import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const useChat = (socket, roomId, username) => {
  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket message listener
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Load history when joining
    const handleRoomJoined = ({ messages: history }) => {
      if (history?.length) setMessages(history);
    };

    socket.on("receive-message", handleMessage);
    socket.on("room-joined", handleRoomJoined);

    return () => {
      socket.off("receive-message", handleMessage);
      socket.off("room-joined", handleRoomJoined);
    };
  }, [socket]);

  const sendMessage = useCallback((text) => {
    if (!socket || !text.trim() || !roomId) return;
    socket.emit("send-message", { roomId, message: text.trim() });
  }, [socket, roomId]);

  const uploadFile = useCallback(async (file) => {
    if (!file || !roomId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await axios.post(
        `${API_URL}/api/files/upload/${roomId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // Send file info as a chat message
      socket.emit("send-message", {
        roomId,
        message: `📎 ${file.name}`,
        fileInfo: data.file,
      });
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [socket, roomId]);

  return { messages, sendMessage, uploadFile, uploading, messagesEndRef };
};

export default useChat;
