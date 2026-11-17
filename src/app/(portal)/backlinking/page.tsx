import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getBacklinks, getPendingCount } from "@/lib/data";
import { fmtDayLong, fmtDayYear } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { IconBadge } from "@/components/Icon";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, string> = {
  "Directory": "#2c54f2",
  "Blog article": "#7c4dff",
  "Guest post": "#15803d",
  "News": "#b45309",
};

export default async function BacklinkingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [links, pending] = await Promise.all([
    getBacklinks(client.id),
    getPendingCount(client.id),
  ]);

  const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted)",
    padding: "4px 14px",
    whiteSpace: "nowrap",
  };

  return (
    <>
      <PageHeader
        title="Backlinking"
        subtitle="Other websites that now link to yours"
        hasPending={pending > 0}
      />
      <Main>
        <section className="card">
          <div style={{ paddingBottom: 16, borderBottom: "1px dashed var(--line)", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Backlinks obtained
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {links.length} backlinks since {fmtDayLong(client.start_date)}, newest first
            </div>
          </div>
          {links.length === 0 ? (
            <div style={{ fontSize: 14, color: "var(--muted)", padding: "10px 4px" }}>
              Backlinks will appear here as they are obtained.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 600, borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead>
                  <tr>
                    <th style={th}>Website</th>
                    <th style={th}>Type</th>
                    <th style={th}>Links to</th>
                    <th style={{ ...th, textAlign: "right" }}>Date obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id}>
                      <td style={{ padding: "10px 14px", background: "var(--tile)", borderRadius: "16px 0 0 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <IconBadge name="link" color={TYPE_COLORS[l.link_type] ?? "#2c54f2"} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{l.site_name}</div>
                            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.3 }}>{l.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", background: "var(--tile)" }}>
                        <span style={{ display: "inline-block", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: "var(--card)", whiteSpace: "nowrap" }}>
                          {l.link_type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", background: "var(--tile)", fontSize: 14, fontWeight: 600 }}>
                        {l.target_page ?? "Home page"}
                      </td>
                      <td style={{ padding: "10px 14px", background: "var(--tile)", borderRadius: "0 16px 16px 0", textAlign: "right", fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {fmtDayYear(l.obtained_on)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Main>
    </>
  );
}
