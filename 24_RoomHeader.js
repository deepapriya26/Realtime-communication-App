import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RoomHeader = ({ roomId, participantCount, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="bg-space-900/80 backdrop-blur-sm border-b border-space-600/50 px-4 py-3 flex items-center justify-between">
      {/* Left: Logo + room info */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="font-display text-accent-cyan text-sm tracking-wider hover:opacity-70 transition-opacity"
        >
          ⚡ SYNC
        </button>
        <div className="h-4 w-px bg-space-600" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse-slow" />
          <span className="text-gray-400 font-body text-sm">
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Center: Room ID badge */}
      <button
        onClick={copyRoomId}
        className="flex items-center gap-2 bg-space-800 border border-space-600 hover:border-accent-cyan/50 transition-colors rounded-lg px-3 py-1.5 group"
        title="Click to copy Room ID"
      >
        <span className="font-display text-sm text-white tracking-widest">{roomId}</span>
        <span className="text-xs text-gray-500 group-hover:text-accent-cyan transition-colors">
          {copied ? "✓ Copied!" : "📋"}
        </span>
      </button>

      {/* Right: Tab toggle */}
      <div className="flex items-center gap-1 bg-space-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("video")}
          className={`px-3 py-1 rounded-md text-xs font-body transition-all ${
            activeTab === "video"
              ? "bg-accent-cyan text-space-950 font-semibold"
              : "text-gray-500 hover:text-white"
          }`}
        >
          📹 Video
        </button>
        <button
          onClick={() => setActiveTab("whiteboard")}
          className={`px-3 py-1 rounded-md text-xs font-body transition-all ${
            activeTab === "whiteboard"
              ? "bg-accent-purple text-white font-semibold"
              : "text-gray-500 hover:text-white"
          }`}
        >
          🖊️ Board
        </button>
      </div>
    </header>
  );
};

export default RoomHeader;
