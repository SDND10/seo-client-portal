import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getActivity, getAiChecks, getPendingCount } from "@/lib/data";
import { fmtDayLong } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { MonthGroupedList } from "@/components/MonthGroupedList";

export const dynamic = "force-dynamic";

export default async function AiVisibilityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [checks, entries, pending] = await Promise.all([
    getAiChecks(client.id),
    getActivity(client.id, { types: ["AI visibility"] }),
    getPendingCount(client.id),
  ]);

  const first = checks[0] ?? null;
  const latest = checks[checks.length - 1] ?? null;
  const score = latest?.score ?? 0;
  const delta = first && latest ? latest.score - first.score : 0;

  return (
    <>
      <PageHeader
        title="AI Visibility"
        subtitle="How visible your business is in answers from AI assistants"
        hasPending={pending > 0}
      />
      <Main>
        <section
          style={{
            background: "#2c54f2",
            color: "#ffffff",
            borderRadius: 28,
            padding: 28,
            boxShadow: "0 18px 40px rgba(44,84,242,0.28)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "28px 40px",
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              flex: "none",
              borderRadius: "50%",
              background: `conic-gradient(#8df23f 0 ${Math.max(0, Math.min(100, score))}%, #6f8cf7 ${Math.max(0, Math.min(100, score))}% 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 164,
                height: 164,
                borderRadius: "50%",
                background: "#2c54f2",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>
                {latest ? score : "–"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#dfe7ff", marginTop: 6 }}>out of 100</div>
            </div>
          </div>
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#dfe7ff" }}>AI visibility score</div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", marginTop: 4 }}>
              {latest
                ? delta > 0
                  ? `Up ${delta} points since we started`
                  : delta < 0
                    ? `Down ${-delta} points since we started`
                    : "Holding steady since we started"
                : "First check coming soon"}
            </div>
            <div style={{ fontSize: 14, color: "#dfe7ff", marginTop: 10, maxWidth: 520, textWrap: "pretty" }}>
              The score shows how often AI assistants such as ChatGPT, Gemini and Perplexity mention{" "}
              {client.business_name} when asked 20 questions a local customer might ask.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
              {first && (
                <div style={{ flex: "1 1 170px", maxWidth: 240, padding: "12px 16px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.32)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#dfe7ff" }}>Where we started</div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{first.score}</div>
                  <div style={{ fontSize: 12, color: "#dfe7ff" }}>{fmtDayLong(first.checked_on)}</div>
                </div>
              )}
              {latest && (
                <div style={{ flex: "1 1 170px", maxWidth: 240, padding: "12px 16px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.32)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#dfe7ff" }}>Latest check</div>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{latest.score}</div>
                  <div style={{ fontSize: 12, color: "#dfe7ff" }}>{fmtDayLong(latest.checked_on)}</div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px", paddingBottom: 16, borderBottom: "1px dashed var(--line)" }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                AI visibility activity
              </h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {entries.length} actions since {fmtDayLong(client.start_date)}
              </div>
            </div>
            <Link href="/activity" className="pill-link">Full activity log</Link>
          </div>
          <MonthGroupedList entries={entries} icon="sparkles" color="#c026d3" />
        </section>
      </Main>
    </>
  );
}
