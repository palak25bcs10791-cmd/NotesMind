import multer from "multer";

// store in memory so pdf-parse can read the buffer directly (no temp files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    const err = new Error("Only PDF files are allowed");
    err.status = 400;
    cb(err);
  },
});

export default upload;
