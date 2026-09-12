import React, { useState } from 'react';
import { X } from 'lucide-react';
import JSZip from 'jszip';
import { StudioSettings } from '../types';
import { canvasTo300DpiPng } from '../engine/pngDpi';
import { CMYKPlates } from '../engine/cmykSeparation';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: HTMLImageElement | null;
  halftoneData: ImageData | null;
  underbaseData: ImageData | null;
  cmykPlates: CMYKPlates | null;
  settings: StudioSettings;
  fileName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  originalImage,
  halftoneData,
  underbaseData,
  cmykPlates,
  settings,
  fileName,
}) => {
  if (!isOpen || !originalImage) return null;

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const width = originalImage.naturalWidth;
  const height = originalImage.naturalHeight;

  // Helper to create a canvas from ImageData
  const createImgCanvas = (data: ImageData): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    c.getContext('2d')?.putImageData(data, 0, 0);
    return c;
  };

  // Helper to create garment mockup canvas
  const createMockupCanvas = (): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    // Garment background
    ctx.fillStyle = settings.garmentColor;
    ctx.fillRect(0, 0, width, height);

    // Underbase
    if (settings.underbaseEnabled && underbaseData) {
      const ubCanvas = createImgCanvas(underbaseData);
      ctx.save();
      ctx.globalAlpha = settings.underbaseDensity / 100;
      ctx.drawImage(ubCanvas, 0, 0);
      ctx.restore();
    }

    // Halftone
    if (halftoneData) {
      const htCanvas = createImgCanvas(halftoneData);
      ctx.drawImage(htCanvas, 0, 0);
    }
    return c;
  };

  // Download Blob trigger (works in both desktop Electron and browser)
  const triggerDownload = (blob: Blob, defaultFilename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export 300 DPI Halftone Separation
  const handleExportHalftone = async () => {
    if (!halftoneData) return;
    setIsExporting(true);
    setExportProgress('Encoding 300 DPI Halftone PNG...');
    try {
      const c = createImgCanvas(halftoneData);
      const blob = await canvasTo300DpiPng(c, 300);
      triggerDownload(blob, `${baseName}_Halftone_${settings.lpi}LPI_300DPI.png`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Choked White Underbase Mask
  const handleExportUnderbase = async () => {
    if (!underbaseData) return;
    setIsExporting(true);
    setExportProgress('Encoding 300 DPI White Underbase PNG...');
    try {
      const c = createImgCanvas(underbaseData);
      const blob = await canvasTo300DpiPng(c, 300);
      triggerDownload(blob, `${baseName}_WhiteUnderbase_Choke${settings.underbaseChoke}px_300DPI.png`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Client Garment Mockup
  const handleExportMockup = async () => {
    setIsExporting(true);
    setExportProgress('Rendering Garment Mockup PNG...');
    try {
      const c = createMockupCanvas();
      const blob = await canvasTo300DpiPng(c, 300);
      triggerDownload(blob, `${baseName}_Garment_Mockup.png`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export All-in-One Prepress ZIP Package
  const handleExportZipPackage = async () => {
    setIsExporting(true);
    setExportProgress('Generating Prepress Archive...');
    try {
      const zip = new JSZip();

      // 1. Halftone separation
      if (halftoneData) {
        setExportProgress('Adding Halftone Separation (300 DPI)...');
        const htCanvas = createImgCanvas(halftoneData);
        const htBlob = await canvasTo300DpiPng(htCanvas, 300);
        zip.file(`${baseName}_Halftone_${settings.lpi}LPI.png`, htBlob);
      }

      // 2. White Underbase
      if (settings.underbaseEnabled && underbaseData) {
        setExportProgress('Adding Choked White Underbase (300 DPI)...');
        const ubCanvas = createImgCanvas(underbaseData);
        const ubBlob = await canvasTo300DpiPng(ubCanvas, 300);
        zip.file(`${baseName}_White_Underbase_Choke${settings.underbaseChoke}px.png`, ubBlob);
      }

      // 3. Garment Mockup
      setExportProgress('Adding Client Mockup...');
      const mockupCanvas = createMockupCanvas();
      const mockupBlob = await canvasTo300DpiPng(mockupCanvas, 300);
      zip.file(`${baseName}_Garment_Mockup.png`, mockupBlob);

      // 4. CMYK Plates if enabled
      if (settings.cmykMode && cmykPlates) {
        setExportProgress('Adding CMYK Process Plates...');
        const cFolder = zip.folder('cmyk_plates');
        if (cFolder) {
          const cyanBlob = await canvasTo300DpiPng(createImgCanvas(cmykPlates.cyan), 300);
          const magBlob = await canvasTo300DpiPng(createImgCanvas(cmykPlates.magenta), 300);
          const yelBlob = await canvasTo300DpiPng(createImgCanvas(cmykPlates.yellow), 300);
          const blkBlob = await canvasTo300DpiPng(createImgCanvas(cmykPlates.black), 300);
          cFolder.file('01_Cyan_15deg.png', cyanBlob);
          cFolder.file('02_Magenta_75deg.png', magBlob);
          cFolder.file('03_Yellow_0deg.png', yelBlob);
          cFolder.file('04_Black_45deg.png', blkBlob);
        }
      }

      // 5. Prepress Specification Manifest
      const manifest = `=====================================================
HALFTONE STUDIO PRO — PREPRESS JOB SPECIFICATION
=====================================================
File Name:          ${fileName}
Dimensions:         ${width} x ${height} px
Target Resolution:  300 DPI (pHYs chunk embedded)
Physical Size:      ${(width / 300).toFixed(2)} x ${(height / 300).toFixed(2)} inches

SCREEN PARAMETERS:
- Dot Shape:        ${settings.shape.toUpperCase()}
- Frequency:        ${settings.lpi} LPI
- Screen Angle:     ${settings.angle} degrees
- Dot Scale:        ${settings.dotScale}x
- Edge Dot Fade:    ${settings.dotFade}%

UNDERBASE SPECIFICATIONS:
- Underbase Enabled: ${settings.underbaseEnabled ? 'YES' : 'NO'}
- Choke Radius:      ${settings.underbaseChoke} pixels (morphological erosion)
- Ink Density:       ${settings.underbaseDensity}%

GARMENT KNOCKOUT:
- Knockout Mode:     ${settings.knockoutMode.toUpperCase()}
- Garment Color:     ${settings.garmentColor}
- Micro-Dot Cleanup: ${settings.microDotCleanup ? 'ACTIVE' : 'INACTIVE'}

GENERATED BY HALFTONE STUDIO PRO PREPRESS SUITE
=====================================================`;
      zip.file('prepress_specifications.txt', manifest);

      setExportProgress('Compressing Package...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${baseName}_Prepress_Package.zip`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none">
      <div className="w-[520px] bg-studio-panel border border-studio-border rounded-sm shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-studio-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-studio-text uppercase">
              Prepress Export Suite
            </h2>
            <p className="text-xs text-studio-muted">
              Lossless 300 DPI PNG outputs compatible with all print RIPs
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3">
          {/* Option 1: Halftone Separation */}
          <div className="p-3.5 bg-studio-card border border-studio-border rounded-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-studio-text text-xs">
                  Halftone Print Separation
                </span>
                <span className="text-[10px] font-mono text-studio-accent bg-studio-panel px-1.5 py-0.5 border border-studio-border rounded-sm">
                  300 DPI PNG
                </span>
              </div>
              <p className="text-[11px] text-studio-muted">
                Separated dots at {settings.lpi} LPI with {settings.shape} screens and knockout applied.
              </p>
            </div>
            <button
              onClick={handleExportHalftone}
              disabled={isExporting}
              className="text-xs font-medium text-studio-text bg-studio-panel hover:bg-studio-hover border border-studio-border px-3 py-1.5 rounded-sm transition-colors"
            >
              Export
            </button>
          </div>

          {/* Option 2: White Underbase Mask */}
          {settings.underbaseEnabled && (
            <div className="p-3.5 bg-studio-card border border-studio-border rounded-sm flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-studio-text text-xs">
                    Choked White Underbase Mask
                  </span>
                  <span className="text-[10px] font-mono text-studio-accent bg-studio-panel px-1.5 py-0.5 border border-studio-border rounded-sm">
                    {settings.underbaseChoke}px Choke
                  </span>
                </div>
                <p className="text-[11px] text-studio-muted">
                  Pure white ink underlayer choked inward to prevent edge bleed on dark apparel.
                </p>
              </div>
              <button
                onClick={handleExportUnderbase}
                disabled={isExporting}
                className="text-xs font-medium text-studio-text bg-studio-panel hover:bg-studio-hover border border-studio-border px-3 py-1.5 rounded-sm transition-colors"
              >
                Export
              </button>
            </div>
          )}

          {/* Option 3: Garment Mockup */}
          <div className="p-3.5 bg-studio-card border border-studio-border rounded-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-studio-text text-xs">
                  Garment Mockup Preview
                </span>
                <span className="text-[10px] font-mono text-studio-muted bg-studio-panel px-1.5 py-0.5 border border-studio-border rounded-sm">
                  Client Proof
                </span>
              </div>
              <p className="text-[11px] text-studio-muted">
                Composite print simulated against {settings.garmentColor} shirt fabric texture.
              </p>
            </div>
            <button
              onClick={handleExportMockup}
              disabled={isExporting}
              className="text-xs font-medium text-studio-text bg-studio-panel hover:bg-studio-hover border border-studio-border px-3 py-1.5 rounded-sm transition-colors"
            >
              Export
            </button>
          </div>

          {/* Option 4: Full ZIP Package */}
          <div className="p-4 bg-studio-accent/10 border border-studio-accent/40 rounded-sm flex items-center justify-between mt-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-studio-text text-xs">
                  All-in-One Prepress Package
                </span>
                <span className="text-[10px] font-mono text-studio-accent bg-studio-panel px-1.5 py-0.5 border border-studio-border rounded-sm">
                  ZIP ARCHIVE
                </span>
              </div>
              <p className="text-[11px] text-studio-muted">
                Includes Halftone PNG, Underbase Mask, Garment Mockup, and Job Specs manifest.
              </p>
            </div>
            <button
              onClick={handleExportZipPackage}
              disabled={isExporting}
              className="text-xs font-semibold text-white bg-studio-accent hover:bg-studio-accent-hover px-4 py-2 rounded-sm transition-colors shadow-sm"
            >
              Export ZIP
            </button>
          </div>

          {/* Progress Indicator */}
          {isExporting && (
            <div className="text-center py-2 text-xs font-mono text-studio-accent">
              {exportProgress}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-studio-card/60 border-t border-studio-border flex justify-between items-center text-[11px] text-studio-muted font-mono">
          <span>Native 300 DPI pHYs Chunks Included</span>
          <button
            onClick={onClose}
            className="text-studio-muted hover:text-studio-text"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
