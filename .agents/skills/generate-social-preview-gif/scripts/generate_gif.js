const fs = require('fs');
const path = require('path');

function encodeFrame(width, height, delayCentisecs, t) {
  const pulseX = Math.round(50 + t * 540);
  const opacity = 0.6 + 0.4 * Math.sin(t * Math.PI * 2);

  const palette = [
    13, 17, 23,     // 0: Dark bg (#0d1117)
    22, 27, 34,     // 1: Card bg (#161b22)
    28, 33, 40,     // 2: Card inner (#1c2128)
    48, 54, 61,     // 3: Border grey (#30363d)
    255, 255, 255, // 4: White text (#ffffff)
    88, 166, 255,  // 5: Blue title (#58a6ff)
    139, 148, 158, // 6: Grey text (#8b949e)
    255, 94, 98,   // 7: Red pulse (#ff5e62)
    255, 153, 102, // 8: Orange gradient (#ff9966)
    79, 172, 254,  // 9: Cyan accent (#4facfe)
    126, 231, 135, // 10: Green badge (#7ee787)
    121, 192, 255, // 11: Light blue badge (#79c0ff)
    255, 166, 87,  // 12: Orange badge (#ffa657)
    33, 38, 45     // 13: Badge fill (#21262d)
  ];

  while (palette.length < 256 * 3) {
    palette.push(0);
  }

  const pixels = new Uint8Array(width * height);
  pixels.fill(0);

  // 50px Padding top/bottom: y bounds between 50 and 270
  for (let y = 50; y < 270; y++) {
    for (let x = 20; x < 620; x++) {
      if (y === 50 || y === 269 || x === 20 || x === 619) {
        pixels[y * width + x] = 3;
      } else {
        pixels[y * width + x] = 2;
      }
    }
  }

  // Shield Icon
  for (let y = 95; y <= 155; y++) {
    for (let x = 65; x <= 110; x++) {
      if (Math.abs(x - 87.5) + (y - 95) * 0.5 < 22 && y < 145) {
        if (x === 65 || x === 110 || y === 95 || y === 145) pixels[y * width + x] = 7;
        else pixels[y * width + x] = 8;
      }
    }
  }

  // Title Representation
  for (let y = 100; y < 120; y++) {
    for (let x = 135; x < 450; x++) pixels[y * width + x] = 4;
  }

  // Subtitle Representation
  for (let y = 128; y < 144; y++) {
    for (let x = 135; x < 400; x++) pixels[y * width + x] = 5;
  }

  // Description Representation
  for (let y = 152; y < 162; y++) {
    for (let x = 135; x < 580; x++) pixels[y * width + x] = 6;
  }

  // Sine Wave Line
  for (let x = 40; x < 600; x++) {
    const waveY = Math.round(210 + 12 * Math.sin((x + t * 640) * 0.02));
    if (waveY >= 50 && waveY < 270) {
      pixels[waveY * width + x] = 9;
      if (waveY + 1 < 270) pixels[(waveY + 1) * width + x] = 9;
    }
  }

  // Pulse Dot
  if (pulseX >= 40 && pulseX <= 600) {
    const dotY = Math.round(210 + 12 * Math.sin((pulseX + t * 640) * 0.02));
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy <= 16) {
          const px = pulseX + dx;
          const py = dotY + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            pixels[py * width + px] = 7;
          }
        }
      }
    }
  }

  // Badges
  for (let y = 232; y < 256; y++) {
    for (let x = 60; x < 180; x++) pixels[y * width + x] = (y === 232 || y === 255 || x === 60 || x === 179) ? 10 : 13;
    for (let x = 200; x < 330; x++) pixels[y * width + x] = (y === 232 || y === 255 || x === 200 || x === 329) ? 11 : 13;
    for (let x = 350; x < 470; x++) pixels[y * width + x] = (y === 232 || y === 255 || x === 350 || x === 469) ? 12 : 13;
  }

  return { pixels, palette };
}

function lzwEncode(width, height, pixels, minCodeSize) {
  const buf = [];
  let clearCode = 1 << minCodeSize;
  let eofCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let maxCode = (1 << codeSize) - 1;

  let dictionary = new Map();
  function resetDict() {
    dictionary.clear();
    for (let i = 0; i < clearCode; i++) dictionary.set(String.fromCharCode(i), i);
    codeSize = minCodeSize + 1;
    maxCode = (1 << codeSize) - 1;
  }

  let curBits = 0;
  let curVal = 0;

  function outputCode(code) {
    curVal |= (code << curBits);
    curBits += codeSize;
    while (curBits >= 8) {
      buf.push(curVal & 0xff);
      curVal >>= 8;
      curBits -= 8;
    }
  }

  resetDict();
  outputCode(clearCode);

  let ent = String.fromCharCode(pixels[0]);
  let nextCode = eofCode + 1;

  for (let i = 1; i < pixels.length; i++) {
    let k = String.fromCharCode(pixels[i]);
    let ek = ent + k;
    if (dictionary.has(ek)) {
      ent = ek;
    } else {
      outputCode(dictionary.get(ent));
      if (nextCode < 4096) {
        dictionary.set(ek, nextCode++);
        if (nextCode > maxCode && codeSize < 12) {
          codeSize++;
          maxCode = (1 << codeSize) - 1;
        }
      } else {
        outputCode(clearCode);
        resetDict();
        nextCode = eofCode + 1;
      }
      ent = k;
    }
  }

  outputCode(dictionary.get(ent));
  outputCode(eofCode);

  if (curBits > 0) buf.push(curVal & 0xff);

  const subblocks = [minCodeSize];
  let idx = 0;
  while (idx < buf.length) {
    let chunkSize = Math.min(255, buf.length - idx);
    subblocks.push(chunkSize);
    for (let i = 0; i < chunkSize; i++) subblocks.push(buf[idx + i]);
    idx += chunkSize;
  }
  subblocks.push(0);

  return Buffer.from(subblocks);
}

function generateSocialPreviewGIF() {
  const width = 640;
  const height = 320;
  const numFrames = 12;
  const gifParts = [];

  gifParts.push(Buffer.from('GIF89a'));

  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(width, 0);
  lsd.writeUInt16LE(height, 2);
  lsd[4] = 0x70;
  lsd[5] = 0;
  lsd[6] = 0;
  gifParts.push(lsd);

  const netscape = Buffer.from([
    0x21, 0xFF, 0x0B,
    0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30,
    0x03, 0x01, 0x00, 0x00, 0x00
  ]);
  gifParts.push(netscape);

  for (let f = 0; f < numFrames; f++) {
    const t = f / numFrames;
    const { pixels, palette } = encodeFrame(width, height, 10, t);

    const gce = Buffer.from([0x21, 0xF9, 0x04, 0x04, 10, 0, 0, 0]);
    gifParts.push(gce);

    const id = Buffer.alloc(10);
    id[0] = 0x2C;
    id.writeUInt16LE(0, 1);
    id.writeUInt16LE(0, 3);
    id.writeUInt16LE(width, 5);
    id.writeUInt16LE(height, 7);
    id[9] = 0x87;
    gifParts.push(id);

    gifParts.push(Buffer.from(palette));
    gifParts.push(lzwEncode(width, height, pixels, 8));
  }

  gifParts.push(Buffer.from([0x3B]));

  const finalBuffer = Buffer.concat(gifParts);
  const targetDir = path.join(process.cwd(), 'assets');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, 'preview.gif');
  fs.writeFileSync(outputPath, finalBuffer);
  console.log(`Successfully generated ${outputPath} (${finalBuffer.length} bytes)`);
}

generateSocialPreviewGIF();
