import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../services/api";
import NoteCard from "../components/NoteCard";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // debounce so we don't hit the API on every keystroke
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get("/notes", { params: { search, tag } });
        setNotes(r.data.notes);
        setError("");
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, tag]);

  const deleteNote = async (id) => {
    if (!confirm("Delete this note?")) return;
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  // collect all unique tags from current notes for the filter row
  const allTags = [...new Set(notes.flatMap((n) => n.tags))];

  return (
    <>
      <div className="row between">
        <h2>Your notes</h2>
        <Link to="/new" className="btn">+ New Note</Link>
      </div>

      <input
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="tags">
        {tag && (
          <span className="tag active" onClick={() => setTag("")}>
            {tag} ✕
          </span>
        )}
        {!tag &&
          allTags.map((t) => (
            <span key={t} className="tag" onClick={() => setTag(t)}>
              {t}
            </span>
          ))}
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="muted">No notes yet. Upload a PDF or paste text to get started.</p>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <NoteCard key={n._id} note={n} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </>
  );
}
