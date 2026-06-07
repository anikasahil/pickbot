const express = require("express");
const cors = require("cors");
const session = require("express-session");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const { courts, upcomingEvents } = require("./courts");
const agent = require("./watchAgent");
const bookingStore = require("./bookings");
const userStore = require("./users");
const { passport, issueJWT, authMiddleware, requireAuth } = require("./auth");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(authMiddleware);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Build system prompt with user context ─────────────────────────────────────
function buildSystemPrompt(user) {
  const profile = user?.profile;
  let userContext = "";

  if (user) {
    userContext = `
CURRENT USER: ${user.name} (${user.email})
USER PROFILE:
- Skill level: ${profile?.skillLevel || "not set yet"}
- Preferred area: ${profile?.area || "not set yet"}
- Timing preference: ${profile?.timing || "not set yet"}
- Play style: ${profile?.playStyle || "not set yet"}
- Phone: ${profile?.phone || "not provided"}

IMPORTANT: If the user's profile has values already set, DO NOT ask about them again.
Use their existing profile to make personalized recommendations immediately.
If profile fields are "not set yet", ask about them naturally during conversation.
After learning any new preference, use the update_profile tool to save it.`;
  }

  return `You are PickBot 🏓, an expert AI concierge for pickleball in Delhi NCR, India. You help users find courts, match with players, discover events, and book slots.

Your personality: Friendly, enthusiastic, knowledgeable. You love pickleball. Be conversational, use occasional emojis, keep messages concise.
${userContext}

ONBOARDING FLOW (only for fields not yet in the user's profile):
1. Skill level: "Never played", "Beginner (0-6 months)", "Intermediate (6mo-2yr)", "Advanced (2yr+)", "Competitive/Tournament"
2. Preferred area of Delhi NCR
3. Availability: weekday mornings, weekday evenings, weekends
4. Solo (match with others) or have a regular group
5. Recommend 2-3 courts + mention relevant events

After learning any preference from the user, immediately call update_profile to save it.

SLOT WATCHING: When user wants to be notified, use set_slot_watch.
BOOKING: Collect court_id, date, time_slot, player_name, player_phone then call book_slot.

COURT RECOMMENDATION RULES:
- Beginners: Affordable courts with coaching, suggest clinics
- Intermediate: Balance price + quality, community courts
- Advanced/Competitive: Premium facilities, certified coaches
- Morning preference: Off-peak pricing
- Budget-conscious: Faridabad, Noida, Greater Noida

ALWAYS end with a clear next step.`;
}

// ─── Tools ─────────────────────────────────────────────────────────────────────
const tools = [
  {
    name: "search_courts",
    description: "Search pickleball courts in Delhi NCR by area, skill level, or timing",
    input_schema: {
      type: "object",
      properties: {
        area: { type: "string", description: "gurgaon | noida | south_delhi | west_delhi | dwarka | faridabad | greater_noida" },
        level: { type: "string", description: "beginner | intermediate | advanced | competitive" },
        timing: { type: "string", description: "morning | evening | weekend" },
        max_price: { type: "number" },
      },
    },
  },
  {
    name: "get_events",
    description: "Get upcoming pickleball events, tournaments, clinics in Delhi NCR",
    input_schema: {
      type: "object",
      properties: {
        level: { type: "string" },
        event_type: { type: "string", description: "tournament | clinic | league" },
      },
    },
  },
  {
    name: "recommend_courts",
    description: "Get personalized court recommendations based on user profile",
    input_schema: {
      type: "object",
      properties: {
        area: { type: "string" },
        level: { type: "string" },
        timing_preference: { type: "string" },
        budget_per_hour: { type: "number" },
        needs_coaching: { type: "boolean" },
      },
      required: ["level"],
    },
  },
  {
    name: "check_availability",
    description: "Check slot availability for a court on a date",
    input_schema: {
      type: "object",
      properties: {
        court_id: { type: "number" },
        date: { type: "string" },
      },
      required: ["court_id"],
    },
  },
  {
    name: "set_slot_watch",
    description: "Watch for a slot to open at a court",
    input_schema: {
      type: "object",
      properties: {
        court_id: { type: "number" },
        date: { type: "string" },
        time_slots: { type: "array", items: { type: "string" } },
        note: { type: "string" },
      },
      required: ["court_id"],
    },
  },
  {
    name: "list_watches",
    description: "List user's active slot watches",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "cancel_watch",
    description: "Cancel a slot watch",
    input_schema: {
      type: "object",
      properties: { watch_id: { type: "string" } },
      required: ["watch_id"],
    },
  },
  {
    name: "book_slot",
    description: "Book a pickleball court slot",
    input_schema: {
      type: "object",
      properties: {
        court_id: { type: "number" },
        date: { type: "string" },
        time_slot: { type: "string" },
        player_name: { type: "string" },
        player_phone: { type: "string" },
        courts_count: { type: "number" },
      },
      required: ["court_id", "date", "time_slot", "player_name", "player_phone"],
    },
  },
  {
    name: "get_bookings",
    description: "Get user's booking history",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "update_profile",
    description: "Save user preference to their profile. Call this whenever user shares skill level, area, timing, or play style.",
    input_schema: {
      type: "object",
      properties: {
        skillLevel: { type: "string", description: "beginner | intermediate | advanced | competitive" },
        area: { type: "string" },
        timing: { type: "string", description: "morning | evening | weekend | flexible" },
        playStyle: { type: "string", description: "solo | group" },
        phone: { type: "string" },
      },
    },
  },
];

// ─── Tool executor ─────────────────────────────────────────────────────────────
function executeTool(name, input, user) {
  if (name === "search_courts") {
    let results = [...courts];
    if (input.area) {
      const map = { gurgaon:"Gurgaon", noida:"Noida", south_delhi:"South Delhi", west_delhi:"West Delhi", dwarka:"Dwarka", faridabad:"Faridabad", greater_noida:"Greater Noida" };
      const a = map[input.area] || input.area;
      results = results.filter(c => c.area.toLowerCase().includes(a.toLowerCase()));
    }
    if (input.level) results = results.filter(c => c.levelSuitable.includes(input.level));
    if (input.max_price) results = results.filter(c => c.pricePerHour <= input.max_price);
    return JSON.stringify(results.slice(0, 4));
  }

  if (name === "get_events") {
    let results = [...upcomingEvents];
    if (input.level) results = results.filter(e => e.levels.includes(input.level));
    if (input.event_type) results = results.filter(e => e.type === input.event_type);
    return JSON.stringify(results);
  }

  if (name === "recommend_courts") {
    let results = courts.filter(c => c.levelSuitable.includes(input.level));
    if (input.area) {
      const f = results.filter(c => c.area.toLowerCase().includes(input.area.toLowerCase()));
      if (f.length) results = f;
    }
    if (input.needs_coaching) results = results.filter(c => c.coachingAvailable);
    if (input.budget_per_hour) {
      const f = results.filter(c => c.pricePerHour <= input.budget_per_hour);
      if (f.length) results = f;
    }
    results.sort((a, b) => b.rating - a.rating);
    return JSON.stringify(results.slice(0, 3));
  }

  if (name === "check_availability") {
    const date = input.date || new Date().toISOString().split("T")[0];
    const court = courts.find(c => c.id === input.court_id);
    if (!court) return JSON.stringify({ error: "Court not found" });
    const available = agent.getAvailableSlots(input.court_id, date);
    return JSON.stringify({ court: court.name, date, availableSlots: available, totalSlots: agent.TIME_SLOTS.length });
  }

  if (name === "set_slot_watch") {
    try {
      const watch = agent.addWatch({ courtId: input.court_id, date: input.date, timeSlots: input.time_slots || ["07:00","08:00"], note: input.note });
      if (user) userStore.addWatchId(user.googleId, watch.id);
      return JSON.stringify({ success: true, watch });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  }

  if (name === "list_watches") return JSON.stringify(agent.getAllWatches());

  if (name === "cancel_watch") {
    const w = agent.cancelWatch(input.watch_id);
    return JSON.stringify(w ? { success: true, watch: w } : { error: "Watch not found" });
  }

  if (name === "book_slot") {
    try {
      const booking = bookingStore.createBooking({
        courtId: input.court_id, date: input.date, timeSlot: input.time_slot,
        playerName: input.player_name, playerPhone: input.player_phone,
        courts_count: input.courts_count || 1,
      });
      if (user) userStore.addBookingId(user.googleId, booking.id);
      return JSON.stringify({ success: true, booking });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  }

  if (name === "get_bookings") return JSON.stringify(bookingStore.getAllBookings());

  if (name === "update_profile") {
    if (user) {
      userStore.updateProfile(user.googleId, input);
      return JSON.stringify({ success: true, updated: input });
    }
    return JSON.stringify({ error: "Not logged in" });
  }

  return JSON.stringify({ error: "Unknown tool" });
}

// ─── Google OAuth routes ───────────────────────────────────────────────────────
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}?auth=failed` }),
  (req, res) => {
    const token = issueJWT(req.user);
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

app.get("/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not logged in" });
  res.json(req.user);
});

app.post("/auth/logout", (req, res) => {
  req.logout(() => res.json({ ok: true }));
});

// ─── Chat endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const user = req.user;

  try {
    let currentMessages = [...messages];

    while (true) {
      const stream = anthropic.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: buildSystemPrompt(user),
        tools,
        messages: currentMessages,
      });

      let assistantContent = [];
      let inputJsonBuffer = "";

      for await (const event of stream) {
        if (event.type === "content_block_start") {
          assistantContent.push({ ...event.content_block });
          inputJsonBuffer = "";
        }
        if (event.type === "content_block_delta") {
          const last = assistantContent[assistantContent.length - 1];
          if (event.delta.type === "text_delta") {
            last.text = (last.text || "") + event.delta.text;
            res.write(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`);
          } else if (event.delta.type === "input_json_delta") {
            inputJsonBuffer += event.delta.partial_json;
            if (last) last.input = inputJsonBuffer;
          }
        }
        if (event.type === "content_block_stop") {
          const last = assistantContent[assistantContent.length - 1];
          if (last?.type === "tool_use" && inputJsonBuffer) {
            try { last.input = JSON.parse(inputJsonBuffer); } catch { last.input = {}; }
            inputJsonBuffer = "";
          }
        }
      }

      const final = await stream.finalMessage();
      if (final.stop_reason === "end_turn") break;

      if (final.stop_reason === "tool_use") {
        currentMessages.push({ role: "assistant", content: assistantContent });
        const toolResults = [];
        for (const block of assistantContent) {
          if (block.type === "tool_use") {
            res.write(`data: ${JSON.stringify({ type: "tool_call", tool: block.name, input: block.input })}\n\n`);
            const result = executeTool(block.name, block.input, user);
            // If profile was updated, broadcast fresh user data
            if (block.name === "update_profile" && user) {
              const fresh = userStore.getUser(user.googleId);
              res.write(`data: ${JSON.stringify({ type: "profile_update", profile: fresh?.profile })}\n\n`);
            }
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
          }
        }
        currentMessages.push({ role: "user", content: toolResults });
        continue;
      }
      break;
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`);
    res.end();
  }
});

// ─── SSE notifications ─────────────────────────────────────────────────────────
app.get("/api/notifications/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  agent.sseClients.add(res);
  console.log(`[SSE] Client connected (${agent.sseClients.size} total)`);
  res.write(`data: ${JSON.stringify({ type: "init", watches: agent.getAllWatches(), notifications: agent.getNotifications(20) })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`); } catch {}
  }, 20_000);

  req.on("close", () => {
    agent.sseClients.delete(res);
    clearInterval(heartbeat);
    console.log(`[SSE] Client disconnected (${agent.sseClients.size} remaining)`);
  });
});

// ─── REST routes ───────────────────────────────────────────────────────────────
app.get("/api/courts", (req, res) => res.json(courts));
app.get("/api/events", (req, res) => res.json(upcomingEvents));

app.get("/api/watches", (req, res) => res.json(agent.getAllWatches()));
app.post("/api/watches", (req, res) => {
  try { res.json(agent.addWatch(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/watches/:id", (req, res) => {
  const w = agent.cancelWatch(req.params.id);
  w ? res.json(w) : res.status(404).json({ error: "Not found" });
});

app.get("/api/notifications", (req, res) => res.json(agent.getNotifications(30)));
app.post("/api/notifications/read-all", (req, res) => { agent.markAllRead(); res.json({ ok: true }); });

app.get("/api/bookings", (req, res) => res.json(bookingStore.getAllBookings()));
app.post("/api/bookings", (req, res) => {
  try { res.json(bookingStore.createBooking(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/bookings/:id", (req, res) => {
  const b = bookingStore.cancelBooking(req.params.id);
  b ? res.json(b) : res.status(404).json({ error: "Not found" });
});

app.get("/api/availability/:courtId", (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const available = agent.getAvailableSlots(parseInt(req.params.courtId), date);
  res.json({ courtId: parseInt(req.params.courtId), date, availableSlots: available });
});

app.get("/api/profile", requireAuth, (req, res) => res.json(req.user));
app.patch("/api/profile", requireAuth, (req, res) => {
  const updated = userStore.updateProfile(req.user.googleId, req.body);
  res.json(updated);
});

// ─── Serve React frontend in production ───────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── Start ─────────────────────────────────────────────────────────────────────
// agent.startAgent(); // disabled — enable when slot-watch feature is needed
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PickBot server on http://localhost:${PORT}`));
