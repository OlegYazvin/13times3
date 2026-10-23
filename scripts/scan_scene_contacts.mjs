import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {sculptSurface} from './sculpt_surface.mjs';
const id=process.argv[2]||'07',data=JSON.parse(await readFile(`.cache/contact-study/${id}-offline-meshes.json`,'utf8'));
const surfaces=data.meshes.map(m=>{
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(m.positions,3));geometry.setIndex(m.indices);geometry.computeBoundingBox();
 return {...m,geometry,bounds:geometry.boundingBox};
});
const findings=[],v=new THREE.Vector3();
for(let i=0;i<surfaces.length;i++)for(let j=i+1;j<surfaces.length;j++){
 const a=surfaces[i],b=surfaces[j];if(a.actor===b.actor||!a.bounds.intersectsBox(b.bounds))continue;
 for(const [source,target] of [[a,b],[b,a]]){
  target.probe??=sculptSurface(target.geometry);
  const p=source.geometry.attributes.position,stride=Math.max(1,Math.ceil(p.count/1800));let count=0,maximum=0,worst=null;
  for(let k=0;k<p.count;k+=stride){v.fromBufferAttribute(p,k);if(!target.bounds.containsPoint(v)||!target.probe.contains(v))continue;
   const {distance}=target.probe.nearest(v);if(distance>.003){count++;if(distance>maximum){maximum=distance;worst=v.toArray();}}
  }
  if(count)findings.push({sourceActor:source.actor,sourcePart:source.part,targetActor:target.actor,targetPart:target.part,sampleStride:stride,samplesDeeperThan3mm:count,maximumSampledDepthM:maximum,worstPoint:worst});
 }
}
findings.sort((a,b)=>b.maximumSampledDepthM-a.maximumSampledDepthM);
const report={build:data.build,method:'Coarse, symmetric vertex sampling against posed exported character surfaces. Flags require exact follow-up and visual classification; gaps and intentional surrealism are not classified by this scan.',findings};
await writeFile(`.cache/contact-study/${id}-scan.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({id,flags:findings.length,deepest:findings.slice(0,8)},null,2));
