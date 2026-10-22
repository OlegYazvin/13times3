import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

// CC0 source: https://www.innerscene.com/tools/library/3d-parts/
// relaxed-walk-maya-3d-person-animated-2c6669a2
// Keep the posed body and rig; our own illustrated head, clothes color,
// sleeves, and gestures replace the source styling at authoring time.
const sourceURL = "https://www.innerscene.com/api/library/" +
  "relaxed-walk-maya-3d-person-animated-2c6669a2/download";
const rawPath = resolve(".cache/rigged-casual-maya-original.glb");
const outputPath = resolve("scripts/assets/figures/rigged-casual-maya.glb");
await mkdir(resolve(".cache"), { recursive: true });
await mkdir(resolve("scripts/assets/figures"), { recursive: true });
let original;
try { original = await readFile(rawPath); }
catch {
  const response = await fetch(sourceURL);
  if (!response.ok) throw new Error(`Could not download CC0 figure (${response.status})`);
  original = Buffer.from(await response.arrayBuffer());
  await writeFile(rawPath, original);
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.readBinary(original);
const root = doc.getRoot();
for (const animation of root.listAnimations()) animation.dispose();
const discard = new Set([
  "eyebrow006", "eyelashes01", "Hairline | fine scalp roots",
  "low-poly", "ponytail01", "teeth_base", "Phone",
]);
for (const node of root.listNodes()) if (discard.has(node.getName())) node.dispose();
for (const material of root.listMaterials()) {
  material.setNormalTexture(null);
  if (material.getName().includes("plum satin")) {
    material.setBaseColorTexture(null);
    material.setBaseColorFactor([.12, .17, .25, 1]);
  } else if (material.getName().includes("charcoal tailored")) {
    material.setBaseColorTexture(null);
    material.setBaseColorFactor([.10, .13, .18, 1]);
  }
}
await doc.transform(prune(), dedup(), textureCompress({
  encoder: sharp, targetFormat: "webp", resize: [512, 512], quality: 78,
}));
await io.write(outputPath, doc);
console.log(`Prepared ${outputPath}`);
