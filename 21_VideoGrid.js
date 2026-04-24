import React, { useMemo } from "react";
import VideoTile from "./VideoTile";

/**
 * VideoGrid
 * Renders local + remote video streams in a responsive grid.
 * Layout adjusts based on participant count:
 *   1 person  → fullscreen
 *   2 people  → side by side
 *   3-4       → 2x2 grid
 *   5-6       → 3x2 grid
 *   7+        → 4x... grid
 */
const getGridClass = (count) => {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  return "grid-cols-4";
};

const VideoGrid = ({
  localStream,
  remoteStreams,
  localUser,
  audioEnabled,
  videoEnabled,
  mediaError,
}) => {
  const remoteEntries = Object.entries(remoteStreams);
  const totalCount = 1 + remoteEntries.length;
  const gridClass = useMemo(() => getGridClass(totalCount), [totalCount]);

  return (
    <div className={`h-full p-3 grid ${gridClass} gap-3 content-start auto-rows-fr`}>
      {/* Local video tile */}
      <VideoTile
        stream={localStream}
        username={localUser?.username || "You"}
        isLocal
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        mediaError={mediaError}
      />

      {/* Remote video tiles */}
      {remoteEntries.map(([socketId, { stream, username }]) => (
        <VideoTile
          key={socketId}
          stream={stream}
          username={username}
          isLocal={false}
          audioEnabled={true}
          videoEnabled={true}
        />
      ))}

      {/* Empty state */}
      {remoteEntries.length === 0 && (
        <div className="video-tile flex flex-col items-center justify-center text-center p-8">
          <div className="text-5xl mb-4">👋</div>
          <p className="font-display text-accent-cyan text-sm tracking-wider mb-2">WAITING FOR OTHERS</p>
          <p className="text-gray-500 font-body text-sm">Share the room ID to invite people</p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
