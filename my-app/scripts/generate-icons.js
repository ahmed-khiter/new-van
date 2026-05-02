// Generates all Swipped app icon PNGs from SVG templates.
// Run with: node scripts/generate-icons.js
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "../src/assets/images");

// ─── S lettermark path (1024×1024 canvas) ────────────────────────────────────
// Traced as a single open cubic-bezier stroke: top-right → top → left-mid →
// waist → right-mid → bottom → bottom-left. Stroke + round linecaps complete
// the letterform without needing a complex glyph outline.
const S_PATH = [
  "M 655 218",
  "C 655 152, 585 126, 512 126",
  "C 435 126, 306 176, 306 288",
  "C 306 400, 412 440, 512 478",
  "C 612 516, 718 556, 718 668",
  "C 718 778, 608 898, 512 898",
  "C 416 898, 306 840, 306 760",
].join(" ");

// Stroke weight & color
const SW = 106;       // stroke-width
const PINK = "#ff4d77";
const NAVY = "#1a1a2e";
const NAVY_MID = "#1e1d33";  // very slightly lighter for gradient centre

// ─── SVG templates ───────────────────────────────────────────────────────────

function svgMain(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="60%">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="44%">
      <stop offset="0%" stop-color="${PINK}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${PINK}" stop-opacity="0"/>
    </radialGradient>
    <filter id="fg" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="400" fill="url(#glow)"/>
  <path d="${S_PATH}"
    fill="none" stroke="${PINK}"
    stroke-width="${SW}" stroke-linecap="round"
    filter="url(#fg)"/>
</svg>`;
}

// Splash variant — slightly tighter composition, same proportions as main
const svgSplash = svgMain;

function svgForeground(size) {
  // Android adaptive foreground: S on transparent background
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <defs>
    <filter id="fg" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <path d="${S_PATH}"
    fill="none" stroke="${PINK}"
    stroke-width="${SW}" stroke-linecap="round"
    filter="url(#fg)"/>
</svg>`;
}

function svgBackground(size) {
  // Android adaptive background: flat navy fill
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="60%">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;
}

function svgMonochrome(size) {
  // Android monochrome: white S on black
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <rect width="1024" height="1024" fill="#000000"/>
  <path d="${S_PATH}"
    fill="none" stroke="#ffffff"
    stroke-width="${SW}" stroke-linecap="round"/>
</svg>`;
}

function svgFavicon(size) {
  // Web favicon: rounded corners, simplified (no blur at small size)
  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="60%">
      <stop offset="0%" stop-color="${NAVY_MID}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
    <clipPath id="round">
      <rect width="1024" height="1024" rx="220" ry="220"/>
    </clipPath>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)" rx="220"/>
  <g clip-path="url(#round)">
    <path d="${S_PATH}"
      fill="none" stroke="${PINK}"
      stroke-width="${SW}" stroke-linecap="round"/>
  </g>
</svg>`;
}

// ─── Generator ───────────────────────────────────────────────────────────────

function write(svgString, filename) {
  const resvg = new Resvg(svgString);
  const png = resvg.render().asPng();
  const dest = path.join(OUT, filename);
  fs.writeFileSync(dest, png);
  const kb = (png.length / 1024).toFixed(1);
  console.log(`  ✓  ${filename.padEnd(36)} ${kb} KB`);
}

console.log("\nGenerating Swipped icons…\n");
write(svgMain(1024),        "icon.png");
write(svgSplash(1024),      "splash-icon.png");
write(svgForeground(1024),  "android-icon-foreground.png");
write(svgBackground(1024),  "android-icon-background.png");
write(svgMonochrome(1024),  "android-icon-monochrome.png");
write(svgFavicon(48),       "favicon.png");
console.log("\nDone.\n");
