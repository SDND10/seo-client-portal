import { NextRequest, NextResponse } from "next/server";
import { getSession, resolveClient } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { id?: string; verdict?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id, verdict } = body;
  if (!id || (verdict !== "approved" && verdict !== "rejected")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const client = await resolveClient(session);
  if (!client) return NextResponse.json({ error: "No client selected" }, { status: 400 });

  const rows = (await sql`
    update approvals set status = ${verdict}, decided_at = now()
    where id = ${id} and client_id = ${client.id} and status = 'pending'
    returning title`) as { title: string }[];
  if (!rows[0]) return NextResponse.json({ error: "Approval not found" }, { status: 404 });

  const label = verdict === "approved" ? "Approved" : "Rejected";
  await sql`
    insert into activity_log (client_id, occurred_on, type, body)
    values (${client.id}, current_date, ${label}, ${`You ${verdict}: ${rows[0].title}`})`;

  return NextResponse.json({ ok: true });
}
