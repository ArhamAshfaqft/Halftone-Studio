import { DotShape, StudioSettings } from '../types';

export interface ProcessHalftoneResult {
  imageData: ImageData;
  width: number;
  height: number;
}

/**
 * Parses hex color to [r, g, b] numbers
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0
  ];
}

/**
 * Calculates dot distance metric based on shape and normalized cell coordinates (-0.5 to 0.5)
 */
function getDotDistance(cu: number, cv: number, shape: DotShape, x: number = 0, y: number = 0): number {
  switch (shape) {
    case 'round':
      return Math.sqrt(cu * cu + cv * cv); // Euclidean circular
    case 'ellipse':
      return Math.sqrt(cu * cu + (cv * 1.5) * (cv * 1.5)) * 0.8; // Elliptical chain
    case 'diamond':
      return Math.abs(cu) + Math.abs(cv); // Manhattan rhomboid
    case 'square':
      return Math.max(Math.abs(cu), Math.abs(cv)); // Square matrix
    case 'line':
      return Math.abs(cv); // 1D linear raster
    case 'wave':
      return Math.abs(cv + 0.22 * Math.sin(cu * Math.PI * 2)); // Sinusoidal wave
    case 'crosshatch':
      return Math.min(Math.abs(cu), Math.abs(cv)); // Dual-axis woven crosshatch
    case 'ripple':
      return Math.abs(cv + 0.2 * Math.sin(cu * Math.PI * 2) + 0.2 * Math.cos(cv * Math.PI * 2)); // Undulating ripple weave
    case 'radial': {
      const r = Math.sqrt(cu * cu + cv * cv);
      return Math.abs((r * 2) % 1 - 0.5); // Concentric ring screen
    }
    case 'stipple': {
      // Deterministic high-frequency pseudo-random noise for vintage stipple / tattoo dots
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise = n - Math.floor(n);
      return Math.sqrt(cu * cu + cv * cv) * 0.7 + noise * 0.3;
    }
    default:
      return Math.sqrt(cu * cu + cv * cv);
  }
}

/**
 * Core Prepress Halftone Processor.
 * Converts input ImageData into print-ready halftone separations.
 */
export function processHalftone(
  sourceData: ImageData,
  settings: StudioSettings,
  targetDpi: number = 300
): ImageData {
  const width = sourceData.width;
  const height = sourceData.height;
  const src = sourceData.data;

  const outData = new ImageData(width, height);
  const dst = outData.data;

  // Screen calculations
  const lpi = Math.max(10, Math.min(85, settings.lpi));
  const cellSize = Math.max(2, targetDpi / lpi);
  const angleRad = (settings.angle * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  // Tonal controls
  const brightness = settings.brightness / 100;
  const contrast = (settings.contrast + 100) / 100;
  const gamma = Math.max(0.2, Math.min(3.0, settings.gamma));
  const blackCutoff = settings.blackCutoff;

  // Knockout setup
  const isKnockout = settings.knockoutMode !== 'none';
  let koR = 0, koG = 0, koB = 0;
  if (settings.knockoutMode === 'black') {
    koR = 0; koG = 0; koB = 0;
  } else if (settings.knockoutMode === 'white') {
    koR = 255; koG = 255; koB = 255;
  } else if (settings.knockoutMode === 'custom') {
    [koR, koG, koB] = hexToRgb(settings.knockoutColor);
  }
  const koThreshold = settings.knockoutThreshold * 2.55; // 0-255 scale
  const koSoftness = Math.max(1, settings.knockoutSoftness * 2.55);

  // Input & Output Levels
  const inBlack = settings.inputBlack ?? 0;
  const inWhite = Math.max(inBlack + 1, settings.inputWhite ?? 255);
  const outMin = (settings.outputMin ?? 0) / 255;
  const outMax = (settings.outputMax ?? 255) / 255;

  // Dot scale and fade
  const dotScaleFactor = settings.dotScale;
  const dotFade = settings.dotFade / 100;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const a = src[idx + 3];

      if (a === 0) {
        dst[idx + 3] = 0;
        continue;
      }

      let r = src[idx];
      let g = src[idx + 1];
      let b = src[idx + 2];

      // Knockout evaluation
      if (isKnockout) {
        const dR = r - koR;
        const dG = g - koG;
        const dB = b - koB;
        // Color distance in Euclidean space
        const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);

        if (dist <= koThreshold) {
          // Fully knocked out to garment color / transparent
          dst[idx + 3] = 0;
          continue;
        } else if (dist < koThreshold + koSoftness) {
          // Soft transition edge
          const taper = (dist - koThreshold) / koSoftness;
          if (Math.random() > taper) {
            dst[idx + 3] = 0;
            continue;
          }
        }
      }

      // Tonal curve adjustments
      // Apply brightness & contrast
      let adjR = ((r / 255 - 0.5) * contrast + 0.5 + brightness);
      let adjG = ((g / 255 - 0.5) * contrast + 0.5 + brightness);
      let adjB = ((b / 255 - 0.5) * contrast + 0.5 + brightness);

      // Gamma
      adjR = Math.pow(Math.max(0, Math.min(1, adjR)), 1 / gamma);
      adjG = Math.pow(Math.max(0, Math.min(1, adjG)), 1 / gamma);
      adjB = Math.pow(Math.max(0, Math.min(1, adjB)), 1 / gamma);

      r = Math.round(adjR * 255);
      g = Math.round(adjG * 255);
      b = Math.round(adjB * 255);

      // Luminance computation
      let lum = (r * 299 + g * 587 + b * 114) / 1000;

      // Input levels remapping
      let normLum = Math.max(0, Math.min(1, (lum - inBlack) / (inWhite - inBlack)));

      // Black cutoff: any values below threshold become knocked out
      if (blackCutoff > 0 && normLum * 255 <= blackCutoff) {
        dst[idx + 3] = 0;
        continue;
      }

      // Output levels remapping
      let density = outMin + normLum * (outMax - outMin);
      if (settings.invert) density = 1.0 - density;

      // Edge Dot Fade: gracefully tapers dots along anti-aliased alpha boundaries
      if (dotFade > 0 && a < 255) {
        const alphaFade = Math.pow(a / 255, 1.0 + dotFade * 2);
        density *= alphaFade;
      }

      // Suppress sub-threshold scum dots if microDotCleanup is active
      const minDensity = settings.microDotCleanup
        ? Math.max(0.01, (settings.microDotThreshold ?? 2) * 0.01)
        : 0.005;

      if (density < minDensity) {
        dst[idx + 3] = 0;
        continue;
      }

      // Rotated grid coordinate mapping
      const u = x * cosA - y * sinA;
      const v = x * sinA + y * cosA;

      // Normalized cell position (-0.5 to 0.5)
      let cu = ((u % cellSize) + cellSize) % cellSize / cellSize - 0.5;
      let cv = ((v % cellSize) + cellSize) % cellSize / cellSize - 0.5;

      // Distance from dot center
      const dist = getDotDistance(cu, cv, settings.shape, x, y);

      // Threshold radius for current density
      const maxRadius = 0.65 * Math.sqrt(density) * dotScaleFactor;

      if (dist <= maxRadius) {
        dst[idx] = r;
        dst[idx + 1] = g;
        dst[idx + 2] = b;
        dst[idx + 3] = 255; // Solid opaque dot
      } else {
        dst[idx + 3] = 0; // Negative space between dots
      }
    }
  }

  // Micro-dot noise filter if enabled (only removes isolated 1-pixel stray specks)
  if (settings.microDotCleanup) {
    cleanupMicroDots(dst, width, height, settings.microDotThreshold);
  }

  return outData;
}

/**
 * Removes isolated 1-pixel stray noise without destroying valid high-frequency halftone dots.
 */
function cleanupMicroDots(
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 2
) {
  if (threshold <= 1) return;
  const toClear: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = (rowOffset + x) * 4;
      if (dst[idx + 3] === 0) continue;

      // Count non-zero alpha neighbors in 3x3 window
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          if (dst[nIdx + 3] > 0) {
            neighbors++;
          }
        }
      }

      // Only delete if completely isolated (0 neighbors) to preserve legitimate halftone screen dots
      if (neighbors === 0) {
        toClear.push(idx);
      }
    }
  }

  for (let i = 0; i < toClear.length; i++) {
    dst[toClear[i] + 3] = 0;
  }
}
