// "The World on Thursday" — entry program for make.fun's
// "Sum up 26 November's world news in one image" bounty ($100 in USDC).
//
// The entry is one picture: a broadsheet front page that sums up the world
// news of Thursday 26 November 2026. The composed image ships in this
// repository as entry.png (see frontpage.html for how it was laid out, and
// assets/ for the hero illustration of a drone over Gulf waters as a
// tanker burns on the horizon). The image itself was composed by
// rendering frontpage.html at 1024 by 1024 in headless Chrome; see
// build-image.mjs. This program writes that image, byte for
// byte, to /output/entry.png, after checking it against the bounty's
// limits: a whole PNG of at most 1 MiB and at most 1024 by 1024 pixels.
// It uses no network and no clock, so every run writes the same bytes.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024; // 1 MiB
const MAX_SIDE = 1024; // pixels

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const outputDir = process.env.MAKEFUN_OUTPUT ?? "/output";
const outputPath = join(outputDir, "entry.png");

/** Read a big-endian unsigned 32-bit integer from a byte buffer. */
function u32be(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 2 ** 24 +
    bytes[offset + 1] * 2 ** 16 +
    bytes[offset + 2] * 2 ** 8 +
    bytes[offset + 3]
  );
}

/** The 8-byte signature every PNG file starts with. */
function hasPngSignature(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return signature.every((value, index) => bytes[index] === value);
}

/** Width and height from the PNG IHDR chunk, which follows the signature. */
function pngSize(bytes: Uint8Array): { width: number; height: number } {
  return { width: u32be(bytes, 16), height: u32be(bytes, 20) };
}

function main(): void {
  if (!existsSync(sourcePath)) {
    throw new Error(`entry image is missing from the repository: ${sourcePath}`);
  }
  const bytes = readFileSync(sourcePath);
  if (!hasPngSignature(bytes)) {
    throw new Error("entry.png is not a PNG file");
  }
  const { width, height } = pngSize(bytes);
  if (width > MAX_SIDE || height > MAX_SIDE) {
    throw new Error(`entry.png is ${width}x${height}, over the ${MAX_SIDE}px limit`);
  }
  if (bytes.length > MAX_BYTES) {
    throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }

  mkdirSync(outputDir, { recursive: true });
  copyFileSync(sourcePath, outputPath);

  const written = statSync(outputPath).size;
  if (written !== bytes.length) {
    throw new Error(`wrote ${written} bytes, expected ${bytes.length}`);
  }
  console.log(`entry.png: ${width}x${height}, ${written} bytes -> ${outputPath}`);
}

main();
