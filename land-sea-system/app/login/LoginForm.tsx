import {
  errorStyle,
  inputStyle,
  palette,
  primaryButtonStyle,
} from "@/lib/ui";

export default function LoginForm({
  error,
}: {
  error?: string;
}) {
  return (
    <form
      action="/api/auth/login"
      method="post"
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
        <label htmlFor="email" style={{ display: "block", marginBottom: "8px" }}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue="admin@landsea.local"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="password" style={{ display: "block", marginBottom: "8px" }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue="Admin12345!"
          required
          style={inputStyle}
        />
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      <button
        type="submit"
        style={primaryButtonStyle}
      >
        Sign In
      </button>
    </form>
  );
}
