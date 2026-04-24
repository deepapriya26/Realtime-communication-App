/**
 * Socket.io Event Handlers
 *
 * WebRTC Signaling Flow:
 * 1. User A joins room → server records them, notifies existing peers
 * 2. Existing peers send "offer" to User A (via server relay)
 * 3. User A responds with "answer" to each peer (via server relay)
 * 4. Both sides exchange ICE candidates (via server relay)
 * 5. WebRTC peer connection established (direct P2P after this)
 *
 * Server is a SIGNALING relay only - media streams go P2P via WebRTC.
 */

const jwt = require("jsonwebtoken");

// In-memory room state (use Redis in production for multi-instance)
const rooms = new Map();
// roomId → { users: Map<socketId, { userId, username, socketId }> }

const initSocketHandlers = (io) => {
  // ─── Auth Middleware for Socket ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow anonymous for now (guest users)
      socket.user = { userId: `guest_${socket.id}`, username: "Guest" };
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      socket.user = {
        userId: decoded.userId,
        username: decoded.username,
      };
      next();
    } catch (err) {
      // Token invalid — treat as guest
      socket.user = { userId: `guest_${socket.id}`, username: "Guest" };
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id} (${socket.user.username})`);

    // ─── Room Management ────────────────────────────────────────────────────

    /**
     * JOIN ROOM
     * Client sends: { roomId, username? }
     * Server:
     *   1. Adds user to room state
     *   2. Joins socket room
     *   3. Sends existing peers list to new user
     *   4. Notifies existing peers of new user
     */
    socket.on("join-room", ({ roomId, username }) => {
      if (!roomId) return;

      // Leave any previous room
      const prevRoom = socket.currentRoom;
      if (prevRoom) leaveRoom(socket, prevRoom, io);

      // Initialize room if needed
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: new Map(), messages: [] });
      }

      const room = rooms.get(roomId);
      const userInfo = {
        userId: socket.user.userId,
        username: username || socket.user.username,
        socketId: socket.id,
        joinedAt: Date.now(),
      };

      room.users.set(socket.id, userInfo);
      socket.join(roomId);
      socket.currentRoom = roomId;

      // Send list of existing peers to the newcomer
      // The newcomer will initiate offers to each existing peer
      const existingPeers = [];
      room.users.forEach((user, sid) => {
        if (sid !== socket.id) {
          existingPeers.push({ socketId: sid, username: user.username });
        }
      });

      socket.emit("room-joined", {
        roomId,
        peers: existingPeers,
        messages: room.messages.slice(-50), // Last 50 messages
        userInfo,
      });

      // Notify existing peers that someone new joined
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        username: userInfo.username,
        userId: userInfo.userId,
      });

      console.log(
        `👥 ${userInfo.username} joined room ${roomId} (${room.users.size} users)`
      );
    });

    // ─── WebRTC Signaling ───────────────────────────────────────────────────

    /**
     * OFFER (Caller → Callee via server)
     * When a new user joins, existing users send them an SDP offer.
     * Server relays to the target peer.
     */
    socket.on("webrtc-offer", ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit("webrtc-offer", {
        offer,
        fromSocketId: socket.id,
        fromUsername: socket.user.username,
      });
    });

    /**
     * ANSWER (Callee → Caller via server)
     * New user responds to each offer with an SDP answer.
     * Server relays to the original caller.
     */
    socket.on("webrtc-answer", ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit("webrtc-answer", {
        answer,
        fromSocketId: socket.id,
      });
    });

    /**
     * ICE CANDIDATE (Both directions via server)
     * Both peers continuously send ICE candidates after offer/answer.
     * Server relays to the correct peer.
     * ICE candidates help establish the best network path (P2P, TURN, etc.)
     */
    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─── Media State ────────────────────────────────────────────────────────

    /** Broadcast media state change (mute/unmute/camera toggle) */
    socket.on("media-state-change", ({ roomId, audioEnabled, videoEnabled, screenSharing }) => {
      socket.to(roomId).emit("peer-media-state", {
        socketId: socket.id,
        audioEnabled,
        videoEnabled,
        screenSharing,
      });
    });

    // ─── Chat ───────────────────────────────────────────────────────────────

    socket.on("send-message", ({ roomId, message, fileInfo }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      const msgObj = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId: socket.user.userId,
        username: user?.username || socket.user.username,
        message,
        fileInfo: fileInfo || null,
        timestamp: new Date().toISOString(),
      };

      // Store last 200 messages in memory
      room.messages.push(msgObj);
      if (room.messages.length > 200) room.messages.shift();

      // Broadcast to all in room (including sender)
      io.to(roomId).emit("receive-message", msgObj);
    });

    // ─── Whiteboard ─────────────────────────────────────────────────────────

    /** Relay drawing data to all other users in the room */
    socket.on("whiteboard-draw", ({ roomId, drawData }) => {
      socket.to(roomId).emit("whiteboard-draw", {
        drawData,
        fromSocketId: socket.id,
      });
    });

    /** Relay clear canvas event */
    socket.on("whiteboard-clear", ({ roomId }) => {
      socket.to(roomId).emit("whiteboard-clear");
    });

    /** Relay undo event */
    socket.on("whiteboard-undo", ({ roomId }) => {
      socket.to(roomId).emit("whiteboard-undo", { fromSocketId: socket.id });
    });

    // ─── Disconnect / Leave ─────────────────────────────────────────────────

    socket.on("leave-room", ({ roomId }) => {
      leaveRoom(socket, roomId, io);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
      if (socket.currentRoom) {
        leaveRoom(socket, socket.currentRoom, io);
      }
    });
  });
};

/**
 * Remove user from room, notify remaining peers, cleanup empty rooms
 */
function leaveRoom(socket, roomId, io) {
  const room = rooms.get(roomId);
  if (!room) return;

  const user = room.users.get(socket.id);
  room.users.delete(socket.id);
  socket.leave(roomId);
  socket.currentRoom = null;

  // Notify remaining peers
  socket.to(roomId).emit("user-left", {
    socketId: socket.id,
    username: user?.username,
  });

  // Cleanup empty rooms
  if (room.users.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑️  Room ${roomId} deleted (empty)`);
  }

  console.log(`👋 ${user?.username} left room ${roomId}`);
}

module.exports = initSocketHandlers;
