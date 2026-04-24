import React, { createContext, useContext, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Create socket connection (reconnects on token change)
    socketRef.current = io(SERVER_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => console.log("🔌 Socket connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("🔌 Socket disconnected:", reason));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

// Returns the socket ref (use socketRef.current to access the socket)
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
