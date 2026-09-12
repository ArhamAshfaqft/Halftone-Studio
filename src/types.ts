export type DotShape = 
  | 'round' 
  | 'ellipse' 
  | 'diamond' 
  | 'square' 
  | 'line' 
  | 'wave'
  | 'crosshatch'
  | 'stipple'
  | 'ripple'
  | 'radial';

export type KnockoutMode = 'none' | 'black' | 'white' | 'custom';

export type ViewMode = 'artwork' | 'halftone' | 'underbase' | 'garment' | 'cmyk';

export type CMYKChannel = 'composite' | 'cyan' | 'magenta' | 'yellow' | 'black';

export interface StudioSettings {
  // Screen & Dot Parameters
  lpi: number; // 10 - 85
  angle: number; // 0 - 90 deg
  shape: DotShape;
  dotScale: number; // 0.5 - 2.0
  dotFade: number; // 0 - 100
  fadeFeather: number; // 0 - 50

  // Knockout Parameters
  knockoutMode: KnockoutMode;
  knockoutColor: string;
  knockoutThreshold: number; // 0 - 100
  knockoutSoftness: number; // 0 - 50

  // White Underbase Prepress
  underbaseEnabled: boolean;
  underbaseChoke: number; // 0 - 5 pixels
  underbaseDensity: number; // 50 - 100%

  // Micro-Dot Cleanup
  microDotCleanup: boolean;
  microDotThreshold: number; // 1 - 4

  // Tonal Adjustments & Input/Output Levels
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  gamma: number; // 0.5 to 2.0
  blackCutoff: number; // 0 to 50
  inputBlack: number; // 0 to 100
  inputWhite: number; // 150 to 255
  outputMin: number; // 0 to 100
  outputMax: number; // 150 to 255
  invert: boolean;

  // Garment Simulation
  garmentColor: string;
  garmentTexture: boolean;
  garmentTextureOpacity: number; // 0 - 100
  showGarmentBox: boolean;

  // CMYK Mode
  cmykMode: boolean;
  cmykActiveChannel: CMYKChannel;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  settings: Partial<StudioSettings>;
}

export interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  fileSize?: number;
  dpi: number;
}

declare global {
  interface Window {
    electronAPI?: {
      openFile: () => Promise<{ path: string; name: string; dataUrl: string } | null>;
      saveFileDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
      writeBuffer: (filePath: string, bufferData: number[]) => Promise<{ success: boolean; error?: string }>;
      isDesktop: boolean;
    };
  }
}
