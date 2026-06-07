/**
 * JSON file-based user store.
 * Persists across server restarts in server/data/users.json
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "data");
const FILE = path.join(DIR, "users.json");

// Ensure data directory exists on startup
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

function findOrCreate({ googleId, email, name, avatar }) {
  const db = load();
  if (!db[googleId]) {
    db[googleId] = {
      googleId,
      email,
      name,
      avatar,
      profile: {
        skillLevel: null,   // beginner | intermediate | advanced | competitive
        area: null,         // gurgaon | noida | south_delhi etc
        timing: null,       // morning | evening | weekend
        playStyle: null,    // solo | group
        phone: null,
      },
      bookingIds: [],
      watchIds: [],
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };
  } else {
    db[googleId].lastSeen = Date.now();
    // Update name/avatar in case they changed in Google
    db[googleId].name = name;
    db[googleId].avatar = avatar;
  }
  save(db);
  return db[googleId];
}

function getUser(googleId) {
  return load()[googleId] || null;
}

function updateProfile(googleId, profileUpdates) {
  const db = load();
  if (!db[googleId]) return null;
  db[googleId].profile = { ...db[googleId].profile, ...profileUpdates };
  save(db);
  return db[googleId];
}

function addBookingId(googleId, bookingId) {
  const db = load();
  if (!db[googleId]) return;
  db[googleId].bookingIds = [bookingId, ...(db[googleId].bookingIds || [])];
  save(db);
}

function addWatchId(googleId, watchId) {
  const db = load();
  if (!db[googleId]) return;
  db[googleId].watchIds = [watchId, ...(db[googleId].watchIds || [])];
  save(db);
}

module.exports = { findOrCreate, getUser, updateProfile, addBookingId, addWatchId };
