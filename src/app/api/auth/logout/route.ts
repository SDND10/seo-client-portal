import { NextResponse } from "next/server";
import { SESSION_COOKIE, VIEWING_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete(VIEWING_COOKIE);
  return res;
}
