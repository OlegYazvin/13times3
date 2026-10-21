import * as THREE from "three";

// A small shared pigment map adds woven grain and uneven hand-painted folds
// to genuinely volumetric garments. It is reused within each authored room.
const garmentMaterials = new WeakMap();
let clothMap;

function createClothMap() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(256, 256);
  let state = 0x5365ca71;
  const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const drift = 10 * Math.sin(x * .09 + y * .014) + 5 * Math.sin(y * .23);
    const value = Math.max(182, Math.min(255, 231 + drift + (random() - .5) * 18));
    const index = (y * 256 + x) * 4;
    image.data[index] = value;
    image.data[index + 1] = value - 2;
    image.data[index + 2] = value - 5;
    image.data[index + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 24; i++) {
    const x = random() * 256, y = random() * 230;
    const length = 15 + random() * 64;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 3, y + length * .3,
      x - 5, y + length * .7, x + 2, y + length);
    ctx.strokeStyle = `rgba(62,49,48,${.045 + random() * .065})`;
    ctx.lineWidth = 1 + random() * 3;
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.userData.mimeType = "image/png";
  return texture;
}

export function paintedFabric(material) {
  if (garmentMaterials.has(material)) return garmentMaterials.get(material);
  clothMap ||= createClothMap();
  const cloth = material.clone();
  cloth.name = `layered painted cloth from ${material.name || "scene pigment"}`;
  cloth.map = clothMap;
  cloth.roughness = .97;
  cloth.needsUpdate = true;
  garmentMaterials.set(material, cloth);
  return cloth;
}
