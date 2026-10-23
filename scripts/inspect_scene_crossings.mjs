import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {sculptSurface} from './sculpt_surface.mjs';
const id=process.argv[2]||'06',data=JSON.parse(await readFile(`.cache/contact-study/${id}-offline-meshes.json`)),scan=JSON.parse(await readFile(`.cache/contact-study/${id}-scan.json`));
const meshes=data.meshes.map(m=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(m.positions,3));g.setIndex(m.indices);g.computeBoundingBox();return{...m,g,bounds:g.boundingBox};});
const results=[],done=new Set();
const explicit=process.argv.length>=7?[{sourceActor:meshes.find(m=>m.identity===process.argv[3])?.actor,sourcePart:process.argv[4],targetActor:meshes.find(m=>m.identity===process.argv[5])?.actor,targetPart:process.argv[6]}]:scan.findings;
for(const flag of explicit){
 const key=[`${flag.sourceActor}/${flag.sourcePart}`,`${flag.targetActor}/${flag.targetPart}`].sort().join('|');if(done.has(key))continue;done.add(key);
 const from=meshes.filter(m=>m.actor===flag.sourceActor&&m.part===flag.sourcePart),to=meshes.filter(m=>m.actor===flag.targetActor&&m.part===flag.targetPart);let edgesTested=0,crossings=0;const points=[];
 for(const source of from)for(const target of to){target.probe??=sculptSurface(target.g);const p=source.g.attributes.position,index=source.g.index.array,edges=new Set(),a=new THREE.Vector3(),b=new THREE.Vector3(),direction=new THREE.Vector3(),box=new THREE.Box3();
  for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){
   const u=index[i+j],v=index[i+(j+1)%3],edge=u<v?`${u}:${v}`:`${v}:${u}`;if(edges.has(edge))continue;edges.add(edge);a.fromBufferAttribute(p,u);b.fromBufferAttribute(p,v);box.setFromPoints([a,b]);if(!box.intersectsBox(target.bounds))continue;
   direction.copy(b).sub(a);const length=direction.length();if(length<1e-7)continue;direction.divideScalar(length);edgesTested++;const hit=target.probe(a.clone().addScaledVector(direction,.00005),direction);
   if(hit&&hit.distanceTo(a)>.0001&&hit.distanceTo(a)<length-.0001){crossings++;if(points.length<8)points.push(hit.toArray());}
  }
 }
 results.push({source:`${flag.sourceActor}/${flag.sourcePart}`,target:`${flag.targetActor}/${flag.targetPart}`,edgesTested,crossings,examples:points});
}
const pairSuffix=process.argv.length>=7?'-'+process.argv.slice(3,7).join('-'):'';
await writeFile(`.cache/contact-study/${id}-crossings${pairSuffix}.json`,JSON.stringify({build:data.build,method:'Actual source mesh edges intersecting target triangles, independent of closed-surface ray parity. Coplanar contact and a fully enclosed object may have no crossings; this supplements distance and visual inspection.',results},null,2));console.log(JSON.stringify(results.map(({examples,...r})=>r),null,2));
