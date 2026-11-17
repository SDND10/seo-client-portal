// Maps-ranking heatmap: a map embed with rank pins laid out on a grid,
// exactly like the design. Pure markup - safe as a server component.

import { heatmapStats } from "@/lib/heatmap";

export type HeatmapSnapshot = {
  captured_on: string;
  grid_size: number;
  ranks: (number | null)[][];
};

function pinColor(rank: number): string {
  if (rank > 20) return "#7f1d1d";
  if (rank <= 3) return "#15803d";
  if (rank <= 10) return "#c2410c";
  return "#dc2626";
}

export function HeatmapCard({
  title,
  dateLabel,
  snapshot,
  lat,
  lng,
  pinScale = 52,
}: {
  title: string;
  dateLabel: string;
  snapshot: HeatmapSnapshot | null;
  lat: number | null;
  lng: number | null;
  pinScale?: number;
}) {
  if (!snapshot) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        </div>
        <div
          style={{
            aspectRatio: "1",
            borderRadius: 18,
            background: "var(--tile)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: 14,
            padding: 20,
            textAlign: "center",
          }}
        >
          No scan for this period yet
        </div>
      </div>
    );
  }

  const n = snapshot.grid_size;
  const c = (n - 1) / 2;
  const stats = heatmapStats(snapshot.ranks);
  const pinSize = (pinScale / (n + 2)).toFixed(2) + "cqw";
  const pinFont = ((pinScale / 2.08) / (n + 2)).toFixed(2) + "cqw";

  const pins: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const rank = snapshot.ranks[i]?.[j];
      if (rank == null) continue;
      const me = i === c && j === c;
      pins.push(
        <div
          key={`${i}-${j}`}
          style={{
            position: "absolute",
            left: `${50 + ((j - c) / (n + 2)) * 100}%`,
            top: `${50 + ((i - c) / (n + 2)) * 100}%`,
            width: pinSize,
            height: pinSize,
            transform: "translate(-50%,-85%) rotate(-45deg)",
            borderRadius: "50% 50% 50% 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: pinColor(rank),
            boxShadow: me
              ? "0 0 0 2px #ffffff, 0 0 0 4px #0e1a3a"
              : "0 1px 3px rgba(14,26,58,0.4)",
            zIndex: me ? 2 : 1,
          }}
        >
          <span
            style={{
              transform: "rotate(45deg)",
              color: "#ffffff",
              fontWeight: 800,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              fontSize: pinFont,
            }}
          >
            {rank > 20 ? "" : rank}
          </span>
        </div>
      );
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>{dateLabel}</span>
      </div>
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          borderRadius: 18,
          overflow: "hidden",
          containerType: "inline-size",
          background:
            "repeating-linear-gradient(0deg,transparent 0 11%,#ffffff 11% 12.5%),repeating-linear-gradient(90deg,transparent 0 11%,#ffffff 11% 12.5%),#e6ebe4",
        }}
      >
        {lat != null && lng != null && (
          <iframe
            title="Map"
            src={`https://maps.google.com/maps?ll=${lat},${lng}&z=11&output=embed`}
            loading="lazy"
            style={{
              position: "absolute",
              left: "-30%",
              top: "-30%",
              width: "160%",
              height: "160%",
              border: 0,
              pointerEvents: "none",
            }}
          />
        )}
        {pins}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 14, background: "var(--tile)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{stats.avg}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Average position</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, padding: "10px 14px", borderRadius: 14, background: "var(--tile)" }}>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{stats.top3}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Points in top 3</div>
        </div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  const dot = (bg: string, extra?: React.CSSProperties) => (
    <span style={{ width: 12, height: 12, borderRadius: "50%", background: bg, ...extra }} />
  );
  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          marginTop: 20,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{dot("#15803d")}1–3</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{dot("#c2410c")}4–10</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{dot("#dc2626")}11–20</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{dot("#7f1d1d")}Not in top 20</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {dot("#15803d", { boxShadow: "0 0 0 2px #ffffff, 0 0 0 4px #0e1a3a" })}Your location
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, textWrap: "pretty" }}>
        Each pin is your Maps position for a search made from that point. Pins are 2 km apart. Map data © Google.
      </div>
    </>
  );
}
