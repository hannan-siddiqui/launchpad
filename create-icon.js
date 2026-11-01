const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      raw[pixelOffset] = r;
      raw[pixelOffset + 1] = g;
      raw[pixelOffset + 2] = b;
      raw[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, chunk('IHDR', ihdr), idat, iend]);
}

// Generate 256x256 high-resolution macOS Launchpad Rocket Icon
const iconPng = createPng(256, 256, (x, y, w, h) => {
  const cx = 128;
  const cy = 128;
  const rx = Math.abs(x - cx);
  const ry = Math.abs(y - cy);
  const cornerR = 54;
  const half = 114;

  // Squircle plate
  let inPlate = false;
  if (rx <= half && ry <= half) {
    if (rx > half - cornerR && ry > half - cornerR) {
      const dx = rx - (half - cornerR);
      const dy = ry - (half - cornerR);
      inPlate = (dx * dx + dy * dy) <= cornerR * cornerR;
    } else {
      inPlate = true;
    }
  }

  if (!inPlate) return [0, 0, 0, 0];

  // 3x3 Grid Dots inside Launchpad
  const startX = 66;
  const startY = 66;
  const spacing = 48;
  const dotRadius = 12;

  let inDot = false;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const dotX = startX + c * spacing + 14;
      const dotY = startY + r * spacing + 14;
      const d = Math.sqrt((x - dotX)**2 + (y - dotY)**2);
      if (d <= dotRadius) {
        inDot = true;
        break;
      }
    }
    if (inDot) break;
  }

  if (inDot) {
    return [255, 255, 255, 255]; // Crisp white dots
  }

  // Vibrant gradient background (Deep Indigo to Radiant Magenta/Cyan)
  const grad = (x + y) / 512;
  const r = Math.round(79 * (1 - grad) + 168 * grad);
  const g = Math.round(70 * (1 - grad) + 85 * grad);
  const b = Math.round(229 * (1 - grad) + 247 * grad);

  return [r, g, b, 250];
});

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconPng);
console.log('High-res 256x256 icon generated at assets/icon.png');
