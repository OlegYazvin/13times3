import * as THREE from "three";

// A quiet pigment wash on the high sky walls. The cloud marks are scenery,
// while trees, architecture, people, and props remain modeled in front of it.
export function paintedSkyTexture(seed = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 384; canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Cloud strokes use the original logical coordinates; the smaller texture
  // keeps all seven outdoor worlds within their mobile download budgets.
  ctx.scale(.5, .5);
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let layer = 0; layer < 28; layer++) {
    const x = -130 + random() * 1000;
    // Leave the zenith plain so the cloud wash meets the high roof without a
    // visible rectangular edge when viewed from the painting or inside.
    const y = 172 + random() * 153;
    const width = 90 + random() * 210;
    const height = 7 + random() * 19;
    const gradient = ctx.createLinearGradient(0, y - height, 0, y + height);
    gradient.addColorStop(0, "rgba(168,184,192,0)");
    gradient.addColorStop(.42, `rgba(154,177,184,${.035 + random() * .045})`);
    gradient.addColorStop(.7, `rgba(211,200,190,${.055 + random() * .055})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.bezierCurveTo(x - width * .29, y - height * .76,
      x + width * .25, y - height * (.42 + random() * .5), x + width / 2, y);
    ctx.bezierCurveTo(x + width * .24, y + height * .76,
      x - width * .22, y + height * .63, x - width / 2, y);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
