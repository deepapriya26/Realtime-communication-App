const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/rooms/create
 * Create a new room (protected)
 */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, isPrivate, maxParticipants } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Room name is required" });
    }

    // Generate unique 8-char room ID (easy to share)
    const roomId = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      name: name.trim(),
      createdBy: req.user._id,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 10,
    });

    // Track rooms created by user
    req.user.roomsCreated.push(roomId);
    await req.user.save({ validateModifiedOnly: true });

    res.status(201).json({
      message: "Room created",
      room: {
        roomId: room.roomId,
        name: room.name,
        isPrivate: room.isPrivate,
        maxParticipants: room.maxParticipants,
        expiresAt: room.expiresAt,
      },
    });
  } catch (err) {
    console.error("Create room error:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room info (public - for joining)
 */
router.get("/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({
      roomId: req.params.roomId,
      isActive: true,
    }).populate("createdBy", "username");

    if (!room) {
      return res.status(404).json({ error: "Room not found or has expired" });
    }

    res.json({
      room: {
        roomId: room.roomId,
        name: room.name,
        isPrivate: room.isPrivate,
        maxParticipants: room.maxParticipants,
        createdBy: room.createdBy?.username,
        expiresAt: room.expiresAt,
      },
    });
  } catch (err) {
    console.error("Get room error:", err);
    res.status(500).json({ error: "Failed to get room info" });
  }
});

/**
 * GET /api/rooms
 * List user's rooms (protected)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({
      createdBy: req.user._id,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

module.exports = router;
