import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import {
  getTraffic, getPendingApprovals, getKeywords, getActivity, getHeatmaps,
} from "@/lib/data";
import { fmtDay, fmtMonthLong, fmtNum, parts } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { TrafficChart } from "@/components/TrafficChart";
import { ApprovalsSection } from "@/components/ApprovalsSection";
import { GmbCompare } from "@/components/GmbCompare";
import { IconBadge } from "@/components/Icon";
import { kindOf, GMB_KINDS } from "@/components/kinds";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function posColors(pos: number | null): [string, string] {
  if (pos == null || pos > 20) return ["#dc2626", "#ffffff"];
  if (pos <= 10) return ["#15803d", "#ffffff"];
  return ["#f59e0b", "#0e1a3a"];
}

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [traffic, approvals, keywords, log, heatmaps] = await Promise.all([
    getTraffic(client.id),
    getPendingApprovals(client.id),
    getKeywords(client.id),
    getActivity(client.id, { limit: 10 }),
    getHeatmaps(client.id),
  ]);

  const fullMonths = traffic.filter((t) => !t.is_partial);
  const partial = [...traffic].reverse().find((t) => t.is_partial) ?? null;
  const first = fullMonths[0] ?? null;
  const last = fullMonths[fullMonths.length - 1] ?? null;

  const featured = keywords.filter((k) => k.featured).slice(0, 10);
  const overviewKeywords = featured.length ? featured : keywords.slice(0, 10);

  return (
    <>
      <PageHeader
        title={
          <span style={{ fontWeight: 600 }}>
            {greeting()},{" "}
            <span style={{ color: "var(--accent)", fontWeight: 800 }}>{client.business_name}</span>
          </span>
        }
        subtitle="Here's what your SEO manager has been doing"
        hasPending={approvals.length > 0}
      />

      <Main style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Organic traffic hero */}
          <section
            style={{
              background: "radial-gradient(120% 140% at 88% 0%, #4b74ff 0%, #2c54f2 48%, #2146e0 100%)",
              color: "#ffffff",
              borderRadius: 28,
              padding: 24,
              boxShadow: "0 18px 40px rgba(44,84,242,0.28)",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 24px" }}>
              {first && (
                <div style={{ flex: "1 1 190px", minWidth: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>Where we started</div>
                  <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginTop: 2 }}>
                    {fmtNum(first.visits)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dfe7ff", whiteSpace: "nowrap" }}>
                    visits in {fmtMonthLong(first.month)} {parts(first.month).y}
                  </div>
                </div>
              )}
              {last && last !== first && (
                <div style={{ flex: "1 1 190px", minWidth: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>Last month</div>
                  <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginTop: 2 }}>
                    {fmtNum(last.visits)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dfe7ff", whiteSpace: "nowrap" }}>
                    visits in {fmtMonthLong(last.month)} {parts(last.month).y}
                  </div>
                </div>
              )}
              {partial && (
                <div style={{ flex: "1 1 190px", minWidth: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>This month so far</div>
                  <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", marginTop: 2 }}>
                    {fmtNum(partial.visits)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dfe7ff", whiteSpace: "nowrap" }}>
                    visits in {fmtMonthLong(partial.month)} so far
                  </div>
                </div>
              )}
            </div>
            <TrafficChart full={fullMonths} />
          </section>

          <ApprovalsSection approvals={approvals} />

          {/* GMB overview */}
          <section className="card">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px 16px",
                paddingBottom: 16,
                borderBottom: "1px dashed var(--line)",
                marginBottom: 18,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                Google My Business
              </h2>
              <Link href="/google-my-business" className="pill-link">
                Full report
              </Link>
            </div>
            <GmbCompare
              pairs={heatmaps}
              lat={client.lat}
              lng={client.lng}
              pinScale={74}
              minCardWidth={210}
            />
          </section>
        </div>

        <div style={{ flex: "1 1 250px", minWidth: 0, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          {/* Keyword overview */}
          <section style={{ flex: "1 1 240px", minWidth: 0, background: "var(--card)", borderRadius: 24, padding: "20px 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  Keyword overview
                </h2>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Google position vs {fmtDay(client.start_date)} {parts(client.start_date).y}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#15803d" }} />Top 10
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />11–20
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626" }} />Below 20
                  </span>
                </div>
              </div>
              <Link href="/keywords" className="pill-link">All</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {overviewKeywords.map((k) => {
                const s = k.start_position;
                const n = k.current_position;
                let change = "No change";
                let color = "var(--muted)";
                if (s == null && n != null) { change = "New"; color = "var(--accent)"; }
                else if (s != null && n != null && n < s) { change = `↑ ${s - n}`; color = "var(--ok)"; }
                else if (s != null && n != null && n > s) { change = `↓ ${n - s}`; color = "var(--danger)"; }
                const [bg, fg] = posColors(n);
                return (
                  <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 10px 14px", borderRadius: 16, background: "var(--tile)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, textWrap: "pretty" }}>{k.keyword}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.3 }}>
                        {s == null ? "Not ranked at start" : `Started at ${s}`}
                      </div>
                    </div>
                    <span style={{ flex: "none", fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color }}>
                      {change}
                    </span>
                    <span style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, background: bg, color: fg }}>
                      {n == null ? "–" : n}
                    </span>
                  </div>
                );
              })}
              {overviewKeywords.length === 0 && (
                <div style={{ fontSize: 14, color: "var(--muted)", padding: "8px 2px" }}>
                  Keywords will appear here once tracking starts.
                </div>
              )}
            </div>
          </section>

          {/* Activity log */}
          <section style={{ flex: "1 1 240px", minWidth: 0, background: "var(--card)", borderRadius: 24, padding: "20px 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingBottom: 16, borderBottom: "1px dashed var(--line)" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  Activity log
                </h2>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Last {log.length} actions</div>
              </div>
              <Link href="/activity" className="pill-link">Full log</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
              {log.map((e) => {
                const [color, icon] =
                  e.type === "Google My Business" && e.subtype && GMB_KINDS[e.subtype]
                    ? kindOf(e.type)
                    : kindOf(e.type);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <IconBadge name={icon} color={color} size={38} radius={11} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, textWrap: "pretty" }}>{e.body}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 8px", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        <span>{e.type}</span>
                        <span>{fmtDay(e.occurred_on)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {log.length === 0 && (
                <div style={{ fontSize: 14, color: "var(--muted)" }}>No activity recorded yet.</div>
              )}
            </div>
          </section>
        </div>
      </Main>
    </>
  );
}
