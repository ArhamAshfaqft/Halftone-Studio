/**
 * Realistic Fabric Texture & Cloth Fold Simulation Engine.
 * Generates natural textile weave, organic cloth folds, and lighting depth
 * so apparel prints wrap realistically around t-shirt fabric rather than looking flat.
 */

// Cache pre-generated procedural weave pattern canvas for high performance
let cachedWeavePattern: CanvasPattern | null = null;

function getWeavePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedWeavePattern) return cachedWeavePattern;

  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const pCtx = canvas.getContext('2d');
  if (!pCtx) return null;

  pCtx.clearRect(0, 0, size, size);

  // Fine combed cotton ring-spun knit weave micro-structure
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  // Horizontal warp threads
  pCtx.fillRect(0, 0, 8, 4);
  pCtx.fillRect(8, 8, 8, 4);
  
  // Vertical weft threads
  pCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  pCtx.fillRect(4, 0, 4, 8);
  pCtx.fillRect(12, 8, 4, 8);

  // Micro thread highlights
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  pCtx.fillRect(2, 2, 2, 2);
  pCtx.fillRect(10, 10, 2, 2);

  cachedWeavePattern = ctx.createPattern(canvas, 'repeat');
  return cachedWeavePattern;
}

/**
 * Draws the garment base color and textile weave.
 */
export function drawGarmentBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  garmentColor: string,
  hasTexture: boolean,
  textureOpacity: number = 35
) {
  ctx.save();
  ctx.fillStyle = garmentColor;
  ctx.fillRect(0, 0, width, height);

  if (hasTexture) {
    const pattern = getWeavePattern(ctx);
    if (pattern) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, textureOpacity / 100));
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renders natural organic cloth folds and ambient shadows.
 * Simulates the natural drape, tension wrinkles, and lighting of t-shirt cotton.
 */
export function drawClothFolds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 35
) {
  if (intensity <= 0) return;
  const alphaFactor = (intensity / 100) * 0.45;

  ctx.save();

  // Natural broad torso cloth drape: soft diagonal undulations
  const foldGrad1 = ctx.createLinearGradient(0, 0, width * 0.8, height);
  foldGrad1.addColorStop(0.0, `rgba(255, 255, 255, ${0.04 * alphaFactor})`);
  foldGrad1.addColorStop(0.18, `rgba(0, 0, 0, ${0.12 * alphaFactor})`);
  foldGrad1.addColorStop(0.32, `rgba(255, 255, 255, ${0.08 * alphaFactor})`);
  foldGrad1.addColorStop(0.48, `rgba(0, 0, 0, ${0.16 * alphaFactor})`);
  foldGrad1.addColorStop(0.65, `rgba(255, 255, 255, ${0.06 * alphaFactor})`);
  foldGrad1.addColorStop(0.82, `rgba(0, 0, 0, ${0.14 * alphaFactor})`);
  foldGrad1.addColorStop(1.0, `rgba(255, 255, 255, ${0.03 * alphaFactor})`);

  ctx.fillStyle = foldGrad1;
  ctx.fillRect(0, 0, width, height);

  // Secondary soft transverse fabric wave
  const foldGrad2 = ctx.createRadialGradient(
    width * 0.4, height * 0.35, width * 0.1,
    width * 0.5, height * 0.5, width * 0.7
  );
  foldGrad2.addColorStop(0.0, `rgba(255, 255, 255, ${0.07 * alphaFactor})`);
  foldGrad2.addColorStop(0.5, `rgba(0, 0, 0, ${0.08 * alphaFactor})`);
  foldGrad2.addColorStop(1.0, `rgba(0, 0, 0, 0)`);

  ctx.fillStyle = foldGrad2;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

/**
 * Applies natural fabric shading and texture OVER the printed ink.
 * Uses canvas blend modes so the ink naturally wraps around folds and absorbs fabric grain.
 */
export function applyPrintMaterialBlending(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasFolds: boolean,
  foldIntensity: number = 35,
  hasTexture: boolean,
  textureOpacity: number = 35
) {
  if (!hasFolds && !hasTexture) return;

  ctx.save();

  // 1. Fold Shadows (Multiplied over ink to darken print in cloth crevices)
  if (hasFolds && foldIntensity > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const shadowFactor = (foldIntensity / 100) * 0.35;

    const shadowGrad = ctx.createLinearGradient(0, 0, width * 0.8, height);
    shadowGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
    shadowGrad.addColorStop(0.18, `rgba(200, 200, 200, 1)`);
    shadowGrad.addColorStop(0.32, 'rgba(255, 255, 255, 1)');
    shadowGrad.addColorStop(0.48, `rgba(180, 180, 180, 1)`);
    shadowGrad.addColorStop(0.65, 'rgba(255, 255, 255, 1)');
    shadowGrad.addColorStop(0.82, `rgba(190, 190, 190, 1)`);
    shadowGrad.addColorStop(1.0, 'rgba(255, 255, 255, 1)');

    ctx.globalAlpha = shadowFactor;
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 2. Fold Highlights (Screened over ink to brighten ridges that catch light)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const lightFactor = (foldIntensity / 100) * 0.15;

    const lightGrad = ctx.createLinearGradient(0, 0, width * 0.8, height);
    lightGrad.addColorStop(0.0, `rgba(255, 255, 255, ${0.4 * lightFactor})`);
    lightGrad.addColorStop(0.18, 'rgba(0, 0, 0, 0)');
    lightGrad.addColorStop(0.32, `rgba(255, 255, 255, ${0.8 * lightFactor})`);
    lightGrad.addColorStop(0.48, 'rgba(0, 0, 0, 0)');
    lightGrad.addColorStop(0.65, `rgba(255, 255, 255, ${0.6 * lightFactor})`);
    lightGrad.addColorStop(0.82, 'rgba(0, 0, 0, 0)');
    lightGrad.addColorStop(1.0, `rgba(255, 255, 255, ${0.3 * lightFactor})`);

    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Fabric Weave Texture (Soft Light over ink to give printed surface textile hand feel)
  if (hasTexture && textureOpacity > 0) {
    const pattern = getWeavePattern(ctx);
    if (pattern) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = (textureOpacity / 100) * 0.22;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  ctx.restore();
}
