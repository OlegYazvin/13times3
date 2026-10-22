import * as THREE from "three";

// A layered watercolor wash for a tall, open sky dome. Pigment gathers in
// individual cloud forms instead of making a horizontal theatrical ceiling.
export function paintedSkyTexture(seed = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 768; canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const paper = ctx.createLinearGradient(0, 0, 0, 384);
  paper.addColorStop(0, "#f4f9fa");
  paper.addColorStop(.52, "#dcecf0");
  paper.addColorStop(.8, "#f6f9f7");
  paper.addColorStop(1, "#fffaf3");
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 768, 384);
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  // Short overlapping lobes make local cloud forms without a grey band.
  // Keep the polar seam quiet; buildings and trees remain the foreground.
  // The dome's walkable view samples the lower half of this atlas: the
  // untouched top wraps the unseen polar cap above the player's field of view.
  for(let cloud=0;cloud<26;cloud++) {
    const cx=random()*768,cy=205+random()*117;
    const w=14+random()*25,h=4+random()*8;
    const warm=random()>.72;
    for(let lobe=0;lobe<5;lobe++) {
      const f=(lobe-2)/2;
      const x=cx+f*w*.75+(random()-.5)*3;
      const y=cy-(1-Math.abs(f))*h*.4+(random()-.5)*h*.45;
      const rx=w*(.65+random()*.3);
      const ry=h*(.9+random()*.55);
      const alpha=.43+random()*.18;
      // A spherical atlas joins its left and right edges. Paint a cloud that
      // crosses either edge on both sides so the join cannot cut it in half.
      for(const wrap of [-768,0,768]) {
      ctx.save();ctx.translate(x+wrap,y);ctx.scale(rx,ry);
      const pigment=ctx.createRadialGradient(0,-.23,.05,0,0,1);
      pigment.addColorStop(0,warm?`rgba(255,243,226,${alpha})`:
        `rgba(250,253,250,${alpha})`);
      pigment.addColorStop(.46,warm?`rgba(224,218,204,${alpha*.65})`:
        `rgba(226,236,235,${alpha*.65})`);
      pigment.addColorStop(.82,`rgba(184,197,199,${alpha*.12})`);
      pigment.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=pigment;
      ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();
      ctx.restore();
      }
    }
  }
  // Fine granulation softens the digital gradient without scattering visible
  // disconnected specks across the viewer's path.
  for(let grain=0;grain<1600;grain++) {
    const x=random()*768,y=185+random()*199;
    ctx.fillStyle=random()>.52?"rgba(106,143,158,.027)":"rgba(196,168,154,.025)";
    ctx.fillRect(x,y,.6+random()*1.2,.6+random()*1.2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}
