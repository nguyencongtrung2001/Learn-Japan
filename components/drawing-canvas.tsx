"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Point {
  x: number;
  y: number;
  t: number;
}

interface Stroke {
  points: Point[];
}

interface DrawingCanvasProps {
  onCharacterSelected: (char: string) => void;
  selectedChar: string;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STROKE_COLOR = "#a5b4fc"; // indigo-light
const STROKE_COLOR_DISABLED = "#6b75a8"; // foreground-dim
const STROKE_WIDTH = 5;
const RECOGNIZE_DEBOUNCE_MS = 300; // Reduced from 600 for faster recognition

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DrawingCanvas({
  onCharacterSelected,
  selectedChar,
  disabled = false,
}: DrawingCanvasProps) {
  /* ---- Refs (performance-critical drawing state) ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const startTimeRef = useRef(0);
  const recognizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dimensionsRef = useRef({ width: 280, height: 280 });

  /* ---- State (triggers re-render for UI updates) ---- */
  const [strokeCount, setStrokeCount] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isActivelyDrawing, setIsActivelyDrawing] = useState(false);

  /* ================================================================ */
  /*  Canvas initialisation                                           */
  /* ================================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set logical size to match actual rendered size
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 280;
    const height = rect.height || 280;
    dimensionsRef.current = { width, height };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  /* ================================================================ */
  /*  Redraw all saved strokes (used after undo / clear)              */
  /* ================================================================ */
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensionsRef.current.width, dimensionsRef.current.height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 1) {
        ctx.beginPath();
        ctx.arc(
          stroke.points[0].x,
          stroke.points[0].y,
          STROKE_WIDTH / 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = STROKE_COLOR;
        ctx.fill();
        continue;
      }
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  }, []);

  /* ================================================================ */
  /*  Coordinate helper                                                */
  /* ================================================================ */
  const getPosition = useCallback(
    (e: MouseEvent | TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, t: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else {
        return { x: 0, y: 0, t: 0 };
      }

      const scaleX = dimensionsRef.current.width / rect.width;
      const scaleY = dimensionsRef.current.height / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
        t: Date.now() - startTimeRef.current,
      };
    },
    []
  );

  /* ================================================================ */
  /*  Handwriting recognition via Google Input Tools                   */
  /* ================================================================ */
  const recognizeStrokes = useCallback(async () => {
    const allStrokes = strokesRef.current;
    if (allStrokes.length === 0) return;
    setIsRecognizing(true);

    try {
      const ink = allStrokes.map((stroke) => {
        const xs = stroke.points.map((p) => Math.round(p.x));
        const ys = stroke.points.map((p) => Math.round(p.y));
        const ts = stroke.points.map((p) => p.t);
        return [xs, ys, ts];
      });

      const requestBody = {
        options: "enable_pre_space",
        requests: [
          {
            writing_guide: {
              writing_area_width: dimensionsRef.current.width,
              writing_area_height: dimensionsRef.current.height,
            },
            ink,
            pre_context: "",
            max_num_results: 10,
            max_completions: 0,
            language: "ja",
          },
        ],
      };

      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Google response format: ["SUCCESS", [["ja-t-i0-handwrit", ["か","が",...], [], {}]]]
      if (Array.isArray(data) && data[0] === "SUCCESS" && data[1]?.[0]?.[1]) {
        setCandidates(data[1][0][1]);
      }
    } catch (error) {
      console.error("Recognition failed:", error);
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  /* ================================================================ */
  /*  Drawing event handlers (use refs for performance)                */
  /* ================================================================ */
  const handleStart = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      if (!startTimeRef.current) startTimeRef.current = Date.now();

      const point = getPosition(e);
      isDrawingRef.current = true;
      currentPointsRef.current = [point];
      lastPointRef.current = point;
      setIsActivelyDrawing(true);

      if (recognizeTimeoutRef.current) {
        clearTimeout(recognizeTimeoutRef.current);
      }
    },
    [disabled, getPosition]
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || disabled) return;
      e.preventDefault();

      const point = getPosition(e);
      currentPointsRef.current.push(point);

      const canvas = canvasRef.current;
      if (!canvas || !lastPointRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.strokeStyle = disabled ? STROKE_COLOR_DISABLED : STROKE_COLOR;
      ctx.lineWidth = STROKE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      lastPointRef.current = point;
    },
    [disabled, getPosition]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsActivelyDrawing(false);
    lastPointRef.current = null;

    if (currentPointsRef.current.length > 0) {
      strokesRef.current = [
        ...strokesRef.current,
        { points: [...currentPointsRef.current] },
      ];
      currentPointsRef.current = [];
      setStrokeCount(strokesRef.current.length);

      // Debounce recognition
      if (recognizeTimeoutRef.current) {
        clearTimeout(recognizeTimeoutRef.current);
      }
      recognizeTimeoutRef.current = setTimeout(() => {
        recognizeStrokes();
      }, RECOGNIZE_DEBOUNCE_MS);
    }
  }, [recognizeStrokes]);

  /* ================================================================ */
  /*  Register native event listeners on the canvas                   */
  /* ================================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => handleStart(e);
    const onMouseMove = (e: MouseEvent) => handleMove(e);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => handleEnd();
    const onTouchStart = (e: TouchEvent) => handleStart(e);
    const onTouchMove = (e: TouchEvent) => handleMove(e);
    const onTouchEnd = () => handleEnd();

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  /* ================================================================ */
  /*  Clear / Undo actions                                            */
  /* ================================================================ */
  const handleClear = useCallback(() => {
    strokesRef.current = [];
    currentPointsRef.current = [];
    startTimeRef.current = 0;
    setStrokeCount(0);
    setCandidates([]);
    onCharacterSelected("");
    redrawCanvas();
  }, [onCharacterSelected, redrawCanvas]);

  const handleUndo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redrawCanvas();

    if (strokesRef.current.length > 0) {
      if (recognizeTimeoutRef.current) clearTimeout(recognizeTimeoutRef.current);
      recognizeTimeoutRef.current = setTimeout(() => {
        recognizeStrokes();
      }, 300);
    } else {
      setCandidates([]);
      onCharacterSelected("");
    }
  }, [recognizeStrokes, onCharacterSelected, redrawCanvas]);

  /* ================================================================ */
  /*  Cleanup timeout on unmount                                      */
  /* ================================================================ */
  useEffect(() => {
    return () => {
      if (recognizeTimeoutRef.current) clearTimeout(recognizeTimeoutRef.current);
    };
  }, []);

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */
  return (
    <div className="drawing-canvas-container">
      {/* Canvas wrapper with grid overlay */}
      <div
        className={`drawing-canvas-wrapper${
          isActivelyDrawing ? " is-drawing" : ""
        }${disabled ? " is-disabled" : ""}`}
      >
        <div className="canvas-grid" />

        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          style={{ touchAction: "none" }}
          id="drawing-canvas"
        />

        {/* Placeholder hint when canvas is empty */}
        {strokeCount === 0 && !isActivelyDrawing && (
          <div className="canvas-placeholder">
            <span className="canvas-placeholder-icon">✏️</span>
            <span className="canvas-placeholder-text">
              Vẽ ký tự tại đây
            </span>
          </div>
        )}

        {/* Recognising indicator */}
        {isRecognizing && (
          <div className="canvas-recognizing">
            <div className="recognizing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {/* Toolbar — Undo / Clear */}
      <div className="canvas-toolbar">
        <button
          type="button"
          onClick={handleUndo}
          disabled={strokeCount === 0 || disabled}
          className="canvas-tool-btn"
          title="Hoàn tác"
          id="canvas-undo-btn"
        >
          <span className="canvas-tool-icon">↩</span> Hoàn tác
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={strokeCount === 0 || disabled}
          className="canvas-tool-btn"
          title="Xóa tất cả"
          id="canvas-clear-btn"
        >
          <span className="canvas-tool-icon">✕</span> Xóa
        </button>
      </div>

      {/* Candidate bar — recognised character suggestions */}
      {candidates.length > 0 && (
        <div className="candidate-bar animate-fade-in" id="candidate-bar">
          <span className="candidate-label">Gợi ý:</span>
          <div className="candidate-list">
            {candidates.slice(0, 8).map((char, i) => (
              <button
                key={`${char}-${i}`}
                type="button"
                onClick={() => onCharacterSelected(char)}
                disabled={disabled}
                className={`candidate-item kana-display${
                  selectedChar === char ? " is-selected" : ""
                }`}
                id={`candidate-${i}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
