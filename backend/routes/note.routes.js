import { Router } from "express";
import protect from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import * as n from "../controllers/note.controller.js";

const router = Router();

// all note routes require login
router.use(protect);

router.post("/", upload.single("file"), n.createNote);
router.get("/", n.getNotes);
router.get("/:id", n.getNote);
router.delete("/:id", n.deleteNote);
router.post("/:id/summarize", n.resummarize);
router.post("/:id/quiz", n.generateQuiz);
router.post("/:id/flashcards", n.generateFlashcards);
router.post("/:id/chat", n.chat);
router.patch("/:id/tags", n.updateTags);
router.get("/:id/export", n.exportNote);

export default router;
