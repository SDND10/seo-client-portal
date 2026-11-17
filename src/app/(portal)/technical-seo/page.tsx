import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getActivity, getPendingCount } from "@/lib/data";
import { fmtDayLong } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { MonthGroupedList } from "@/components/MonthGroupedList";

export const dynamic = "force-dynamic";

export default async function TechnicalSeoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [entries, pending] = await Promise.all([
    getActivity(client.id, { types: ["Technical"] }),
    getPendingCount(client.id),
  ]);

  return (
    <>
      <PageHeader
        title="Technical SEO"
        subtitle="Behind-the-scenes fixes that help Google read and trust your website"
        hasPending={pending > 0}
      />
      <Main>
        <section className="card">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px", paddingBottom: 16, borderBottom: "1px dashed var(--line)" }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                Technical work implemented
              </h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {entries.length} items since {fmtDayLong(client.start_date)}
              </div>
            </div>
            <Link href="/activity" className="pill-link">Full activity log</Link>
          </div>
          <MonthGroupedList entries={entries} icon="wrench" color="#0e1a3a" />
        </section>
      </Main>
    </>
  );
}
