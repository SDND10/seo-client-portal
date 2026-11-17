"use client";

import { useState } from "react";
import type { ActivityRow, MonthSummaryRow } from "@/lib/data";
import { KINDS, kindOf } from "./kinds";
import { Icon, IconBadge } from "./Icon";
import { fmtDay, fmtMonthYear, parts } from "@/lib/format";

const PAGE_SIZE = 12;
const FILTER_TYPES = Object.keys(KINDS).filter((k) => k !== "Approved" && k !== "Rejected");

export function ActivityBoard({
  entries,
  summaries,
  sinceLabel,
}: {
  entries: ActivityRow[];
  summaries: MonthSummaryRow[];
  sinceLabel: string;
}) {
  const [type, setType] = useState("All");
  const [month, setMonth] = useState<string | null>(null); // "YYYY-MM"
  const [q, setQ] = useState("");
  const [pages, setPages] = useState(1);

  const needle = q.trim().toLowerCase();
  const monthOf = (iso: string) => iso.slice(0, 7);

  const filtered = entries.filter(
    (e) =>
      (type === "All" || e.type === type) &&
      (month == null || monthOf(e.occurred_on) === month) &&
      (!needle || `${e.body} ${e.type}`.toLowerCase().includes(needle))
  );
  const shown = filtered.slice(0, PAGE_SIZE * pages);

  const groups: { key: string; label: string; items: ActivityRow[] }[] = [];
  for (const e of shown) {
    const key = monthOf(e.occurred_on);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: fmtMonthYear(e.occurred_on), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  // Month-by-month cards: every month that has entries, newest first.
  const monthKeys = [...new Set(entries.map((e) => monthOf(e.occurred_on)))].sort().reverse();
  const summaryByMonth = new Map(summaries.map((s) => [s.month.slice(0, 7), s.summary]));
  const nowKey = new Date().toISOString().slice(0, 7);

  const isFiltered = type !== "All" || month != null || needle !== "";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      {/* Full log */}
      <section style={{ flex: "3 1 380px", minWidth: 0, background: "var(--card)", borderRadius: 24, padding: "22px 24px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px" }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Full activity log
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {isFiltered
                ? `${filtered.length} of ${entries.length} actions`
                : `${entries.length} actions since ${sinceLabel}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, width: 200, height: 38, padding: "0 14px", border: "1px solid var(--line)", borderRadius: 999, background: "var(--card)" }}>
              <input
                type="search"
                placeholder="Search the log"
                aria-label="Search the log"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPages(1); }}
                style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", font: "inherit", fontSize: 14, color: "var(--text)" }}
              />
              <span style={{ display: "flex", color: "var(--text)" }}>
                <Icon name="search" size={15} />
              </span>
            </label>
            {month != null && (
              <button
                type="button"
                onClick={() => { setMonth(null); setPages(1); }}
                style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, border: 0, borderRadius: 999, padding: "8px 12px 8px 14px", background: "var(--accent)", color: "#ffffff" }}
              >
                {fmtMonthYear(month + "-01")}
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, paddingBottom: 18, borderBottom: "1px dashed var(--line)" }}>
          {["All", ...FILTER_TYPES].map((k) => (
            <button
              key={k}
              type="button"
              className={`pill-btn${k === type ? " active" : ""}`}
              aria-pressed={k === type}
              onClick={() => { setType(k); setPages(1); }}
            >
              {k}
            </button>
          ))}
        </div>

        {groups.map((g) => (
          <div key={g.key} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
              {g.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {g.items.map((e) => {
                const [color, icon] = kindOf(e.type);
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <IconBadge name={icon} color={color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, textWrap: "pretty" }}>{e.body}</div>
                      <div style={{ fontSize: 13, color: "var(--muted)" }}>{e.type}</div>
                    </div>
                    <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmtDay(e.occurred_on)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ marginTop: 20, fontSize: 14, color: "var(--muted)" }}>No actions match these filters.</div>
        )}
        {shown.length < filtered.length && (
          <button type="button" className="ghost-btn" style={{ marginTop: 22, width: "100%", padding: "12px 18px" }} onClick={() => setPages((p) => p + 1)}>
            Show more
          </button>
        )}
      </section>

      {/* Month by month */}
      <section style={{ flex: "2 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: "4px 4px 0" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            Month by month
          </h2>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>What was worked on each month</div>
        </div>
        {monthKeys.map((mk) => {
          const list = entries.filter((e) => monthOf(e.occurred_on) === mk);
          const active = month === mk;
          const segs = FILTER_TYPES
            .map((k) => ({ type: k, n: list.filter((e) => e.type === k).length, color: KINDS[k]![0] }))
            .filter((sg) => sg.n > 0);
          const summary = summaryByMonth.get(mk);
          return (
            <div key={mk} style={{ background: "var(--card)", borderRadius: 24, padding: "18px 20px 20px", boxShadow: active ? "0 0 0 2px var(--accent)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{fmtMonthYear(mk + "-01")}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {list.length} actions{mk === nowKey ? " so far" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setMonth(active ? null : mk); setPages(1); }}
                  style={{
                    flex: "none", fontSize: 13, fontWeight: 700, lineHeight: 1.3, cursor: "pointer", borderRadius: 999, padding: "7px 14px",
                    border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                    background: active ? "var(--accent)" : "var(--card)",
                    color: active ? "#ffffff" : "var(--text)",
                  }}
                >
                  {active ? "Showing" : "Show in log"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 3, height: 10, marginTop: 14, borderRadius: 999, overflow: "hidden" }}>
                {segs.map((sg) => (
                  <span key={sg.type} style={{ flex: `${sg.n} 0 0`, background: sg.color }} />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                {segs.map((sg) => (
                  <div key={sg.type} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                    <span style={{ width: 10, height: 10, flex: "none", borderRadius: "50%", background: sg.color }} />
                    <span style={{ flex: 1, minWidth: 0 }}>{sg.type}</span>
                    <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{sg.n}</span>
                  </div>
                ))}
              </div>
              {summary && (
                <div style={{ fontSize: 14, color: "var(--text)", marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "var(--tile)", textWrap: "pretty" }}>
                  {summary}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
