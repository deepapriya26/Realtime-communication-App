import React from "react";

const ControlBar = ({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  chatOpen,
  unreadCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
  activeTab,
  onToggleWhiteboard,
}) => {
  return (
    <div className="bg-space-900/95 backdrop-blur-sm border-t border-space-600/50 px-4 py-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          {/* Mic */}
          <button
            onClick={onToggleAudio}
            className={`control-btn ${audioEnabled ? "control-btn-active" : "control-btn-inactive"}`}
            title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            <span className="text-lg">{audioEnabled ? "🎙️" : "🔇"}</span>
          </button>

          {/* Camera */}
          <button
            onClick={onToggleVideo}
            className={`control-btn ${videoEnabled ? "control-btn-active" : "control-btn-inactive"}`}
            title={videoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            <span className="text-lg">{videoEnabled ? "📹" : "🚫"}</span>
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`control-btn ${isScreenSharing ? "bg-accent-cyan/20 border border-accent-cyan/50" : "control-btn-active"}`}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <span className="text-lg">🖥️</span>
          </button>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          {/* Whiteboard toggle */}
          <button
            onClick={onToggleWhiteboard}
            className={`control-btn px-4 gap-2 flex-row rounded-full text-sm font-body ${
              activeTab === "whiteboard"
                ? "bg-accent-purple/20 border border-accent-purple/50 text-accent-purple"
                : "control-btn-active"
            }`}
            title="Toggle whiteboard"
          >
            <span>🖊️</span>
            <span className="hidden sm:inline">Board</span>
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            className="btn-danger px-5 py-2 rounded-full font-body font-medium flex items-center gap-2"
            title="Leave meeting"
          >
            <span>📞</span>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Chat */}
          <button
            onClick={onToggleChat}
            className={`control-btn relative ${chatOpen ? "bg-accent-cyan/20 border border-accent-cyan/50" : "control-btn-active"}`}
            title="Toggle chat"
          >
            <span className="text-lg">💬</span>
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-cyan text-space-950 text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
