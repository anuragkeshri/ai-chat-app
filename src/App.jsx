import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-lite";

const SUGGESTIONS = [
  "Explain React hooks",
  "Write a JavaScript utility",
  "Review my code approach",
  "Summarize a technical topic",
];

function getTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim() || loading) return;

    setShowChips(false);
    setMessages((prev) => [...prev, { role: "user", text, time: getTime() }]);
    setInput("");
    setLoading(true);

    const newHistory = [...history, { role: "user", parts: [{ text }] }];
    setHistory(newHistory);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: newHistory }),
        }
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

      setMessages((prev) => [...prev, { role: "ai", text: reply, time: getTime() }]);
      setHistory((prev) => [...prev, { role: "model", parts: [{ text: reply }] }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Unable to reach the service. Please verify your API key and connection.",
          time: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <div className="app">
      <div className="chat-shell">
        <header className="chat-header">
          <div className="chat-header__brand">
            <div className="chat-header__logo" aria-hidden="true">
              <SparkIcon />
            </div>
            <div>
              <div className="chat-header__title">Assistant</div>
              <div className="chat-header__subtitle">
                <span className="status-dot" aria-hidden="true" />
                Ready
              </div>
            </div>
          </div>
          <span className="model-badge">{MODEL}</span>
        </header>

        <div className="chat-messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true">
                <SparkIcon />
              </div>
              <h2>How can I help you today?</h2>
              <p>Ask questions about code, concepts, or workflows.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role === "user" ? "message-row--user" : ""}`}>
              <div className={`message-avatar message-avatar--${msg.role === "ai" ? "ai" : "user"}`}>
                {msg.role === "ai" ? "AI" : "You"}
              </div>
              <div className="message-body">
                <div className={`message-bubble message-bubble--${msg.role === "ai" ? "ai" : "user"}`}>
                  {msg.text}
                </div>
                <div className="message-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row">
              <div className="message-avatar message-avatar--ai">AI</div>
              <div className="message-body">
                <div className="typing-bubble">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="chat-composer">
          {showChips && (
            <div className="suggestion-chips">
              {SUGGESTIONS.map((label) => (
                <button key={label} type="button" className="chip" onClick={() => send(label)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="input-wrap">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Type your message…"
              rows={1}
            />
            <button
              type="button"
              className={`send-btn ${canSend ? "send-btn--active" : "send-btn--disabled"}`}
              onClick={() => send(input)}
              disabled={!canSend}
            >
              <SendIcon />
            </button>
          </div>
          <div className="composer-footer">
            <span>
              <kbd>Enter</kbd> send · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line
            </span>
            <span>{input.length > 0 ? `${input.length} chars` : ""}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
