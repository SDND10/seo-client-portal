// Data ingestion endpoint for the Grok bot (or any automation).
//
//   POST /api/ingest
//   Authorization: Bearer <INGEST_API_KEY>
//   Content-Type: application/json
//
// Body: { "client": "<client-slug>", ...sections }  — every section is optional;
// send only what you have. All writes are upserts, so re-sending data is safe.
// See README.md for full payload examples.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

type Json = Record<string, unknown>;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  const key = process.env.INGEST_API_KEY;
  const auth = req.headers.get("authorization") || "";
  if (!key || auth !== `Bearer ${key}`) {
    return bad("Invalid or missing API key", 401);
  }

  let body: Json;
  try {
    body = await req.json();
  } catch {
    return bad("Body must be JSON");
  }

  let cid: string;
  let clientCode: string;
  let createdClient = false;
  const warnings: string[] = [];

  // --- Create a client: { "create_client": { business_name, ... } }
  // Idempotent: if a client with the same name/slug already exists, its ID is
  // returned instead of an error, so the bot can safely retry.
  if (body.create_client && typeof body.create_client === "object") {
    const c = body.create_client as Json;
    const businessName = String(c.business_name ?? "").trim();
    if (!businessName) return bad('create_client.business_name is required');
    const slug = slugify(String(c.slug ?? "") || businessName);
    if (!slug) return bad("Could not build a slug from that business name");

    const str = (v: unknown) => (v == null || v === "" ? null : String(v).trim().slice(0, 300));
    const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));

    const existing = (await sql`
      select id, client_code from clients where slug = ${slug}`) as { id: string; client_code: string }[];
    if (existing[0]) {
      cid = existing[0].id;
      clientCode = existing[0].client_code;
      warnings.push(`Client already existed; using ${clientCode}.`);
    } else {
      const rows = (await sql`
        insert into clients (slug, business_name, contact_name, email, phone, website, street, suburb, state, postcode, lat, lng, start_date)
        values (${slug}, ${businessName}, ${str(c.contact_name)}, ${str(c.email)}, ${str(c.phone)},
                ${str(c.website)}, ${str(c.street)}, ${str(c.suburb)}, ${str(c.state)}, ${str(c.postcode)},
                ${num(c.lat)}, ${num(c.lng)},
                ${String(c.start_date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10)})
        returning id, client_code`) as { id: string; client_code: string }[];
      cid = rows[0]!.id;
      clientCode = rows[0]!.client_code;
      createdClient = true;
    }

    // Optional portal login for the new client.
    const loginEmail = String(c.login_email ?? "").trim().toLowerCase();
    const loginPassword = String(c.login_password ?? "");
    if (loginEmail && loginPassword) {
      if (loginPassword.length < 8) {
        warnings.push("login_password must be at least 8 characters - no login was created.");
      } else {
        const taken = (await sql`select 1 from users where email = ${loginEmail}`) as unknown[];
        if (taken.length) {
          warnings.push(`Login email ${loginEmail} is already in use - no login was created.`);
        } else {
          const hash = bcrypt.hashSync(loginPassword, 12);
          await sql`
            insert into users (client_id, email, name, password_hash, role)
            values (${cid}, ${loginEmail}, ${str(c.contact_name) ?? businessName}, ${hash}, 'client')`;
        }
      }
    }
  } else {
    const ref = typeof body.client === "string" ? body.client.trim() : null;
    if (!ref) return bad('Missing "client" (the client ID, e.g. "C1001") or "create_client"');

    // Accept the client ID (C1001), the slug, or the raw uuid.
    const clients = (await sql`
      select id, client_code from clients
      where client_code = ${ref} or slug = ${ref} or id::text = ${ref}`) as { id: string; client_code: string }[];
    if (!clients[0]) return bad(`Unknown client "${ref}". Use the client ID shown in the admin area (e.g. "C1001").`, 404);
    cid = clients[0].id;
    clientCode = clients[0].client_code;
  }

  const result: Record<string, number> = {};

  try {
    // --- Monthly organic traffic: [{ month: "2026-10" | "2026-10-01", visits: 1120, partial?: false }]
    if (Array.isArray(body.traffic)) {
      let n = 0;
      for (const t of body.traffic as Json[]) {
        const month = String(t.month ?? "").slice(0, 7) + "-01";
        const visits = Number(t.visits);
        if (!/^\d{4}-\d{2}-01$/.test(month) || !Number.isFinite(visits)) continue;
        await sql`
          insert into traffic_monthly (client_id, month, visits, is_partial)
          values (${cid}, ${month}, ${Math.round(visits)}, ${Boolean(t.partial)})
          on conflict (client_id, month) do update
            set visits = excluded.visits, is_partial = excluded.is_partial`;
        n++;
      }
      result.traffic = n;
    }

    // --- Keywords: [{ keyword, start_position?, current_position?, start_visits?, current_visits?, featured? }]
    if (Array.isArray(body.keywords)) {
      let n = 0;
      for (const k of body.keywords as Json[]) {
        const keyword = String(k.keyword ?? "").trim().toLowerCase();
        if (!keyword) continue;
        const sp = k.start_position == null ? null : Number(k.start_position);
        const cp = k.current_position == null ? null : Number(k.current_position);
        await sql`
          insert into keywords (client_id, keyword, start_position, current_position, start_visits, current_visits, featured)
          values (${cid}, ${keyword}, ${sp}, ${cp},
                  ${Number(k.start_visits ?? 0)}, ${Number(k.current_visits ?? 0)},
                  ${k.featured == null ? false : Boolean(k.featured)})
          on conflict (client_id, keyword) do update set
            start_position = coalesce(excluded.start_position, keywords.start_position),
            current_position = excluded.current_position,
            start_visits = greatest(excluded.start_visits, keywords.start_visits),
            current_visits = excluded.current_visits,
            featured = excluded.featured or keywords.featured`;
        n++;
      }
      result.keywords = n;
    }

    // --- GMB heatmaps: [{ keyword, captured_on: "2026-11-15", grid_size: 7, ranks: [[..]] }]
    // ranks is a grid_size x grid_size array; null = point not measured, 21+ = not in top 20.
    if (Array.isArray(body.heatmaps)) {
      let n = 0;
      for (const h of body.heatmaps as Json[]) {
        const keyword = String(h.keyword ?? "").trim().toLowerCase();
        const captured = String(h.captured_on ?? "").slice(0, 10);
        if (!keyword || !/^\d{4}-\d{2}-\d{2}$/.test(captured) || !Array.isArray(h.ranks)) continue;
        await sql`
          insert into gmb_heatmaps (client_id, keyword, captured_on, grid_size, ranks)
          values (${cid}, ${keyword}, ${captured}, ${Number(h.grid_size ?? 7)}, ${JSON.stringify(h.ranks)})
          on conflict (client_id, keyword, captured_on) do update
            set grid_size = excluded.grid_size, ranks = excluded.ranks`;
        n++;
      }
      result.heatmaps = n;
    }

    // --- Activity log: [{ date: "2026-11-14", type: "Content", subtype?, text }]
    // Types: Content, Google My Business, On-page, Backlinks, Technical, Keywords, AI visibility
    // GMB subtypes: Reviews, Posts, Photos, Profile updates
    if (Array.isArray(body.activity)) {
      let n = 0;
      for (const a of body.activity as Json[]) {
        const date = String(a.date ?? "").slice(0, 10);
        const type = String(a.type ?? "").trim();
        const text = String(a.text ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !type || !text) continue;
        const dup = (await sql`
          select 1 from activity_log
          where client_id = ${cid} and occurred_on = ${date} and type = ${type} and body = ${text}
          limit 1`) as unknown[];
        if (dup.length === 0) {
          await sql`
            insert into activity_log (client_id, occurred_on, type, subtype, body)
            values (${cid}, ${date}, ${type}, ${a.subtype == null ? null : String(a.subtype)}, ${text})`;
          n++;
        }
      }
      result.activity = n;
    }

    // --- Backlinks: [{ date, site_name, domain, type?, target? }]
    if (Array.isArray(body.backlinks)) {
      let n = 0;
      for (const b of body.backlinks as Json[]) {
        const date = String(b.date ?? "").slice(0, 10);
        const domain = String(b.domain ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !domain) continue;
        await sql`
          insert into backlinks (client_id, obtained_on, site_name, domain, link_type, target_page)
          values (${cid}, ${date}, ${String(b.site_name ?? domain)}, ${domain},
                  ${String(b.type ?? "Directory")}, ${b.target == null ? null : String(b.target)})
          on conflict (client_id, domain, target_page, obtained_on) do nothing`;
        n++;
      }
      result.backlinks = n;
    }

    // --- AI visibility checks: [{ date, score }]
    if (Array.isArray(body.ai_checks)) {
      let n = 0;
      for (const c of body.ai_checks as Json[]) {
        const date = String(c.date ?? "").slice(0, 10);
        const score = Number(c.score);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(score)) continue;
        await sql`
          insert into ai_visibility_checks (client_id, checked_on, score)
          values (${cid}, ${date}, ${Math.round(score)})
          on conflict (client_id, checked_on) do update set score = excluded.score`;
        n++;
      }
      result.ai_checks = n;
    }

    // --- Approval requests: [{ ref, type, title, detail?, date?, icon?, color? }]
    // ref is your bot's stable id for the request; re-sending the same ref updates it
    // instead of creating a duplicate. Client decisions are read back via GET.
    if (Array.isArray(body.approvals)) {
      let n = 0;
      for (const a of body.approvals as Json[]) {
        const ref = String(a.ref ?? "").trim();
        const title = String(a.title ?? "").trim();
        if (!ref || !title) continue;
        const existing = (await sql`
          select id from approvals where client_id = ${cid} and external_ref = ${ref}`) as { id: string }[];
        if (existing[0]) {
          await sql`
            update approvals set type = ${String(a.type ?? "Action")}, title = ${title},
              detail = ${a.detail == null ? null : String(a.detail)},
              icon = ${String(a.icon ?? "file-text")}, color = ${String(a.color ?? "#2c54f2")}
            where id = ${existing[0].id}`;
        } else {
          await sql`
            insert into approvals (client_id, external_ref, type, title, detail, icon, color, requested_on)
            values (${cid}, ${ref}, ${String(a.type ?? "Action")}, ${title},
                    ${a.detail == null ? null : String(a.detail)},
                    ${String(a.icon ?? "file-text")}, ${String(a.color ?? "#2c54f2")},
                    ${String(a.date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10)})`;
        }
        n++;
      }
      result.approvals = n;
    }

    // --- Reports: [{ title, period_start?, period_end?, issued_on?, due_on?, url?, available? }]
    if (Array.isArray(body.reports)) {
      let n = 0;
      for (const r of body.reports as Json[]) {
        const title = String(r.title ?? "").trim();
        if (!title) continue;
        const existing = (await sql`
          select id from reports where client_id = ${cid} and title = ${title}`) as { id: string }[];
        const vals = {
          ps: r.period_start == null ? null : String(r.period_start).slice(0, 10),
          pe: r.period_end == null ? null : String(r.period_end).slice(0, 10),
          io: r.issued_on == null ? null : String(r.issued_on).slice(0, 10),
          du: r.due_on == null ? null : String(r.due_on).slice(0, 10),
          url: r.url == null ? null : String(r.url),
          av: Boolean(r.available),
        };
        if (existing[0]) {
          await sql`
            update reports set period_start = ${vals.ps}, period_end = ${vals.pe}, issued_on = ${vals.io},
              due_on = ${vals.du}, url = ${vals.url}, available = ${vals.av}
            where id = ${existing[0].id}`;
        } else {
          await sql`
            insert into reports (client_id, title, period_start, period_end, issued_on, due_on, url, available)
            values (${cid}, ${title}, ${vals.ps}, ${vals.pe}, ${vals.io}, ${vals.du}, ${vals.url}, ${vals.av})`;
        }
        n++;
      }
      result.reports = n;
    }

    // --- Month summaries for the activity page: [{ month: "2026-11", summary }]
    if (Array.isArray(body.summaries)) {
      let n = 0;
      for (const s of body.summaries as Json[]) {
        const month = String(s.month ?? "").slice(0, 7) + "-01";
        const summary = String(s.summary ?? "").trim();
        if (!/^\d{4}-\d{2}-01$/.test(month) || !summary) continue;
        await sql`
          insert into month_summaries (client_id, month, summary)
          values (${cid}, ${month}, ${summary})
          on conflict (client_id, month) do update set summary = excluded.summary`;
        n++;
      }
      result.summaries = n;
    }
  } catch (err) {
    console.error("Ingest error:", err);
    return bad("Database error while saving data", 500);
  }

  return NextResponse.json({
    ok: true,
    client: clientCode,
    ...(createdClient ? { created: true } : {}),
    ...(warnings.length ? { warnings } : {}),
    saved: result,
  });
}

// GET /api/ingest?client=<slug>&decisions=since-iso-date
// Lets the bot read back approval decisions the client has made.
export async function GET(req: NextRequest) {
  const key = process.env.INGEST_API_KEY;
  const auth = req.headers.get("authorization") || "";
  if (!key || auth !== `Bearer ${key}`) {
    return bad("Invalid or missing API key", 401);
  }
  const ref = (req.nextUrl.searchParams.get("client") || "").trim();
  if (!ref) return bad('Missing "client" query parameter (the client ID, e.g. "C1001")');
  const clients = (await sql`
    select id, client_code from clients
    where client_code = ${ref} or slug = ${ref} or id::text = ${ref}`) as { id: string; client_code: string }[];
  if (!clients[0]) return bad(`Unknown client "${ref}"`, 404);

  const since = req.nextUrl.searchParams.get("decisions") || "1970-01-01";
  const rows = await sql`
    select external_ref as ref, type, title, status, decided_at
    from approvals
    where client_id = ${clients[0].id} and status <> 'pending' and decided_at >= ${since}
    order by decided_at desc`;
  return NextResponse.json({ ok: true, client: clients[0].client_code, decisions: rows });
}
