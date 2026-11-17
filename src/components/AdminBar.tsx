"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminBar({
  clients,
  current,
}: {
  clients: { slug: string; business_name: string }[];
  current: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchClient(slug: string) {
    setBusy(true);
    await fetch("/api/admin/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px 16px",
        padding: "10px 24px",
        background: "#0e1a3a",
        color: "#ffffff",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span style={{ fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }}>
        Master view
      </span>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        Viewing
        <select
          value={current}
          disabled={busy}
          onChange={(e) => switchClient(e.target.value)}
          style={{
            font: "inherit",
            fontWeight: 700,
            padding: "6px 10px",
            borderRadius: 999,
            border: 0,
            background: "#ffffff",
            color: "#0e1a3a",
            cursor: "pointer",
          }}
        >
          {clients.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.business_name}
            </option>
          ))}
        </select>
      </label>
      <Link href="/admin" style={{ color: "#8df23f", fontWeight: 800 }}>
        All clients
      </Link>
    </div>
  );
}
