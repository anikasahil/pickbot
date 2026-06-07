/**
 * Background Slot-Watch Agent
 * Monitors court slot availability and fires notifications when watched slots open.
 * Simulates a real booking system — replace availabilityCheck() with real API calls
 * when you connect to an actual court booking platform.
 */

const { courts } = require("./courts");

// In-memory stores (replace with DB in production)
const watches = new Map();    // watchId -> WatchEntry
const notifications = [];     // all notifications
const sseClients = new Set(); // active SSE connections
let watchIdCounter = 1;

// Simulated slot inventory: courtId -> date -> timeSlot -> boolean (available)
const slotInventory = new Map();

const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
];
const PEAK_SLOTS = new Set(["06:00","07:00","08:00","17:00","18:00","19:00","20:00"]);

function getSlotKey(courtId, date, slot) {
  return `${courtId}_${date}_${slot}`;
}

function initDayInventory(courtId, date) {
  const key = `${courtId}_${date}`;
  if (slotInventory.has(key)) return;
  const slots = {};
  for (const slot of TIME_SLOTS) {
    // Peak hours 75% booked, off-peak 30% booked
    slots[slot] = PEAK_SLOTS.has(slot)
      ? Math.random() > 0.75
      : Math.random() > 0.30;
  }
  slotInventory.set(key, slots);
}

function isSlotAvailable(courtId, date, slot) {
  const key = `${courtId}_${date}`;
  if (!slotInventory.has(key)) initDayInventory(courtId, date);
  return slotInventory.get(key)[slot] ?? true;
}

function setSlotAvailability(courtId, date, slot, available) {
  const key = `${courtId}_${date}`;
  if (!slotInventory.has(key)) initDayInventory(courtId, date);
  slotInventory.get(key)[slot] = available;
}

function getAvailableSlots(courtId, date) {
  const key = `${courtId}_${date}`;
  if (!slotInventory.has(key)) initDayInventory(courtId, date);
  const inv = slotInventory.get(key);
  return TIME_SLOTS.filter(s => inv[s]);
}

function pushNotification(notification) {
  notification.id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  notification.timestamp = Date.now();
  notification.read = false;
  notifications.unshift(notification);
  if (notifications.length > 100) notifications.pop();

  const data = `data: ${JSON.stringify({ type: "notification", notification })}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch {}
  }
  return notification;
}

function broadcastWatchUpdate(watches) {
  const data = `data: ${JSON.stringify({ type: "watches_update", watches: getAllWatches() })}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch {}
  }
}

// ─── Agent polling loop ────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000; // 30 seconds

function runAgentCycle() {
  if (watches.size === 0) return;

  const today = new Date().toISOString().split("T")[0];

  for (const [watchId, watch] of watches.entries()) {
    if (watch.status !== "active") continue;

    // Simulate: 15% chance a slot "opens up" each cycle (cancellation simulation)
    const shouldSimulateOpening = Math.random() < 0.15;
    if (shouldSimulateOpening) {
      // Pick a slot from watchedSlots that's currently booked and "open" it
      const bookedWatched = watch.timeSlots.filter(
        s => !isSlotAvailable(watch.courtId, watch.date || today, s)
      );
      if (bookedWatched.length > 0) {
        const slot = bookedWatched[Math.floor(Math.random() * bookedWatched.length)];
        setSlotAvailability(watch.courtId, watch.date || today, slot, true);

        const court = courts.find(c => c.id === watch.courtId);
        const notif = pushNotification({
          type: "slot_available",
          title: "🏓 Slot Just Opened!",
          message: `${court?.name || "Court"} has a ${slot} slot available on ${watch.date || today}!`,
          courtId: watch.courtId,
          courtName: court?.name,
          date: watch.date || today,
          slot,
          watchId,
          priority: "high",
        });

        console.log(`[Agent] Slot opened: ${court?.name} @ ${slot} on ${watch.date || today}`);

        // Auto-mark watch as fulfilled if only one slot was being watched
        if (watch.timeSlots.length === 1) {
          watch.status = "fulfilled";
          watch.fulfilledAt = Date.now();
          broadcastWatchUpdate();
        }
      }
    }

    // Also check: if the watched date is in the past, expire the watch
    const watchDate = watch.date || today;
    if (watchDate < today) {
      watch.status = "expired";
      broadcastWatchUpdate();
    }
  }
}

let agentTimer = null;

function startAgent() {
  if (agentTimer) return;
  console.log("[Agent] Slot-watch agent started — polling every 30s");
  agentTimer = setInterval(runAgentCycle, POLL_INTERVAL_MS);
}

function stopAgent() {
  if (agentTimer) { clearInterval(agentTimer); agentTimer = null; }
}

// ─── Watch CRUD ────────────────────────────────────────────────────────────────
function addWatch({ courtId, date, timeSlots, note }) {
  const court = courts.find(c => c.id === courtId);
  if (!court) throw new Error("Court not found");

  const today = new Date().toISOString().split("T")[0];
  const watchDate = date || today;
  initDayInventory(courtId, watchDate);

  const watchId = `watch_${watchIdCounter++}`;
  const entry = {
    id: watchId,
    courtId,
    courtName: court.name,
    courtArea: court.area,
    date: watchDate,
    timeSlots: timeSlots || ["07:00", "08:00"],
    note: note || "",
    status: "active",   // active | fulfilled | cancelled | expired
    createdAt: Date.now(),
  };
  watches.set(watchId, entry);

  // Check if any watched slots are already available
  const alreadyOpen = entry.timeSlots.filter(s => isSlotAvailable(courtId, watchDate, s));
  if (alreadyOpen.length > 0) {
    pushNotification({
      type: "slot_available",
      title: "🏓 Slots Available Now!",
      message: `${court.name} already has open slots on ${watchDate}: ${alreadyOpen.join(", ")}`,
      courtId,
      courtName: court.name,
      date: watchDate,
      slot: alreadyOpen[0],
      watchId,
      priority: "high",
    });
  } else {
    pushNotification({
      type: "watch_created",
      title: "👀 Watch Set",
      message: `Watching ${court.name} for ${entry.timeSlots.join(", ")} slots on ${watchDate}. I'll alert you the moment one opens.`,
      courtId,
      courtName: court.name,
      date: watchDate,
      watchId,
      priority: "normal",
    });
  }

  broadcastWatchUpdate();
  startAgent();
  return entry;
}

function cancelWatch(watchId) {
  const watch = watches.get(watchId);
  if (!watch) return null;
  watch.status = "cancelled";
  broadcastWatchUpdate();
  return watch;
}

function getAllWatches() {
  return Array.from(watches.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function getNotifications(limit = 30) {
  return notifications.slice(0, limit);
}

function markNotificationRead(notifId) {
  const n = notifications.find(n => n.id === notifId);
  if (n) n.read = true;
}

function markAllRead() {
  notifications.forEach(n => { n.read = true; });
}

module.exports = {
  addWatch,
  cancelWatch,
  getAllWatches,
  getNotifications,
  markNotificationRead,
  markAllRead,
  getAvailableSlots,
  isSlotAvailable,
  sseClients,
  pushNotification,
  TIME_SLOTS,
  startAgent,
  stopAgent,
};
