"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  height: 48,
  padding: "0 14px",
  border: "1px solid #c5cddc",
  borderRadius: 14,
  background: "#ffffff",
  color: "#0e1a3a",
  font: "inherit",
  fontSize: 15,
  fontWeight: 600,
  minWidth: 0,
};

const submitStyle: React.CSSProperties = {
  height: 50,
  fontFamily: "inherit",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  background: "#8df23f",
  color: "#0e1a3a",
  border: 0,
  borderRadius: 999,
};

const linkBtnStyle: React.CSSProperties = {
  alignSelf: "center",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  border: 0,
  background: "transparent",
  color: "#2c54f2",
  padding: "6px 8px",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Login accepts an email address or a plain username; the email-format check
// is only used by the password-reset view.
export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("Enter your email or username");
    if (!password) return setError("Enter your password");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Wrong email or password");
        setBusy(false);
        return;
      }
      router.push(data.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail(email)) {
      setError("Enter a valid email address");
      setResetSent(false);
      return;
    }
    setError("");
    setResetSent(true);
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        minHeight: "100vh",
        background: "#ffffff",
        padding: 16,
        gap: 16,
        color: "#0e1a3a",
      }}
    >
      {/* Brand panel */}
      <div
        style={{
          flex: "1 1 340px",
          minWidth: 0,
          minHeight: 260,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 40,
          padding: 36,
          borderRadius: 28,
          color: "#ffffff",
          background: "radial-gradient(120% 140% at 88% 0%, #4b74ff 0%, #2c54f2 48%, #2146e0 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#8df23f" }} />
          Network Digital
        </div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.03em", maxWidth: 420, textWrap: "balance" }}>
            See what your SEO manager is doing
          </div>
          <div style={{ fontSize: 16, color: "#dfe7ff", marginTop: 14, maxWidth: 400, textWrap: "pretty" }}>
            Rankings, traffic, Google Maps visibility and every action taken, in one place.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div
        style={{
          flex: "1 1 360px",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          borderRadius: 28,
          background: "#eef2f9",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400, background: "#ffffff", borderRadius: 24, padding: "32px 28px" }}>
          {view === "login" ? (
            <form onSubmit={submitLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>Log in</h1>
                <div style={{ fontSize: 14, color: "#5f6b82", marginTop: 2 }}>Open your client portal</div>
              </div>
              <label style={labelStyle}>
                Email
                <input
                  type="text"
                  value={email}
                  autoComplete="username"
                  placeholder="you@yourbusiness.com.au"
                  onChange={(e) => { setEmail(e.target.value); setError(""); setResetSent(false); }}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Password
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 48,
                    border: "1px solid #c5cddc",
                    borderRadius: 14,
                    background: "#ffffff",
                    paddingRight: 6,
                  }}
                >
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    style={{ flex: 1, minWidth: 0, height: "100%", padding: "0 14px", border: 0, borderRadius: 14, background: "transparent", color: "#0e1a3a", font: "inherit", fontSize: 15, fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    style={{ flex: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", border: 0, borderRadius: 10, padding: "8px 10px", background: "transparent", color: "#2c54f2" }}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
              {error && (
                <div role="alert" style={{ fontSize: 14, fontWeight: 700, color: "#d92d20" }}>{error}</div>
              )}
              <button type="submit" disabled={busy} style={{ ...submitStyle, opacity: busy ? 0.7 : 1 }}>
                {busy ? "Logging in…" : "Log in"}
              </button>
              <button type="button" onClick={() => { setView("reset"); setError(""); setResetSent(false); }} style={linkBtnStyle}>
                Forgot your password?
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>Reset password</h1>
                <div style={{ fontSize: 14, color: "#5f6b82", marginTop: 2, textWrap: "pretty" }}>
                  Enter your email and we&apos;ll send you a link to set a new password
                </div>
              </div>
              <label style={labelStyle}>
                Email
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="you@yourbusiness.com.au"
                  onChange={(e) => { setEmail(e.target.value); setError(""); setResetSent(false); }}
                  style={inputStyle}
                />
              </label>
              {error && (
                <div role="alert" style={{ fontSize: 14, fontWeight: 700, color: "#d92d20" }}>{error}</div>
              )}
              {resetSent && (
                <div role="status" style={{ fontSize: 14, fontWeight: 700, color: "#14833b", textWrap: "pretty" }}>
                  If that email has an account, a reset link is on its way.
                </div>
              )}
              <button type="submit" style={submitStyle}>Send reset link</button>
              <button type="button" onClick={() => { setView("login"); setError(""); setResetSent(false); }} style={linkBtnStyle}>
                Back to log in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
