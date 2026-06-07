export default function EventCard({ event }) {
  const typeColors = {
    tournament: "bg-red-100 text-red-700",
    clinic: "bg-green-100 text-green-700",
    league: "bg-blue-100 text-blue-700",
  };
  const typeIcons = {
    tournament: "🏆",
    clinic: "🎓",
    league: "🤝",
  };

  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="court-card bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>
              {typeIcons[event.type]} {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{event.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">📍 {event.venue}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <div className="text-xs font-bold text-orange-700 bg-orange-100 rounded-lg px-2 py-1">{dateStr}</div>
          {event.prizePool && (
            <div className="text-[10px] text-green-700 font-medium mt-1">🎁 {event.prizePool}</div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-600 mb-2">{event.description}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-600">
          Entry: <span className="font-semibold text-gray-800">₹{event.registrationFee}</span>
        </div>
        <div className="text-orange-600 font-medium">
          📅 Deadline: {new Date(event.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      </div>

      <button className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
        Register Now
      </button>
    </div>
  );
}
