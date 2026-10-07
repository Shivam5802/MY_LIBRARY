import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Crop,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
  aspectRatio?: number; // default 1 (square avatar)
  title?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 1,
  title = 'Crop & Adjust Profile Photo',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset transforms whenever a new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture release fails
      }
    }
  };

  // Wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(0.5, prev + zoomDelta), 3.5));
  };

  // Perform Final Canvas Export
  const handleApplyCrop = useCallback(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const outputSize = 400; // High-resolution avatar 400x400
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize / aspectRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Container / Viewport dimensions
    const viewportBox = containerRef.current?.getBoundingClientRect();
    const viewportWidth = viewportBox ? viewportBox.width : 280;
    const viewportHeight = viewportBox ? viewportBox.height : 280;

    // Center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale factors: map preview display to export canvas
    const scaleFactor = canvas.width / viewportWidth;
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Calculate image base display dimensions to preserve aspect ratio
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let baseWidth = viewportWidth;
    let baseHeight = viewportHeight;

    if (imgAspect > 1) {
      // Landscape: fit height or width
      baseWidth = viewportHeight * imgAspect;
      baseHeight = viewportHeight;
    } else {
      // Portrait
      baseWidth = viewportWidth;
      baseHeight = viewportWidth / imgAspect;
    }

    // Translate by user pan offset (scaled)
    const drawX = (pan.x / zoom) - (baseWidth / 2);
    const drawY = (pan.y / zoom) - (baseHeight / 2);

    ctx.drawImage(img, drawX, drawY, baseWidth, baseHeight);

    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedBase64);
    onClose();
  }, [pan, zoom, rotation, aspectRatio, onCropComplete, onClose]);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag to reposition • Scroll or use slider to zoom • Rotate as needed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 select-none">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-indigo-500/80 shadow-inner bg-slate-900 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none ring-8 ring-indigo-500/10"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={() => setImageLoaded(true)}
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                maxWidth: 'none',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              className="max-w-none opacity-90 object-contain"
            />

            {/* Circular Grid Guides */}
            <div className="absolute inset-0 pointer-events-none rounded-full border border-white/30 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white text-xs">
                Loading photo...
              </div>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 font-medium flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3" /> Circular avatar preview (400×400)
          </span>
        </div>

        {/* Controls Bar */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900">
          {/* Zoom Control */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-mono text-slate-500 w-10 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Rotation & Reset Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRotation((prev) => prev - 90)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                title="Rotate Left 90°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">-90°</span>
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => prev + 90)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                title="Rotate Right 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                title="Reset Position & Zoom"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
