import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // faster dashboard queries per user
    },
    title: { type: String, required: true, trim: true },
    sourceType: { type: String, enum: ["pdf", "text"], default: "text" },
    originalText: { type: String, required: true },
    summary: { type: String, default: "" },
    summaryMode: {
      type: String,
      enum: ["short", "detailed", "bullets", "eli5"],
      default: "short",
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    quiz: [
      {
        question: String,
        options: [String],
        answerIndex: Number,
        explanation: String,
      },
    ],
    flashcards: [{ front: String, back: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);
