import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Grid } from 'lucide-react';
import { generateLpiTestSheet } from '../engine/lpiTestSheet';
import { canvasTo300DpiPng } from '../engine/pngDpi';

interface LpiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LpiModal: React.FC<LpiModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [testSheetCanvas, setTestSheetCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fullCanvas = generateLpiTestSheet();
    setTestSheetCanvas(fullCanvas);

    if (previewCanvasRef.current) {
      const pCtx = previewCanvasRef.current.getContext('2d');
      if (pCtx) {
        // Draw scaled down preview
        const pCanvas = previewCanvasRef.current;
        pCanvas.width = 480;
        pCanvas.height = 640;
        pCtx.drawImage(fullCanvas, 0, 0, pCanvas.width, pCanvas.height);
      }
    }
  }, [isOpen]);

  const handleExport = async () => {
    if (!testSheetCanvas) return;
    setIsExporting(true);
    try {
      const blob = await canvasTo300DpiPng(testSheetCanvas, 300);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Halftone_Studio_LPI_Calibration_Sheet_300DPI.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
      <div className="w-[560px] bg-studio-panel border border-studio-border rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-studio-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-studio-text uppercase flex items-center gap-2">
              <Grid className="w-4 h-4 text-studio-accent" />
              LPI Calibration Test Sheet
            </h2>
            <p className="text-xs text-studio-muted">
              Standard 15–75 LPI dot density grid at 300 DPI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center">
          <div className="border border-studio-border bg-white shadow p-2 rounded-sm mb-4">
            <canvas ref={previewCanvasRef} className="block w-[360px] h-[480px] object-contain" />
          </div>
          <p className="text-xs text-studio-muted text-center max-w-md mb-2">
            Print this calibration sheet on your DTF film or burn to silk screen. Examine dot hold with a 10x loupe to identify your printer's ideal LPI.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-studio-card/60 border-t border-studio-border flex justify-between items-center">
          <span className="text-[11px] font-mono text-studio-muted">
            1800 × 2400 px · 300 DPI Native
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-studio-muted hover:text-studio-text px-3 py-1.5"
            >
              Close
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="text-xs font-semibold text-white bg-studio-accent hover:bg-studio-accent-hover px-4 py-1.5 rounded-sm transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export Test Sheet (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
