import { useState, useEffect } from "react";

const TIME_SLOTS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00",
];
const PEAK = new Set(["06:00","07:00","08:00","17:00","18:00","19:00","20:00"]);

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function SlotPicker({ court, onClose, onWatch }) {
  const [date, setDate] = useState(todayStr());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [note, setNote] = useState("");
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!court) return;
    setLoading(true);
    fetch(`/api/availability/${court.id}?date=${date}`)
      .then(r => r.json())
      .then(data => {
        const map = {};
        (data.availableSlots || []).forEach(s => { map[s] = true; });
        setAvailability(map);
      })
      .catch(() => setAvailability({}))
      .finally(() => setLoading(false));
  }, [court, date]);

  function toggleSlot(slot) {
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  }

  async function handleWatch() {
    if (selectedSlots.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtId: court.id, date, timeSlots: selectedSlots, note }),
      });
      const w = await res.json();
      onWatch(w);
      onClose();
    } catch (e) {
      alert("Failed to set watch. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!court) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "16px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "white", borderRadius: "16px", width: "100%", maxWidth: "440px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>Watch a Slot</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: 2 }}>{court.name}</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
            color: "white", borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>×</button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Date picker */}
          <label style={{ display: "block", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Date</span>
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={e => setDate(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
                borderRadius: "8px", fontSize: "14px", boxSizing: "border-box",
                outline: "none",
              }}
            />
          </label>

          {/* Slots */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Select time slots to watch</span>
              {loading && <span style={{ color: "#9ca3af", fontWeight: 400 }}>Loading...</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {TIME_SLOTS.map(slot => {
                const avail = availability[slot];
                const selected = selectedSlots.includes(slot);
                const peak = PEAK.has(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    style={{
                      padding: "7px 4px",
                      borderRadius: "8px",
                      border: selected ? "2px solid #16a34a" : "1px solid #e5e7eb",
                      background: selected ? "#dcfce7" : avail ? "#f9fafb" : "#fee2e2",
                      color: selected ? "#16a34a" : avail ? "#374151" : "#b91c1c",
                      fontSize: "12px",
                      fontWeight: selected ? 700 : 500,
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.1s",
                    }}
                  >
                    {slot}
                    {peak && (
                      <span style={{
                        position: "absolute", top: -4, right: -3,
                        background: "#f59e0b", color: "white",
                        fontSize: "8px", borderRadius: "999px", padding: "1px 3px", fontWeight: 700,
                      }}>P</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>
              <span>🟢 Available &nbsp; 🔴 Booked &nbsp; <span style={{ color: "#f59e0b", fontWeight: 700 }}>P</span> Peak hour</span>
            </div>
          </div>

          {/* Note */}
          <label style={{ display: "block", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Weekend doubles with friends"
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #d1d5db",
                borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", outline: "none",
              }}
            />
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{
              flex: 1, padding: "10px", border: "1px solid #d1d5db",
              borderRadius: "8px", background: "white", cursor: "pointer",
              fontSize: "14px", color: "#374151",
            }}>
              Cancel
            </button>
            <button
              onClick={handleWatch}
              disabled={selectedSlots.length === 0 || submitting}
              style={{
                flex: 2, padding: "10px", border: "none",
                borderRadius: "8px",
                background: selectedSlots.length > 0 ? "linear-gradient(135deg,#16a34a,#15803d)" : "#e5e7eb",
                cursor: selectedSlots.length > 0 ? "pointer" : "not-allowed",
                fontSize: "14px", fontWeight: 600, color: selectedSlots.length > 0 ? "white" : "#9ca3af",
              }}
            >
              {submitting ? "Setting Watch..." : `👀 Watch ${selectedSlots.length > 0 ? selectedSlots.length + " slot(s)" : "Slots"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
