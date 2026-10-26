import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { errMsg } from "../services/api";
import Quiz from "../components/Quiz";
import Flashcards from "../components/Flashcards";
import ChatBox from "../components/ChatBox";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [tab, setTab] = useState("summary");
  const [busy, setBusy] = useState(""); // tracks which action is loading
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .get(`/notes/${id}`)
      .then((r) => setNote(r.data.note))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  // generic runner to avoid repeating try/catch for each action
  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const changeMode = (mode) =>
    run("sum", async () => {
      const r = await api.post(`/notes/${id}/summarize`, { mode });
      setNote(r.data.note);
    });

  const genQuiz = () =>
    run("quiz", async () => {
      const r = await api.post(`/notes/${id}/quiz`);
      setNote((prev) => ({ ...prev, quiz: r.data.quiz }));
    });

  const genCards = () =>
    run("cards", async () => {
      const r = await api.post(`/notes/${id}/flashcards`);
      setNote((prev) => ({ ...prev, flashcards: r.data.flashcards }));
    });

  const copy = async () => {
    await navigator.clipboard.writeText(note.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (error && !note) {
    return (
      <p className="error">
        {error}{" "}
        <button className="btn small" onClick={() => navigate("/dashboard")}>
          Back
        </button>
      </p>
    );
  }

  if (!note) return <p className="muted">Loading...</p>;

  return (
    <>
      <div className="row between">
        <h2>{note.title}</h2>
        <a
          className="btn small ghost"
          href={`${import.meta.env.VITE_API_URL || "/api"}/notes/${id}/export`}
        >
          ⬇ Export .md
        </a>
      </div>

      <div className="tags">
        {note.tags.map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tabs">
        {["summary", "quiz", "flashcards", "chat"].map((t) => (
          <button
            key={t}
            className={tab === t ? "tab active" : "tab"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Summary tab ── */}
      {tab === "summary" && (
        <div className="card">
          <div className="row between">
            <select
              value={note.summaryMode}
              disabled={busy === "sum"}
              onChange={(e) => changeMode(e.target.value)}
            >
              <option value="short">Short</option>
              <option value="detailed">Detailed</option>
              <option value="bullets">Bullet points</option>
              <option value="eli5">Explain like I'm 12</option>
            </select>
            <button className="btn small ghost" onClick={copy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          {busy === "sum" ? (
            <p className="muted">Re-summarizing...</p>
          ) : (
            <pre className="summary">{note.summary}</pre>
          )}
        </div>
      )}

      {/* ── Quiz tab ── */}
      {tab === "quiz" && (
        note.quiz?.length ? (
          <>
            {/* key forces a full remount when quiz is regenerated */}
            <Quiz key={note.quiz.length + note.updatedAt} quiz={note.quiz} />
            <button
              className="btn small ghost"
              disabled={busy === "quiz"}
              onClick={genQuiz}
            >
              {busy === "quiz" ? "Generating..." : "Regenerate quiz"}
            </button>
          </>
        ) : (
          <button className="btn" disabled={busy === "quiz"} onClick={genQuiz}>
            {busy === "quiz" ? "Generating..." : "Generate quiz"}
          </button>
        )
      )}

      {/* ── Flashcards tab ── */}
      {tab === "flashcards" && (
        note.flashcards?.length ? (
          <>
            <Flashcards cards={note.flashcards} />
            <button
              className="btn small ghost"
              disabled={busy === "cards"}
              onClick={genCards}
            >
              {busy === "cards" ? "Generating..." : "Regenerate"}
            </button>
          </>
        ) : (
          <button className="btn" disabled={busy === "cards"} onClick={genCards}>
            {busy === "cards" ? "Generating..." : "Generate flashcards"}
          </button>
        )
      )}

      {/* ── Chat tab ── */}
      {tab === "chat" && <ChatBox noteId={id} />}
    </>
  );
}
