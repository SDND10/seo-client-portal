import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const current = body.current || "";
  const next = body.next || "";
  if (next.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const rows = (await sql`
    select password_hash from users where id = ${session.uid}`) as { password_hash: string }[];
  if (!rows[0] || !bcrypt.compareSync(current, rows[0].password_hash)) {
    return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  }

  const hash = bcrypt.hashSync(next, 12);
  await sql`update users set password_hash = ${hash} where id = ${session.uid}`;
  return NextResponse.json({ ok: true });
}
