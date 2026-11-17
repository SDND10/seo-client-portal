"use client";

import { useState } from "react";
import { HeatmapCard, HeatmapLegend, type HeatmapSnapshot } from "./Heatmap";
import { fmtDayYear } from "@/lib/format";

export type HeatmapPairProp = {
  keyword: string;
  before: HeatmapSnapshot | null;
  now: HeatmapSnapshot | null;
};

export function GmbCompare({
  pairs,
  lat,
  lng,
  pinScale = 52,
  minCardWidth = 240,
}: {
  pairs: HeatmapPairProp[];
  lat: number | null;
  lng: number | null;
  pinScale?: number;
  minCardWidth?: number;
}) {
  const [kw, setKw] = useState(0);

  if (pairs.length === 0) {
    return (
      <div style={{ fontSize: 14, color: "var(--muted)" }}>
        Maps ranking scans will appear here once your SEO manager runs the first one.
      </div>
    );
  }

  const pair = pairs[Math.min(kw, pairs.length - 1)]!;
  // If only one snapshot exists so far, show it as "Now".
  const before = pair.now ? pair.before : null;
  const now = pair.now ?? pair.before;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {pairs.map((p, i) => (
          <button
            key={p.keyword}
            type="button"
            className={`pill-btn${i === kw ? " active" : ""}`}
            aria-pressed={i === kw}
            onClick={() => setKw(i)}
          >
            {p.keyword}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCardWidth}px), 1fr))`,
          gap: 24,
        }}
      >
        <HeatmapCard
          title="Before"
          dateLabel={before ? fmtDayYear(before.captured_on) : ""}
          snapshot={before}
          lat={lat}
          lng={lng}
          pinScale={pinScale}
        />
        <HeatmapCard
          title="Now"
          dateLabel={now ? fmtDayYear(now.captured_on) : ""}
          snapshot={now}
          lat={lat}
          lng={lng}
          pinScale={pinScale}
        />
      </div>
      <HeatmapLegend />
    </>
  );
}
