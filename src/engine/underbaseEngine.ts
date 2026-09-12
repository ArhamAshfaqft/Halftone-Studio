/**
 * Industrial White Underbase Prepress Engine.
 * Generates white ink underbase mask with morphological erosion choke (1-5px)
 * to prevent white ink bleed during DTF & DTG printing.
 */

import { KnockoutMode } from '../types';

export interface UnderbaseOptions {
  choke: number; // 0 to 5 pixels
  density: number; // 50% to 100%
  whiteThreshold?: number;
  knockoutMode?: KnockoutMode;
  knockoutColor?: string;
  knockoutThreshold?: number;
  knockoutSoftness?: number;
}

/**
 * Computes white underbase alpha channel from image data.
 * @param srcData ImageData from the artwork
 * @param width Image width
 * @param height Image height
 * @param options Underbase choke, density, and knockout options
 * @returns ImageData representing the choked white underbase mask
 */
export function generateWhiteUnderbase(
  srcData: ImageData,
  width: number,
  height: number,
  options: UnderbaseOptions
): ImageData {
  const { choke = 2, density = 100 } = options;
  const src = srcData.data;
  const totalPixels = width * height;

  // Knockout configuration
  const isKnockout = options.knockoutMode && options.knockoutMode !== 'none';
  let koR = 0, koG = 0, koB = 0;
  if (options.knockoutMode === 'black') {
    koR = 0; koG = 0; koB = 0;
  } else if (options.knockoutMode === 'white') {
    koR = 255; koG = 255; koB = 255;
  } else if (options.knockoutMode === 'custom' && options.knockoutColor) {
    const hex = options.knockoutColor.replace('#', '');
    koR = parseInt(hex.substring(0, 2), 16) || 0;
    koG = parseInt(hex.substring(2, 4), 16) || 0;
    koB = parseInt(hex.substring(4, 6), 16) || 0;
  }
  const koThreshold = (options.knockoutThreshold ?? 10) * 2.55;
  const koSoftness = Math.max(1, (options.knockoutSoftness ?? 8) * 2.55);

  // Step 1: Extract base underbase intensity (0-255) for each pixel
  const rawAlpha = new Uint8Array(totalPixels);
  const densityFactor = Math.min(1.0, Math.max(0.1, density / 100));

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const a = src[idx + 3];
    if (a === 0) {
      rawAlpha[i] = 0;
      continue;
    }

    const r = src[idx];
    const g = src[idx + 1];
    const b = src[idx + 2];

    // Knockout evaluation (prevents printing white under garment-matched areas)
    if (isKnockout) {
      const dR = r - koR;
      const dG = g - koG;
      const dB = b - koB;
      const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);

      if (dist <= koThreshold) {
        rawAlpha[i] = 0;
        continue;
      } else if (dist < koThreshold + koSoftness) {
        const taper = (dist - koThreshold) / koSoftness;
        if (Math.random() > taper) {
          rawAlpha[i] = 0;
          continue;
        }
      }
    }

    // In DTF & Screen Printing, white underbase is solid underneath all printed inks
    // to block dark garment fiber from muddying colors.
    const targetAlpha = Math.round(a * densityFactor);
    rawAlpha[i] = Math.min(255, Math.max(0, targetAlpha));
  }

  // If choke is 0, return un-choked underbase directly
  if (choke <= 0) {
    const outData = new ImageData(width, height);
    const out = outData.data;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const alphaVal = rawAlpha[i];
      out[idx] = 255;
      out[idx + 1] = 255;
      out[idx + 2] = 255;
      out[idx + 3] = alphaVal;
    }
    return outData;
  }

  // Step 2: Morphological Erosion for Choke (Pulling inward by N pixels)
  // We use a 2-pass separable circular kernel approximation for fast performance
  const radius = Math.min(5, Math.max(1, Math.round(choke)));
  const chokedAlpha = erodeAlpha(rawAlpha, width, height, radius);

  // Step 3: Package into output ImageData (Pure white RGB with choked alpha)
  const resultData = new ImageData(width, height);
  const result = resultData.data;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const alphaVal = chokedAlpha[i];
    result[idx] = 255;
    result[idx + 1] = 255;
    result[idx + 2] = 255;
    result[idx + 3] = alphaVal;
  }

  return resultData;
}

/**
 * Fast Euclidean Morphological Erosion on an 8-bit Alpha Map.
 */
function erodeAlpha(
  src: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  const temp = new Uint8Array(src.length);
  const output = new Uint8Array(src.length);

  // Horizontal min pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      const xStart = Math.max(0, x - radius);
      const xEnd = Math.min(width - 1, x + radius);

      for (let kx = xStart; kx <= xEnd; kx++) {
        const val = src[rowOffset + kx];
        if (val < minVal) {
          minVal = val;
          if (minVal === 0) break; // Fast break
        }
      }
      temp[rowOffset + x] = minVal;
    }
  }

  // Vertical min pass with Euclidean circular distance check
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let minVal = 255;
      const yStart = Math.max(0, y - radius);
      const yEnd = Math.min(height - 1, y + radius);

      for (let ky = yStart; ky <= yEnd; ky++) {
        const dy = ky - y;
        // Circular kernel cutoff
        if (Math.abs(dy) <= radius) {
          const val = temp[ky * width + x];
          if (val < minVal) {
            minVal = val;
            if (minVal === 0) break;
          }
        }
      }
      output[y * width + x] = minVal;
    }
  }

  return output;
}
