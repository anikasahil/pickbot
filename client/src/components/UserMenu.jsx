import { useState, useRef, useEffect } from "react";

export default function UserMenu({ user, onLogout, onShowProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await fetch("/auth/logout", { method: "POST" });
    localStorage.removeItem("pickbot_token");
    onLogout();
  }

  const profile = user?.profile || {};
  const filled = [profile.skillLevel, profile.area, profile.timing, profile.playStyle].filter(Boolean).length;
  const pct = Math.round((filled / 4) * 100);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
          borderRadius: "999px", padding: "3px",
          display: "flex", alignItems: "center", gap: "7px",
        }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.5)" }} />
        ) : (
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "13px" }}>
            {user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <span style={{ color: "white", fontSize: "12px", fontWeight: 600, paddingRight: 6 }}>
          {user.name?.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "white", borderRadius: "14px", width: "240px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 1000,
          border: "1px solid #e5e7eb", overflow: "hidden",
        }}>
          {/* User info */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: 40, height: 40, borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{user.name}</div>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>{user.email}</div>
              </div>
            </div>

            {/* Profile completeness */}
            <div style={{ marginTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginBottom: 4 }}>
                <span>Profile complete</span><span style={{ fontWeight: 600, color: pct === 100 ? "#16a34a" : "#f59e0b" }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: "#e5e7eb", borderRadius: 999 }}>
                <div style={{ height: 4, borderRadius: 999, width: `${pct}%`, background: pct === 100 ? "#16a34a" : "#f59e0b", transition: "width 0.4s" }} />
              </div>
            </div>
          </div>

          {/* Profile snapshot */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
            {[
              ["🎯 Skill", profile.skillLevel],
              ["📍 Area", profile.area],
              ["⏰ Timing", profile.timing],
              ["👥 Style", profile.playStyle],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: 4 }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span style={{ color: val ? "#111827" : "#d1d5db", fontWeight: val ? 600 : 400 }}>{val || "not set"}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: "8px 0" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", padding: "10px 16px", border: "none", background: "none",
                cursor: "pointer", textAlign: "left", fontSize: "13px", color: "#dc2626",
                display: "flex", alignItems: "center", gap: "8px",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
