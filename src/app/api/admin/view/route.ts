import { NextRequest, NextResponse } from "next/server";
import { getSession, VIEWING_COOKIE } from "@/lib/auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

// Admin picks which client's portal to view.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  if (!body.slug) {
    res.cookies.delete(VIEWING_COOKIE);
    return res;
  }

  const rows = (await sql`select 1 from clients where slug = ${body.slug}`) as unknown[];
  if (!rows.length) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  res.cookies.set(VIEWING_COOKIE, body.slug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return res;
}
