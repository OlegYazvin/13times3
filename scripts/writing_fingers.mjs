import * as THREE from 'three';

// Fit the existing anatomical joints, rather than replacing fingers with a
// painted hand or placing a pencil beside an open palm.
export function fitWritingFingers(fingers,angles,deform,getTurn,setTurn){
 const sign=Math.sign(fingers[0][0].x)||1;
 const targets=[new THREE.Vector3(sign*.245,.60,.31),new THREE.Vector3(sign*.155,.60,.31)];
 angles[0]=[-.10,-.10,0];angles[1]=[.45,.75,.30];
 for(let f=2;f<5;f++)angles[f]=[.40,.85,.35];
 setTurn(.35);
 const error=f=>deform(fingers[f][3],f).distanceToSquared(targets[f]);
 for(const step of [.30,.15,.07,.03,.012,.005])for(let pass=0;pass<10;pass++){
  let changed=false;
  for(const f of[0,1])for(let k=0;k<3;k++){
   const before=angles[f][k];let best=error(f),chosen=before;
   for(const delta of[-step,step]){angles[f][k]=THREE.MathUtils.clamp(before+delta,f===0?-.65:0,f===0?1.2:1.9);const e=error(f);if(e<best){best=e;chosen=angles[f][k];}}
   angles[f][k]=chosen;if(chosen!==before)changed=true;
  }
  const before=getTurn();let chosen=before,best=error(0);
  for(const delta of[-step,step]){setTurn(THREE.MathUtils.clamp(before+delta,-1.2,1.4));const e=error(0);if(e<best){best=e;chosen=getTurn();}}
  setTurn(chosen);if(chosen!==before)changed=true;if(!changed)break;
 }
 return {targets,error:targets.map((_,f)=>Math.sqrt(error(f)))};
}
