import React, { useState, useRef } from "react";

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const ChatPanel = ({
  messages,
  onSend,
  onFileUpload,
  uploading,
  messagesEndRef,
  currentUser,
}) => {
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSend(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-space-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-space-600/50 flex items-center gap-2">
        <span className="text-accent-cyan">💬</span>
        <span className="font-display text-sm text-white tracking-wide">CHAT</span>
        <span className="ml-auto text-xs text-gray-600 font-body">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 font-body text-sm mt-8">
            <div className="text-3xl mb-2">💬</div>
            No messages yet. Say hello!
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.userId === currentUser?.id || msg.username === currentUser?.username;
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {/* Username + time */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-xs font-body font-medium ${isOwn ? "text-accent-cyan" : "text-gray-400"}`}>
                  {isOwn ? "You" : msg.username}
                </span>
                <span className="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Message bubble */}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                isOwn
                  ? "bg-accent-cyan/20 border border-accent-cyan/20 text-white"
                  : "bg-space-700 text-gray-200"
              }`}>
                {msg.fileInfo ? (
                  // File message
                  <a
                    href={msg.fileInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xl">
                      {msg.fileInfo.mimetype?.startsWith("image/") ? "🖼️" :
                       msg.fileInfo.mimetype?.startsWith("video/") ? "🎬" :
                       msg.fileInfo.mimetype?.includes("pdf") ? "📄" : "📎"}
                    </span>
                    <div>
                      <div className="text-sm font-body font-medium text-accent-cyan underline">
                        {msg.fileInfo.originalName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(msg.fileInfo.size)}
                      </div>
                    </div>
                  </a>
                ) : (
                  <p className="text-sm font-body leading-relaxed break-words whitespace-pre-wrap">
                    {msg.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-space-600/50">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 bg-space-800 border border-space-600 rounded-lg overflow-hidden focus-within:border-accent-cyan/50 transition-colors">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              className="w-full bg-transparent text-white text-sm font-body px-3 py-2.5 resize-none focus:outline-none placeholder-gray-600"
              rows={1}
              style={{ maxHeight: "100px" }}
            />
          </div>

          {/* File upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="control-btn control-btn-active flex-shrink-0"
            title="Attach file"
          >
            {uploading ? (
              <svg className="animate-spin h-4 w-4 text-accent-cyan" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <span>📎</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="*/*"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="control-btn bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/30 disabled:opacity-40 flex-shrink-0"
            title="Send message"
          >
            <span className="text-accent-cyan text-sm">➤</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
