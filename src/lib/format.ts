const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-11-14" -> { y, m (1-12), d } without timezone surprises */
export function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y: y!, m: m!, d: d! };
}

/** "2026-11-14" -> "14 Nov" */
export function fmtDay(iso: string): string {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "2026-11-14" -> "14 Nov 2026" */
export function fmtDayYear(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "2026-11-14" -> "14 November 2026" */
export function fmtDayLong(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "2026-11-01" -> "November 2026" */
export function fmtMonthYear(iso: string): string {
  const { y, m } = parts(iso);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** "2026-11-01" -> "Nov" */
export function fmtMonthShort(iso: string): string {
  return MONTHS_SHORT[parts(iso).m - 1]!;
}

/** "2026-11-01" -> "November" */
export function fmtMonthLong(iso: string): string {
  return MONTHS_LONG[parts(iso).m - 1]!;
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-AU");
}

export function todayParts() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-AU", { weekday: "long" });
  const label = `${MONTHS_SHORT[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  return { label, weekday };
}
