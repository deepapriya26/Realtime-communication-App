/**
 * SyncSpace - Real-time Video Conferencing & Collaboration Platform
 * Main Server Entry Point
 *
 * Architecture:
 * - Express.js REST API for auth, rooms, file uploads
 * - Socket.io for real-time signaling, chat, whiteboard sync
 * - WebRTC signaling handled via Socket.io (offer/answer/ICE exchange)
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const mongoose = require("mongoose");

// Route imports
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const fileRoutes = require("./routes/files");

// Socket handler
const initSocketHandlers = require("./socket/socketHandlers");

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Increase buffer size for whiteboard data
  maxHttpBufferSize: 1e7,
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/auth", limiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/files", fileRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Socket.io Handlers ───────────────────────────────────────────────────────
initSocketHandlers(io);

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/syncspace"
    );
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 SyncSpace server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});

module.exports = { app, io };
