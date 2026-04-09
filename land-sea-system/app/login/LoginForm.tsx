"use client";

import { useState } from "react";
import {
  errorStyle,
  inputStyle,
  palette,
  primaryButtonStyle,
} from "@/lib/ui";

export default function LoginForm() {
  const [email, setEmail] = useState("admin@landsea.local");
  const [password, setPassword] = useState("Admin12345!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        maxWidth: "420px",
        border: `1px solid ${palette.border}`,
        borderRadius: "28px",
        padding: "32px",
        background: "rgba(255, 252, 242, 0.9)",
        boxShadow: "0 24px 60px rgba(37, 36, 34, 0.10)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          padding: "6px 12px",
          borderRadius: "999px",
          background: "rgba(235, 94, 40, 0.10)",
          color: palette.spicyPaprika,
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Secure Access
      </div>
      <h1
        style={{
          marginTop: 0,
          marginBottom: "10px",
          fontSize: "38px",
          letterSpacing: "-0.05em",
        }}
      >
        Login
      </h1>
      <p style={{ color: palette.mutedText, marginTop: 0, marginBottom: "24px" }}>
        Sign in to access the Land and Sea System.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      <button
        type="submit"
        disabled={loading}
        style={primaryButtonStyle}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
