import sharp from "sharp";
import { fileURLToPath } from "node:url";

// The published head texture is painted art, never a source photograph. The
// frontal likeness and the hair around the sides share one UV surface so the
// face does not float in front of a separate, featureless hair helmet.
const strokes = [];
for (let i = 0; i < 72; i++) {
  const x = (i * 61.7) % 1024;
  const y = (i * 37.3) % 330;
  const d = 30 + (i * 13) % 60;
  strokes.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(x + 26).toFixed(1)} ${(y - 12).toFixed(1)} ${(x + d).toFixed(1)} ${(y + 16).toFixed(1)}" fill="none" stroke="${i % 3 ? "#9b7157" : "#302522"}" stroke-width="${1 + i % 3}" opacity=".17"/>`);
}
const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
  <defs>
    <linearGradient id="hair" x1="0" y1="0" x2=".16" y2="1"><stop stop-color="#7c5c49"/><stop offset=".52" stop-color="#49372f"/><stop offset="1" stop-color="#302829"/></linearGradient>
    <linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6b4b3a"/><stop offset=".55" stop-color="#b58a70"/><stop offset="1" stop-color="#6d4b3c"/></linearGradient>
  </defs>
  <rect width="1024" height="512" fill="url(#hair)"/>
  <path d="M0 0H512V512H0Z" fill="url(#front)"/>
  ${strokes.join("")}
</svg>`);
const portrait = await sharp(fileURLToPath(new URL("./assets/room02/oleg-face-v5-reference.webp", import.meta.url)))
  .resize(576, 576)
  .extract({ left: 32, top: 32, width: 512, height: 512 })
  .png().toBuffer();
await sharp(backdrop).composite([{ input: portrait, left: 0, top: 0 }])
  .webp({ quality: 84 })
  .toFile(fileURLToPath(new URL("./assets/room02/oleg-head-atlas.webp", import.meta.url)));
