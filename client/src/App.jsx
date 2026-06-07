import { useState, useRef, useEffect, useCallback } from "react";
import CourtCard from "./components/CourtCard.jsx";
import EventCard from "./components/EventCard.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import SlotPicker from "./components/SlotPicker.jsx";
import WatchPanel from "./components/WatchPanel.jsx";
import BookingModal from "./components/BookingModal.jsx";
import BookingHistory from "./components/BookingHistory.jsx";
import VoiceButton from "./components/VoiceButton.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import UserMenu from "./components/UserMenu.jsx";
import PasswordGate from "./components/PasswordGate.jsx";

// In dev, Vite proxies /api and /auth to localhost:3001
// In production, same domain serves everything — so relative URLs work for both
const API_BASE = "";

// Attach JWT to every fetch automatically
const apiFetch = (url, opts = {}) => {
  const token = localStorage.getItem("pickbot_token");
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
};

const QUICK_REPLIES = {
  start: [
    { label: "🆕 Never played", value: "I've never played pickleball before" },
    { label: "🌱 Beginner", value: "I'm a beginner, played for a few months" },
    { label: "🎯 Intermediate", value: "I'm intermediate, been playing 6-12 months" },
    { label: "⚡ Advanced", value: "I'm advanced, playing 2+ years" },
    { label: "🏆 Competitive", value: "I play competitively and enter tournaments" },
  ],
  area: [
    { label: "Gurgaon", value: "I'm based in Gurgaon" },
    { label: "Noida", value: "I'm in Noida" },
    { label: "South Delhi", value: "South Delhi works for me" },
    { label: "West Delhi", value: "I'm in West Delhi / Dwarka area" },
    { label: "Flexible", value: "I'm flexible with location" },
  ],
  timing: [
    { label: "🌅 Weekday mornings", value: "Weekday mornings before 9am work best for me" },
    { label: "🌆 Weekday evenings", value: "Weekday evenings after 6pm" },
    { label: "🏖️ Weekends only", value: "I can only play on weekends" },
    { label: "🕐 Any time", value: "I'm flexible on timing" },
  ],
};

function parseMessageContent(content) {
  const courtRegex = /```court\n([\s\S]*?)```/g;
  const eventRegex = /```event\n([\s\S]*?)```/g;
  let courts = [];
  let events = [];
  let text = content;
  let m;
  while ((m = courtRegex.exec(content)) !== null) {
    try { courts.push(JSON.parse(m[1])); } catch {}
    text = text.replace(m[0], "");
  }
  while ((m = eventRegex.exec(content)) !== null) {
    try { events.push(JSON.parse(m[1])); } catch {}
    text = text.replace(m[0], "");
  }
  return { text: text.trim(), courts, events };
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm shrink-0">
        🏓
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </div>
      </div>
    </div>
  );
}

function Message({ msg, onWatchSlot, onBookSlot }) {
  const { text, courts, events } = parseMessageContent(msg.content);
  const isBot = msg.role === "assistant";

  return (
    <div className={`flex items-end gap-2 animate-slide-up ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm shrink-0">
          🏓
        </div>
      )}
      <div className={`max-w-[80%] ${isBot ? "" : "items-end flex flex-col"}`}>
        {text && (
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isBot
              ? "bg-white border border-gray-200 rounded-bl-sm text-gray-800"
              : "bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-sm"
          }`}>
            {text}
          </div>
        )}
        {courts.length > 0 && (
          <div className="mt-2 w-full">
            {courts.map((c, i) => <CourtCard key={i} court={c} onWatchSlot={onWatchSlot} onBookSlot={onBookSlot} />)}
          </div>
        )}
        {events.length > 0 && (
          <div className="mt-2 w-full">
            {events.map((e, i) => <EventCard key={i} event={e} />)}
          </div>
        )}
        <div className={`text-[10px] text-gray-400 mt-1 ${isBot ? "text-left" : "text-right"}`}>
          {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

function QuickReplies({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s.value)}
          className="quick-btn bg-white border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-green-50 hover:border-green-400"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// Toast notification for new real-time alerts
function Toast({ notification, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)",
      background: "white", border: "1px solid #e5e7eb", borderLeft: "4px solid #16a34a",
      borderRadius: "10px", padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      zIndex: 3000, maxWidth: "340px", width: "calc(100% - 32px)",
      animation: "slideUp 0.3s ease",
    }}>
      <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827", marginBottom: 3 }}>{notification.title}</div>
      <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>{notification.message}</div>
      <button onClick={onDismiss} style={{
        position: "absolute", top: 6, right: 8,
        background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px",
      }}>×</button>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export default function App() {
  // Password gate
  const [unlocked, setUnlocked] = useState(localStorage.getItem("pickbot_access") === "granted");

  // Phase 4: Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(QUICK_REPLIES.start);
  const [toolStatus, setToolStatus] = useState(null);

  // Phase 2 state
  const [notifications, setNotifications] = useState([]);
  const [watches, setWatches] = useState([]);
  const [slotPickerCourt, setSlotPickerCourt] = useState(null);
  const [showWatchPanel, setShowWatchPanel] = useState(false);
  const [toast, setToast] = useState(null);

  // Phase 3 state
  const [bookingCourt, setBookingCourt] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showBookingHistory, setShowBookingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Bootstrap: grab token from URL or localStorage, load user
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("pickbot_token", urlToken);
      window.history.replaceState({}, "", "/");
    }
    const token = urlToken || localStorage.getItem("pickbot_token");
    if (!token) { setAuthLoading(false); return; }

    apiFetch(`${API_BASE}/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // SSE connection for real-time notifications
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/notifications/stream`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setWatches(data.watches || []);
          setNotifications(data.notifications || []);
        } else if (data.type === "notification") {
          const n = data.notification;
          setNotifications(prev => [n, ...prev].slice(0, 100));
          if (n.priority === "high") setToast(n);
        } else if (data.type === "watches_update") {
          setWatches(data.watches || []);
        }
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setQuickReplies([]);
    setToolStatus(null);

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await apiFetch(`${API_BASE}/api/chat`, {
        method: "POST",
        body: JSON.stringify({ messages: apiMessages }),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              botText += data.text;
              const botMsg = { role: "assistant", content: botText, timestamp: Date.now(), _streaming: true };
              setMessages((prev) => {
                const without = prev.filter((m) => !m._streaming);
                return [...without, botMsg];
              });
            } else if (data.type === "tool_call") {
              const toolLabels = {
                search_courts: "🔍 Searching courts...",
                get_events: "📅 Finding events...",
                recommend_courts: "⭐ Building recommendations...",
                check_availability: "📊 Checking availability...",
                set_slot_watch: "👀 Setting watch...",
                list_watches: "📋 Loading watches...",
                cancel_watch: "🚫 Cancelling watch...",
              };
              setToolStatus(toolLabels[data.tool] || "⚙️ Processing...");
            } else if (data.type === "profile_update") {
              // Bot saved a new preference — refresh user profile
              setUser(prev => prev ? { ...prev, profile: { ...prev.profile, ...data.profile } } : prev);
            } else if (data.type === "done") {
              setToolStatus(null);
              setMessages((prev) =>
                prev.map((m) => m._streaming ? { ...m, _streaming: false } : m)
              );
              // Refresh watches after bot may have set one
              fetch(`${API_BASE}/api/watches`).then(r => r.json()).then(setWatches).catch(() => {});
              detectQuickReplies(botText);
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please check that the server is running on port 3001.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setToolStatus(null);
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  function detectQuickReplies(text) {
    const lower = text.toLowerCase();
    if (lower.includes("level") || lower.includes("experience") || lower.includes("skill")) {
      setQuickReplies(QUICK_REPLIES.start);
    } else if (lower.includes("area") || lower.includes("location") || lower.includes("part of delhi")) {
      setQuickReplies(QUICK_REPLIES.area);
    } else if (lower.includes("availab") || lower.includes("timing") || lower.includes("schedule") || lower.includes("when")) {
      setQuickReplies(QUICK_REPLIES.timing);
    } else {
      setQuickReplies([]);
    }
  }

  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      setTimeout(() => sendMessage("Hello! I want to start playing pickleball."), 600);
    }
  }, []);

  // Load bookings on mount (after auth)
  useEffect(() => {
    if (!user) return;
    apiFetch(`${API_BASE}/api/bookings`).then(r => r.json()).then(setBookings).catch(() => {});
  }, [user]);

  function handleMarkAllRead() {
    fetch(`${API_BASE}/api/notifications/read-all`, { method: "POST" });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function handleWatchCancelled(watchId) {
    setWatches(prev => prev.map(w => w.id === watchId ? { ...w, status: "cancelled" } : w));
  }

  function handleBookingCancelled(id) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const activeWatches = watches.filter(w => w.status === "active");

  // Password gate — first thing shown
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  // Auth loading spinner
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏓</div>
          <div style={{ color: "#16a34a", fontWeight: 600 }}>Loading PickBot...</div>
        </div>
      </div>
    );
  }

  // Not logged in → show login screen
  if (!user) return <LoginScreen />;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🏓</div>
        <div className="flex-1">
          <div className="font-bold text-base">PickBot</div>
          <div className="text-green-200 text-xs">Your pickleball buddy in Delhi NCR</div>
        </div>
        <div className="flex items-center gap-3">
          {/* Bookings button */}
          <button
            onClick={() => setShowBookingHistory(true)}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
              color: "white", borderRadius: "20px", padding: "5px 10px",
              display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600,
            }}
          >
            🏓 {bookings.filter(b => b.status === "confirmed").length > 0 && (
              <span style={{ background: "#a78bfa", color: "white", borderRadius: "999px", padding: "1px 5px", fontSize: "10px", fontWeight: 700 }}>
                {bookings.filter(b => b.status === "confirmed").length}
              </span>
            )}
            Bookings
          </button>
          {/* Watches button */}
          <button
            onClick={() => setShowWatchPanel(true)}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
              color: "white", borderRadius: "20px", padding: "5px 10px",
              display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600,
            }}
          >
            👀 {activeWatches.length > 0 && <span style={{ background: "#fbbf24", color: "#78350f", borderRadius: "999px", padding: "1px 5px", fontSize: "10px", fontWeight: 700 }}>{activeWatches.length}</span>}
            Watches
          </button>
          <NotificationBell notifications={notifications} onMarkAllRead={handleMarkAllRead} />
          <UserMenu user={user} onLogout={() => setUser(null)} />
        </div>
      </div>

      {/* Tool status banner */}
      {toolStatus && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-2 text-xs text-green-700 font-medium animate-fade-in flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-green-600 border-t-transparent animate-spin"></div>
          {toolStatus}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !isLoading && (
          <div className="text-center pt-12">
            <div className="text-5xl mb-3">🏓</div>
            <div className="text-gray-500 text-sm">Starting your pickleball journey...</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} onWatchSlot={setSlotPickerCourt} onBookSlot={setBookingCourt} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <TypingIndicator />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <QuickReplies suggestions={quickReplies} onSelect={(v) => sendMessage(v)} />

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
        <div className="flex gap-2 items-end">
          <VoiceButton onResult={(text) => sendMessage(text)} disabled={isLoading} />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask or tap 🎤 to speak..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 max-h-28"
            style={{ minHeight: "42px" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          🏓 Delhi NCR Pickleball · AI-powered · Book · Watch · Voice
        </p>
      </div>

      {/* Phase 2 overlays */}
      {slotPickerCourt && (
        <SlotPicker
          court={slotPickerCourt}
          onClose={() => setSlotPickerCourt(null)}
          onWatch={(w) => {
            setWatches(prev => [w, ...prev]);
            sendMessage(`I've set a watch for ${w.courtName} on ${w.date} for slots: ${w.timeSlots.join(", ")}. Keep me posted!`);
          }}
        />
      )}

      {showWatchPanel && (
        <WatchPanel
          watches={watches}
          onClose={() => setShowWatchPanel(false)}
          onCancel={handleWatchCancelled}
        />
      )}

      {bookingCourt && (
        <BookingModal
          court={bookingCourt}
          onClose={() => setBookingCourt(null)}
          onBooked={(b) => {
            setBookings(prev => [b, ...prev]);
            setBookingCourt(null);
            sendMessage(`Great, I've booked ${b.courtName} on ${b.date} at ${b.timeSlot}. My booking reference is ${b.ref}.`);
          }}
        />
      )}

      {showBookingHistory && (
        <BookingHistory
          bookings={bookings}
          onClose={() => setShowBookingHistory(false)}
          onCancel={handleBookingCancelled}
        />
      )}

      {toast && (
        <Toast notification={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
