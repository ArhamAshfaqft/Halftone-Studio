/**
 * Generates a high-resolution streetwear / apparel sample graphic.
 * Used for instant preview and onboarding so users can immediately test
 * halftones, knockout black, underbase choke, and garment simulator.
 */

export function generateSampleArtwork(): string {
  const canvas = document.createElement('canvas');
  const size = 1200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = size / 2;
  const cy = size / 2;

  // Pure black background (perfect for testing Knockout Black!)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Background radial burst rays
  ctx.save();
  ctx.translate(cx, cy);
  const numRays = 36;
  for (let i = 0; i < numRays; i++) {
    ctx.rotate((Math.PI * 2) / numRays);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-30, 480);
    ctx.lineTo(30, 480);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(235, 94, 40, 0.08)' : 'rgba(37, 99, 235, 0.06)';
    ctx.fill();
  }
  ctx.restore();

  // Outer circular ring with notches
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 420, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#F97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 400, 0, Math.PI * 2);
  ctx.stroke();

  // Vibrant gradient backdrop behind center subject
  const coreGrad = ctx.createRadialGradient(cx, cy - 40, 50, cx, cy - 20, 320);
  coreGrad.addColorStop(0, '#FFDD00');
  coreGrad.addColorStop(0.3, '#FF3366');
  coreGrad.addColorStop(0.7, '#7928CA');
  coreGrad.addColorStop(1, '#000000');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy - 30, 260, 0, Math.PI * 2);
  ctx.fill();

  // Graphic Subject: Stylized Eagle / Winged Emblem
  ctx.save();
  ctx.translate(cx, cy - 40);

  // Wings Left & Right
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    ctx.scale(side, 1);
    
    // Wing gradient
    const wingGrad = ctx.createLinearGradient(0, -100, 260, 80);
    wingGrad.addColorStop(0, '#FFFFFF');
    wingGrad.addColorStop(0.3, '#38BDF8');
    wingGrad.addColorStop(0.7, '#2563EB');
    wingGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = wingGrad;

    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.moveTo(30, 20 + f * 18);
      ctx.quadraticCurveTo(120 + f * 20, -50 + f * 25, 230 - f * 20, -20 + f * 35);
      ctx.quadraticCurveTo(110 + f * 15, 10 + f * 20, 30, 50 + f * 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Center Shield / Crest
  const shieldGrad = ctx.createLinearGradient(0, -120, 0, 160);
  shieldGrad.addColorStop(0, '#FFFFFF');
  shieldGrad.addColorStop(0.4, '#F59E0B');
  shieldGrad.addColorStop(0.8, '#DC2626');
  shieldGrad.addColorStop(1, '#1E1B4B');
  ctx.fillStyle = shieldGrad;

  ctx.beginPath();
  ctx.moveTo(0, -110);
  ctx.lineTo(80, -70);
  ctx.lineTo(65, 70);
  ctx.lineTo(0, 150);
  ctx.lineTo(-65, 70);
  ctx.lineTo(-80, -70);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Star in crest
  ctx.fillStyle = '#FFFFFF';
  drawStar(ctx, 0, -10, 5, 42, 20);
  ctx.fill();

  ctx.restore();

  // Typography Curved Banner
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 54px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('HALFTONE STUDIO', cx, cy + 280);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 24px Poppins, sans-serif';
  ctx.letterSpacing = '12px';
  ctx.fillText('DTF & DTG PREPRESS SUITE', cx, cy + 325);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '500 18px Poppins, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('• 300 DPI LOSSLESS SEPARATION •', cx, cy + 360);

  return canvas.toDataURL('image/png');
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}
