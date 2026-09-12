import React from 'react';
import { 
  DotShape, 
  KnockoutMode, 
  StudioSettings, 
  CMYKChannel 
} from '../types';
import { 
  Circle, 
  Square, 
  Minus, 
  Waves, 
  Gem, 
  Disc,
  Grid,
  Sparkles,
  Target,
  Wand2
} from 'lucide-react';

interface SidebarProps {
  settings: StudioSettings;
  onChange: (updated: Partial<StudioSettings>) => void;
  onResetToDefaults: () => void;
  onAutoTone: () => void;
  autoToneStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onChange,
  onResetToDefaults,
  onAutoTone,
  autoToneStatus,
}) => {
  const shapes: { id: DotShape; label: string; icon: React.ReactNode }[] = [
    { id: 'round', label: 'Round', icon: <Circle className="w-3 h-3" /> },
    { id: 'ellipse', label: 'Ellipse', icon: <Disc className="w-3 h-3" /> },
    { id: 'diamond', label: 'Diamond', icon: <Gem className="w-3 h-3" /> },
    { id: 'square', label: 'Square', icon: <Square className="w-3 h-3" /> },
    { id: 'line', label: 'Line', icon: <Minus className="w-3 h-3" /> },
    { id: 'wave', label: 'Wave', icon: <Waves className="w-3 h-3" /> },
    { id: 'crosshatch', label: 'Crosshatch', icon: <Grid className="w-3 h-3" /> },
    { id: 'ripple', label: 'Ripple', icon: <Waves className="w-3 h-3 rotate-90" /> },
    { id: 'radial', label: 'Radial', icon: <Target className="w-3 h-3" /> },
    { id: 'stipple', label: 'Stipple', icon: <Sparkles className="w-3 h-3" /> },
  ];

  const garmentColors = [
    { label: 'Black', hex: '#121316' },
    { label: 'Charcoal', hex: '#26282E' },
    { label: 'Heather Grey', hex: '#6B7280' },
    { label: 'White', hex: '#F3F4F6' },
    { label: 'Navy', hex: '#0F172A' },
    { label: 'Forest', hex: '#14281D' },
    { label: 'Maroon', hex: '#3B1219' },
  ];

  return (
    <aside className="w-80 bg-studio-panel border-r border-studio-border flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto select-none text-xs">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-studio-border flex items-center justify-between">
        <span className="font-semibold text-studio-text tracking-wide uppercase text-[11px]">
          Prepress Parameters
        </span>
        <button
          onClick={onResetToDefaults}
          className="text-studio-muted hover:text-studio-text text-[11px] underline transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Auto-Tone Prepress Optimizer */}
        <div>
          <button
            onClick={onAutoTone}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-studio-card hover:bg-studio-hover border border-studio-accent/50 hover:border-studio-accent text-studio-text rounded-sm font-medium transition-colors shadow-sm"
            title="Scan artwork histogram and optimize LPI, Knockout, and Levels automatically"
          >
            <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
            <span className="font-semibold tracking-wider text-[11px] uppercase">
              Auto-Tone Optimize
            </span>
          </button>
          {autoToneStatus && (
            <div className="mt-1.5 text-[10px] font-mono text-studio-accent bg-studio-card p-1.5 border border-studio-border rounded-sm leading-snug">
              {autoToneStatus}
            </div>
          )}
        </div>

        {/* Section 1: Screen & Dot Geometry */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <span className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold">
              Screen Geometry
            </span>
            <span className="font-mono text-studio-accent font-semibold">{settings.lpi} LPI</span>
          </div>

          {/* Dot Shape Selector */}
          <div>
            <label className="text-studio-muted mb-1.5 block text-[11px]">Dot Shape Matrix</label>
            <div className="grid grid-cols-2 gap-1">
              {shapes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onChange({ shape: s.id })}
                  className={`flex items-center gap-1.5 py-1.5 px-2 rounded-sm border text-[11px] transition-colors ${
                    settings.shape === s.id
                      ? 'bg-studio-accent text-white border-studio-accent font-medium'
                      : 'bg-studio-card text-studio-muted border-studio-border hover:text-studio-text hover:bg-studio-hover'
                  }`}
                >
                  {s.icon}
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* LPI Frequency Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-studio-muted">Frequency (LPI)</label>
              <div className="flex gap-1">
                {[25, 35, 45, 55, 65].map((val) => (
                  <button
                    key={val}
                    onClick={() => onChange({ lpi: val })}
                    className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono border ${
                      settings.lpi === val
                        ? 'border-studio-accent text-studio-accent bg-studio-card font-bold'
                        : 'border-studio-border text-studio-muted hover:text-studio-text'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="85"
              step="1"
              value={settings.lpi}
              onChange={(e) => onChange({ lpi: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-studio-muted font-mono mt-0.5">
              <span>10 LPI (Coarse)</span>
              <span>85 LPI (Fine)</span>
            </div>
          </div>

          {/* Screen Angle Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-studio-muted">Screen Angle</label>
              <div className="flex gap-1">
                {[0, 22.5, 45, 75].map((val) => (
                  <button
                    key={val}
                    onClick={() => onChange({ angle: val })}
                    className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono border ${
                      settings.angle === val
                        ? 'border-studio-accent text-studio-accent bg-studio-card font-bold'
                        : 'border-studio-border text-studio-muted hover:text-studio-text'
                    }`}
                  >
                    {val}°
                  </button>
                ))}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="0.5"
              value={settings.angle}
              onChange={(e) => onChange({ angle: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Dot Scale */}
          <div>
            <div className="flex justify-between text-studio-muted mb-1">
              <span>Dot Scale</span>
              <span className="font-mono text-studio-text">{settings.dotScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.dotScale}
              onChange={(e) => onChange({ dotScale: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Dot Fade (Edge Tapering) */}
          <div>
            <div className="flex justify-between text-studio-muted mb-1">
              <span>Edge Dot Fade</span>
              <span className="font-mono text-studio-text">{settings.dotFade}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.dotFade}
              onChange={(e) => onChange({ dotFade: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </section>

        <hr className="border-studio-border" />

        {/* Section 2: Input & Output Levels */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <span className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold">
              Tonal Levels (Histogram)
            </span>
          </div>

          <div className="space-y-2.5 bg-studio-card p-2.5 border border-studio-border rounded-sm">
            <div>
              <div className="flex justify-between text-studio-muted mb-1">
                <span>Shadows (Black Point)</span>
                <span className="font-mono text-studio-text">{settings.inputBlack ?? 0}</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="1"
                value={settings.inputBlack ?? 0}
                onChange={(e) => onChange({ inputBlack: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-studio-muted mb-1">
                <span>Highlights (White Point)</span>
                <span className="font-mono text-studio-text">{settings.inputWhite ?? 255}</span>
              </div>
              <input
                type="range"
                min="160"
                max="255"
                step="1"
                value={settings.inputWhite ?? 255}
                onChange={(e) => onChange({ inputWhite: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-studio-muted mb-1">
                <span>Midtone Gamma</span>
                <span className="font-mono text-studio-text">{settings.gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.05"
                value={settings.gamma}
                onChange={(e) => onChange({ gamma: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-studio-border">
              <div>
                <div className="flex justify-between text-[10px] text-studio-muted mb-1">
                  <span>Min Dot</span>
                  <span className="font-mono text-studio-text">{settings.outputMin ?? 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={settings.outputMin ?? 0}
                  onChange={(e) => onChange({ outputMin: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-studio-muted mb-1">
                  <span>Max Solid</span>
                  <span className="font-mono text-studio-text">{settings.outputMax ?? 255}</span>
                </div>
                <input
                  type="range"
                  min="180"
                  max="255"
                  step="1"
                  value={settings.outputMax ?? 255}
                  onChange={(e) => onChange({ outputMax: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        <hr className="border-studio-border" />

        {/* Section 3: Knockout Engine */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <span className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold">
              Garment Knockout
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {(['none', 'black', 'white', 'custom'] as KnockoutMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onChange({ knockoutMode: mode })}
                className={`py-1.5 rounded-sm border text-[11px] capitalize transition-colors ${
                  settings.knockoutMode === mode
                    ? 'bg-studio-accent text-white border-studio-accent font-medium'
                    : 'bg-studio-card text-studio-muted border-studio-border hover:text-studio-text'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {settings.knockoutMode !== 'none' && (
            <div className="space-y-2.5 bg-studio-card p-2.5 border border-studio-border rounded-sm">
              {settings.knockoutMode === 'custom' && (
                <div className="flex items-center justify-between">
                  <span className="text-studio-muted">Color Target</span>
                  <input
                    type="color"
                    value={settings.knockoutColor}
                    onChange={(e) => onChange({ knockoutColor: e.target.value })}
                    className="w-8 h-6 bg-transparent cursor-pointer rounded-sm border border-studio-border"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-studio-muted mb-1">
                  <span>Threshold</span>
                  <span className="font-mono text-studio-text">{settings.knockoutThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={settings.knockoutThreshold}
                  onChange={(e) => onChange({ knockoutThreshold: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-studio-muted mb-1">
                  <span>Edge Softness</span>
                  <span className="font-mono text-studio-text">{settings.knockoutSoftness}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="1"
                  value={settings.knockoutSoftness}
                  onChange={(e) => onChange({ knockoutSoftness: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </section>

        <hr className="border-studio-border" />

        {/* Section 4: White Underbase & Choke */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ub-enable"
                checked={settings.underbaseEnabled}
                onChange={(e) => onChange({ underbaseEnabled: e.target.checked })}
                className="rounded-sm accent-studio-accent cursor-pointer"
              />
              <label htmlFor="ub-enable" className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold cursor-pointer">
                White Underbase Mask
              </label>
            </div>
            {settings.underbaseEnabled && (
              <span className="font-mono text-studio-accent font-semibold">{settings.underbaseChoke} px Choke</span>
            )}
          </div>

          {settings.underbaseEnabled && (
            <div className="space-y-3 bg-studio-card p-2.5 border border-studio-border rounded-sm">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-studio-muted">Choke (Inward Erosion)</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4, 5].map((px) => (
                      <button
                        key={px}
                        onClick={() => onChange({ underbaseChoke: px })}
                        className={`w-6 h-5 rounded-sm text-[10px] font-mono border ${
                          settings.underbaseChoke === px
                            ? 'border-studio-accent text-studio-accent bg-studio-panel font-bold'
                            : 'border-studio-border text-studio-muted hover:text-studio-text'
                        }`}
                      >
                        {px}p
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={settings.underbaseChoke}
                  onChange={(e) => onChange({ underbaseChoke: Number(e.target.value) })}
                  className="w-full"
                />
                <p className="text-[10px] text-studio-muted mt-1 leading-tight">
                  Pulls white ink inward to prevent white halo outline on dark shirts.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-studio-muted mb-1">
                  <span>Underbase Density</span>
                  <span className="font-mono text-studio-text">{settings.underbaseDensity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={settings.underbaseDensity}
                  onChange={(e) => onChange({ underbaseDensity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </section>

        <hr className="border-studio-border" />

        {/* Section 5: Micro-Dot Cleanup */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dot-cleanup"
                checked={settings.microDotCleanup}
                onChange={(e) => onChange({ microDotCleanup: e.target.checked })}
                className="rounded-sm accent-studio-accent cursor-pointer"
              />
              <label htmlFor="dot-cleanup" className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold cursor-pointer">
                Micro-Dot Cleanup
              </label>
            </div>
          </div>
          <p className="text-[10px] text-studio-muted leading-tight">
            Removes isolated single-pixel dots that cause printer nozzle clogs.
          </p>
        </section>

        <hr className="border-studio-border" />

        {/* Section 6: Garment Simulator */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <span className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold">
              Garment Simulator
            </span>
          </div>

          <div>
            <label className="text-studio-muted mb-1.5 block">Shirt Fabric Color</label>
            <div className="flex flex-wrap gap-1.5">
              {garmentColors.map((c) => (
                <button
                  key={c.label}
                  onClick={() => onChange({ garmentColor: c.hex })}
                  title={c.label}
                  className={`w-7 h-7 rounded-sm border transition-transform ${
                    settings.garmentColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-studio-accent scale-110 shadow-sm'
                      : 'border-studio-border hover:border-studio-muted'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={settings.garmentColor}
                onChange={(e) => onChange({ garmentColor: e.target.value })}
                className="w-7 h-7 bg-transparent cursor-pointer rounded-sm border border-studio-border"
                title="Custom Garment Color"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-studio-card p-2 rounded-sm border border-studio-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="garment-box"
                checked={settings.showGarmentBox}
                onChange={(e) => onChange({ showGarmentBox: e.target.checked })}
                className="rounded-sm accent-studio-accent cursor-pointer"
              />
              <label htmlFor="garment-box" className="text-studio-muted cursor-pointer">
                Garment Background Box
              </label>
            </div>
            <span className="text-[10px] font-mono text-studio-muted">
              {settings.showGarmentBox ? 'Visible' : 'Hidden'}
            </span>
          </div>

          <div className="space-y-2 bg-studio-card p-2 rounded-sm border border-studio-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="garment-texture"
                  checked={settings.garmentTexture}
                  onChange={(e) => onChange({ garmentTexture: e.target.checked })}
                  className="rounded-sm accent-studio-accent cursor-pointer"
                />
                <label htmlFor="garment-texture" className="text-studio-muted cursor-pointer text-xs">
                  Knit Cotton Weave
                </label>
              </div>
              {settings.garmentTexture && (
                <span className="text-[10px] font-mono text-studio-accent">{settings.garmentTextureOpacity}%</span>
              )}
            </div>
            {settings.garmentTexture && (
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={settings.garmentTextureOpacity}
                onChange={(e) => onChange({ garmentTextureOpacity: Number(e.target.value) })}
                className="w-full"
              />
            )}
          </div>

          <div className="space-y-2 bg-studio-card p-2 rounded-sm border border-studio-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="garment-folds"
                  checked={settings.garmentFolds}
                  onChange={(e) => onChange({ garmentFolds: e.target.checked })}
                  className="rounded-sm accent-studio-accent cursor-pointer"
                />
                <label htmlFor="garment-folds" className="text-studio-muted cursor-pointer text-xs">
                  Natural Cloth Folds & Shading
                </label>
              </div>
              {settings.garmentFolds && (
                <span className="text-[10px] font-mono text-studio-accent">{settings.garmentFoldIntensity}%</span>
              )}
            </div>
            {settings.garmentFolds && (
              <input
                type="range"
                min="10"
                max="75"
                step="5"
                value={settings.garmentFoldIntensity}
                onChange={(e) => onChange({ garmentFoldIntensity: Number(e.target.value) })}
                className="w-full"
              />
            )}
          </div>
        </section>

        <hr className="border-studio-border" />

        {/* Section 7: CMYK 4-Color Separation Mode */}
        <section className="space-y-3">
          <div className="flex items-center justify-between font-medium text-studio-text">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cmyk-toggle"
                checked={settings.cmykMode}
                onChange={(e) => onChange({ cmykMode: e.target.checked })}
                className="rounded-sm accent-studio-accent cursor-pointer"
              />
              <label htmlFor="cmyk-toggle" className="uppercase text-[11px] tracking-wider text-studio-muted font-semibold cursor-pointer">
                4-Color CMYK Process
              </label>
            </div>
          </div>

          {settings.cmykMode && (
            <div className="space-y-2 bg-studio-card p-2.5 border border-studio-border rounded-sm">
              <label className="text-studio-muted block">Active Plate Preview</label>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px]">
                {(['composite', 'cyan', 'magenta', 'yellow', 'black'] as CMYKChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => onChange({ cmykActiveChannel: ch })}
                    className={`py-1 px-2 rounded-sm border capitalize text-left transition-colors ${
                      settings.cmykActiveChannel === ch
                        ? 'bg-studio-accent text-white border-studio-accent font-medium'
                        : 'bg-studio-panel text-studio-muted border-studio-border hover:text-studio-text'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};
