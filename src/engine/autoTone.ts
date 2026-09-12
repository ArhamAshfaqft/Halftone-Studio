import { StudioSettings, DotShape, KnockoutMode } from '../types';

export interface AutoToneResult {
  settings: Partial<StudioSettings>;
  summary: string;
}

/**
 * Intelligent Prepress Auto-Tone Analyzer.
 * Inspects pixel distribution, histogram dynamic range, and border colors
 * to automatically recommend optimal LPI, Knockout, and Levels for the artwork.
 */
export function analyzeAndAutoTune(imageData: ImageData): AutoToneResult {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  // 1. Compute 256-bin luminance histogram & border color sampling
  const hist = new Uint32Array(256);
  let totalLum = 0;
  let nonZeroCount = 0;

  // Sample borders to detect background color
  let borderLumSum = 0;
  let borderSampleCount = 0;
  let borderRSum = 0;
  let borderGSum = 0;
  let borderBSum = 0;

  for (let y = 0; y < height; y++) {
    const isBorderY = y < 10 || y > height - 10;
    const rowOffset = y * width;

    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const a = src[idx + 3];
      if (a < 10) continue;

      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];
      const lum = Math.round((r * 299 + g * 587 + b * 114) / 1000);

      hist[lum]++;
      totalLum += lum;
      nonZeroCount++;

      // Border sampling
      if (isBorderY || x < 10 || x > width - 10) {
        borderLumSum += lum;
        borderRSum += r;
        borderGSum += g;
        borderBSum += b;
        borderSampleCount++;
      }
    }
  }

  if (nonZeroCount === 0) {
    return {
      settings: { lpi: 45, shape: 'round', knockoutMode: 'black', underbaseChoke: 2 },
      summary: 'Default DTF Standard'
    };
  }

  const avgBorderLum = borderSampleCount > 0 ? borderLumSum / borderSampleCount : 0;
  const avgBorderR = borderSampleCount > 0 ? Math.round(borderRSum / borderSampleCount) : 0;
  const avgBorderG = borderSampleCount > 0 ? Math.round(borderGSum / borderSampleCount) : 0;
  const avgBorderB = borderSampleCount > 0 ? Math.round(borderBSum / borderSampleCount) : 0;

  // 2. Knockout Recommendation
  let knockoutMode: KnockoutMode = 'black';
  let knockoutThreshold = 18;
  let knockoutSoftness = 12;
  let knockoutColor = '#000000';

  if (avgBorderLum < 30) {
    // Definite black background
    knockoutMode = 'black';
    knockoutThreshold = Math.min(28, Math.max(14, Math.round(avgBorderLum * 0.8 + 14)));
    knockoutSoftness = 12;
  } else if (avgBorderLum > 225) {
    // White background
    knockoutMode = 'white';
    knockoutThreshold = Math.min(30, Math.max(12, Math.round((255 - avgBorderLum) + 14)));
    knockoutSoftness = 10;
  } else if (borderSampleCount > 0 && Math.abs(avgBorderR - avgBorderG) > 20) {
    // Tinted background
    knockoutMode = 'custom';
    knockoutColor = `#${avgBorderR.toString(16).padStart(2, '0')}${avgBorderG.toString(16).padStart(2, '0')}${avgBorderB.toString(16).padStart(2, '0')}`;
    knockoutThreshold = 20;
    knockoutSoftness = 12;
  } else {
    knockoutMode = 'black';
    knockoutThreshold = 16;
  }

  // 3. Dynamic Range & Levels (Find 2nd and 98th percentiles)
  const p2Count = Math.floor(nonZeroCount * 0.02);
  const p98Count = Math.floor(nonZeroCount * 0.98);

  let accum = 0;
  let blackPoint = 0;
  let whitePoint = 255;

  for (let i = 0; i < 256; i++) {
    accum += hist[i];
    if (blackPoint === 0 && accum >= p2Count) {
      blackPoint = i;
    }
    if (accum >= p98Count) {
      whitePoint = i;
      break;
    }
  }

  // 4. LPI & Shape Recommendation
  // High resolution graphics benefit from 50-60 LPI, lower resolution art from 35-45 LPI
  let recLpi = 45;
  let recShape: DotShape = 'round';

  const diagonal = Math.sqrt(width * width + height * height);
  if (diagonal >= 2400) {
    recLpi = 55;
    recShape = 'ellipse'; // Elliptical for smooth gradient chains
  } else if (diagonal >= 1200) {
    recLpi = 45;
    recShape = 'round';
  } else {
    recLpi = 35;
    recShape = 'diamond';
  }

  const recSettings: Partial<StudioSettings> = {
    lpi: recLpi,
    shape: recShape,
    angle: 45,
    knockoutMode,
    knockoutColor,
    knockoutThreshold,
    knockoutSoftness,
    inputBlack: Math.min(40, Math.max(0, blackPoint)),
    inputWhite: Math.max(200, Math.min(255, whitePoint)),
    outputMin: 0,
    outputMax: 255,
    blackCutoff: Math.min(18, Math.max(5, Math.round(blackPoint * 0.8))),
    underbaseEnabled: true,
    underbaseChoke: 2,
    underbaseDensity: 100,
    microDotCleanup: true,
  };

  const summary = `Auto-Tone: ${recLpi} LPI · ${recShape.toUpperCase()} · ${knockoutMode.toUpperCase()} Knockout (${knockoutThreshold}%) · 2px Choke`;

  return {
    settings: recSettings,
    summary
  };
}
