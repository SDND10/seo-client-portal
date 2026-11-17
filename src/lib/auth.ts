import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { sql } from "./db";

export const SESSION_COOKIE = "portal_session";
export const VIEWING_COOKIE = "viewing_client";

export type Session = {
  uid: string;
  role: "admin" | "client";
  clientId: string | null;
  name: string;
  email: string;
};

export type Client = {
  id: string;
  slug: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  street: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string;
};

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken(payload: Session): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/**
 * Which client's portal is being viewed.
 * - client users always see their own client
 * - the master (admin) user sees whichever client they selected (viewing_client cookie)
 */
export async function resolveClient(session: Session): Promise<Client | null> {
  if (session.role === "client") {
    if (!session.clientId) return null;
    const rows = (await sql`
      select id, slug, business_name, contact_name, email, phone, website,
             street, suburb, state, postcode, lat, lng, start_date::text as start_date
      from clients where id = ${session.clientId}`) as Client[];
    return rows[0] ?? null;
  }
  const slug = (await cookies()).get(VIEWING_COOKIE)?.value;
  if (!slug) return null;
  const rows = (await sql`
    select id, slug, business_name, contact_name, email, phone, website,
           street, suburb, state, postcode, lat, lng, start_date::text as start_date
    from clients where slug = ${slug}`) as Client[];
  return rows[0] ?? null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
