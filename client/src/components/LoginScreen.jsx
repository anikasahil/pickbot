export default function LoginScreen() {
  function handleGoogleLogin() {
    window.location.href = "/auth/google";
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)",
      padding: "24px",
    }}>
      <div style={{
        background: "white", borderRadius: "24px", padding: "40px 32px",
        maxWidth: "380px", width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        textAlign: "center",
      }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "40px", margin: "0 auto 20px",
          boxShadow: "0 8px 24px rgba(22,163,74,0.4)",
        }}>🏓</div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
          PickBot
        </h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>
          Your AI pickleball concierge
        </p>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 32px" }}>
          Delhi NCR · Find courts · Book slots · Get matched
        </p>

        {/* Features */}
        <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px", marginBottom: "28px", textAlign: "left" }}>
          {[
            ["🏟️", "8 courts across Delhi NCR"],
            ["🤖", "AI chat that knows your preferences"],
            ["📅", "Book slots in seconds"],
            ["🔔", "Real-time slot availability alerts"],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", fontSize: "13px", color: "#374151" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%", padding: "13px 16px",
            border: "1px solid #e5e7eb", borderRadius: "12px",
            background: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            fontSize: "15px", fontWeight: 600, color: "#374151",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.15s, transform 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {/* Google G logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "16px", lineHeight: 1.5 }}>
          By signing in, your preferences are saved so PickBot remembers you across sessions.
        </p>
      </div>
    </div>
  );
}
