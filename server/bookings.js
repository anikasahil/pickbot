const { courts } = require("./courts");

const bookings = new Map();
let bookingCounter = 1000;

function generateRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "PB-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function createBooking({ courtId, date, timeSlot, playerName, playerPhone, courts_count = 1 }) {
  const court = courts.find(c => c.id === courtId);
  if (!court) throw new Error("Court not found");

  const id = `booking_${bookingCounter++}`;
  const booking = {
    id,
    ref: generateRef(),
    courtId,
    courtName: court.name,
    courtArea: court.area,
    courtAddress: court.address,
    courtPhone: court.phone,
    date,
    timeSlot,
    endTime: addHour(timeSlot),
    courts_count,
    playerName,
    playerPhone,
    amount: court.pricePerHour * courts_count,
    status: "confirmed",
    createdAt: Date.now(),
  };
  bookings.set(id, booking);
  return booking;
}

function addHour(slot) {
  const [h, m] = slot.split(":").map(Number);
  return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getBooking(id) { return bookings.get(id) || null; }
function getAllBookings() { return Array.from(bookings.values()).sort((a, b) => b.createdAt - a.createdAt); }
function cancelBooking(id) {
  const b = bookings.get(id);
  if (!b) return null;
  b.status = "cancelled";
  return b;
}

module.exports = { createBooking, getBooking, getAllBookings, cancelBooking };
