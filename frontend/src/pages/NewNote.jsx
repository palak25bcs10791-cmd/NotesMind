import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errMsg } from "../services/api";

export default function NewNote() {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [mode, setMode] = useState("short");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file && text.trim().length < 50) {
      return setError("Upload a PDF or paste at least 50 characters of text");
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("mode", mode);
    fd.append("tags", tags);
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("text", text);
    }

    setBusy(true);
    try {
      const r = await api.post("/notes", fd);
      navigate(`/notes/${r.data.note._id}`);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>New note</h2>
      {error && <p className="error">{error}</p>}

      <input
        placeholder="Title (optional — uses filename if uploading PDF)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Tags, comma separated (optional)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <label>Summary style</label>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="short">Short (4-6 sentences)</option>
        <option value="detailed">Detailed (with headings)</option>
        <option value="bullets">Bullet points</option>
        <option value="eli5">Explain like I'm 12</option>
      </select>

      <label>Upload PDF</label>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0] || null)}
      />

      {!file && (
        <>
          <p className="muted center">— or paste text below —</p>
          <textarea
            rows="10"
            placeholder="Paste your notes here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      )}

      <button className="btn" disabled={busy}>
        {busy ? "Summarizing... (can take ~20s for big files)" : "Summarize"}
      </button>
    </form>
  );
}
