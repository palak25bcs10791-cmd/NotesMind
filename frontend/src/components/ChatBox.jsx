import { useState, useRef, useEffect } from "react";
import api, { errMsg } from "../services/api";

export default function ChatBox({ noteId }) {
  const [msgs, setMsgs] = useState([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef();

  // scroll to latest message automatically
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!question.trim() || busy) return;

    const q = question.trim();
    setQuestion("");
    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);

    try {
      const r = await api.post(`/notes/${noteId}/chat`, { question: q });
      setMsgs((prev) => [...prev, { role: "ai", text: r.data.answer }]);
    } catch (err) {
      setMsgs((prev) => [...prev, { role: "ai", text: "⚠ " + errMsg(err) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="chat">
        {msgs.length === 0 && (
          <p className="muted">Ask anything about this note. Answers come only from your document.</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
        {busy && <div className="msg ai muted">Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <form className="row" onSubmit={send}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your notes..."
        />
        <button className="btn" disabled={busy}>Send</button>
      </form>
    </div>
  );
}
