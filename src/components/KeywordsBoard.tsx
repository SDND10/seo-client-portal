"use client";

import { useState } from "react";
import type { KeywordRow } from "@/lib/data";
import { Icon } from "./Icon";

function posColors(pos: number | null): [string, string] {
  if (pos == null || pos > 20) return ["#dc2626", "#ffffff"];
  if (pos <= 10) return ["#15803d", "#ffffff"];
  return ["#f59e0b", "#0e1a3a"];
}

export function KeywordsSearch({
  q,
  onChange,
}: {
  q: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: 220,
        height: 42,
        padding: "0 16px",
        border: "1px solid var(--line)",
        borderRadius: 999,
        background: "var(--card)",
      }}
    >
      <input
        type="search"
        placeholder="Search keywords"
        aria-label="Search keywords"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", font: "inherit", fontSize: 14, color: "var(--text)" }}
      />
      <span style={{ display: "flex", color: "var(--text)" }}>
        <Icon name="search" size={16} />
      </span>
    </label>
  );
}

export function KeywordsBoard({
  rows,
  startLabel,
  startMonthLabel,
  nowLabel,
  nowMonthLabel,
}: {
  rows: KeywordRow[];
  startLabel: string;
  startMonthLabel: string;
  nowLabel: string;
  nowMonthLabel: string;
}) {
  const [q, setQ] = useState("");
  const [hl, setHl] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const list = rows.filter((k) => !needle || k.keyword.includes(needle));
  const top10 = (get: (k: KeywordRow) => number | null) =>
    rows.filter((k) => get(k) != null && get(k)! <= 10).length;
  const unranked = (get: (k: KeywordRow) => number | null) =>
    rows.filter((k) => get(k) == null).length;
  const startVisits = rows.reduce((t, k) => t + k.start_visits, 0);
  const nowVisits = rows.reduce((t, k) => t + k.current_visits, 0);

  const bg = (name: string) => (hl === name ? "var(--tile-hl)" : "var(--tile)");

  const startRows = [...list].sort(
    (a, b) => (a.start_position ?? 999) - (b.start_position ?? 999)
  );
  const nowRows = [...list].sort(
    (a, b) => (a.current_position ?? 999) - (b.current_position ?? 999)
  );

  const chip = (text: string, active = false) => (
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: 999,
        background: active ? "var(--accent)" : "var(--tile)",
        color: active ? "#ffffff" : "var(--text)",
      }}
    >
      {text}
    </span>
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 0 16px" }}>
        <KeywordsSearch q={q} onChange={setQ} />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          padding: "0 4px 16px",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--muted)",
        }}
      >
        <span>Position:</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#15803d" }} />Top 10
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />11–20
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626" }} />Below 20 or not ranked
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        {/* Where we started */}
        <section style={{ flex: "1 1 300px", minWidth: 0, background: "var(--card)", borderRadius: 24, padding: "22px 20px 20px" }}>
          <div style={{ padding: "0 4px 16px", borderBottom: "1px dashed var(--line)" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Where we started
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Positions on {startLabel}, visits during {startMonthLabel}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {chip(`${top10((k) => k.start_position)} in the top 10`)}
              {chip(`${unranked((k) => k.start_position)} not ranked`)}
              {chip(`${startVisits.toLocaleString("en-AU")} visits a month`)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px 8px 16px", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
            <span style={{ flex: 1 }}>Keyword</span>
            <span style={{ flex: "0 0 52px", textAlign: "right" }}>Visits</span>
            <span style={{ flex: "0 0 42px", textAlign: "center" }}>Pos.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {startRows.map((k) => {
              const [pbg, pfg] = posColors(k.start_position);
              return (
                <div
                  key={k.id}
                  onMouseEnter={() => setHl(k.keyword)}
                  onMouseLeave={() => setHl(null)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 10px 16px", borderRadius: 16, background: bg(k.keyword) }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, lineHeight: 1.3, textWrap: "pretty" }}>{k.keyword}</span>
                    {k.start_position == null && (
                      <span style={{ display: "block", fontSize: 12, color: "var(--muted)", lineHeight: 1.3 }}>Not ranked</span>
                    )}
                  </span>
                  <span style={{ flex: "0 0 52px", textAlign: "right", fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {k.start_visits.toLocaleString("en-AU")}
                  </span>
                  <span style={{ width: 42, height: 42, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, background: pbg, color: pfg }}>
                    {k.start_position == null ? "–" : k.start_position}
                  </span>
                </div>
              );
            })}
            {list.length === 0 && (
              <div style={{ padding: "8px 12px", fontSize: 14, color: "var(--muted)" }}>No keywords match your search.</div>
            )}
          </div>
        </section>

        {/* Where we are now */}
        <section style={{ flex: "1 1 300px", minWidth: 0, background: "var(--card)", borderRadius: 24, padding: "22px 20px 20px" }}>
          <div style={{ padding: "0 4px 16px", borderBottom: "1px dashed var(--line)" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Where we are now
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Positions on {nowLabel}, visits during {nowMonthLabel}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {chip(`${top10((k) => k.current_position)} in the top 10`, true)}
              {chip(`${unranked((k) => k.current_position)} not ranked`)}
              {chip(`${nowVisits.toLocaleString("en-AU")} visits a month`)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 12px 8px 16px", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
            <span style={{ flex: 1 }}>Keyword</span>
            <span style={{ flex: "0 0 52px", textAlign: "right" }}>Visits</span>
            <span style={{ flex: "0 0 48px", textAlign: "right" }}>Change</span>
            <span style={{ flex: "0 0 42px", textAlign: "center" }}>Pos.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {nowRows.map((k) => {
              const s = k.start_position;
              const n = k.current_position;
              let change = "No change";
              let color = "var(--muted)";
              if (s == null && n != null) { change = "New"; color = "var(--accent)"; }
              else if (s != null && n != null && n < s) { change = `↑ ${s - n}`; color = "var(--ok)"; }
              else if (s != null && n != null && n > s) { change = `↓ ${n - s}`; color = "var(--danger)"; }
              const [pbg, pfg] = posColors(n);
              return (
                <div
                  key={k.id}
                  onMouseEnter={() => setHl(k.keyword)}
                  onMouseLeave={() => setHl(null)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 10px 16px", borderRadius: 16, background: bg(k.keyword) }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, lineHeight: 1.3, textWrap: "pretty" }}>{k.keyword}</span>
                  </span>
                  <span style={{ flex: "0 0 52px", textAlign: "right", fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {k.current_visits.toLocaleString("en-AU")}
                  </span>
                  <span style={{ flex: "0 0 48px", textAlign: "right", fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color }}>
                    {change}
                  </span>
                  <span style={{ width: 42, height: 42, flex: "none", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, background: pbg, color: pfg }}>
                    {n == null ? "–" : n}
                  </span>
                </div>
              );
            })}
            {list.length === 0 && (
              <div style={{ padding: "8px 12px", fontSize: 14, color: "var(--muted)" }}>No keywords match your search.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
