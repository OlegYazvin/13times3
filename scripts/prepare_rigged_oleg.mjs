import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsSpecular, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

// CC0 source: https://www.innerscene.com/tools/library/3d-parts/
// relaxed-walk-sam-3d-person-animated-732f1206
// Only a fitted clothed body and its skeleton are reused; the original face,
// hair, animation and unrelated handheld prop are removed. See
// docs/rigged-figure-source.md for the artistic and license decisions.
const sourceURL = "https://www.innerscene.com/api/library/" +
  "relaxed-walk-sam-3d-person-animated-732f1206/download";
const rawPath = resolve(".cache/rigged-casual-sam-original.glb");
const outputPath = resolve("scripts/assets/figures/rigged-casual-sam.glb");
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
const io = new NodeIO().registerExtensions([KHRMaterialsSpecular, EXTTextureWebP]);
const doc = await io.readBinary(original);
const root = doc.getRoot();
for (const animation of root.listAnimations()) animation.dispose();
const discard = new Set([
  "eyebrow001", "eyelashes01", "Hairline | fine scalp roots", "low-poly",
  "short01", "teeth_base", "Phone",
]);
for (const node of root.listNodes()) if (discard.has(node.getName())) node.dispose();
for (const material of root.listMaterials()) {
  material.setNormalTexture(null);
  if (material.getName().includes("original top")) {
    material.setBaseColorTexture(null);
    material.setBaseColorFactor([.8, .73, .62, 1]);
  } else if (material.getName().includes("original bottom")) {
    material.setBaseColorTexture(null);
    material.setBaseColorFactor([.08, .12, .19, 1]);
  }
}
await doc.transform(prune(), dedup(), textureCompress({
  encoder: sharp, targetFormat: "webp", resize: [512, 512], quality: 78,
}));
await io.write(outputPath, doc);
console.log(`Prepared ${outputPath}`);
