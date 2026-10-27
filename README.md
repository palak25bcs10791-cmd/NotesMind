🧠 NotesMind — AI Notes Summarizer

Turn long notes and PDFs into summaries, quizzes, flashcards, and a chat that answers only from your material.

🔗 Live demo: https://notes-mind.vercel.app/login

🎥 Demo video: https://drive.google.com/file/d/1c30ulk4U_MWIgBsWMMbhtNNl9uIbN4CI/view

Note: the backend runs on a free Render instance, so the very first request after a period of inactivity can take about 50 seconds while the server wakes up.


📌 The Problem

Students get long PDFs, lecture notes, and reading material with very little time to revise. Reading everything again is slow, and generic AI chatbots can make up facts that are not in the course material.

NotesMind lets a student upload a PDF or paste text and instantly get a summary, a self-test, and a study assistant that is restricted to that document.

✨ Features
Feature	What it does
🔐 Secure auth	Register / login / logout with bcrypt-hashed passwords and a JWT in an HttpOnly cookie
📄 PDF or text input	Upload a PDF (text is extracted on the server) or paste notes directly
📝 4 summary styles	Short, Detailed, Bullet points, and Explain-like-I'm-12, switchable at any time
📚 Long document support	Large PDFs are split into chunks, summarized, then combined (map-reduce)
❓ Quiz generator	5 multiple-choice questions with scoring, correct-answer highlighting, and explanations
🃏 Flashcards	Auto-generated cards with a click-to-flip interface
💬 Chat with your note	Ask questions; answers come only from your document, otherwise it says it couldn't find it
🏷️ Tags & search	AI-suggested and manual tags, live search, and tag filtering on the dashboard
⬇️ Export	Download the summary, flashcards, and quiz as a Markdown file
🔒 Data isolation	Every note is tied to its owner; users can only see their own notes
🛠️ Tech Stack
Frontend: React 18, Vite, React Router, Axios, Context API
Backend: Node.js, Express (MVC structure)
Database: MongoDB Atlas with Mongoose
AI: Groq API (OpenAI-compatible chat completions)
File handling: Multer (in-memory upload) and pdf-parse
Auth: bcrypt, JSON Web Tokens, cookie-parser
Deployment: Vercel (frontend) and Render (backend)
🏗️ Architecture
React (Vercel)  ──HTTPS + cookie──▶  Express API (Render)  ──▶  MongoDB Atlas
                                           │
                                           └──▶  Groq API (LLM)
backend/
├── config/        # database connection
├── controllers/   # auth and note logic
├── middlewares/   # JWT protect, PDF upload
├── models/        # User, Note schemas
├── routes/        # route definitions
├── utils/         # LLM wrapper, PDF text extraction, chunking, token helper
└── index.js

frontend/src/
├── components/    # Navbar, NoteCard, Quiz, Flashcards, ChatBox, ProtectedRoute
├── context/       # AuthContext
├── pages/         # Login, Register, Dashboard, NewNote, NoteDetails
└── services/      # Axios instance
🧩 Engineering Decisions
HttpOnly cookie for the JWT. The token is not readable by JavaScript, which protects against token theft through XSS. In production the cookie uses Secure and SameSite=None so it works between the Vercel and Render domains.
Map-reduce summarization. Long documents are split into paragraph-aware chunks, each chunk is summarized, and the partial summaries are summarized again. This keeps requests within the model's token limits.
Grounded chat. The chat prompt tells the model to answer only from the stored document and to say so when the answer is missing, which reduces made-up answers.
Validated AI output. Quiz and flashcard responses are requested as JSON, parsed, and filtered (for example, four options and a valid answer index) before being saved.
Rate-limit handling. The LLM wrapper retries when the provider returns a rate-limit response and shows a clear message if it still fails.
Provider isolated in one file. All AI calls live in backend/utils/llm.js, so switching models or providers does not touch the rest of the app.
Per-user authorization. Every note query filters by the logged-in user, and passwords are never returned from the API.
Central error handling. A single Express error handler returns consistent JSON errors, including upload errors (wrong file type or size over 8 MB).
🚀 Run Locally
Prerequisites
Node.js 18 or later
A free MongoDB Atlas cluster
A free Groq API key
1. Clone and install
bash
git clone https://github.com/palak25bcs10791-cmd/NotesMind.git
cd NotesMind

cd backend
cp .env.example .env      # then fill in your values
npm install

cd ../frontend
npm install
2. Configure backend/.env
env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/notesmind
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
NODE_ENV=development
3. Start both servers
bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev

Open http://localhost:5173. The Vite dev proxy forwards /api to the backend so cookies work locally.

📡 API Reference
Method	Endpoint	Auth	Description
POST	/api/auth/register	No	Create an account
POST	/api/auth/login	No	Log in and set the cookie
GET	/api/auth/me	Yes	Current user
POST	/api/auth/logout	Yes	Clear the cookie
POST	/api/notes	Yes	Create a note (multipart file or text, plus mode, title, tags)
GET	/api/notes?search=&tag=	Yes	List and filter notes
GET	/api/notes/:id	Yes	Get one note
DELETE	/api/notes/:id	Yes	Delete a note
POST	/api/notes/:id/summarize	Yes	Re-summarize with { mode }
POST	/api/notes/:id/quiz	Yes	Generate a quiz
POST	/api/notes/:id/flashcards	Yes	Generate flashcards
POST	/api/notes/:id/chat	Yes	Ask a question with { question }
PATCH	/api/notes/:id/tags	Yes	Update tags with { tags[] }
GET	/api/notes/:id/export	Yes	Download as Markdown
☁️ Deployment

Backend → Render

Root directory: backend, build npm install, start npm start
Environment variables: the same as .env, with NODE_ENV=production and CLIENT_URL=<your Vercel URL> (no trailing slash)

Frontend → Vercel

Root directory: frontend (Vite)
Environment variable: VITE_API_URL=<your Render URL>/api
frontend/vercel.json rewrites all routes to index.html so page refreshes work

Environment files are never committed. Only .env.example templates are in the repo.

⚠️ Known Limitations
Scanned (image-only) PDFs are not supported because there is no OCR step.
Very large documents are partly truncated for quiz, flashcard, and chat features to stay within free-tier token limits.
The free hosting tier sleeps when idle, causing a slow first request.
🔮 Future Improvements
OCR for scanned PDFs
Saved chat history per note
Spaced-repetition scheduling for flashcards
Summarizing web pages and YouTube links

👩‍💻 Author

Palak Agarwal — Scaler School of Technology GitHub: @palak25bcs10791-cmd