import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <span className="font-display text-2xl font-bold text-accent-cyan tracking-wider">
            SYNCSPACE
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Meet.{" "}
          <span className="text-accent-cyan">Create.</span>
          <br />
          Collaborate.
        </h1>

        <p className="font-body text-lg text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
          Crystal-clear video calls, real-time whiteboard, encrypted chat, and seamless file sharing — all in one space.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary text-lg px-8 py-4"
            >
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth?mode=register")}
                className="btn-primary text-lg px-8 py-4"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="btn-ghost text-lg px-8 py-4"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { icon: "📹", label: "HD Video Calls" },
            { icon: "🔒", label: "End-to-End Encrypted" },
            { icon: "🖊️", label: "Live Whiteboard" },
            { icon: "💬", label: "Real-time Chat" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="glass-panel p-4 flex flex-col items-center gap-2 text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors cursor-default"
            >
              <span className="text-2xl">{icon}</span>
              <span className="font-body">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
