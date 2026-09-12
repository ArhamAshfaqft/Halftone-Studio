/**
 * Prepress PNG DPI metadata injector.
 * Injects standard pHYs (Physical pixel dimensions) chunk into PNG buffer
 * so that print RIPs and graphics software detect native 300 DPI (11,811 pixels/meter).
 */

// CRC-32 table generator
let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  crcTable = table;
  return table;
}

function calculateCrc(buf: Uint8Array, offset: number, length: number): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < length; i++) {
    c = table[(c ^ buf[offset + i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Injects a 300 DPI pHYs chunk into an ArrayBuffer or Uint8Array PNG.
 */
export function setPngDpi(pngBuffer: ArrayBuffer | Uint8Array, dpi: number = 300): Uint8Array {
  const bytes = pngBuffer instanceof Uint8Array ? pngBuffer : new Uint8Array(pngBuffer);

  // Validate PNG signature: [137, 80, 78, 71, 13, 10, 26, 10]
  if (
    bytes.length < 8 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47 ||
    bytes[4] !== 0x0d ||
    bytes[5] !== 0x0a ||
    bytes[6] !== 0x1a ||
    bytes[7] !== 0x0a
  ) {
    // Return unmodified if not a valid PNG
    return bytes;
  }

  // 1 inch = 0.0254 meters => pixels/meter = dpi / 0.0254
  const pixelsPerMeter = Math.round(dpi / 0.0254);

  // pHYs chunk payload:
  // 4 bytes: pixels per meter X (big endian)
  // 4 bytes: pixels per meter Y (big endian)
  // 1 byte:  unit specifier (1 = meter)
  const chunkLength = 9;
  const chunkData = new Uint8Array(4 + 4 + chunkLength + 4); // length (4) + type (4) + data (9) + crc (4) = 21 bytes

  const view = new DataView(chunkData.buffer);
  view.setUint32(0, chunkLength, false); // Length

  // Type "pHYs"
  chunkData[4] = 0x70; // 'p'
  chunkData[5] = 0x48; // 'H'
  chunkData[6] = 0x59; // 'Y'
  chunkData[7] = 0x73; // 's'

  // Data: X pixels per meter
  view.setUint32(8, pixelsPerMeter, false);
  // Data: Y pixels per meter
  view.setUint32(12, pixelsPerMeter, false);
  // Data: unit = meter (1)
  chunkData[16] = 1;

  // CRC calculated over type (4 bytes) + data (9 bytes)
  const crc = calculateCrc(chunkData, 4, 4 + chunkLength);
  view.setUint32(17, crc, false);

  // Look for existing pHYs chunk or insert after IHDR
  // IHDR starts at byte 8. IHDR length is 13 bytes data + 12 bytes header/crc = 25 bytes.
  // So IHDR ends at byte 8 + 4 + 4 + 13 + 4 = 33.
  const insertPos = 33;

  // Check if a pHYs chunk already exists
  let existingPhysOffset = -1;
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const len = new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, false);
    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (chunkType === 'pHYs') {
      existingPhysOffset = offset;
      break;
    }
    if (chunkType === 'IDAT' || chunkType === 'IEND') {
      break;
    }
    offset += 12 + len;
  }

  if (existingPhysOffset !== -1) {
    // Replace existing pHYs chunk
    const existingLen = new DataView(bytes.buffer, bytes.byteOffset).getUint32(existingPhysOffset, false);
    const existingChunkTotalLen = 12 + existingLen;
    const result = new Uint8Array(bytes.length - existingChunkTotalLen + chunkData.length);
    result.set(bytes.subarray(0, existingPhysOffset), 0);
    result.set(chunkData, existingPhysOffset);
    result.set(bytes.subarray(existingPhysOffset + existingChunkTotalLen), existingPhysOffset + chunkData.length);
    return result;
  }

  // Insert after IHDR
  const result = new Uint8Array(bytes.length + chunkData.length);
  result.set(bytes.subarray(0, insertPos), 0);
  result.set(chunkData, insertPos);
  result.set(bytes.subarray(insertPos), insertPos + chunkData.length);
  return result;
}

/**
 * Converts a HTMLCanvasElement into a 300 DPI PNG Blob or ArrayBuffer.
 */
export async function canvasTo300DpiPng(canvas: HTMLCanvasElement, dpi: number = 300): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to generate canvas blob'));
        return;
      }
      try {
        const arrayBuf = await blob.arrayBuffer();
        const dpiBytes = setPngDpi(arrayBuf, dpi);
        resolve(new Blob([dpiBytes.buffer as ArrayBuffer], { type: 'image/png' }));
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
