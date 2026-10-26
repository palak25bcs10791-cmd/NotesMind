import chunkText from "./chunkText.js";

const MODEL = () => process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryDelay = (res) => {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;

  const reset = res.headers.get("x-ratelimit-reset-tokens");
  const match = reset?.match(/^([\d.]+)(ms|s|m)$/);
  if (!match) return 5000;

  const value = Number(match[1]);
  return value * (match[2] === "m" ? 60000 : match[2] === "s" ? 1000 : 1);
};

// ── core fetch wrapper ────────────────────────────────────────────────────────
export const generate = async (prompt, { json = false } = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("GROQ_API_KEY is not configured"), { status: 503 });
  }

  let res;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL(),
        messages: [{ role: "user", content: prompt }],
        max_completion_tokens: json ? 2048 : 1024,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (res.status !== 429 || attempt === 2) break;
    await delay(retryDelay(res));
  }

  if (!res.ok) {
    if (res.status === 429) {
      throw Object.assign(
        new Error("Groq rate limit reached. Please wait a minute, then try again."),
        { status: 429 }
      );
    }
    const err = new Error("AI service error: " + (await res.text()).slice(0, 200));
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";

  if (!text) {
    throw Object.assign(new Error("AI returned an empty response"), { status: 502 });
  }

  return text;
};

// ── helpers ───────────────────────────────────────────────────────────────────

// Strip markdown code fences if the model wraps its JSON response.
const parseJSON = (text) => {
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*|\s*```$/gi, "");
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed.items;
  } catch {
    throw Object.assign(new Error("AI returned invalid JSON, please retry"), { status: 502 });
  }
};

// truncate text for prompts that don't need the full document
const trim = (text) => text.slice(0, 12000);

// ── summary mode prompts ──────────────────────────────────────────────────────
const MODES = {
  short:    "Write a concise summary in 4-6 sentences.",
  detailed: "Write a detailed, well-structured summary with short headings and full explanations of key ideas.",
  bullets:  "Summarize as clear bullet points grouped by topic. Use '-' for bullets.",
  eli5:     "Explain the content simply, as if to a 12-year-old, using easy words and small examples.",
};

// ── summarize (map-reduce so long PDFs don't exceed token limits) ─────────────
export const summarize = async (text, mode = "short") => {
  const instruction = MODES[mode] || MODES.short;
  const chunks = chunkText(text);

  let source = text;

  if (chunks.length > 1) {
    // map: summarize each chunk independently
    const partials = [];
    for (const chunk of chunks) {
      partials.push(
        await generate(`Summarize the key points of this part of a document:\n\n${chunk}`)
      );
    }
    // reduce: summarize the chunk summaries together
    source = partials.join("\n\n");
  }

  return generate(
    `${instruction}\nOnly use the information given. Do not invent facts.\n\nCONTENT:\n${source}`
  );
};

// ── quiz generator ────────────────────────────────────────────────────────────
export const makeQuiz = async (text, count = 5) => {
  const out = await generate(
    `Create ${count} multiple-choice questions from the notes below.
Return ONLY a JSON object with an "items" array of objects with keys:
  question (string), options (array of exactly 4 strings), answerIndex (0-3), explanation (string).

NOTES:
${trim(text)}`,
    { json: true }
  );

  const quiz = parseJSON(out);
  if (!Array.isArray(quiz)) {
    throw Object.assign(new Error("Invalid quiz format"), { status: 502 });
  }

  // validate each question before saving
  return quiz
    .filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.answerIndex >= 0 &&
        q.answerIndex <= 3
    )
    .map(({ question, options, answerIndex, explanation }) => ({
      question,
      options,
      answerIndex,
      explanation: explanation || "",
    }));
};

// ── flashcard generator ───────────────────────────────────────────────────────
export const makeFlashcards = async (text, count = 10) => {
  const out = await generate(
    `Create ${count} study flashcards from the notes below.
Return ONLY a JSON object with an "items" array of objects with keys:
  front (a question or term), back (a short answer or definition).

NOTES:
${trim(text)}`,
    { json: true }
  );

  const cards = parseJSON(out);
  if (!Array.isArray(cards)) {
    throw Object.assign(new Error("Invalid flashcard format"), { status: 502 });
  }

  return cards
    .filter((c) => c.front && c.back)
    .map(({ front, back }) => ({ front, back }));
};

// ── auto-tag suggester ────────────────────────────────────────────────────────
export const suggestTags = async (text) => {
  try {
    const out = await generate(
      `Give 3 short topic tags (1-2 words each) for this text.
Return ONLY a JSON object with an "items" array of strings.

${text.slice(0, 4000)}`,
      { json: true }
    );
    const tags = parseJSON(out);
    return Array.isArray(tags) ? tags.slice(0, 3).map(String) : [];
  } catch {
    return []; // tags are optional — don't fail the whole request
  }
};

// ── chat with notes ───────────────────────────────────────────────────────────
export const chatWithNotes = (text, question) =>
  generate(
    `You are a study assistant. Answer the question using ONLY the document below.
If the answer is not in the document, say "I couldn't find that in your notes."

DOCUMENT:
${trim(text)}

QUESTION: ${question}`
  );
