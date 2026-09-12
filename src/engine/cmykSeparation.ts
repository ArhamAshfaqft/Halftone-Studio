import { StudioSettings } from '../types';

/**
 * Standard prepress screen angles to eliminate moiré patterns in 4-color process printing.
 */
export const CMYK_ANGLES = {
  cyan: 15,
  magenta: 75,
  yellow: 0,
  black: 45
};

export interface CMYKPlates {
  composite: ImageData;
  cyan: ImageData;
  magenta: ImageData;
  yellow: ImageData;
  black: ImageData;
}

/**
 * Converts RGB [0-255] to CMYK [0-1]
 */
function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const normR = r / 255;
  const normG = g / 255;
  const normB = b / 255;

  const k = 1 - Math.max(normR, normG, normB);
  if (k === 1) {
    return [0, 0, 0, 1];
  }
  const c = (1 - normR - k) / (1 - k);
  const m = (1 - normG - k) / (1 - k);
  const y = (1 - normB - k) / (1 - k);

  return [c, m, y, k];
}

/**
 * Processes 4-Color Process CMYK Halftone Separations.
 */
export function processCmykSeparations(
  sourceData: ImageData,
  settings: StudioSettings,
  targetDpi: number = 300
): CMYKPlates {
  const width = sourceData.width;
  const height = sourceData.height;
  const src = sourceData.data;

  const cyanData = new ImageData(width, height);
  const magentaData = new ImageData(width, height);
  const yellowData = new ImageData(width, height);
  const blackData = new ImageData(width, height);
  const compositeData = new ImageData(width, height);

  const lpi = Math.max(10, Math.min(85, settings.lpi));
  const cellSize = Math.max(2, targetDpi / lpi);

  // Precompute angles
  const angles = {
    c: (CMYK_ANGLES.cyan * Math.PI) / 180,
    m: (CMYK_ANGLES.magenta * Math.PI) / 180,
    y: (CMYK_ANGLES.yellow * Math.PI) / 180,
    k: (CMYK_ANGLES.black * Math.PI) / 180,
  };

  const cosC = Math.cos(angles.c), sinC = Math.sin(angles.c);
  const cosM = Math.cos(angles.m), sinM = Math.sin(angles.m);
  const cosY = Math.cos(angles.y), sinY = Math.sin(angles.y);
  const cosK = Math.cos(angles.k), sinK = Math.sin(angles.k);

  const dotScale = settings.dotScale;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const a = src[idx + 3];

      if (a === 0) continue;

      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];

      const [cVal, mVal, yVal, kVal] = rgbToCmyk(r, g, b);

      // Cyan Dot
      const uC = x * cosC - y * sinC, vC = x * sinC + y * cosC;
      const cuC = (((uC % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const cvC = (((vC % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const distC = Math.sqrt(cuC * cuC + cvC * cvC);
      const isC = distC <= 0.55 * Math.sqrt(cVal) * dotScale && cVal > 0.02;

      if (isC) {
        cyanData.data[idx] = 0;
        cyanData.data[idx + 1] = 168; // Process Cyan color
        cyanData.data[idx + 2] = 224;
        cyanData.data[idx + 3] = 255;
      }

      // Magenta Dot
      const uM = x * cosM - y * sinM, vM = x * sinM + y * cosM;
      const cuM = (((uM % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const cvM = (((vM % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const distM = Math.sqrt(cuM * cuM + cvM * cvM);
      const isM = distM <= 0.55 * Math.sqrt(mVal) * dotScale && mVal > 0.02;

      if (isM) {
        magentaData.data[idx] = 236;
        magentaData.data[idx + 1] = 0; // Process Magenta
        magentaData.data[idx + 2] = 140;
        magentaData.data[idx + 3] = 255;
      }

      // Yellow Dot
      const uY = x * cosY - y * sinY, vY = x * sinY + y * cosY;
      const cuY = (((uY % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const cvY = (((vY % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const distY = Math.sqrt(cuY * cuY + cvY * cvY);
      const isY = distY <= 0.55 * Math.sqrt(yVal) * dotScale && yVal > 0.02;

      if (isY) {
        yellowData.data[idx] = 255;
        yellowData.data[idx + 1] = 237; // Process Yellow
        yellowData.data[idx + 2] = 0;
        yellowData.data[idx + 3] = 255;
      }

      // Black Dot
      const uK = x * cosK - y * sinK, vK = x * sinK + y * cosK;
      const cuK = (((uK % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const cvK = (((vK % cellSize) + cellSize) % cellSize) / cellSize - 0.5;
      const distK = Math.sqrt(cuK * cuK + cvK * cvK);
      const isK = distK <= 0.55 * Math.sqrt(kVal) * dotScale && kVal > 0.02;

      if (isK) {
        blackData.data[idx] = 20;
        blackData.data[idx + 1] = 20;
        blackData.data[idx + 2] = 20;
        blackData.data[idx + 3] = 255;
      }

      // Subtractive CMYK Composite blending
      if (isC || isM || isY || isK) {
        let compR = 1.0;
        let compG = 1.0;
        let compB = 1.0;

        if (isC) { compR *= 0.0; compG *= 0.66; compB *= 0.88; }
        if (isM) { compR *= 0.92; compG *= 0.0; compB *= 0.55; }
        if (isY) { compR *= 1.0; compG *= 0.93; compB *= 0.0; }
        if (isK) { compR *= 0.08; compG *= 0.08; compB *= 0.08; }

        compositeData.data[idx] = Math.round(compR * 255);
        compositeData.data[idx + 1] = Math.round(compG * 255);
        compositeData.data[idx + 2] = Math.round(compB * 255);
        compositeData.data[idx + 3] = 255;
      }
    }
  }

  return {
    composite: compositeData,
    cyan: cyanData,
    magenta: magentaData,
    yellow: yellowData,
    black: blackData
  };
}
