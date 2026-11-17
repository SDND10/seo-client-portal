// Pure helpers shared by server and client code (no DB imports here).

/** Average position + points-in-top-3 across a heatmap grid, like the design. */
export function heatmapStats(ranks: (number | null)[][]) {
  let sum = 0;
  let count = 0;
  let top3 = 0;
  for (const row of ranks) {
    for (const r of row) {
      if (r == null) continue;
      count++;
      sum += r > 20 ? 21 : r;
      if (r <= 3) top3++;
    }
  }
  const avg = count ? sum / count : 0;
  return { avg: avg > 20 ? "20+" : avg.toFixed(1), top3: `${top3} of ${count}`, count };
}
