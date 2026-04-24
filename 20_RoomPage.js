import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import useWebRTC from "../hooks/useWebRTC";
import useChat from "../hooks/useChat";
import VideoGrid from "../components/VideoGrid/VideoGrid";
import ChatPanel from "../components/Chat/ChatPanel";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import ControlBar from "../components/Room/ControlBar";
import RoomHeader from "../components/Room/RoomHeader";
import LoadingSpinner from "../components/UI/LoadingSpinner";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketRef = useSocket();

  const [activeTab, setActiveTab] = useState("video"); // video | whiteboard
  const [chatOpen, setChatOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [joining, setJoining] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadRef = useRef(0);

  const socket = socketRef.current;

  const {
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
  } = useWebRTC(socket, roomId);

  const { messages, sendMessage, uploadFile, uploading, messagesEndRef } =
    useChat(socket, roomId, user?.username);

  // ── Track unread messages ──────────────────────────────────────────────────
  useEffect(() => {
    if (!chatOpen) {
      const newMsgs = messages.length - lastReadRef.current;
      if (newMsgs > 0) setUnreadCount(newMsgs);
    } else {
      lastReadRef.current = messages.length;
      setUnreadCount(0);
    }
  }, [messages, chatOpen]);

  // ── Join room sequence ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId || !user) return;

    const joinRoom = async () => {
      try {
        await initLocalStream();
        socket.emit("join-room", { roomId, username: user.username });
      } catch (err) {
        console.error("Failed to init media:", err);
        // Still join without media
        socket.emit("join-room", { roomId, username: user.username });
      } finally {
        setJoining(false);
      }
    };

    joinRoom();

    // Track participants via socket events
    const handleRoomJoined = ({ peers }) => {
      setParticipants(peers.map((p) => ({ ...p, isRemote: true })));
    };
    const handleUserJoined = (userData) => {
      setParticipants((prev) => [
        ...prev.filter((p) => p.socketId !== userData.socketId),
        { ...userData, isRemote: true },
      ]);
    };
    const handleUserLeft = ({ socketId, username }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket, roomId, user, initLocalStream]);

  // ── Leave room ────────────────────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    if (socket) socket.emit("leave-room", { roomId });
    cleanup();
    navigate("/dashboard");
  }, [socket, roomId, cleanup, navigate]);

  // Leave on unmount / browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) socket.emit("leave-room", { roomId });
      cleanup();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [socket, roomId, cleanup, handleLeave]);

  if (joining) return <LoadingSpinner fullscreen message="Joining room..." />;

  return (
    <div className="h-screen bg-space-950 flex flex-col overflow-hidden">
      {/* Header */}
      <RoomHeader
        roomId={roomId}
        participantCount={Object.keys(remoteStreams).length + 1}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video / Whiteboard */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "video" ? (
            <VideoGrid
              localStream={localStream}
              remoteStreams={remoteStreams}
              localUser={user}
              audioEnabled={audioEnabled}
              videoEnabled={videoEnabled}
              mediaError={mediaError}
            />
          ) : (
            <Whiteboard socket={socket} roomId={roomId} />
          )}
        </div>

        {/* Chat sidebar */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 border-l border-space-600/50 animate-slide-up">
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              onFileUpload={uploadFile}
              uploading={uploading}
              messagesEndRef={messagesEndRef}
              currentUser={user}
            />
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleChat={() => setChatOpen((o) => !o)}
        onLeave={handleLeave}
        activeTab={activeTab}
        onToggleWhiteboard={() => setActiveTab((t) => t === "whiteboard" ? "video" : "whiteboard")}
      />
    </div>
  );
};

export default RoomPage;
