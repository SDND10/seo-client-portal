"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActivityRow } from "@/lib/data";
import { GMB_KINDS } from "./kinds";
import { IconBadge } from "./Icon";
import { fmtDay, fmtMonthYear, parts } from "@/lib/format";

export function GmbActivity({ entries, sinceLabel }: { entries: ActivityRow[]; sinceLabel: string }) {
  const [kind, setKind] = useState<string | null>(null);

  const filtered = entries.filter((e) => kind == null || e.subtype === kind);

  const groups: { key: string; label: string; items: ActivityRow[] }[] = [];
  for (const e of filtered) {
    const { y, m } = parts(e.occurred_on);
    const key = `${y}-${m}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: fmtMonthYear(e.occurred_on), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  return (
    <section className="card">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px" }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            Google My Business activity
          </h2>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {kind
              ? `${filtered.length} of ${entries.length} actions: ${kind.toLowerCase()}`
              : `${entries.length} actions on your profile since ${sinceLabel}`}
          </div>
        </div>
        <Link href="/activity" className="pill-link">Full activity log</Link>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, paddingBottom: 18, borderBottom: "1px dashed var(--line)" }}>
        {Object.entries(GMB_KINDS).map(([name, [color, icon]]) => {
          const n = entries.filter((e) => e.subtype === name).length;
          const active = kind === name;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              onClick={() => setKind(active ? null : name)}
              style={{
                flex: "1 1 150px",
                minWidth: 0,
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                border: 0,
                borderRadius: 16,
                background: "var(--tile)",
                color: "var(--text)",
                boxShadow: active ? "0 0 0 2px var(--accent)" : "none",
              }}
            >
              <IconBadge name={icon} color={color} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 22, fontWeight: 700, lineHeight: 1.15 }}>{n}</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {name}
                </span>
              </span>
            </button>
          );
        })}
      </div>

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
            {g.items.map((e) => {
              const [color, icon] = (e.subtype && GMB_KINDS[e.subtype]) || ["#15803d", "map-pin"];
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <IconBadge name={icon} color={color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, textWrap: "pretty" }}>{e.body}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{e.subtype ?? "Google My Business"}</div>
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
        <div style={{ marginTop: 20, fontSize: 14, color: "var(--muted)" }}>No actions of this kind yet.</div>
      )}
    </section>
  );
}
