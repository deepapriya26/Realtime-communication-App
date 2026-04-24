import { useRef, useState, useCallback, useEffect } from "react";

const useWhiteboard = (socket, roomId) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]); // Array of ImageData snapshots for undo

  const [tool, setTool] = useState("pen"); // pen | eraser | line | rect | circle
  const [color, setColor] = useState("#00d4ff");
  const [lineWidth, setLineWidth] = useState(3);

  // ─── Canvas Context Helper ────────────────────────────────────────────────
  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  // ─── Save Snapshot for Undo ───────────────────────────────────────────────
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(imageData);
    if (historyRef.current.length > 20) historyRef.current.shift(); // max 20 undos
  }, []);

  // ─── Drawing Functions ────────────────────────────────────────────────────
  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const drawLine = useCallback((ctx, from, to, drawColor, width, erase = false) => {
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = erase ? width * 4 : width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // ─── Mouse / Touch Event Handlers ─────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveSnapshot();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, [getPos, saveSnapshot]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    const currentPos = getPos(e, canvas);

    const drawData = {
      from: lastPos.current,
      to: currentPos,
      color,
      lineWidth,
      tool,
    };

    // Draw locally
    drawLine(ctx, drawData.from, drawData.to, color, lineWidth, tool === "eraser");

    // Emit to peers
    if (socket && roomId) {
      socket.emit("whiteboard-draw", { roomId, drawData });
    }

    lastPos.current = currentPos;
  }, [getCtx, getPos, drawLine, socket, roomId, color, lineWidth, tool]);

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
  }, []);

  // ─── Whiteboard Actions ───────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveSnapshot();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (socket && roomId) socket.emit("whiteboard-clear", { roomId });
  }, [socket, roomId, saveSnapshot]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    const prev = historyRef.current.pop();
    ctx.putImageData(prev, 0, 0);
    if (socket && roomId) socket.emit("whiteboard-undo", { roomId });
  }, [socket, roomId]);

  // ─── Receive Remote Drawing ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = ({ drawData }) => {
      const ctx = getCtx();
      if (!ctx) return;
      drawLine(ctx, drawData.from, drawData.to, drawData.color, drawData.lineWidth, drawData.tool === "eraser");
    };

    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("whiteboard-draw", handleRemoteDraw);
    socket.on("whiteboard-clear", handleRemoteClear);

    return () => {
      socket.off("whiteboard-draw", handleRemoteDraw);
      socket.off("whiteboard-clear", handleRemoteClear);
    };
  }, [socket, getCtx, drawLine]);

  // ─── Resize Canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      // Preserve drawing when resizing
      const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      canvas.getContext("2d").putImageData(imageData, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return {
    canvasRef,
    tool, setTool,
    color, setColor,
    lineWidth, setLineWidth,
    clearCanvas,
    undo,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};

export default useWhiteboard;
