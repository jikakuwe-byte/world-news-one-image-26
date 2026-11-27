// "The World on Thursday" — the entry program for make.fun's
// "Sum up 26 November's world news in one image" bounty ($100 in USDC).
//
// What this entry is: one picture, a broadsheet front page that sums up
// the world news of Thursday 26 November 2026. The picture is
// frontpage.html rendered at 1024 by 1024 in headless Chrome (see
// build-image.mjs), saved in this repository as entry.png, with a hero
// illustration of a drone over Gulf waters while a tanker burns on the
// horizon. This program does nothing creative: it checks that picture
// against the bounty's limits — a PNG, at most 1024 by 1024 pixels, at
// most 1 MiB — and copies it, byte for byte, to /output/entry.png.
// It reads no clock and touches no network, so repeated runs write
// identical bytes.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The bounty's limits for the delivered image.
const MAX_BYTES = 1024 * 1024;
const MAX_SIDE_PX = 1024;

// Every PNG begins with these eight bytes.
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT ?? "/output";
const outPath = join(outDir, "entry.png");

/** True when the buffer opens with the PNG magic bytes. */
function isPng(bytes: Uint8Array): boolean {
  return PNG_MAGIC.every((magic, i) => bytes[i] === magic);
}

/**
 * Width and height of a PNG, read from its IHDR chunk with a DataView.
 * The IHDR chunk starts right after the 8-byte signature: 4 bytes of
 * length, 4 bytes spelling IHDR, then width and height as big-endian
 * 32-bit integers at offsets 16 and 20. Reading them as unsigned
 * 32-bit values keeps the check exact for any image under the limit.
 */
function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

/** Refuse anything that is not the single image this entry promises. */
function checkImage(bytes: Uint8Array): { width: number; height: number } {
  if (!isPng(bytes)) {
    throw new Error("entry.png is not a PNG file");
  }
  const { width, height } = pngDimensions(bytes);
  if (width > MAX_SIDE_PX || height > MAX_SIDE_PX) {
    throw new Error(`entry.png is ${width}x${height}, over the ${MAX_SIDE_PX}px limit`);
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  return { width, height };
}

function main(): void {
  if (!existsSync(source)) {
    throw new Error(`entry image is missing from the repository: ${source}`);
  }
  const bytes = readFileSync(source);
  const { width, height } = checkImage(bytes);

  mkdirSync(outDir, { recursive: true });
  copyFileSync(source, outPath);

  // The copy must be exact: same byte count as the checked original.
  const written = statSync(outPath).size;
  if (written !== bytes.length) {
    throw new Error(`wrote ${written} bytes, expected ${bytes.length}`);
  }
  console.log(`entry.png: ${width}x${height}, ${written} bytes -> ${outPath}`);
}

main();
