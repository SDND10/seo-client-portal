"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientSummary = {
  slug: string;
  business_name: string;
  contact_name: string | null;
  suburb: string | null;
  state: string | null;
  start_date: string;
  pending: number;
  keywords: number;
  last_activity: string | null;
};

export function AdminDashboard({ clients }: { clients: ClientSummary[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(clients.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    business_name: "", contact_name: "", email: "", phone: "", website: "",
    suburb: "", state: "", postcode: "", lat: "", lng: "",
    login_email: "", login_password: "",
  });

  async function viewPortal(slug: string) {
    await fetch("/api/admin/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    router.push("/");
    router.refresh();
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create client");
      return;
    }
    if (data.warning) setError(data.warning);
    setShowForm(false);
    setForm({
      business_name: "", contact_name: "", email: "", phone: "", website: "",
      suburb: "", state: "", postcode: "", lat: "", lng: "",
      login_email: "", login_password: "",
    });
    router.refresh();
  }

  const field = (key: keyof typeof form, label: string, type = "text", required = false) => (
    <label className="field-label">
      {label}
      <input
        className="text-input"
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );

  return (
    <>
      <section className="card">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px 16px", paddingBottom: 16, borderBottom: "1px dashed var(--line)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Clients</h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              {clients.length} client{clients.length === 1 ? "" : "s"} on the portal
            </div>
          </div>
          <button type="button" className="cta-btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Close" : "Add client"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={createClient} style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20, paddingBottom: 22, borderBottom: "1px dashed var(--line)" }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>New client</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
              {field("business_name", "Business name", "text", true)}
              {field("contact_name", "Contact name")}
              {field("email", "Contact email", "email")}
              {field("phone", "Phone", "tel")}
              {field("website", "Website")}
              {field("suburb", "Suburb")}
              {field("state", "State")}
              {field("postcode", "Postcode")}
              {field("lat", "Latitude (for the Maps heatmap)")}
              {field("lng", "Longitude")}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
              Portal login for this client (optional — you can add it later)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
              {field("login_email", "Login email", "email")}
              {field("login_password", "Login password (min 8 chars)", "text")}
            </div>
            {error && <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>{error}</div>}
            <div>
              <button type="submit" className="cta-btn" disabled={busy} style={{ padding: "13px 22px" }}>
                {busy ? "Creating…" : "Create client"}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {clients.map((c) => (
            <div key={c.slug} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px 14px", padding: "14px 16px", borderRadius: 16, background: "var(--tile)" }}>
              <span style={{ width: 44, height: 44, flex: "none", borderRadius: "50%", background: "#2c54f2", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
                {c.business_name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
              </span>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{c.business_name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {[c.contact_name, [c.suburb, c.state].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || c.slug}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13, fontWeight: 700 }}>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: "var(--card)" }}>
                  {c.keywords} keywords
                </span>
                <span style={{ padding: "5px 12px", borderRadius: 999, background: c.pending ? "var(--lime)" : "var(--card)", color: c.pending ? "#0e1a3a" : "var(--text)" }}>
                  {c.pending} pending
                </span>
              </div>
              <button type="button" className="ghost-btn" onClick={() => viewPortal(c.slug)}>
                View portal
              </button>
            </div>
          ))}
          {clients.length === 0 && (
            <div style={{ fontSize: 14, color: "var(--muted)", padding: "10px 4px" }}>
              No clients yet — add your first one above.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
