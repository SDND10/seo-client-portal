import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Create a new client (and optionally their portal login). Admin only.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const businessName = String(body.business_name ?? "").trim();
  if (!businessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  const slug = slugify(String(body.slug ?? "") || businessName);
  if (!slug) return NextResponse.json({ error: "Could not build a slug" }, { status: 400 });

  const existing = (await sql`select 1 from clients where slug = ${slug}`) as unknown[];
  if (existing.length) {
    return NextResponse.json({ error: `A client with slug "${slug}" already exists` }, { status: 409 });
  }

  const num = (v: unknown) => (v == null || v === "" || Number.isNaN(Number(v)) ? null : Number(v));
  const str = (v: unknown) => (v == null || v === "" ? null : String(v).trim().slice(0, 300));

  const rows = (await sql`
    insert into clients (slug, business_name, contact_name, email, phone, website, street, suburb, state, postcode, lat, lng, start_date)
    values (${slug}, ${businessName}, ${str(body.contact_name)}, ${str(body.email)}, ${str(body.phone)},
            ${str(body.website)}, ${str(body.street)}, ${str(body.suburb)}, ${str(body.state)}, ${str(body.postcode)},
            ${num(body.lat)}, ${num(body.lng)},
            ${String(body.start_date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10)})
    returning id, client_code`) as { id: string; client_code: string }[];
  const clientId = rows[0]!.id;
  const clientCode = rows[0]!.client_code;

  const loginEmail = String(body.login_email ?? "").trim().toLowerCase();
  const loginPassword = String(body.login_password ?? "");
  if (loginEmail && loginPassword) {
    if (loginPassword.length < 8) {
      return NextResponse.json({ error: "Client password must be at least 8 characters" }, { status: 400 });
    }
    const taken = (await sql`select 1 from users where email = ${loginEmail}`) as unknown[];
    if (taken.length) {
      return NextResponse.json(
        { ok: true, slug, client_code: clientCode, warning: `Client created (ID ${clientCode}), but login email ${loginEmail} is already in use.` },
      );
    }
    const hash = bcrypt.hashSync(loginPassword, 12);
    await sql`
      insert into users (client_id, email, name, password_hash, role)
      values (${clientId}, ${loginEmail}, ${str(body.contact_name) ?? businessName}, ${hash}, 'client')`;
  }

  return NextResponse.json({ ok: true, slug, client_code: clientCode });
}
