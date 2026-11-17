import Link from "next/link";
import { Icon } from "./Icon";

export function BellLink({ hasPending }: { hasPending: boolean }) {
  return (
    <Link
      href="/#approvals"
      aria-label="Actions needing approval"
      style={{
        position: "relative",
        width: 42,
        height: 42,
        flex: "none",
        border: "1px solid var(--line)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--card)",
        color: "var(--text)",
      }}
    >
      <Icon name="bell" size={18} />
      {hasPending && (
        <span
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--lime)",
            boxShadow: "0 0 0 2px var(--page)",
          }}
        />
      )}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  hasPending,
  children,
}: {
  title: React.ReactNode;
  subtitle: string;
  hasPending: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px 24px",
        padding: "30px 24px 24px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {children}
        <BellLink hasPending={hasPending} />
      </div>
    </header>
  );
}

/** The rounded light-blue main area every page uses. */
export function Main({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <main
      style={{
        flex: 1,
        background: "var(--panel)",
        borderRadius: "32px 0 0 0",
        padding: "24px 24px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        ...style,
      }}
    >
      {children}
    </main>
  );
}
