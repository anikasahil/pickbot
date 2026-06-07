export default function CourtCard({ court, onWatchSlot, onBookSlot }) {
  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-orange-100 text-orange-700",
    competitive: "bg-red-100 text-red-700",
  };

  return (
    <div className="court-card bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{court.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">📍 {court.area} · {court.locality}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <div className="text-base font-bold text-purple-700">₹{court.pricePerHour}/hr</div>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-xs text-gray-600">{court.rating} ({court.reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {court.levelSuitable.map((l) => (
          <span key={l} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${levelColors[l] || "bg-gray-100 text-gray-600"}`}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </span>
        ))}
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${court.type === "indoor" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
          {court.type === "indoor" ? "🏢 Indoor" : "☀️ Outdoor"}
        </span>
        {court.coachingAvailable && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            🎓 Coaching
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
        <div>⏰ {court.timing}</div>
        <div>🏓 {court.courts} courts</div>
        <div>🚇 {court.nearbyMetro}</div>
        <div>📅 {court.openDays}</div>
      </div>

      {court.notes && (
        <p className="text-[11px] text-gray-500 italic border-t border-gray-100 pt-2 mt-2">
          💡 {court.notes}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onBookSlot && onBookSlot(court)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
          Book Slot
        </button>
        <button
          onClick={() => onWatchSlot && onWatchSlot(court)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
        >
          👀 Watch Slot
        </button>
        <button className="border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-medium py-1.5 px-2 rounded-lg transition-colors">
          ℹ️
        </button>
      </div>
    </div>
  );
}
