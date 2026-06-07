import { useState } from "react";

const TIME_SLOTS = [
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00",
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

const STEPS = ["slot", "details", "confirm", "done"];

export default function BookingModal({ court, onClose, onBooked }) {
  const [step, setStep] = useState("slot");
  const [date, setDate] = useState(todayStr());
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [courts_count, setCourts] = useState(1);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id, date, timeSlot, playerName: name,
          playerPhone: phone, courts_count,
        }),
      });
      if (!res.ok) throw new Error("Booking failed");
      const b = await res.json();
      setBooking(b);
      setStep("done");
      onBooked && onBooked(b);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = court.pricePerHour * courts_count;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "16px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "white", borderRadius: "20px", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>
              {step === "done" ? "🎉 Booking Confirmed!" : "Book a Court"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", marginTop: 2 }}>{court.name}</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer",
            color: "white", borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
          }}>×</button>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div style={{ display: "flex", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {[["slot","1. Pick Slot"], ["details","2. Your Details"], ["confirm","3. Confirm"]].map(([s, label]) => (
              <div key={s} style={{
                flex: 1, textAlign: "center", padding: "10px 4px",
                fontSize: "11px", fontWeight: 600,
                color: step === s ? "#7c3aed" : "#9ca3af",
                borderBottom: step === s ? "2px solid #7c3aed" : "2px solid transparent",
              }}>{label}</div>
            ))}
          </div>
        )}

        <div style={{ padding: "20px" }}>
          {/* STEP 1: Slot */}
          {step === "slot" && (
            <>
              <label style={{ display: "block", marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Date</span>
                <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
              </label>

              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Time Slot</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {TIME_SLOTS.map(s => (
                    <button key={s} onClick={() => setTimeSlot(s)} style={{
                      padding: "8px 4px", borderRadius: "8px",
                      border: timeSlot === s ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                      background: timeSlot === s ? "#ede9fe" : "white",
                      color: timeSlot === s ? "#7c3aed" : "#374151",
                      fontSize: "12px", fontWeight: timeSlot === s ? 700 : 500, cursor: "pointer",
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Number of Courts</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setCourts(n)} style={{
                      flex: 1, padding: "8px", borderRadius: "8px",
                      border: courts_count === n ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                      background: courts_count === n ? "#ede9fe" : "white",
                      color: courts_count === n ? "#7c3aed" : "#374151",
                      fontSize: "14px", fontWeight: courts_count === n ? 700 : 500, cursor: "pointer",
                    }}>{n}</button>
                  ))}
                </div>
              </label>

              <button onClick={() => setStep("details")} disabled={!timeSlot}
                style={{
                  width: "100%", padding: "12px", border: "none", borderRadius: "10px",
                  background: timeSlot ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#e5e7eb",
                  color: timeSlot ? "white" : "#9ca3af",
                  fontSize: "14px", fontWeight: 600, cursor: timeSlot ? "pointer" : "not-allowed",
                }}>
                Next →
              </button>
            </>
          )}

          {/* STEP 2: Details */}
          {step === "details" && (
            <>
              <div style={{ background: "#f5f3ff", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", color: "#7c3aed", fontWeight: 600 }}>{court.name}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: 2 }}>
                  {date} · {timeSlot}–{addHour(timeSlot)} · {courts_count} court{courts_count > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginTop: 4 }}>₹{totalAmount}</div>
              </div>

              <label style={{ display: "block", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Your Name</span>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
              </label>

              <label style={{ display: "block", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Phone Number</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" }} />
              </label>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep("slot")} style={{
                  flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "10px",
                  background: "white", fontSize: "14px", cursor: "pointer", color: "#374151",
                }}>← Back</button>
                <button onClick={() => setStep("confirm")} disabled={!name.trim() || !phone.trim()}
                  style={{
                    flex: 2, padding: "12px", border: "none", borderRadius: "10px",
                    background: name && phone ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#e5e7eb",
                    color: name && phone ? "white" : "#9ca3af",
                    fontSize: "14px", fontWeight: 600, cursor: name && phone ? "pointer" : "not-allowed",
                  }}>Review Booking →</button>
              </div>
            </>
          )}

          {/* STEP 3: Confirm */}
          {step === "confirm" && (
            <>
              <div style={{ background: "#f5f3ff", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#374151", marginBottom: "12px" }}>Booking Summary</div>
                {[
                  ["Court", court.name],
                  ["Address", court.address],
                  ["Date", date],
                  ["Time", `${timeSlot} – ${addHour(timeSlot)}`],
                  ["Courts", courts_count],
                  ["Name", name],
                  ["Phone", phone],
                  ["Amount", `₹${totalAmount}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: "13px" }}>
                    <span style={{ color: "#6b7280" }}>{k}</span>
                    <span style={{ color: "#111827", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                  </div>
                ))}
              </div>

              {error && <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "10px", textAlign: "center" }}>{error}</div>}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep("details")} style={{
                  flex: 1, padding: "12px", border: "1px solid #d1d5db", borderRadius: "10px",
                  background: "white", fontSize: "14px", cursor: "pointer", color: "#374151",
                }}>← Back</button>
                <button onClick={handleConfirm} disabled={loading}
                  style={{
                    flex: 2, padding: "12px", border: "none", borderRadius: "10px",
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                  }}>{loading ? "Confirming..." : "Confirm & Book 🏓"}</button>
              </div>
            </>
          )}

          {/* STEP 4: Done */}
          {step === "done" && booking && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#111827", marginBottom: 4 }}>You're all set!</div>
              <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}>Your court is booked</div>

              <div style={{ background: "#f0fdf4", border: "2px dashed #16a34a", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, marginBottom: 4 }}>BOOKING REFERENCE</div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#111827", letterSpacing: "0.1em" }}>{booking.ref}</div>
              </div>

              {[
                ["Court", booking.courtName],
                ["Date", booking.date],
                ["Time", `${booking.timeSlot} – ${booking.endTime}`],
                ["Amount", `₹${booking.amount}`],
                ["Contact", booking.courtPhone],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>{k}</span>
                  <span style={{ color: "#111827", fontWeight: 600 }}>{v}</span>
                </div>
              ))}

              <button onClick={onClose} style={{
                width: "100%", marginTop: "16px", padding: "12px", border: "none",
                borderRadius: "10px", background: "linear-gradient(135deg,#16a34a,#15803d)",
                color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              }}>Done ✓</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function addHour(slot) {
  if (!slot) return "";
  const [h, m] = slot.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
