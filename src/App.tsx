import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Viewport } from './components/Viewport';
import { ExportModal } from './components/ExportModal';
import { LpiModal } from './components/LpiModal';
import { StudioSettings, Preset, ViewMode } from './types';
import { DEFAULT_PRESETS } from './presets';
import { processHalftone } from './engine/halftoneCore';
import { generateWhiteUnderbase } from './engine/underbaseEngine';
import { processCmykSeparations, CMYKPlates } from './engine/cmykSeparation';
import { analyzeAndAutoTune } from './engine/autoTone';

const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  lpi: 45,
  angle: 45,
  shape: 'round',
  dotScale: 1.0,
  dotFade: 25,
  fadeFeather: 15,
  knockoutMode: 'black',
  knockoutColor: '#000000',
  knockoutThreshold: 18,
  knockoutSoftness: 12,
  underbaseEnabled: true,
  underbaseChoke: 2,
  underbaseDensity: 100,
  microDotCleanup: true,
  microDotThreshold: 2,
  brightness: 0,
  contrast: 0,
  gamma: 1.0,
  blackCutoff: 10,
  inputBlack: 0,
  inputWhite: 255,
  outputMin: 0,
  outputMax: 255,
  invert: false,
  garmentColor: '#121316',
  garmentTexture: true,
  garmentTextureOpacity: 35,
  showGarmentBox: false,
  garmentFolds: true,
  garmentFoldIntensity: 35,
  cmykMode: false,
  cmykActiveChannel: 'composite',
};

export const App: React.FC = () => {
  // Current settings restored from localStorage if previously saved, else defaults
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem('halftone_studio_settings');
      if (saved) {
        return { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not restore saved settings:', e);
    }
    return DEFAULT_STUDIO_SETTINGS;
  });

  // Automatically persist user settings on change
  useEffect(() => {
    try {
      localStorage.setItem('halftone_studio_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not persist settings:', e);
    }
  }, [settings]);

  const [currentPresetId, setCurrentPresetId] = useState<string>('dtf-standard');
  const [autoToneStatus, setAutoToneStatus] = useState<string | undefined>(undefined);

  // Loaded Artwork state (starts clean with no demo design)
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Rendered Data
  const [halftoneData, setHalftoneData] = useState<ImageData | null>(null);
  const [underbaseData, setUnderbaseData] = useState<ImageData | null>(null);
  const [cmykPlates, setCmykPlates] = useState<CMYKPlates | null>(null);

  // Viewport & UI State
  const [zoom, setZoom] = useState<number>(0.65);
  const [viewMode, setViewMode] = useState<ViewMode>('garment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isLpiModalOpen, setIsLpiModalOpen] = useState<boolean>(false);
  const [resetViewTrigger, setResetViewTrigger] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update Settings
  const handleSettingsChange = (updated: Partial<StudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  // Preset Selection
  const handleSelectPreset = (preset: Preset) => {
    setCurrentPresetId(preset.id);
    setSettings((prev) => ({ ...prev, ...preset.settings }));
  };

  // Reset to Defaults
  const handleResetToDefaults = () => {
    const defaultP = DEFAULT_PRESETS[0];
    setCurrentPresetId(defaultP.id);
    setSettings(DEFAULT_STUDIO_SETTINGS);
    try {
      localStorage.removeItem('halftone_studio_settings');
    } catch (e) {}
    setAutoToneStatus(undefined);
  };

  // Auto-Tone Optimizer
  const handleAutoTone = () => {
    if (!originalImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.naturalWidth;
    canvas.height = originalImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(originalImage, 0, 0);
    const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const res = analyzeAndAutoTune(srcData);
    setSettings((prev) => ({ ...prev, ...res.settings }));
    setAutoToneStatus(res.summary);
  };

  // Re-run halftone and underbase generation pipeline
  const runPipeline = useCallback(() => {
    if (!originalImage) return;

    setIsProcessing(true);

    // Create source image data
    const canvas = document.createElement('canvas');
    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(originalImage, 0, 0);
    const srcData = ctx.getImageData(0, 0, width, height);

    // Execute in microtask / timer to avoid blocking UI frame
    setTimeout(() => {
      try {
        if (settings.cmykMode) {
          const cmyk = processCmykSeparations(srcData, settings, 300);
          setCmykPlates(cmyk);
          setHalftoneData(cmyk.composite);
        } else {
          // Standard Single Separation Halftone
          const ht = processHalftone(srcData, settings, 300);
          setHalftoneData(ht);

          // Generate Choked White Underbase if enabled
          if (settings.underbaseEnabled) {
            const ub = generateWhiteUnderbase(ht, width, height, {
              choke: settings.underbaseChoke,
              density: settings.underbaseDensity,
            });
            setUnderbaseData(ub);
          } else {
            setUnderbaseData(null);
          }
        }
      } catch (err) {
        console.error('Prepress Pipeline Error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 10);
  }, [originalImage, settings]);

  // Debounce pipeline execution on settings change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runPipeline();
    }, 60);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [runPipeline]);

  // Load new image from dataUrl
  const loadNewImage = (dataUrl: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      setFileName(name);
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = dataUrl;
  };

  // Open File Action (Native desktop dialog or browser input fallback)
  const handleOpenFile = async () => {
    if (window.electronAPI?.openFile) {
      const file = await window.electronAPI.openFile();
      if (file) {
        loadNewImage(file.dataUrl, file.name);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        loadNewImage(ev.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop image onto window
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        loadNewImage(ev.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="h-screen w-screen bg-studio-bg flex flex-col overflow-hidden text-studio-text select-none font-sans"
    >
      {/* Hidden file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/tiff"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Application Header */}
      <Header
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenFile={handleOpenFile}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenLpiModal={() => setIsLpiModalOpen(true)}
        zoom={zoom}
        onZoomChange={setZoom}
        onResetView={() => setResetViewTrigger((v) => v + 1)}
        fileName={fileName}
        imageDimensions={imageDimensions}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Prepress Parameters Sidebar */}
        <Sidebar
          settings={settings}
          onChange={handleSettingsChange}
          onResetToDefaults={handleResetToDefaults}
          onAutoTone={handleAutoTone}
          autoToneStatus={autoToneStatus}
        />

        {/* Center Interactive Studio Viewport */}
        <Viewport
          originalImage={originalImage}
          halftoneData={halftoneData}
          underbaseData={underbaseData}
          cmykPlates={cmykPlates}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onOpenFile={handleOpenFile}
          zoom={zoom}
          onZoomChange={setZoom}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isProcessing={isProcessing}
          resetTrigger={resetViewTrigger}
        />
      </div>

      {/* Prepress Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        originalImage={originalImage}
        halftoneData={halftoneData}
        underbaseData={underbaseData}
        cmykPlates={cmykPlates}
        settings={settings}
        fileName={fileName}
      />

      {/* LPI Calibration Test Sheet Modal */}
      <LpiModal
        isOpen={isLpiModalOpen}
        onClose={() => setIsLpiModalOpen(false)}
      />
    </div>
  );
};
