import * as THREE from "three";

// A quiet pigment wash on the high sky walls. The cloud marks are scenery,
// while trees, architecture, people, and props remain modeled in front of it.
export function paintedSkyTexture(seed = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Work in one unwrapped sky panel. Light washes high above the horizon
  // avoid a blank portrait-phone sky without turning the dome into a roof.
  ctx.scale(2/3, 2/3);
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let layer = 0; layer < 46; layer++) {
    const x = -120 + random() * 1008;
    // Keep a quiet strip right at the pole, where the dome's UVs meet.
    const y = 48 + random() * 278;
    const width = 115 + random() * 260;
    const height = 9 + random() * 26;
    const gradient = ctx.createLinearGradient(0, y - height, 0, y + height);
    gradient.addColorStop(0, "rgba(168,184,192,0)");
    gradient.addColorStop(.32, `rgba(137,164,176,${.065 + random() * .085})`);
    gradient.addColorStop(.68, `rgba(222,204,191,${.075 + random() * .09})`);
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
  // Small warm openings between the cool cloud strokes make the atmosphere
  // feel like layered paint instead of a repeated banded procedural shader.
  for(let i=0;i<18;i++) {
    const x=random()*768,y=67+random()*246,r=20+random()*51;
    const wash=ctx.createRadialGradient(x,y,0,x,y,r);
    wash.addColorStop(0,`rgba(245,226,204,${.055+random()*.07})`);
    wash.addColorStop(1,"rgba(245,226,204,0)");
    ctx.fillStyle=wash;
    ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
