import * as THREE from "three";

// A restrained pigment wash for the inside of a tall sky dome. Local cloud
// blooms avoid the horizontal UV bands that resemble a painted ceiling.
export function paintedSkyTexture(seed = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 768, 384);
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  // Each cloud is a few translucent watercolor blooms, never a panorama-
  // length stroke. Leave the polar UV seam quiet at the very top.
  for(let cloud=0;cloud<28;cloud++) {
    const cx=random()*768,cy=48+random()*264;
    const w=18+random()*49,h=8+random()*16;
    for(let lobe=0;lobe<3;lobe++) {
      const x=cx+(lobe-1)*w*.43+(random()-.5)*7;
      const y=cy+(random()-.5)*h*.32;
      ctx.save();ctx.translate(x,y);ctx.scale(w*(.6+random()*.33),h);
      const pigment=ctx.createRadialGradient(0,0,.05,0,0,1);
      const alpha=.075+random()*.07;
      pigment.addColorStop(0,lobe===1?`rgba(142,165,175,${alpha})`:
        `rgba(209,194,184,${alpha*.85})`);
      pigment.addColorStop(.55,`rgba(189,201,202,${alpha*.45})`);
      pigment.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=pigment;
      ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
