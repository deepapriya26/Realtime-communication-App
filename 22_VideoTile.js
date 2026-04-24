import React, { useRef, useEffect } from "react";

const VideoTile = ({
  stream,
  username,
  isLocal,
  audioEnabled,
  videoEnabled,
  mediaError,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="video-tile min-h-0 flex items-center justify-center">
      {/* Video element */}
      {stream && videoEnabled !== false ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local to prevent echo
          className="w-full h-full object-cover"
        />
      ) : (
        // Avatar fallback when no video
        <div className="w-full h-full flex items-center justify-center bg-space-800">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan/40 flex items-center justify-center">
              <span className="font-display text-2xl text-accent-cyan">{initials}</span>
            </div>
            {mediaError && isLocal && (
              <p className="text-red-400 text-xs font-body text-center px-4 max-w-xs">
                ⚠️ {mediaError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overlay info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between">
        <span className="font-body text-sm text-white truncate">
          {username} {isLocal && "(You)"}
        </span>
        <div className="flex items-center gap-1">
          {!audioEnabled && (
            <span
              className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-xs"
              title="Muted"
            >
              🔇
            </span>
          )}
          {!videoEnabled && (
            <span
              className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-xs"
              title="Camera off"
            >
              📷
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
