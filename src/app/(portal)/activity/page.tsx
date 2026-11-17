import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getActivity, getMonthSummaries, getPendingCount } from "@/lib/data";
import { fmtDayLong } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { ActivityBoard } from "@/components/ActivityBoard";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [entries, summaries, pending] = await Promise.all([
    getActivity(client.id),
    getMonthSummaries(client.id),
    getPendingCount(client.id),
  ]);

  return (
    <>
      <PageHeader
        title="Activity log"
        subtitle={`Everything your SEO manager has done since ${fmtDayLong(client.start_date)}`}
        hasPending={pending > 0}
      />
      <Main>
        <ActivityBoard entries={entries} summaries={summaries} sinceLabel={fmtDayLong(client.start_date)} />
      </Main>
    </>
  );
}
