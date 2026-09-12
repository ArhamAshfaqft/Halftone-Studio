import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ViewMode, StudioSettings } from '../types';
import { Columns, Search, RefreshCw, Maximize2, Square, Upload } from 'lucide-react';
import { CMYKPlates } from '../engine/cmykSeparation';
import { drawGarmentBase, drawClothFolds, applyPrintMaterialBlending } from '../engine/fabricTexture';

interface ViewportProps {
  originalImage: HTMLImageElement | null;
  halftoneData: ImageData | null;
  underbaseData: ImageData | null;
  cmykPlates: CMYKPlates | null;
  settings: StudioSettings;
  onSettingsChange?: (s: Partial<StudioSettings>) => void;
  onOpenFile?: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isProcessing: boolean;
  resetTrigger?: number;
}

export const Viewport: React.FC<ViewportProps> = ({
  originalImage,
  halftoneData,
  underbaseData,
  cmykPlates,
  settings,
  onSettingsChange,
  onOpenFile,
  zoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  isProcessing,
  resetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Pan state (infinite 2D plane coordinates)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Split view state
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitPos, setSplitPos] = useState(0.5); // 0.0 to 1.0 relative to image width
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Loupe magnifier state
  const [loupeEnabled, setLoupeEnabled] = useState(false);
  const [mouseScreenPos, setMouseScreenPos] = useState<{ x: number; y: number } | null>(null);

  // Fit to screen calculation (works for both small and massive images)
  const fitToScreen = useCallback(() => {
    if (!originalImage || !containerRef.current) return;
    const cW = containerRef.current.clientWidth;
    const cH = containerRef.current.clientHeight;
    if (cW === 0 || cH === 0) return;

    const imgW = originalImage.naturalWidth;
    const imgH = originalImage.naturalHeight;

    // Available space with 60px padding
    const padding = 80;
    const availW = Math.max(100, cW - padding * 2);
    const availH = Math.max(100, cH - padding * 2);

    // Calculate fit zoom
    const fitZoom = Math.min(availW / imgW, availH / imgH);
    // Clamp zoom: small images scale up nicely, large images scale down
    const targetZoom = Math.max(0.1, Math.min(fitZoom, 4.0));

    onZoomChange(targetZoom);
    setPan({
      x: (cW - imgW * targetZoom) / 2,
      y: (cH - imgH * targetZoom) / 2,
    });
  }, [originalImage, onZoomChange]);

  // Initial fit when image loads or changes, or reset trigger fired
  useEffect(() => {
    fitToScreen();
  }, [originalImage, resetTrigger, fitToScreen]);

  // Window resize listener to re-center if container dimensions change
  useEffect(() => {
    const handleResize = () => {
      // Keep view intact or fit if out of bounds
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas || !originalImage) return;

    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Garment background renderer
    const drawGarmentBg = (targetCtx: CanvasRenderingContext2D) => {
      if (!settings.showGarmentBox) return;

      drawGarmentBase(
        targetCtx,
        width,
        height,
        settings.garmentColor,
        settings.garmentTexture,
        settings.garmentTextureOpacity
      );

      if (settings.garmentFolds) {
        drawClothFolds(targetCtx, width, height, settings.garmentFoldIntensity);
      }
    };

    // Draw individual layer
    const drawMode = (targetCtx: CanvasRenderingContext2D, mode: ViewMode) => {
      if (mode === 'artwork') {
        targetCtx.drawImage(originalImage, 0, 0);
      } else if (mode === 'underbase' && underbaseData) {
        targetCtx.fillStyle = '#0B0D11';
        targetCtx.fillRect(0, 0, width, height);
        const temp = document.createElement('canvas');
        temp.width = width;
        temp.height = height;
        temp.getContext('2d')?.putImageData(underbaseData, 0, 0);
        targetCtx.drawImage(temp, 0, 0);
      } else if (mode === 'garment') {
        drawGarmentBg(targetCtx);

        if (settings.underbaseEnabled && underbaseData) {
          const ubTemp = document.createElement('canvas');
          ubTemp.width = width;
          ubTemp.height = height;
          ubTemp.getContext('2d')?.putImageData(underbaseData, 0, 0);
          targetCtx.save();
          targetCtx.globalAlpha = settings.underbaseDensity / 100;
          targetCtx.drawImage(ubTemp, 0, 0);
          targetCtx.restore();
        }

        if (settings.cmykMode && cmykPlates) {
          const compTemp = document.createElement('canvas');
          compTemp.width = width;
          compTemp.height = height;
          compTemp.getContext('2d')?.putImageData(cmykPlates.composite, 0, 0);
          targetCtx.drawImage(compTemp, 0, 0);
        } else if (halftoneData) {
          const htTemp = document.createElement('canvas');
          htTemp.width = width;
          htTemp.height = height;
          htTemp.getContext('2d')?.putImageData(halftoneData, 0, 0);
          targetCtx.drawImage(htTemp, 0, 0);
        }

        // Apply natural cloth fold shading & fabric weave texture OVER print ink
        applyPrintMaterialBlending(
          targetCtx,
          width,
          height,
          settings.garmentFolds,
          settings.garmentFoldIntensity,
          settings.garmentTexture,
          settings.garmentTextureOpacity
        );
      } else if (mode === 'cmyk' && cmykPlates) {
        const plate = cmykPlates[settings.cmykActiveChannel] || cmykPlates.composite;
        const temp = document.createElement('canvas');
        temp.width = width;
        temp.height = height;
        temp.getContext('2d')?.putImageData(plate, 0, 0);
        targetCtx.drawImage(temp, 0, 0);
      } else {
        // Halftone Separation mode
        if (halftoneData) {
          const htTemp = document.createElement('canvas');
          htTemp.width = width;
          htTemp.height = height;
          htTemp.getContext('2d')?.putImageData(halftoneData, 0, 0);
          targetCtx.drawImage(htTemp, 0, 0);
        } else {
          targetCtx.drawImage(originalImage, 0, 0);
        }
      }
    };

    // Split View vs Single View
    if (splitEnabled) {
      const splitX = width * splitPos;

      // Left: Original
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();
      drawMode(ctx, 'artwork');
      ctx.restore();

      // Right: Processed
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();
      drawMode(ctx, viewMode);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(1, 2 / zoom);
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();
    } else {
      drawMode(ctx, viewMode);
    }
  }, [
    originalImage,
    halftoneData,
    underbaseData,
    cmykPlates,
    settings,
    viewMode,
    splitEnabled,
    splitPos,
    zoom
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Loupe Magnifier rendering
  useEffect(() => {
    if (!loupeEnabled || !mouseScreenPos || !mainCanvasRef.current || !loupeCanvasRef.current || !containerRef.current) return;
    const lCanvas = loupeCanvasRef.current;
    const lCtx = lCanvas.getContext('2d');
    const mainCanvas = mainCanvasRef.current;
    if (!lCtx) return;

    const size = 180;
    lCanvas.width = size;
    lCanvas.height = size;

    const cRect = containerRef.current.getBoundingClientRect();
    const relX = mouseScreenPos.x - cRect.left;
    const relY = mouseScreenPos.y - cRect.top;

    // Accurate image coordinate translation
    const imgX = (relX - pan.x) / zoom;
    const imgY = (relY - pan.y) / zoom;

    lCtx.clearRect(0, 0, size, size);
    lCtx.save();
    // Circular clip
    lCtx.beginPath();
    lCtx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    lCtx.clip();

    lCtx.fillStyle = '#0F1218';
    lCtx.fillRect(0, 0, size, size);

    const mag = 4;
    const srcW = size / (zoom * mag);
    const srcH = size / (zoom * mag);

    lCtx.imageSmoothingEnabled = false; // Pixel dot clarity
    lCtx.drawImage(
      mainCanvas,
      imgX - srcW / 2,
      imgY - srcH / 2,
      srcW,
      srcH,
      0,
      0,
      size,
      size
    );

    // Crosshairs
    lCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    lCtx.lineWidth = 1;
    lCtx.beginPath();
    lCtx.moveTo(size / 2, 0);
    lCtx.lineTo(size / 2, size);
    lCtx.moveTo(0, size / 2);
    lCtx.lineTo(size, size / 2);
    lCtx.stroke();
    lCtx.restore();

    // Metallic border ring
    lCtx.strokeStyle = '#2563EB';
    lCtx.lineWidth = 3;
    lCtx.beginPath();
    lCtx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    lCtx.stroke();
  }, [loupeEnabled, mouseScreenPos, zoom, pan]);

  // Focal-Point Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const cRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - cRect.left;
    const mouseY = e.clientY - cRect.top;

    // Zoom multiplier
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(32.0, Math.max(0.05, zoom * factor));
    const k = newZoom / zoom;

    // Zoom centered towards mouse cursor
    setPan({
      x: mouseX - (mouseX - pan.x) * k,
      y: mouseY - (mouseY - pan.y) * k,
    });
    onZoomChange(newZoom);
  };

  // Mouse Pan & Split Divider dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !originalImage) return;

    const cRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - cRect.left;

    // Check if clicking near Split Divider
    if (splitEnabled) {
      const dividerScreenX = pan.x + originalImage.naturalWidth * splitPos * zoom;
      if (Math.abs(mouseX - dividerScreenX) < 18) {
        setIsDraggingSplit(true);
        return;
      }
    }

    // Left click or middle click pans the canvas
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseScreenPos({ x: e.clientX, y: e.clientY });

    if (isDraggingSplit && containerRef.current && originalImage) {
      const cRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - cRect.left;
      const newPos = (mouseX - pan.x) / (originalImage.naturalWidth * zoom);
      setSplitPos(Math.max(0.01, Math.min(0.99, newPos)));
      return;
    }

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  if (!originalImage) {
    return (
      <div
        ref={containerRef}
        className="flex-1 h-[calc(100vh-3.5rem)] relative bg-studio-bg overflow-hidden flex items-center justify-center p-6 select-none"
      >
        <div
          onClick={onOpenFile}
          className="flex flex-col items-center justify-center max-w-md w-full p-12 border-2 border-dashed border-studio-border hover:border-studio-accent rounded-sm cursor-pointer transition-all bg-studio-panel/40 hover:bg-studio-panel/75 group text-center"
        >
          <div className="w-14 h-14 rounded-sm bg-studio-card flex items-center justify-center border border-studio-border mb-4 group-hover:border-studio-accent transition-colors shadow-sm">
            <Upload className="w-6 h-6 text-studio-muted group-hover:text-studio-accent transition-colors" />
          </div>
          <h3 className="text-sm font-semibold text-studio-text mb-1.5 tracking-wider uppercase">
            Open Artwork File
          </h3>
          <p className="text-xs text-studio-muted mb-4 leading-relaxed max-w-xs">
            Drag and drop your graphic here, or click to browse files
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-studio-muted/70 bg-studio-card/80 px-2.5 py-1 rounded-sm border border-studio-border">
            <span>PNG</span>
            <span>·</span>
            <span>JPG</span>
            <span>·</span>
            <span>WEBP</span>
            <span>·</span>
            <span>TIFF</span>
          </div>
          <span className="text-[10px] text-studio-muted/50 mt-3 font-mono">
            Transparent PNG recommended for DTF & Screen Printing
          </span>
        </div>
      </div>
    );
  }

  const imgW = originalImage.naturalWidth;
  const imgH = originalImage.naturalHeight;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex-1 h-[calc(100vh-3.5rem)] relative bg-studio-bg overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-200"
      style={{
        backgroundColor: viewMode === 'garment' && !settings.showGarmentBox ? settings.garmentColor : undefined,
      }}
    >
      {/* Top View Mode Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-studio-panel/90 backdrop-blur border border-studio-border p-1 rounded-sm text-xs shadow-xl">
        {(
          [
            { id: 'artwork', label: 'Artwork' },
            { id: 'halftone', label: 'Halftone Separation' },
            { id: 'underbase', label: 'White Underbase' },
            { id: 'garment', label: 'Garment Mockup' },
            ...(settings.cmykMode ? [{ id: 'cmyk' as ViewMode, label: 'CMYK Plates' }] : []),
          ] as { id: ViewMode; label: string }[]
        ).map((m) => (
          <button
            key={m.id}
            onClick={() => onViewModeChange(m.id)}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${
              viewMode === m.id
                ? 'bg-studio-accent text-white font-semibold'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-hover'
            }`}
          >
            {m.label}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-studio-border mx-1" />

        {/* Split View Toggle */}
        <button
          onClick={() => setSplitEnabled(!splitEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors ${
            splitEnabled
              ? 'bg-studio-accent text-white'
              : 'text-studio-muted hover:text-studio-text hover:bg-studio-hover'
          }`}
          title="Toggle Split Comparison"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split</span>
        </button>

        {/* Loupe Magnifier Toggle */}
        <button
          onClick={() => setLoupeEnabled(!loupeEnabled)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors ${
            loupeEnabled
              ? 'bg-studio-accent text-white'
              : 'text-studio-muted hover:text-studio-text hover:bg-studio-hover'
          }`}
          title="Toggle 4x Loupe Dot Inspector"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Loupe</span>
        </button>

        {/* Garment / Artboard Box Toggle */}
        {onSettingsChange && (
          <button
            onClick={() => onSettingsChange({ showGarmentBox: !settings.showGarmentBox })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors ${
              settings.showGarmentBox
                ? 'bg-studio-accent text-white font-semibold'
                : 'text-studio-muted hover:text-studio-text hover:bg-studio-hover'
            }`}
            title="Toggle Artboard & Garment Box Boundary"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Box: {settings.showGarmentBox ? 'On' : 'Off'}</span>
          </button>
        )}
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-4 right-5 z-20 flex items-center gap-2 bg-studio-panel/90 border border-studio-border px-3 py-1.5 rounded-sm text-xs text-studio-text shadow">
          <RefreshCw className="w-3.5 h-3.5 text-studio-accent animate-spin" />
          <span>Rasterizing Dots...</span>
        </div>
      )}

      {/* Infinite Canvas Viewport Plane */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {/* Exact Pixel Resolution Artboard (Zero distortion, zero stretching) */}
        <div
          className={`relative transition-all duration-150 ${
            settings.showGarmentBox
              ? `shadow-2xl border border-studio-border ${viewMode !== 'garment' ? 'bg-transparency-grid' : ''}`
              : ''
          }`}
          style={{
            width: `${imgW}px`,
            height: `${imgH}px`,
          }}
        >
          <canvas
            ref={mainCanvasRef}
            width={imgW}
            height={imgH}
            style={{
              width: `${imgW}px`,
              height: `${imgH}px`,
              display: 'block',
              imageRendering: zoom > 2 ? 'pixelated' : 'auto',
            }}
          />
        </div>
      </div>

      {/* Floating Loupe Inspector */}
      {loupeEnabled && mouseScreenPos && (
        <div
          className="pointer-events-none fixed z-50 rounded-full overflow-hidden shadow-2xl border-2 border-studio-border"
          style={{
            left: mouseScreenPos.x + 20,
            top: mouseScreenPos.y - 90,
          }}
        >
          <canvas ref={loupeCanvasRef} className="block w-[180px] h-[180px]" />
        </div>
      )}

      {/* Bottom HUD: Status & Infinite Canvas Fit Controls */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-3 text-[11px] text-studio-muted font-mono bg-studio-panel/85 px-3 py-1.5 border border-studio-border rounded-sm shadow-md">
        <span>Infinite Canvas</span>
        <span>·</span>
        <span>Scroll to Zoom</span>
        <span>·</span>
        <span>Drag to Pan</span>
        {splitEnabled && (
          <>
            <span>·</span>
            <span className="text-studio-accent">Drag Divider</span>
          </>
        )}
      </div>

      {/* Bottom Right: Quick Fit to Screen Button */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-studio-panel/85 p-1 border border-studio-border rounded-sm shadow-md text-xs">
        <button
          onClick={fitToScreen}
          className="flex items-center gap-1 px-2.5 py-1 text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-sm font-medium transition-colors"
          title="Fit Artwork to Screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit Screen</span>
        </button>
        <button
          onClick={() => {
            if (!originalImage || !containerRef.current) return;
            const cW = containerRef.current.clientWidth;
            const cH = containerRef.current.clientHeight;
            onZoomChange(1.0);
            setPan({
              x: (cW - originalImage.naturalWidth) / 2,
              y: (cH - originalImage.naturalHeight) / 2,
            });
          }}
          className="px-2 py-1 text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-sm font-mono text-[11px] transition-colors"
          title="100% Actual Size"
        >
          100%
        </button>
      </div>
    </div>
  );
};
