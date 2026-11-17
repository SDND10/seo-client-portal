import { NextRequest, NextResponse } from "next/server";
import { getSession, resolveClient } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const FIELDS = [
  "business_name", "contact_name", "email", "phone", "website",
  "street", "suburb", "state", "postcode",
] as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const client = await resolveClient(session);
  if (!client) return NextResponse.json({ error: "No client selected" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const vals: Record<string, string | null> = {};
  for (const f of FIELDS) {
    vals[f] = body[f] == null ? null : String(body[f]).trim().slice(0, 300);
  }
  if (!vals.business_name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  await sql`
    update clients set
      business_name = ${vals.business_name},
      contact_name = ${vals.contact_name},
      email = ${vals.email},
      phone = ${vals.phone},
      website = ${vals.website},
      street = ${vals.street},
      suburb = ${vals.suburb},
      state = ${vals.state},
      postcode = ${vals.postcode}
    where id = ${client.id}`;

  return NextResponse.json({ ok: true });
}
