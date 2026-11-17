import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getKeywords, getPendingCount, getTraffic } from "@/lib/data";
import { fmtDayLong, fmtMonthYear } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { KeywordsBoard } from "@/components/KeywordsBoard";

export const dynamic = "force-dynamic";

export default async function KeywordsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [keywords, pending, traffic] = await Promise.all([
    getKeywords(client.id),
    getPendingCount(client.id),
    getTraffic(client.id),
  ]);

  const fullMonths = traffic.filter((t) => !t.is_partial);
  const startMonth = fullMonths[0]?.month ?? client.start_date;
  const nowMonth = fullMonths[fullMonths.length - 1]?.month ?? client.start_date;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Keywords"
        subtitle={`Your Google positions on ${fmtDayLong(client.start_date)} compared with today`}
        hasPending={pending > 0}
      />
      <Main>
        <KeywordsBoard
          rows={keywords}
          startLabel={fmtDayLong(client.start_date)}
          startMonthLabel={fmtMonthYear(startMonth)}
          nowLabel={fmtDayLong(today)}
          nowMonthLabel={fmtMonthYear(nowMonth)}
        />
      </Main>
    </>
  );
}
