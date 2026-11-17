"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
};

const PROFILE_FIELDS: [keyof Profile, string, string][] = [
  ["business_name", "Business name", "text"],
  ["contact_name", "Contact name", "text"],
  ["email", "Email", "email"],
  ["phone", "Phone", "tel"],
  ["website", "Website", "text"],
  ["street", "Street address", "text"],
  ["suburb", "Suburb", "text"],
  ["state", "State", "text"],
  ["postcode", "Postcode", "text"],
];

export function SettingsPanel({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [tab, setTab] = useState<"Profile" | "Password" | "Appearance">("Profile");
  const [profile, setProfile] = useState(initial);
  const [profileStatus, setProfileStatus] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwStatus, setPwStatus] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("seoPortalTheme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  function applyTheme(t: "light" | "dark") {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("seoPortalTheme", t);
    } catch {}
    setTheme(t);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("");
    const res = await fetch("/api/settings/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfileStatus(res.ok ? "Changes saved" : data.error || "Could not save");
    if (res.ok) router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pw.current) { setPwStatus("Enter your current password"); setPwOk(false); return; }
    if (pw.next.length < 8) { setPwStatus("New password must be at least 8 characters"); setPwOk(false); return; }
    if (pw.next !== pw.confirm) { setPwStatus("The two new passwords do not match"); setPwOk(false); return; }
    const res = await fetch("/api/settings/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: pw.current, next: pw.next }),
    });
    const data = await res.json();
    if (res.ok) {
      setPw({ current: "", next: "", confirm: "" });
      setPwStatus("Password updated");
      setPwOk(true);
    } else {
      setPwStatus(data.error || "Could not update password");
      setPwOk(false);
    }
  }

  const themes: ["light" | "dark", string, string, string, string, string][] = [
    ["light", "Light", "#ffffff", "#eef2f9", "#ffffff", "#c5cddc"],
    ["dark", "Dark", "#0a1024", "#111938", "#1a2448", "#44517e"],
  ];

  return (
    <section className="card" style={{ maxWidth: 820, padding: "22px 24px 26px" }}>
      <div role="tablist" style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 18, borderBottom: "1px dashed var(--line)" }}>
        {(["Profile", "Password", "Appearance"] as const).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`pill-btn${tab === name ? " active" : ""}`}
            style={{ fontSize: 14, padding: "9px 18px" }}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 22 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>Profile</h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>The details we hold about you and your business</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 16 }}>
            {PROFILE_FIELDS.map(([key, label, type]) => (
              <label key={key} className="field-label">
                {label}
                <input
                  className="text-input"
                  type={type}
                  value={profile[key]}
                  onChange={(e) => {
                    setProfile({ ...profile, [key]: e.target.value });
                    setProfileStatus("");
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
            <button type="submit" className="cta-btn" style={{ padding: "13px 22px" }}>Save changes</button>
            <span role="status" style={{ fontSize: 14, fontWeight: 700, color: profileStatus === "Changes saved" ? "var(--ok)" : "var(--danger)" }}>
              {profileStatus}
            </span>
          </div>
        </form>
      )}

      {tab === "Password" && (
        <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 22, maxWidth: 420 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>Change password</h2>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Use at least 8 characters</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {([["current", "Current password"], ["next", "New password"], ["confirm", "Confirm new password"]] as const).map(
              ([key, label]) => (
                <label key={key} className="field-label">
                  {label}
                  <input
                    className="text-input"
                    type="password"
                    value={pw[key]}
                    onChange={(e) => { setPw({ ...pw, [key]: e.target.value }); setPwStatus(""); }}
                  />
                </label>
              )
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
            <button type="submit" className="cta-btn" style={{ padding: "13px 22px" }}>Update password</button>
            <span role="status" style={{ fontSize: 14, fontWeight: 700, color: pwOk ? "var(--ok)" : "var(--danger)" }}>{pwStatus}</span>
          </div>
        </form>
      )}

      {tab === "Appearance" && (
        <div style={{ marginTop: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>Appearance</h2>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Choose light or dark mode</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 18 }}>
            {themes.map(([id, name, page, panel, card, line]) => (
              <button
                key={id}
                type="button"
                aria-pressed={theme === id}
                onClick={() => applyTheme(id)}
                style={{
                  flex: "1 1 220px",
                  maxWidth: 300,
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 14,
                  border: 0,
                  borderRadius: 20,
                  background: "var(--tile)",
                  color: "var(--text)",
                  boxShadow: theme === id ? "0 0 0 2px var(--accent)" : "none",
                }}
              >
                <span style={{ display: "flex", height: 110, borderRadius: 12, overflow: "hidden", background: page }}>
                  <span style={{ flex: "0 0 26%", display: "flex", flexDirection: "column", gap: 7, padding: "10px 8px" }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#2c54f2" }} />
                    <span style={{ height: 5, borderRadius: 3, background: line }} />
                    <span style={{ height: 5, borderRadius: 3, background: line }} />
                    <span style={{ height: 5, borderRadius: 3, background: line }} />
                  </span>
                  <span style={{ flex: 1, marginTop: 14, borderRadius: "10px 0 0 0", padding: 8, display: "flex", flexDirection: "column", gap: 6, background: panel }}>
                    <span style={{ height: 34, borderRadius: 8, background: "#2c54f2" }} />
                    <span style={{ flex: 1, borderRadius: 8, background: card }} />
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{theme === id ? "On" : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
