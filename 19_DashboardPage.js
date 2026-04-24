import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/api/rooms/create`, {
        name: roomName.trim(),
      });
      navigate(`/room/${data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = (e) => {
    e.preventDefault();
    const id = joinRoomId.trim().toUpperCase();
    if (!id) return;
    navigate(`/room/${id}`);
  };

  return (
    <div className="min-h-screen bg-space-950 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <span className="font-display text-accent-cyan text-xl tracking-wider">⚡ SYNCSPACE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
                <span className="text-accent-cyan text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-gray-400 font-body text-sm hidden sm:block">{user?.username}</span>
            </div>
            <button onClick={logout} className="btn-ghost text-sm px-3 py-2">
              Sign Out
            </button>
          </div>
        </header>

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, <span className="text-accent-cyan">{user?.username}</span>
          </h1>
          <p className="text-gray-500 font-body">Create a new room or join an existing one.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg font-body mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg">Create Room</h2>
                <p className="text-gray-500 text-xs font-body">Start a new meeting</p>
              </div>
            </div>

            <form onSubmit={createRoom} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1 font-body">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Team Standup"
                  className="input-field"
                  maxLength={100}
                />
              </div>
              <button type="submit" disabled={creating || !roomName.trim()} className="btn-primary w-full">
                {creating ? "Creating..." : "Create & Join →"}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-purple/10 border border-accent-purple/20 rounded-lg flex items-center justify-center text-xl">
                🚀
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg">Join Room</h2>
                <p className="text-gray-500 text-xs font-body">Enter a room ID to join</p>
              </div>
            </div>

            <form onSubmit={joinRoom} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1 font-body">Room ID</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD34"
                  className="input-field font-display tracking-widest"
                  maxLength={8}
                />
              </div>
              <button type="submit" disabled={!joinRoomId.trim()} className="btn-ghost w-full text-center">
                Join Room →
              </button>
            </form>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🎥", title: "HD Video", desc: "WebRTC P2P" },
            { icon: "🖊️", title: "Whiteboard", desc: "Real-time sync" },
            { icon: "💬", title: "Chat", desc: "File sharing" },
            { icon: "🔒", title: "Encrypted", desc: "JWT + TLS" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="glass-panel p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="font-body font-semibold text-white text-sm">{title}</div>
              <div className="font-body text-gray-500 text-xs">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
