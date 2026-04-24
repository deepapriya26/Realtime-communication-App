const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Multer Config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by room
    const roomDir = path.join(uploadDir, req.params.roomId || "general");
    if (!fs.existsSync(roomDir)) {
      fs.mkdirSync(roomDir, { recursive: true });
    }
    cb(null, roomDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp to avoid collisions
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}-${sanitized}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  // Block potentially dangerous file types
  const blockedExtensions = [".exe", ".bat", ".cmd", ".sh", ".ps1", ".msi"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (blockedExtensions.includes(ext)) {
    return cb(new Error("File type not allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
});

/**
 * POST /api/files/upload/:roomId
 * Upload a file to a room
 */
router.post(
  "/upload/:roomId",
  authMiddleware,
  upload.single("file"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.params.roomId || "general"
      }/${req.file.filename}`;

      res.json({
        message: "File uploaded successfully",
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl,
        },
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "File upload failed" });
    }
  }
);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large (max 50MB)" });
    }
  }
  if (err.message === "File type not allowed") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
