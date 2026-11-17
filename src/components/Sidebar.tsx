"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", label: "Home", icon: "house" },
  { href: "/keywords", label: "Keywords", icon: "search" },
  { href: "/google-my-business", label: "Google My Business", icon: "map-pin" },
  { href: "/technical-seo", label: "Technical SEO", icon: "wrench" },
  { href: "/backlinking", label: "Backlinking", icon: "link" },
  { href: "/ai-visibility", label: "AI Visibility", icon: "sparkles" },
  { href: "/activity", label: "Full Activity Log", icon: "history" },
  { href: "/reports", label: "Reports", icon: "chart-column" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({
  initials,
  dateLabel,
  weekday,
  pendingCount,
}: {
  initials: string;
  dateLabel: string;
  weekday: string;
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        flex: "0 0 216px",
        position: "sticky",
        top: 0,
        height: "100vh",
        alignSelf: "flex-start",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: "28px 24px",
      }}
    >
      <div>
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#2c54f2",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {initials}
        </span>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3, marginTop: 16 }}>{dateLabel}</div>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {weekday}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`nav-link${active ? " active" : ""}`}
            >
              <span style={{ display: "flex", color: active ? "var(--accent)" : "var(--icon)" }}>
                <Icon name={item.icon} size={18} />
              </span>
              {item.label}
              {active && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </Link>
          );
        })}
        <form action="/api/auth/logout" method="post" style={{ marginTop: 6 }}>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "9px 4px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--muted)",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </form>
      </div>

      <div
        style={{
          marginTop: "auto",
          background: "#2c54f2",
          color: "#ffffff",
          borderRadius: 22,
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="circle-check" size={20} color="#2c54f2" />
        </span>
        <div style={{ fontSize: 13, lineHeight: 1.45, textWrap: "pretty" }}>
          {pendingCount
            ? `${pendingCount} action${pendingCount === 1 ? " is" : "s are"} waiting for your approval`
            : "Nothing is waiting for your approval"}
        </div>
        <Link href="/#approvals" style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
          {pendingCount ? "Review now" : "All caught up"}
        </Link>
      </div>
    </nav>
  );
}
