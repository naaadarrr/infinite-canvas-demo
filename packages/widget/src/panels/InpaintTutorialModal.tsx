import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, LayoutGrid, Paintbrush, Eraser, Undo2, Redo2, Plus, Crown } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';

type InpaintMode = 'replace' | 'add' | 'remove';
type MaskTool = 'brush' | 'eraser';

interface DrawAction {
  type: 'draw' | 'erase';
  points: { x: number; y: number }[];
  brushSizeRatio: number;
}

const MODES: InpaintMode[] = ['replace', 'add', 'remove'];
const MODE_LABELS: Record<InpaintMode, string> = {
  replace: 'Replace',
  add: 'Add',
  remove: 'Remove',
};

const TUTORIAL_IMAGE_URLS: Record<InpaintMode, string> = {
  replace: 'https://d1735p3aqhycef.cloudfront.net/media/images/6CyC2di16mtui71H.png',
  add: 'https://d1735p3aqhycef.cloudfront.net/media/images/aZi4oVw_xYK4F8W5.png',
  remove: 'https://d1735p3aqhycef.cloudfront.net/media/images/z6tK697oh_R_3jo5.png',
};

const AUTO_CYCLE_MS = 3000;

// Brush size as ratio of image short side
const BRUSH_SIZE_MIN_RATIO = 0.01;
const BRUSH_SIZE_MAX_RATIO = 0.25;
const BRUSH_SIZE_DEFAULT_RATIO = 0.05;

interface InpaintTutorialModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFromBoard: () => void;
  onSubmit: (data: { imageUrl: string; prompt: string; maskTool: MaskTool; brushSize: number }) => void;
  credits?: number;
  /** When provided, the modal opens directly in editor view with this image pre-loaded */
  initialImageUrl?: string;
}

const footerBtnStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: 240,
  height: 44,
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background 120ms ease',
};

export function InpaintTutorialModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits = 15,
  initialImageUrl,
}: InpaintTutorialModalProps) {
  const [view, setView] = useState<'tutorial' | 'editor'>('tutorial');
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor state
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maskTool, setMaskTool] = useState<MaskTool>('brush');
  const [brushSizeRatio, setBrushSizeRatio] = useState(BRUSH_SIZE_DEFAULT_RATIO);

  // Cursor state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isOverCanvas, setIsOverCanvas] = useState(false);

  // Canvas refs — four canvases per spec
  const canvasRef = useRef<HTMLCanvasElement>(null);       // visible: source image
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);   // visible: yellow mask overlay
  const cacheCanvasRef = useRef<HTMLCanvasElement>(null);  // offscreen: confirmed strokes
  const strokeCanvasRef = useRef<HTMLCanvasElement>(null); // offscreen: current stroke

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<DrawAction[]>([]);
  const historyIndexRef = useRef(-1);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const maskToolRef = useRef<MaskTool>('brush');
  const brushSizeRatioRef = useRef(BRUSH_SIZE_DEFAULT_RATIO);

  // Image natural dimensions + displayed canvas size for cursor scaling
  const imgNaturalSize = useRef({ w: 0, h: 0 });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  // Explicit pixel dimensions for the displayed canvas (like the reference MaskEditor).
  // Both canvases + wrapper use these exact values so getBoundingClientRect() is consistent.
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const centeringShellRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { maskToolRef.current = maskTool; }, [maskTool]);
  useEffect(() => { brushSizeRatioRef.current = brushSizeRatio; }, [brushSizeRatio]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);

  // Reset all state when modal opens/closes
  useEffect(() => {
    if (open) {
      if (initialImageUrl) {
        setView('editor');
        setImageUrl(initialImageUrl);
      } else {
        setView('tutorial');
        setImageUrl('');
      }
      setActiveIdx(0);
      setPrompt('');
      setMaskTool('brush');
      setBrushSizeRatio(BRUSH_SIZE_DEFAULT_RATIO);
      setIsOverCanvas(false);
      setIsDrawing(false);
      setHistory([]);
      setHistoryIndex(-1);
      setCanvasSize({ width: 0, height: 0 });
      historyRef.current = [];
      historyIndexRef.current = -1;
      currentPointsRef.current = [];
      lastPointRef.current = null;
    }
  }, [open, initialImageUrl]);

  // Auto-cycle tutorial images
  useEffect(() => {
    if (!open || view !== 'tutorial') return;
    timerRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % MODES.length);
    }, AUTO_CYCLE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, view]);

  // ── Canvas helpers ──────────────────────────────────────────────────────────

  const getBrushSizePx = useCallback((ratio: number): number => {
    const { w, h } = imgNaturalSize.current;
    const shortSide = Math.min(w, h);
    return Math.max(1, shortSide * ratio);
  }, []);

  /**
   * Convert a mouse event's viewport coords into canvas buffer pixel coords.
   * Always uses maskCanvasRef.getBoundingClientRect() — the element that
   * actually receives the pointer events — so cursor and paint land at the
   * same spot.
   */
  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return { x: 0, y: 0 };
    // getBoundingClientRect() gives the canvas's actual on-screen rect,
    // accounting for any CSS scaling applied by maxWidth/maxHeight.
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  * maskCanvas.width;
    const y = (e.clientY - rect.top)  / rect.height * maskCanvas.height;
    return { x, y };
  }, []);

  const clearStrokeCanvas = useCallback(() => {
    const sc = strokeCanvasRef.current;
    if (!sc) return;
    const ctx = sc.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, sc.width, sc.height);
  }, []);

  const drawStrokePoint = useCallback((point: { x: number; y: number }) => {
    const sc = strokeCanvasRef.current;
    if (!sc) return;
    const ctx = sc.getContext('2d');
    if (!ctx) return;
    const radius = getBrushSizePx(brushSizeRatioRef.current) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [getBrushSizePx]);

  const drawStrokeSegment = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const sc = strokeCanvasRef.current;
    if (!sc) return;
    const ctx = sc.getContext('2d');
    if (!ctx) return;
    const lineWidth = getBrushSizePx(brushSizeRatioRef.current);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }, [getBrushSizePx]);

  const renderToMask = useCallback((includeCurrentStroke: boolean) => {
    const maskCanvas = maskCanvasRef.current;
    const cacheCanvas = cacheCanvasRef.current;
    const strokeCanvas = strokeCanvasRef.current;
    if (!maskCanvas || !cacheCanvas || !strokeCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = maskCanvas;

    // Build a temporary canvas: cache + optional current stroke
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) return;

    // Draw confirmed strokes
    tmpCtx.drawImage(cacheCanvas, 0, 0);

    // Composite current stroke
    if (includeCurrentStroke) {
      const tool = maskToolRef.current;
      if (tool === 'brush') {
        tmpCtx.globalCompositeOperation = 'source-over';
      } else {
        tmpCtx.globalCompositeOperation = 'destination-out';
      }
      tmpCtx.drawImage(strokeCanvas, 0, 0);
      tmpCtx.globalCompositeOperation = 'source-over';
    }

    // Render yellow semi-transparent mask onto maskCanvas
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(tmpCanvas, 0, 0);
    ctx.restore();
  }, []);

  const rebuildCache = useCallback(() => {
    const cacheCanvas = cacheCanvasRef.current;
    if (!cacheCanvas) return;
    const ctx = cacheCanvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = cacheCanvas;
    ctx.clearRect(0, 0, width, height);

    const hist = historyRef.current;
    const idx = historyIndexRef.current;

    for (let i = 0; i <= idx; i++) {
      const action = hist[i];
      if (!action || action.points.length === 0) continue;

      const bpx = getBrushSizePx(action.brushSizeRatio);

      if (action.type === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.fillStyle = '#000';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = bpx;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw first point as circle
      ctx.beginPath();
      ctx.arc(action.points[0].x, action.points[0].y, bpx / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw segments
      if (action.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let j = 1; j < action.points.length; j++) {
          ctx.lineTo(action.points[j].x, action.points[j].y);
        }
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }, [getBrushSizePx]);

  // Rebuild cache + re-render mask when historyIndex changes
  useEffect(() => {
    if (view !== 'editor') return;
    rebuildCache();
    renderToMask(false);
  }, [historyIndex, view, rebuildCache, renderToMask]);

  // ── Canvas initialization ───────────────────────────────────────────────────

  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const calculateAndInitCanvas = useCallback((img: HTMLImageElement) => {
    const shell = centeringShellRef.current;
    if (!shell) return;

    const containerWidth = shell.clientWidth;
    const containerHeight = shell.clientHeight;

    let displayWidth = img.naturalWidth;
    let displayHeight = img.naturalHeight;

    // Scale down to fit container width
    if (displayWidth > containerWidth) {
      const scale = containerWidth / displayWidth;
      displayWidth = containerWidth;
      displayHeight = img.naturalHeight * scale;
    }
    // Scale down to fit container height
    if (displayHeight > containerHeight) {
      const scale = containerHeight / displayHeight;
      displayHeight = containerHeight;
      displayWidth = displayWidth * scale;
    }

    const newWidth = Math.round(displayWidth);
    const newHeight = Math.round(displayHeight);

    setCanvasSize({ width: newWidth, height: newHeight });

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    imgNaturalSize.current = { w, h };

    // Set all four canvases to image natural dimensions (internal resolution)
    [canvasRef, maskCanvasRef, cacheCanvasRef, strokeCanvasRef].forEach((ref) => {
      if (ref.current) {
        ref.current.width = w;
        ref.current.height = h;
      }
    });

    const imgCtx = canvasRef.current?.getContext('2d');
    if (imgCtx) {
      imgCtx.clearRect(0, 0, w, h);
      imgCtx.drawImage(img, 0, 0, w, h);
    }

    [maskCanvasRef, cacheCanvasRef, strokeCanvasRef].forEach((ref) => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, w, h);
    });
  }, []);

  const initCanvas = useCallback(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;
      calculateAndInitCanvas(img);
    };
    img.src = imageUrl;
  }, [imageUrl, calculateAndInitCanvas]);

  useEffect(() => {
    if (view === 'editor' && imageUrl) {
      initCanvas();
    }
  }, [view, imageUrl, initCanvas]);

  // ── Mouse event handlers ────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    currentPointsRef.current = [coords];
    lastPointRef.current = coords;
    clearStrokeCanvas();
    drawStrokePoint(coords);
    renderToMask(true);
  }, [getCanvasCoords, clearStrokeCanvas, drawStrokePoint, renderToMask]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update cursor position
    setMousePos({ x: e.clientX, y: e.clientY });

    if (!isDrawingRef.current) return;

    const coords = getCanvasCoords(e);
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      drawStrokeSegment(lastPoint, coords);
      renderToMask(true);
    }
    currentPointsRef.current.push(coords);
    lastPointRef.current = coords;
  }, [getCanvasCoords, drawStrokeSegment, renderToMask]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;

    const points = [...currentPointsRef.current];
    const tool = maskToolRef.current;
    const ratio = brushSizeRatioRef.current;

    if (points.length > 0) {
      const action: DrawAction = {
        type: tool === 'brush' ? 'draw' : 'erase',
        points,
        brushSizeRatio: ratio,
      };

      setHistory((prev) => {
        // Truncate any redo history
        const truncated = prev.slice(0, historyIndexRef.current + 1);
        const next = [...truncated, action];
        historyRef.current = next;
        return next;
      });
      setHistoryIndex((prev) => {
        const next = prev + 1;
        historyIndexRef.current = next;
        return next;
      });
    }

    setIsDrawing(false);
    isDrawingRef.current = false;
    currentPointsRef.current = [];
    lastPointRef.current = null;
    clearStrokeCanvas();
  }, [clearStrokeCanvas]);

  const handleUndo = useCallback(() => {
    setHistoryIndex((prev) => {
      const next = Math.max(-1, prev - 1);
      historyIndexRef.current = next;
      return next;
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryIndex((prev) => {
      const max = historyRef.current.length - 1;
      const next = Math.min(max, prev + 1);
      historyIndexRef.current = next;
      return next;
    });
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // ── File handling ───────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setView('editor');
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    historyIndexRef.current = -1;
    e.target.value = '';
  }, []);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearImage = useCallback(() => {
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
    setPrompt('');
    setView('tutorial');
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, [imageUrl]);

  const handleSubmit = useCallback(() => {
    if (!imageUrl || !prompt.trim()) return;
    onSubmit({ imageUrl, prompt, maskTool, brushSize: getBrushSizePx(brushSizeRatio) });
  }, [imageUrl, prompt, maskTool, brushSizeRatio, getBrushSizePx, onSubmit]);

  const activeMode = MODES[activeIdx];

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % MODES.length);
    }, AUTO_CYCLE_MS);
  }, []);

  const brushCursorPx = (() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !canvasSize.width) return 20;
    const brushSizePx = getBrushSizePx(brushSizeRatio);
    return Math.max(4, (brushSizePx / maskCanvas.width) * canvasSize.width);
  })();

  // ── Tutorial view ──────────────────────────────────────────────────────────
  if (view === 'tutorial') {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <ImmersiveModal
          open={open}
          title="AI Image Inpainter"
          subtitle="Modify or reimagine elements of your image with simple brush strokes."
          onClose={onClose}
          maxWidth={1800}
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
              <button
                type="button"
                onClick={triggerUpload}
                style={{ ...footerBtnStyle, background: '#fff', color: '#000' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                <Upload size={16} />
                Upload
              </button>
              <button
                type="button"
                onClick={onSelectFromBoard}
                style={footerBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              >
                <LayoutGrid size={16} />
                Select from Board
              </button>
            </div>
          }
        >
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            padding: '8px 0 20px',
            minHeight: 0,
            marginTop: 24,
          }}>
            {/* Pill indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {MODES.map((mode, i) => {
                const isActive = i === activeIdx;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setActiveIdx(i); resetTimer(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 32,
                      padding: '0 16px',
                      borderRadius: 20,
                      border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'background 150ms ease, color 150ms ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                );
              })}
            </div>

            {/* Tutorial image — fixed 16:9 container matching Upscale modals */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: 720, aspectRatio: '16 / 9' }}>
                <img
                  key={activeMode}
                  src={TUTORIAL_IMAGE_URLS[activeMode]}
                  alt={`${activeMode} tutorial`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 16,
                  }}
                />
              </div>
            </div>
          </div>
        </ImmersiveModal>
      </>
    );
  }

  // ── Editor view ────────────────────────────────────────────────────────────
  const canSubmit = !!imageUrl && prompt.trim().length > 0;

  const maskBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: active ? 'rgba(88,87,253,0.3)' : 'transparent',
    color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 100ms ease',
  });

  const iconBtnStyle = (enabled: boolean): React.CSSProperties => ({
    ...maskBtnStyle(false),
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? 'pointer' : 'default',
  });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <ImmersiveModal
        open={open}
        title="AI Image Inpainter"
        onClose={onClose}
        maxWidth={1800}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                ...footerBtnStyle,
                maxWidth: 400,
                background: canSubmit ? '#3643FF' : 'rgba(255,255,255,0.08)',
                color: canSubmit ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: canSubmit ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <span>Generate</span>
              <div style={{ width: 1, height: 16, background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Crown size={16} color={canSubmit ? '#facc15' : 'currentColor'} />
                <span>{credits}</span>
              </div>
            </button>
          </div>
        }
      >
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          minHeight: 0,
          padding: '0 0 4px',
        }}>
          {/* Image + mask canvas area */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div
              ref={centeringShellRef}
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                handleMouseUp();
                setIsOverCanvas(false);
              }}
            >
              <canvas ref={cacheCanvasRef} style={{ display: 'none' }} />
              <canvas ref={strokeCanvasRef} style={{ display: 'none' }} />

              <div
                ref={canvasWrapperRef}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 16,
                  lineHeight: 0,
                  cursor: 'none',
                  width: canvasSize.width || 'auto',
                  height: canvasSize.height || 'auto',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    display: 'block',
                    width: canvasSize.width || '100%',
                    height: canvasSize.height || 'auto',
                    userSelect: 'none',
                  }}
                  draggable={false}
                />

                <canvas
                  ref={maskCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    display: 'block',
                    width: canvasSize.width || '100%',
                    height: canvasSize.height || 'auto',
                    userSelect: 'none',
                    cursor: 'none',
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={() => setIsOverCanvas(true)}
                  onMouseLeave={() => setIsOverCanvas(false)}
                />
              </div>
            </div>

            {isOverCanvas && canvasSize.width > 0 && (
              <div
                style={{
                  position: 'fixed',
                  left: mousePos.x - brushCursorPx / 2,
                  top: mousePos.y - brushCursorPx / 2,
                  width: brushCursorPx,
                  height: brushCursorPx,
                  borderRadius: '50%',
                  border: '2px solid #facc15',
                  backgroundColor: maskTool === 'brush' ? 'rgba(250,204,21,0.2)' : 'transparent',
                  pointerEvents: 'none',
                  zIndex: 200,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
            )}

            {/* Mask toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 12,
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.08)',
              alignSelf: 'center',
            }}>
              <button type="button" title="Brush" onClick={() => setMaskTool('brush')} style={maskBtnStyle(maskTool === 'brush')}>
                <Paintbrush size={16} />
              </button>
              <button type="button" title="Eraser" onClick={() => setMaskTool('eraser')} style={maskBtnStyle(maskTool === 'eraser')}>
                <Eraser size={16} />
              </button>
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />
              <input
                type="range"
                min={BRUSH_SIZE_MIN_RATIO * 1000}
                max={BRUSH_SIZE_MAX_RATIO * 1000}
                value={brushSizeRatio * 1000}
                onChange={(e) => setBrushSizeRatio(Number(e.target.value) / 1000)}
                style={{ width: 80, accentColor: '#5857FD', cursor: 'pointer' }}
              />
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />
              <button
                type="button"
                title="Undo"
                style={iconBtnStyle(canUndo)}
                onClick={canUndo ? handleUndo : undefined}
              >
                <Undo2 size={16} />
              </button>
              <button
                type="button"
                title="Redo"
                style={iconBtnStyle(canRedo)}
                onClick={canRedo ? handleRedo : undefined}
              >
                <Redo2 size={16} />
              </button>
            </div>
          </div>

          {/* Prompt input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            minHeight: 56,
          }}>
            <button
              type="button"
              onClick={triggerUpload}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 120ms ease, background 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <Plus size={18} />
            </button>
            <input
              type="text"
              placeholder="Describe what you want to change..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 14,
                lineHeight: '20px',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </ImmersiveModal>
    </>
  );
}
