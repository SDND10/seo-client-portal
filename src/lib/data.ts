import { sql } from "./db";

export type TrafficRow = { month: string; visits: number; is_partial: boolean };
export type KeywordRow = {
  id: number;
  keyword: string;
  start_position: number | null;
  current_position: number | null;
  start_visits: number;
  current_visits: number;
  featured: boolean;
};
export type ActivityRow = {
  id: number;
  occurred_on: string;
  type: string;
  subtype: string | null;
  body: string;
};
export type ApprovalRow = {
  id: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  detail: string | null;
  requested_on: string;
  status: string;
};
export type HeatmapPair = {
  keyword: string;
  before: { captured_on: string; grid_size: number; ranks: (number | null)[][] } | null;
  now: { captured_on: string; grid_size: number; ranks: (number | null)[][] } | null;
};
export type BacklinkRow = {
  id: number;
  obtained_on: string;
  site_name: string;
  domain: string;
  link_type: string;
  target_page: string | null;
};
export type AiCheckRow = { checked_on: string; score: number };
export type ReportRow = {
  id: string;
  title: string;
  issued_on: string | null;
  due_on: string | null;
  url: string | null;
  available: boolean;
};
export type MonthSummaryRow = { month: string; summary: string };

export async function getTraffic(clientId: string): Promise<TrafficRow[]> {
  return (await sql`
    select month::text as month, visits, is_partial
    from traffic_monthly where client_id = ${clientId} order by month`) as TrafficRow[];
}

export async function getKeywords(clientId: string): Promise<KeywordRow[]> {
  return (await sql`
    select id, keyword, start_position, current_position, start_visits, current_visits, featured
    from keywords where client_id = ${clientId}
    order by current_position nulls last, keyword`) as KeywordRow[];
}

export async function getPendingApprovals(clientId: string): Promise<ApprovalRow[]> {
  return (await sql`
    select id, type, icon, color, title, detail, requested_on::text as requested_on, status
    from approvals where client_id = ${clientId} and status = 'pending'
    order by requested_on desc`) as ApprovalRow[];
}

export async function getPendingCount(clientId: string): Promise<number> {
  const rows = (await sql`
    select count(*)::int as n from approvals
    where client_id = ${clientId} and status = 'pending'`) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function getActivity(clientId: string, opts?: { limit?: number; types?: string[] }): Promise<ActivityRow[]> {
  if (opts?.types?.length) {
    return (await sql`
      select id, occurred_on::text as occurred_on, type, subtype, body
      from activity_log where client_id = ${clientId} and type = any(${opts.types})
      order by occurred_on desc, id desc
      limit ${opts?.limit ?? 1000}`) as ActivityRow[];
  }
  return (await sql`
    select id, occurred_on::text as occurred_on, type, subtype, body
    from activity_log where client_id = ${clientId}
    order by occurred_on desc, id desc
    limit ${opts?.limit ?? 1000}`) as ActivityRow[];
}

export async function getHeatmaps(clientId: string): Promise<HeatmapPair[]> {
  const rows = (await sql`
    select keyword, captured_on::text as captured_on, grid_size, ranks
    from gmb_heatmaps where client_id = ${clientId}
    order by keyword, captured_on`) as {
    keyword: string;
    captured_on: string;
    grid_size: number;
    ranks: (number | null)[][];
  }[];
  const byKeyword = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byKeyword.get(r.keyword) ?? [];
    list.push(r);
    byKeyword.set(r.keyword, list);
  }
  const pairs: HeatmapPair[] = [];
  for (const [keyword, snaps] of byKeyword) {
    const before = snaps[0] ?? null;
    const now = snaps.length > 1 ? snaps[snaps.length - 1]! : null;
    pairs.push({
      keyword,
      before: before && { captured_on: before.captured_on, grid_size: before.grid_size, ranks: before.ranks },
      now: now && { captured_on: now.captured_on, grid_size: now.grid_size, ranks: now.ranks },
    });
  }
  return pairs;
}

export async function getBacklinks(clientId: string): Promise<BacklinkRow[]> {
  return (await sql`
    select id, obtained_on::text as obtained_on, site_name, domain, link_type, target_page
    from backlinks where client_id = ${clientId}
    order by obtained_on desc, id desc`) as BacklinkRow[];
}

export async function getAiChecks(clientId: string): Promise<AiCheckRow[]> {
  return (await sql`
    select checked_on::text as checked_on, score
    from ai_visibility_checks where client_id = ${clientId}
    order by checked_on`) as AiCheckRow[];
}

export async function getReports(clientId: string): Promise<ReportRow[]> {
  return (await sql`
    select id, title, issued_on::text as issued_on, due_on::text as due_on, url, available
    from reports where client_id = ${clientId}
    order by available desc, coalesce(issued_on, due_on)`) as ReportRow[];
}

export async function getMonthSummaries(clientId: string): Promise<MonthSummaryRow[]> {
  return (await sql`
    select month::text as month, summary
    from month_summaries where client_id = ${clientId}
    order by month desc`) as MonthSummaryRow[];
}
