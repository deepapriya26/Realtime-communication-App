import React from "react";
import useWhiteboard from "../../hooks/useWhiteboard";

const COLORS = [
  "#00d4ff", "#7c3aed", "#10b981", "#ef4444",
  "#f59e0b", "#ec4899", "#ffffff", "#64748b",
];

const LINE_WIDTHS = [2, 4, 8, 16];

const Whiteboard = ({ socket, roomId }) => {
  const {
    canvasRef,
    tool, setTool,
    color, setColor,
    lineWidth, setLineWidth,
    clearCanvas,
    undo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useWhiteboard(socket, roomId);

  return (
    <div className="h-full flex flex-col bg-space-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-space-900/80 border-b border-space-600/50 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {[
            { id: "pen", icon: "✏️", label: "Pen" },
            { id: "eraser", icon: "🧹", label: "Eraser" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              className={`px-3 py-1.5 rounded text-sm font-body transition-all ${
                tool === id
                  ? "bg-accent-cyan text-space-950 font-semibold"
                  : "bg-space-700 text-gray-400 hover:text-white"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-space-600" />

        {/* Color picker */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? "border-white scale-125" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom color */}
          <label className="relative cursor-pointer" title="Custom color">
            <div
              className="w-6 h-6 rounded-full border-2 border-dashed border-gray-500 hover:border-white transition-colors flex items-center justify-center text-xs"
            >
              +
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
            />
          </label>
        </div>

        <div className="w-px h-6 bg-space-600" />

        {/* Brush size */}
        <div className="flex items-center gap-1">
          {LINE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setLineWidth(w)}
              title={`${w}px`}
              className={`flex items-center justify-center w-8 h-8 rounded transition-all ${
                lineWidth === w ? "bg-space-600" : "hover:bg-space-700"
              }`}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: w + 4, height: w + 4, maxWidth: 20, maxHeight: 20 }}
              />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-space-600" />

        {/* Actions */}
        <button
          onClick={undo}
          className="btn-ghost text-sm px-3 py-1.5"
          title="Undo (last 20 steps)"
        >
          ↩ Undo
        </button>
        <button
          onClick={clearCanvas}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm px-3 py-1.5 rounded transition-colors"
          title="Clear canvas (synced to all)"
        >
          🗑 Clear
        </button>

        {/* Current color indicator */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 font-body">
          <div className="w-4 h-4 rounded-full border border-space-500" style={{ backgroundColor: color }} />
          <span>{tool} · {lineWidth}px</span>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden bg-white/[0.02]">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas absolute inset-0"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Empty state hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="text-center opacity-20">
            <div className="text-6xl mb-2">🖊️</div>
            <p className="font-display text-white text-sm tracking-wider">START DRAWING</p>
            <p className="font-body text-gray-400 text-xs mt-1">Synced in real-time with everyone</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
