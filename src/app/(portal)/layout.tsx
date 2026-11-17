import { redirect } from "next/navigation";
import { getSession, resolveClient, initials } from "@/lib/auth";
import { getPendingCount } from "@/lib/data";
import { sql } from "@/lib/db";
import { todayParts } from "@/lib/format";
import { Sidebar } from "@/components/Sidebar";
import { AdminBar } from "@/components/AdminBar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await resolveClient(session);
  if (!client) {
    if (session.role === "admin") redirect("/admin");
    redirect("/login");
  }

  const pendingCount = await getPendingCount(client.id);
  const today = todayParts();

  let adminClients: { slug: string; business_name: string }[] = [];
  if (session.role === "admin") {
    adminClients = (await sql`
      select slug, business_name from clients order by business_name`) as typeof adminClients;
  }

  return (
    <>
      {session.role === "admin" && <AdminBar clients={adminClients} current={client.slug} />}
      <div style={{ display: "flex", flexWrap: "wrap", minHeight: "100vh", background: "var(--page)" }}>
        <Sidebar
          initials={initials(client.business_name)}
          dateLabel={today.label}
          weekday={today.weekday}
          pendingCount={pendingCount}
        />
        <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </>
  );
}
