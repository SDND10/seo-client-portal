import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getPendingCount, getReports } from "@/lib/data";
import { fmtDayLong } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { IconBadge } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [reports, pending] = await Promise.all([
    getReports(client.id),
    getPendingCount(client.id),
  ]);

  const available = reports.filter((r) => r.available).length;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={`A full report every six months from your start date, ${fmtDayLong(client.start_date)}`}
        hasPending={pending > 0}
      />
      <Main>
        <section className="card" style={{ maxWidth: 820 }}>
          <div style={{ paddingBottom: 16, borderBottom: "1px dashed var(--line)" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Six-monthly reports
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {available} {available === 1 ? "report" : "reports"} available
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px 14px",
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "var(--tile)",
                }}
              >
                <IconBadge name={r.available ? "file-text" : "clock"} color={r.available ? "#2c54f2" : "#8490a6"} size={44} radius={12} iconSize={20} />
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {r.available && r.issued_on
                      ? `Issued ${fmtDayLong(r.issued_on)}`
                      : r.due_on
                        ? `Due ${fmtDayLong(r.due_on)}`
                        : ""}
                  </div>
                </div>
                {r.available && r.url ? (
                  <a href={r.url} target="_blank" rel="noreferrer" className="cta-btn" style={{ textDecoration: "none" }}>
                    View report
                  </a>
                ) : r.available ? (
                  <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                    Ask your SEO manager for the file
                  </span>
                ) : (
                  <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                    Not yet available
                  </span>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div style={{ fontSize: 14, color: "var(--muted)", padding: "10px 4px" }}>
                Your first report will appear here.
              </div>
            )}
          </div>
        </section>
      </Main>
    </>
  );
}
