import { useState } from "react";

export default function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim().toUpperCase() === "KAMINEY") {
      localStorage.setItem("pickbot_access", "granted");
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setInput("");
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)",
      padding: "24px",
    }}>
      <div style={{
        background: "white", borderRadius: "24px", padding: "40px 32px",
        maxWidth: "360px", width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        textAlign: "center",
        animation: shaking ? "shake 0.4s ease" : "none",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "36px", margin: "0 auto 20px",
          boxShadow: "0 8px 24px rgba(22,163,74,0.4)",
        }}>🏓</div>

        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>PickBot</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 28px" }}>
          Private beta · Enter your access code
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Access code"
            style={{
              width: "100%", padding: "13px 16px", boxSizing: "border-box",
              border: `2px solid ${error ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: "12px", fontSize: "18px", fontWeight: 700,
              textAlign: "center", letterSpacing: "0.15em", textTransform: "uppercase",
              outline: "none", marginBottom: "12px",
              transition: "border-color 0.2s",
              color: "#111827",
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = "#16a34a"; }}
            onBlur={e => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "10px", fontWeight: 500 }}>
              Wrong code. Try again.
            </p>
          )}

          <button type="submit" style={{
            width: "100%", padding: "13px",
            border: "none", borderRadius: "12px",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "white", fontSize: "15px", fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.02em",
          }}>
            Enter →
          </button>
        </form>

        <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "20px" }}>
          Get your access code from the PickBot team
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
