import React from 'react';
import { Upload, Download, Grid, RotateCcw, ZoomIn, ZoomOut, SlidersHorizontal, Key } from 'lucide-react';
import { Preset } from '../types';
import { DEFAULT_PRESETS } from '../presets';

interface HeaderProps {
  currentPresetId: string;
  onSelectPreset: (preset: Preset) => void;
  onOpenFile: () => void;
  onOpenExportModal: () => void;
  onOpenLpiModal: () => void;
  onOpenLicenseModal: () => void;
  isLicensed: boolean;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetView: () => void;
  fileName: string;
  imageDimensions: { width: number; height: number };
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  onOpenFile,
  onOpenExportModal,
  onOpenLpiModal,
  onOpenLicenseModal,
  isLicensed,
  zoom,
  onZoomChange,
  onResetView,
  fileName,
  imageDimensions,
}) => {
  return (
    <header className="h-14 bg-studio-panel border-b border-studio-border px-5 flex items-center justify-between select-none z-30">
      {/* Left: Branding & File Info */}
      <div className="flex items-center gap-6">
        <div>
          <span className="text-sm font-semibold tracking-wide text-studio-text">
            HALFTONE STUDIO
          </span>
        </div>

        {/* Loaded File Meta */}
        <div className="hidden md:flex items-center gap-3 text-xs text-studio-muted border-l border-studio-border pl-5">
          {fileName ? (
            <>
              <span className="truncate max-w-[180px] font-medium text-studio-text">
                {fileName}
              </span>
              {imageDimensions.width > 0 && (
                <span className="font-mono text-[11px] text-studio-muted bg-studio-card px-1.5 py-0.5 border border-studio-border rounded-sm">
                  {imageDimensions.width} × {imageDimensions.height} px · 300 DPI
                </span>
              )}
            </>
          ) : (
            <span className="font-mono text-[11px] text-studio-muted/60">
              No artwork loaded
            </span>
          )}
        </div>
      </div>

      {/* Center: Preset Selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-studio-card border border-studio-border rounded-sm px-2.5 py-1 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-studio-muted" />
          <span className="text-studio-muted">Preset:</span>
          <select
            value={currentPresetId}
            onChange={(e) => {
              const p = DEFAULT_PRESETS.find((pr) => pr.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="bg-transparent text-studio-text font-medium outline-none cursor-pointer text-xs pr-2"
          >
            {DEFAULT_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-studio-card text-studio-text">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center bg-studio-card border border-studio-border rounded-sm text-xs">
          <button
            onClick={() => onZoomChange(Math.max(0.1, zoom - 0.25))}
            className="p-1.5 text-studio-muted hover:text-studio-text transition-colors border-r border-studio-border"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-studio-text min-w-[48px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(16.0, zoom + 0.25))}
            className="p-1.5 text-studio-muted hover:text-studio-text transition-colors border-l border-studio-border"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 text-studio-muted hover:text-studio-text transition-colors border-l border-studio-border"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* License Activation / Status */}
        <button
          onClick={onOpenLicenseModal}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-sm border transition-colors ${
            isLicensed
              ? 'bg-studio-card hover:bg-studio-hover text-studio-text border-studio-border'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}
          title={isLicensed ? 'License Active' : 'Activate Software License'}
        >
          <Key className={`w-3.5 h-3.5 ${isLicensed ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="hidden lg:inline">{isLicensed ? 'Licensed' : 'Activate'}</span>
        </button>

        {/* LPI Test Sheet Button */}
        <button
          onClick={onOpenLpiModal}
          className="flex items-center gap-1.5 text-xs text-studio-text bg-studio-card hover:bg-studio-hover border border-studio-border px-3 py-1.5 rounded-sm transition-colors"
          title="Generate LPI Calibration Test Sheet"
        >
          <Grid className="w-3.5 h-3.5 text-studio-muted" />
          <span>LPI Test Sheet</span>
        </button>

        {/* Open Artwork File */}
        <button
          onClick={onOpenFile}
          className="flex items-center gap-1.5 text-xs text-studio-text bg-studio-card hover:bg-studio-hover border border-studio-border px-3 py-1.5 rounded-sm transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-studio-muted" />
          <span>Open Artwork</span>
        </button>

        {/* Export Prepress Button */}
        <button
          onClick={onOpenExportModal}
          disabled={!fileName}
          className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-sm transition-colors shadow-sm ${
            !fileName
              ? 'bg-studio-border text-studio-muted/50 cursor-not-allowed opacity-60'
              : 'text-white bg-studio-accent hover:bg-studio-accent-hover'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 300 DPI</span>
        </button>
      </div>
    </header>
  );
};
