import Note from "../models/note.model.js";
import extractText from "../utils/extractText.js";
import { summarize, makeQuiz, makeFlashcards, suggestTags, chatWithNotes } from "../utils/llm.js";

const MODES = ["short", "detailed", "bullets", "eli5"];

// fields returned in the dashboard list — omit originalText to keep responses small
const listFields = "title sourceType summary summaryMode tags createdAt";

// reusable helper: find a note that belongs to the logged-in user
const getOwned = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id }).catch(() => null);
  if (!note) res.status(404).json({ success: false, message: "Note not found" });
  return note;
};

// POST /api/notes  (multipart: file OR text field)
export const createNote = async (req, res) => {
  try {
    const { title, text, mode = "short" } = req.body;
    let content = (text || "").trim();
    let sourceType = "text";

    if (req.file) {
      content = await extractText(req.file.buffer);
      sourceType = "pdf";
    }

    if (!content || content.length < 50) {
      return res.status(400).json({
        success: false,
        message: "Provide a PDF or at least 50 characters of text (scanned PDFs are not supported)",
      });
    }

    if (!MODES.includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid summary mode" });
    }

    const summary = await summarize(content, mode);
    const aiTags = await suggestTags(content);

    // merge user-provided tags with AI-suggested ones, deduplicate and lowercase
    const userTags = (req.body.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const tags = [...new Set([...userTags, ...aiTags].map((t) => t.toLowerCase()))];

    const note = await Note.create({
      user: req.user._id,
      title: title?.trim() || req.file?.originalname?.replace(/\.pdf$/i, "") || "Untitled note",
      sourceType,
      originalText: content,
      summary,
      summaryMode: mode,
      tags,
    });

    res.status(201).json({ success: true, note });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// GET /api/notes?search=&tag=
export const getNotes = async (req, res) => {
  try {
    const { search, tag } = req.query;
    const query = { user: req.user._id };

    if (tag) query.tags = tag.toLowerCase();

    if (search) {
      // escape special regex chars so user input can't break the query
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: rx }, { summary: rx }, { tags: rx }];
    }

    const notes = await Note.find(query).select(listFields).sort({ createdAt: -1 });
    res.json({ success: true, notes });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/notes/:id
export const getNote = async (req, res) => {
  const note = await getOwned(req, res);
  if (note) res.json({ success: true, note });
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  const note = await getOwned(req, res);
  if (!note) return;
  await note.deleteOne();
  res.json({ success: true, message: "Note deleted" });
};

// POST /api/notes/:id/summarize  { mode }
export const resummarize = async (req, res) => {
  try {
    const note = await getOwned(req, res);
    if (!note) return;

    const { mode } = req.body;
    if (!MODES.includes(mode)) {
      return res.status(400).json({ success: false, message: "Invalid summary mode" });
    }

    note.summary = await summarize(note.originalText, mode);
    note.summaryMode = mode;
    await note.save();

    res.json({ success: true, note });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// POST /api/notes/:id/quiz
export const generateQuiz = async (req, res) => {
  try {
    const note = await getOwned(req, res);
    if (!note) return;

    note.quiz = await makeQuiz(note.originalText);

    if (!note.quiz.length) {
      return res.status(502).json({ success: false, message: "Could not generate quiz, retry" });
    }

    await note.save();
    res.json({ success: true, quiz: note.quiz });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// POST /api/notes/:id/flashcards
export const generateFlashcards = async (req, res) => {
  try {
    const note = await getOwned(req, res);
    if (!note) return;

    note.flashcards = await makeFlashcards(note.originalText);

    if (!note.flashcards.length) {
      return res.status(502).json({ success: false, message: "Could not generate flashcards, retry" });
    }

    await note.save();
    res.json({ success: true, flashcards: note.flashcards });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// POST /api/notes/:id/chat  { question }
export const chat = async (req, res) => {
  try {
    const note = await getOwned(req, res);
    if (!note) return;

    const question = (req.body.question || "").trim();
    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const answer = await chatWithNotes(note.originalText, question);
    res.json({ success: true, answer });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

// PATCH /api/notes/:id/tags  { tags: [] }
export const updateTags = async (req, res) => {
  const note = await getOwned(req, res);
  if (!note) return;

  const tags = Array.isArray(req.body.tags) ? req.body.tags : [];
  note.tags = [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  await note.save();

  res.json({ success: true, note });
};

// GET /api/notes/:id/export  -> markdown file download
export const exportNote = async (req, res) => {
  const note = await getOwned(req, res);
  if (!note) return;

  let md = `# ${note.title}\n\nTags: ${note.tags.join(", ") || "-"}\n\n## Summary (${note.summaryMode})\n\n${note.summary}\n`;

  if (note.flashcards.length) {
    md += `\n## Flashcards\n\n`;
    md += note.flashcards.map((c, i) => `${i + 1}. **${c.front}**\n   ${c.back}`).join("\n");
  }

  if (note.quiz.length) {
    md += `\n\n## Quiz\n\n`;
    md += note.quiz
      .map(
        (q, i) =>
          `${i + 1}. ${q.question}\n` +
          q.options.map((o, j) => `   - ${"abcd"[j]}) ${o}`).join("\n") +
          `\n   Answer: ${"abcd"[q.answerIndex]}`
      )
      .join("\n\n");
  }

  res.setHeader("Content-Type", "text/markdown");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${note.title.replace(/[^\w\- ]/g, "")}.md"`
  );
  res.send(md);
};
