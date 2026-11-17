import { redirect } from "next/navigation";
import { getSession, resolveClient } from "@/lib/auth";
import { getPendingCount } from "@/lib/data";
import { PageHeader, Main } from "@/components/PageHeader";
import { SettingsPanel } from "@/components/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const client = await resolveClient(session);
  if (!client) redirect(session.role === "admin" ? "/admin" : "/login");

  const pending = await getPendingCount(client.id);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your details, password and appearance"
        hasPending={pending > 0}
      />
      <Main>
        <SettingsPanel
          initial={{
            business_name: client.business_name ?? "",
            contact_name: client.contact_name ?? "",
            email: client.email ?? "",
            phone: client.phone ?? "",
            website: client.website ?? "",
            street: client.street ?? "",
            suburb: client.suburb ?? "",
            state: client.state ?? "",
            postcode: client.postcode ?? "",
          }}
        />
      </Main>
    </>
  );
}
