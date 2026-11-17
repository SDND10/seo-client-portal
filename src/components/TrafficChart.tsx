// The organic-traffic line chart from the home page design (pure SVG, server-rendered).

import type { TrafficRow } from "@/lib/data";
import { fmtMonthShort, fmtNum } from "@/lib/format";

export function TrafficChart({ full }: { full: TrafficRow[] }) {
  if (full.length < 2) {
    return (
      <div style={{ fontSize: 14, color: "#dfe7ff", padding: "20px 0" }}>
        The traffic chart will appear once at least two months of data have been recorded.
      </div>
    );
  }

  const maxY = Math.max(300, Math.ceil(Math.max(...full.map((d) => d.visits)) / 300) * 300);
  const xy = full.map((d, i) => [
    (i / (full.length - 1)) * 100,
    100 - (d.visits / maxY) * 100,
  ]);
  const f = (v: number) => v.toFixed(2);
  const line = xy.map((q, i) => `${i ? "L" : "M"}${f(q[0]!)} ${f(q[1]!)}`).join(" ");
  const baseY = f(100 - (full[0]!.visits / maxY) * 100);
  const ticks = [0, 1, 2, 3, 4].map((i) => ({
    label: fmtNum((maxY / 4) * i),
    bottom: `${i * 25}%`,
  }));

  return (
    <div
      style={{
        minWidth: 0,
        padding: "16px 18px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.32)",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: "0 0 38px", height: 230 }}>
          {ticks.map((t) => (
            <div
              key={t.bottom}
              style={{
                position: "absolute",
                right: 0,
                bottom: t.bottom,
                transform: "translateY(50%)",
                fontSize: 12,
                fontWeight: 600,
                color: "#dfe7ff",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 0, height: 230 }}>
          {ticks.map((t) => (
            <div
              key={t.bottom}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: t.bottom,
                borderTop: "1px solid rgba(255,255,255,0.18)",
              }}
            />
          ))}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="tg-lime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8df23f" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#8df23f" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${line} L100 100 L0 100 Z`} fill="url(#tg-lime)" />
            <path
              d={`M0 ${baseY} L100 ${baseY}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeDasharray="6 6"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={line}
              fill="none"
              stroke="#8df23f"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {full.map((d, i) => (
            <div
              key={d.month}
              style={{
                position: "absolute",
                left: `${xy[i]![0]}%`,
                bottom: `${100 - xy[i]![1]!}%`,
                width: 12,
                height: 12,
                margin: "0 0 -6px -6px",
                borderRadius: "50%",
                background: "#8df23f",
                border: "2.5px solid #2c54f2",
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <div style={{ flex: "0 0 38px" }} />
        <div style={{ position: "relative", flex: 1, minWidth: 0, height: 18 }}>
          {full.map((d, i) => (
            <div
              key={d.month}
              style={{
                position: "absolute",
                left: `${xy[i]![0]}%`,
                top: 0,
                transform: "translateX(-50%)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#dfe7ff",
                whiteSpace: "nowrap",
              }}
            >
              {fmtMonthShort(d.month)}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 18px",
          marginTop: 14,
          fontSize: 12,
          fontWeight: 600,
          color: "#ffffff",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#8df23f" }} />
          Visits from Google per month
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, borderTop: "2px dashed #ffffff" }} />
          Where we started
        </span>
      </div>
    </div>
  );
}
