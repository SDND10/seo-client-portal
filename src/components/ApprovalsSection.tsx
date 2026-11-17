"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBadge } from "./Icon";
import { fmtDay } from "@/lib/format";

type Approval = {
  id: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  detail: string | null;
  requested_on: string;
};

export function ApprovalsSection({ approvals }: { approvals: Approval[] }) {
  const router = useRouter();
  const [decided, setDecided] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const pending = approvals.filter((a) => !decided.includes(a.id));

  async function decide(id: string, verdict: "approved" | "rejected") {
    setBusy(id);
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, verdict }),
    });
    setBusy(null);
    if (res.ok) {
      setDecided((d) => [...d, id]);
      router.refresh();
    }
  }

  return (
    <section
      id="approvals"
      style={{
        background: "var(--card)",
        border: "1.5px solid var(--lime)",
        borderRadius: 24,
        padding: "22px 24px 24px",
        boxShadow: "0 8px 24px rgba(141,242,63,0.18)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          Actions needing approval
        </h2>
        <span
          style={{
            minWidth: 24,
            height: 24,
            padding: "0 7px",
            borderRadius: 12,
            background: "var(--accent)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {pending.length}
        </span>
      </div>
      {pending.length > 0 ? (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
          {pending.map((item) => (
            <div
              key={item.id}
              style={{
                flex: "1 0 250px",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 16,
                borderRadius: 18,
                background: "var(--tile)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconBadge name={item.icon} color={item.color} size={36} radius={10} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, whiteSpace: "nowrap" }}>
                    {item.type}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
                    Requested {fmtDay(item.requested_on)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginTop: 4, textWrap: "pretty" }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", textWrap: "pretty" }}>{item.detail}</div>
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10 }}>
                <button
                  type="button"
                  className="cta-btn"
                  disabled={busy === item.id}
                  onClick={() => decide(item.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={busy === item.id}
                  onClick={() => decide(item.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 14, color: "var(--muted)" }}>Nothing needs your approval right now.</div>
      )}
    </section>
  );
}
