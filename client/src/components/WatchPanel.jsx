import { useState } from "react";

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusBadge(status) {
  const styles = {
    active:    { background: "#dcfce7", color: "#16a34a" },
    fulfilled: { background: "#dbeafe", color: "#1d4ed8" },
    cancelled: { background: "#f3f4f6", color: "#6b7280" },
    expired:   { background: "#fee2e2", color: "#b91c1c" },
  };
  const s = styles[status] || styles.cancelled;
  return (
    <span style={{ ...s, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }}>
      {status}
    </span>
  );
}

export default function WatchPanel({ watches, onClose, onCancel }) {
  const [cancelling, setCancelling] = useState(null);

  const active = watches.filter(w => w.status === "active");
  const past = watches.filter(w => w.status !== "active");

  async function handleCancel(watchId) {
    setCancelling(watchId);
    try {
      await fetch(`/api/watches/${watchId}`, { method: "DELETE" });
      onCancel(watchId);
    } catch {
      alert("Failed to cancel. Try again.");
    } finally {
      setCancelling(null);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1500, display: "flex", justifyContent: "flex-end",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "340px", background: "white", height: "100%",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          padding: "20px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>👀 My Watches</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: 2 }}>
              {active.length} active
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
            color: "white", borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {watches.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
              <div style={{ fontSize: "36px", marginBottom: 12 }}>👁️</div>
              <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>No watches yet</div>
              <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
                Tap "Watch Slot" on any court card to get notified when a slot opens up.
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Active
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {active.map(w => (
                  <WatchCard key={w.id} w={w} onCancel={handleCancel} cancelling={cancelling} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Past
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {past.map(w => (
                  <WatchCard key={w.id} w={w} onCancel={null} cancelling={cancelling} />
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}

function WatchCard({ w, onCancel, cancelling }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "12px",
      background: w.status === "active" ? "#f9fafb" : "white",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{w.courtName}</div>
        <div>{statusBadge(w.status)}</div>
      </div>

      <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: 4 }}>
        📅 {w.date}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: 6 }}>
        {w.timeSlots.map(s => (
          <span key={s} style={{
            background: "#e5e7eb", color: "#374151",
            fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: 500,
          }}>{s}</span>
        ))}
      </div>

      {w.note && (
        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: 6, fontStyle: "italic" }}>
          "{w.note}"
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>Created {timeAgo(w.createdAt)}</span>
        {onCancel && w.status === "active" && (
          <button
            onClick={() => onCancel(w.id)}
            disabled={cancelling === w.id}
            style={{
              background: "none", border: "1px solid #fca5a5", color: "#dc2626",
              borderRadius: "6px", padding: "3px 10px", fontSize: "12px",
              cursor: "pointer", fontWeight: 500,
            }}
          >
            {cancelling === w.id ? "..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
