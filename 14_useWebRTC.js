/**
 * useWebRTC - Core WebRTC Hook
 *
 * Manages:
 * - Local media stream (camera + mic)
 * - Screen share stream
 * - RTCPeerConnection instances (one per remote peer)
 * - ICE candidate gathering and exchange
 * - Offer/Answer SDP negotiation via Socket.io
 *
 * WebRTC Flow (Mesh topology - each user connects to every other user):
 *
 *   New User Joins
 *       │
 *       ▼
 *   Server sends existing peers list to new user
 *       │
 *       ▼
 *   New user creates RTCPeerConnection for EACH existing peer
 *   New user sends SDP Offer to each peer (via server relay)
 *       │
 *       ▼
 *   Each existing peer receives offer, creates RTCPeerConnection
 *   Each existing peer sends SDP Answer (via server relay)
 *       │
 *       ▼
 *   Both sides exchange ICE Candidates (via server relay)
 *       │
 *       ▼
 *   WebRTC P2P connection established 🎉
 *   Media streams flow directly peer-to-peer (no server involvement)
 */

import { useRef, useState, useCallback, useEffect } from "react";

// ICE servers for NAT traversal
// STUN: discovers public IP/port | TURN: relays media if P2P fails
const ICE_SERVERS = {
  iceServers: [
    { urls: process.env.REACT_APP_STUN_SERVER || "stun:stun.l.google.com:19302" },
    { urls: process.env.REACT_APP_STUN_SERVER_2 || "stun:stun1.l.google.com:19302" },
    // Add TURN server here for production:
    // {
    //   urls: process.env.REACT_APP_TURN_URL,
    //   username: process.env.REACT_APP_TURN_USERNAME,
    //   credential: process.env.REACT_APP_TURN_CREDENTIAL,
    // },
  ],
};

const useWebRTC = (socket, roomId) => {
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, username } }
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // ─── Get Local Media ──────────────────────────────────────────────────────
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (err) {
      console.error("Media access error:", err);
      setMediaError(err.message);
      // Try audio only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setVideoEnabled(false);
        return audioStream;
      } catch (audioErr) {
        console.error("Audio also failed:", audioErr);
        throw audioErr;
      }
    }
  }, []);

  // ─── Create Peer Connection ───────────────────────────────────────────────
  const createPeerConnection = useCallback((targetSocketId, targetUsername) => {
    if (peerConnectionsRef.current[targetSocketId]) {
      return peerConnectionsRef.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ── ICE Candidate Handler ──
    // Fires as ICE agent discovers network candidates
    // We relay each candidate to the remote peer via server
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // ── Track Handler ──
    // Fires when remote peer's media tracks arrive
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: {
          stream: remoteStream,
          username: targetUsername || targetSocketId.slice(0, 6),
        },
      }));
    };

    // ── Connection State ──
    pc.onconnectionstatechange = () => {
      console.log(`Peer ${targetSocketId} state: ${pc.connectionState}`);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        removePeer(targetSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        // Try ICE restart
        pc.restartIce();
      }
    };

    return pc;
  }, [socket]); // eslint-disable-line

  // ─── Cleanup Peer ────────────────────────────────────────────────────────
  const removePeer = useCallback((socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[socketId];
    }
    setRemoteStreams((prev) => {
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  }, []);

  // ─── WebRTC Signaling Event Handlers ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    /**
     * room-joined: Server sends us list of existing peers.
     * We are the "caller" — we initiate an offer to each peer.
     */
    const handleRoomJoined = async ({ peers }) => {
      for (const peer of peers) {
        try {
          const pc = createPeerConnection(peer.socketId, peer.username);

          // Create and send SDP offer
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          socket.emit("webrtc-offer", {
            targetSocketId: peer.socketId,
            offer: pc.localDescription,
          });
        } catch (err) {
          console.error("Error creating offer for", peer.socketId, err);
        }
      }
    };

    /**
     * webrtc-offer: An existing user sent us an offer (we're the new user).
     * We respond with an answer.
     */
    const handleOffer = async ({ offer, fromSocketId, fromUsername }) => {
      try {
        const pc = createPeerConnection(fromSocketId, fromUsername);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Create and send SDP answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          targetSocketId: fromSocketId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error("Error handling offer from", fromSocketId, err);
      }
    };

    /**
     * webrtc-answer: Remote peer responded to our offer.
     * Complete the connection by setting remote description.
     */
    const handleAnswer = async ({ answer, fromSocketId }) => {
      try {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (!pc) return;
        if (pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error handling answer from", fromSocketId, err);
      }
    };

    /**
     * ice-candidate: Remote peer found a network candidate.
     * Add it to our peer connection so ICE can try this path.
     */
    const handleIceCandidate = async ({ candidate, fromSocketId }) => {
      try {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (!pc || !candidate) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    /**
     * user-left: Peer disconnected, cleanup their connection.
     */
    const handleUserLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket, createPeerConnection, removePeer]);

  // ─── Media Controls ───────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
      if (socket && roomId) {
        socket.emit("media-state-change", {
          roomId, audioEnabled: audioTrack.enabled, videoEnabled, screenSharing: isScreenSharing,
        });
      }
    }
  }, [socket, roomId, videoEnabled, isScreenSharing]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
      if (socket && roomId) {
        socket.emit("media-state-change", {
          roomId, audioEnabled, videoEnabled: videoTrack.enabled, screenSharing: isScreenSharing,
        });
      }
    }
  }, [socket, roomId, audioEnabled, isScreenSharing]);

  // ─── Screen Share ─────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace the video track in ALL peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });

      // Also update local video preview
      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(screenTrack);
      }

      setIsScreenSharing(true);
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));

      // When screen share ends (user clicks browser's "Stop sharing")
      screenTrack.onended = () => stopScreenShare();

      if (socket && roomId) {
        socket.emit("media-state-change", {
          roomId, audioEnabled, videoEnabled, screenSharing: true,
        });
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("Screen share error:", err);
      }
    }
  }, [socket, roomId, audioEnabled, videoEnabled]); // eslint-disable-line

  const stopScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) return;
    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    // Restore camera track
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const cameraTrack = cameraStream.getVideoTracks()[0];

      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(cameraTrack);
      });

      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStreamRef.current.addTrack(cameraTrack);
      }

      setIsScreenSharing(false);
      setLocalStream(new MediaStream([...localStreamRef.current.getTracks()]));

      if (socket && roomId) {
        socket.emit("media-state-change", {
          roomId, audioEnabled, videoEnabled, screenSharing: false,
        });
      }
    } catch (err) {
      console.error("Error restoring camera:", err);
    }
  }, [socket, roomId, audioEnabled, videoEnabled]);

  // ─── Cleanup ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    setIsScreenSharing(false);
  }, []);

  return {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    isScreenSharing,
    mediaError,
    initLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
};

export default useWebRTC;
