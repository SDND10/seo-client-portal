import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const clients = (await sql`
    select c.slug, c.business_name, c.contact_name, c.suburb, c.state, c.start_date::text as start_date,
      (select count(*)::int from approvals a where a.client_id = c.id and a.status = 'pending') as pending,
      (select count(*)::int from keywords k where k.client_id = c.id) as keywords,
      (select max(l.occurred_on)::text from activity_log l where l.client_id = c.id) as last_activity
    from clients c
    order by c.business_name`) as {
    slug: string;
    business_name: string;
    contact_name: string | null;
    suburb: string | null;
    state: string | null;
    start_date: string;
    pending: number;
    keywords: number;
    last_activity: string | null;
  }[];

  return (
    <div style={{ minHeight: "100vh", background: "var(--panel)" }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px 24px",
          padding: "26px 28px 20px",
          background: "var(--page)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Master view
          </h1>
          <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>
            Signed in as {session.email} — pick a client to open their portal
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="ghost-btn">Sign out</button>
        </form>
      </header>
      <div style={{ padding: "24px 28px 40px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000 }}>
        <AdminDashboard clients={clients} />
      </div>
    </div>
  );
}
