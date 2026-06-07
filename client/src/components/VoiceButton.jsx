import { useState, useRef, useEffect } from "react";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceButton({ onResult, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(!!SpeechRecognition);
  const [pulse, setPulse] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
      setPulse(false);
    };
    rec.onerror = () => { setListening(false); setPulse(false); };
    rec.onend = () => { setListening(false); setPulse(false); };
    recognitionRef.current = rec;
  }, [supported, onResult]);

  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setPulse(p => !p), 500);
    return () => clearInterval(t);
  }, [listening]);

  function toggle() {
    if (!supported || disabled) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setPulse(false);
    } else {
      recognitionRef.current?.start();
      setListening(true);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={listening ? "Tap to stop" : "Tap to speak"}
      style={{
        width: 44, height: 44,
        borderRadius: "12px",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: listening
          ? (pulse ? "#dc2626" : "#ef4444")
          : "#f3f4f6",
        color: listening ? "white" : "#6b7280",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.15s, transform 0.1s",
        transform: listening ? "scale(1.08)" : "scale(1)",
        boxShadow: listening ? "0 0 0 4px rgba(239,68,68,0.25)" : "none",
      }}
    >
      {listening ? (
        // Stop / waveform icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      ) : (
        // Mic icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      )}
    </button>
  );
}
