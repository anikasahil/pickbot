import { useState } from "react";

function statusBadge(status) {
  const s = status === "confirmed"
    ? { background: "#dcfce7", color: "#16a34a" }
    : { background: "#fee2e2", color: "#b91c1c" };
  return <span style={{ ...s, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }}>{status}</span>;
}

export default function BookingHistory({ bookings, onClose, onCancel }) {
  const [cancelling, setCancelling] = useState(null);

  async function handleCancel(id) {
    setCancelling(id);
    try {
      await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      onCancel(id);
    } catch {
      alert("Failed to cancel. Try again.");
    } finally {
      setCancelling(null);
    }
  }

  const upcoming = bookings.filter(b => b.status === "confirmed");
  const past = bookings.filter(b => b.status !== "confirmed");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1500, display: "flex", justifyContent: "flex-end",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "340px", background: "white", height: "100%",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.25s ease",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          padding: "20px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>🏓 My Bookings</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: 2 }}>
              {upcoming.length} upcoming
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
            color: "white", borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {bookings.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
              <div style={{ fontSize: "36px", marginBottom: 12 }}>🏓</div>
              <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>No bookings yet</div>
              <div style={{ fontSize: "13px" }}>Tap "Book Slot" on a court card to get started.</div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Upcoming</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {upcoming.map(b => <BookingCard key={b.id} b={b} onCancel={handleCancel} cancelling={cancelling} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Past / Cancelled</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {past.map(b => <BookingCard key={b.id} b={b} onCancel={null} cancelling={cancelling} />)}
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}

function BookingCard({ b, onCancel, cancelling }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px",
      background: b.status === "confirmed" ? "#f5f3ff" : "white",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{b.ref}</div>
        {statusBadge(b.status)}
      </div>
      <div style={{ fontWeight: 600, fontSize: "14px", color: "#374151", marginBottom: 4 }}>{b.courtName}</div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: 2 }}>📅 {b.date} · {b.timeSlot}–{b.endTime}</div>
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: 6 }}>👤 {b.playerName} · {b.playerPhone}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: "14px" }}>₹{b.amount}</span>
        {onCancel && b.status === "confirmed" && (
          <button onClick={() => onCancel(b.id)} disabled={cancelling === b.id} style={{
            background: "none", border: "1px solid #fca5a5", color: "#dc2626",
            borderRadius: "6px", padding: "3px 10px", fontSize: "12px", cursor: "pointer", fontWeight: 500,
          }}>{cancelling === b.id ? "..." : "Cancel"}</button>
        )}
      </div>
    </div>
  );
}
