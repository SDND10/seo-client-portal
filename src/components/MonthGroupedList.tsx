// Server component: activity entries grouped by month with a fixed icon badge,
// used by the Technical SEO and AI Visibility pages.

import type { ActivityRow } from "@/lib/data";
import { fmtDay, fmtMonthYear, parts } from "@/lib/format";
import { IconBadge } from "./Icon";

export function MonthGroupedList({
  entries,
  icon,
  color,
}: {
  entries: ActivityRow[];
  icon: string;
  color: string;
}) {
  const groups: { key: string; label: string; items: ActivityRow[] }[] = [];
  for (const e of entries) {
    const { y, m } = parts(e.occurred_on);
    const key = `${y}-${m}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: fmtMonthYear(e.occurred_on), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  if (entries.length === 0) {
    return <div style={{ marginTop: 20, fontSize: 14, color: "var(--muted)" }}>No work recorded yet.</div>;
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g.key} style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
              {g.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
              {g.items.length} {g.items.length === 1 ? "action" : "actions"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {g.items.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <IconBadge name={icon} color={color} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.4, textWrap: "pretty" }}>
                  {e.body}
                </div>
                <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "var(--muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {fmtDay(e.occurred_on)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
