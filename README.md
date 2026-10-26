# NotesMind — AI Notes Summarizer

Upload a PDF or paste text → get AI summaries, quizzes, flashcards, and chat with your notes.

Built with: React + Express + MongoDB + Groq AI

---

## Features

- Register / Login / Logout with JWT stored in HttpOnly cookie
- Upload PDF or paste plain text
- 4 summary modes: Short, Detailed, Bullet points, ELI5
- Long PDF support via chunked map-reduce summarization
- Quiz generator — 5 MCQs with scoring and explanations
- Flashcards — flip UI, navigate between cards
- Chat with your note — answers only from your document
- Auto + manual tags, search and tag filter on dashboard
- Export summary + flashcards + quiz as a Markdown file

---

## Setup

### 1. Clone and install

```bash
# backend
cd backend
cp .env.example .env      # fill in your values
npm install

# frontend
cd ../frontend
npm install
```

### 2. Fill in `.env`

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/notesmind
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=get_a_key_at_console.groq.com/keys
GROQ_MODEL=openai/gpt-oss-20b
NODE_ENV=development
```

### 3. Run

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Frontend runs at http://localhost:5173 — the Vite proxy forwards `/api` to the backend so cookies work in dev.

---

## API Reference

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | No |
| POST | /api/auth/login | No |
| GET | /api/auth/me | Yes |
| POST | /api/auth/logout | Yes |
| POST | /api/notes (multipart `file` or `text`, `mode`, `title`, `tags`) | Yes |
| GET | /api/notes?search=&tag= | Yes |
| GET | /api/notes/:id | Yes |
| DELETE | /api/notes/:id | Yes |
| POST | /api/notes/:id/summarize `{mode}` | Yes |
| POST | /api/notes/:id/quiz | Yes |
| POST | /api/notes/:id/flashcards | Yes |
| POST | /api/notes/:id/chat `{question}` | Yes |
| PATCH | /api/notes/:id/tags `{tags[]}` | Yes |
| GET | /api/notes/:id/export | Yes |

---

## Deploy

**Backend → Render**
- Root: `backend`
- Start command: `npm start`
- Environment variables: same as `.env` but set `NODE_ENV=production` and `CLIENT_URL=<your vercel url>`

**Frontend → Vercel**
- Root: `frontend`
- Environment variable: `VITE_API_URL=<your render backend url>/api`
