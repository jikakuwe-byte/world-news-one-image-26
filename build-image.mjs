// Build script (development tool, not the graded entrypoint):
// renders frontpage.html at exactly 1024x1024 with headless Chrome and
// saves the screenshot as entry.png, the image main.ts ships.
// Usage: node build-image.mjs [chrome-binary]
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const chrome =
  process.argv[2] ??
  process.env.CHROME_BIN ??
  "google-chrome";
const page = pathToFileURL(join(here, "frontpage.html")).href;
const out = join(here, "entry.png");

const result = spawnSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1024,1024",
    `--screenshot=${out}`,
    page,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) {
  throw new Error(`chrome exited with status ${result.status}`);
}
console.log(`wrote ${out}`);
