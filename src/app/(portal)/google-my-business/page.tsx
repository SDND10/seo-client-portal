import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getActivity, getHeatmaps, getPendingCount } from "@/lib/data";
import { fmtDayLong } from "@/lib/format";
import { PageHeader, Main } from "@/components/PageHeader";
import { GmbCompare } from "@/components/GmbCompare";
import { GmbActivity } from "@/components/GmbActivity";

export const dynamic = "force-dynamic";

export default async function GmbPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const [heatmaps, activity, pending] = await Promise.all([
    getHeatmaps(client.id),
    getActivity(client.id, { types: ["Google My Business"] }),
    getPendingCount(client.id),
  ]);

  return (
    <>
      <PageHeader
        title="Google My Business"
        subtitle="Where you show up on Google Maps, and the work done on your profile"
        hasPending={pending > 0}
      />
      <Main>
        <section className="card">
          <div style={{ paddingBottom: 16, borderBottom: "1px dashed var(--line)", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              Maps ranking: before and now
            </h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Pick a keyword to compare</div>
          </div>
          <GmbCompare pairs={heatmaps} lat={client.lat} lng={client.lng} pinScale={52} minCardWidth={240} />
        </section>
        <GmbActivity entries={activity} sinceLabel={fmtDayLong(client.start_date)} />
      </Main>
    </>
  );
}
