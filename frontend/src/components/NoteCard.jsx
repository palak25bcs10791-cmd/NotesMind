import { Link } from "react-router-dom";

export default function NoteCard({ note, onDelete }) {
  return (
    <div className="card">
      <Link to={`/notes/${note._id}`}>
        <h3>{note.title}</h3>
      </Link>
      <p className="muted clamp">{note.summary}</p>
      <div className="tags">
        {note.tags.map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <div className="row between">
        <small className="muted">
          {note.sourceType.toUpperCase()} · {new Date(note.createdAt).toLocaleDateString()}
        </small>
        <button className="btn small danger" onClick={() => onDelete(note._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
