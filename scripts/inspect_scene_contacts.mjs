import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {sculptSurface} from './sculpt_surface.mjs';

const id=process.argv[2]||'07',suffix=process.argv.includes('--offline')?'-offline':'',path=`.cache/contact-study/${id}${suffix}-meshes.json`,data=JSON.parse(await readFile(path,'utf8'));
const surfaces=data.meshes.map(m=>{
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(m.positions,3));geometry.setIndex(m.indices);geometry.computeBoundingBox();
 return {...m,geometry,bounds:geometry.boundingBox,probe:sculptSurface(geometry)};
});
const sceneId=id.split('-')[0];
const pairs=sceneId==='07'?[
 ['Zephrine','trousers','Oleg','shirt','carried legs against parent clothing'],
 ['Oleg','hand-left','Zephrine','trousers','left supporting grip'],
 ['Oleg','hand-right','Zephrine','trousers','right supporting grip'],
 ['Oleg','face-neck','Zephrine','trousers','head clearance beside carried thighs'],
 ['Oleg','face-neck','Zephrine','shirt','head clears the carried child shirt'],
]:sceneId==='03'?[
 ['Zephrine','hand-right','Charlize','hand-left','paired girls holding hands'],
 ['Charlize','hand-left','Zephrine','hand-right','reverse held-hand clearance'],
]:sceneId==='05'?[
 ['Jane','hand-left','Zephrine','hand-right','mother and child held hands'],
 ['Zephrine','hand-right','Jane','hand-left','child holding mother fingers'],
]:sceneId==='06'?[
 ['Jane','hand-left','Zephrine','shirt','supporting palm against child back'],
 ['Jane','hand-right','Zephrine','trousers','supporting palm beneath child legs'],
 ['Zephrine','trousers','Jane','trousers','child resting on the clothed lap'],
 ['Zephrine','face-neck','Jane','shirt','child face and neck against mother clothing'],
 ['Jane','shirt','Zephrine','shirt','mother sleeves against child shirt'],
 ['Zephrine','shirt','Jane','shirt','child shirt against mother sleeves'],
 ['Jane','shirt','Zephrine','trousers','mother sleeve clears child legs'],
 ['Zephrine','trousers','Jane','shirt','reverse child leg and sleeve clearance'],
]:sceneId==='02'?[
 ['Jane','hand-right','Oleg','shirt','advising palm on the clothed shoulder','advising','job-search'],
 ['Jane','hand-right','Zephrine','face-neck','caregiving hand clear of the child face','caring','with Jane'],
 ['Oleg','hand-left','Jane','shirt','comforting arm grip on the clothed shoulder','embrace','holding Oleg'],
 ['Jane','hand-right','Oleg','shirt','comforting palm on the clothed chest','holding Oleg','embrace'],
 ['Jane','shirt','Oleg','shirt','comforting clothing clearance','holding Oleg','embrace'],
 ['Oleg','shirt','Jane','shirt','reverse comforting clothing clearance','embrace','holding Oleg'],
 ['Oleg','shirt','Jane','face-neck','comforting sleeve clears the neck','embrace','holding Oleg'],
]:sceneId==='09'?[
 ['Jane','hand-right','Zephrine','vest','reassuring hand against the outer vest'],
 ['Jane','hand-right','Zephrine','shirt','reassuring hand clears the inner shirt'],
]:sceneId==='10'?[
 ['Companion','hand-right','Zephrine','hand-left','first friend steadying Zephrine','first child'],
 ['Zephrine','hand-left','Companion','hand-right','reverse first shared grip',null,'first child'],
 ['Zephrine','hand-right','Companion','hand-left','Zephrine holding the second friend',null,'second child'],
 ['Companion','hand-left','Zephrine','hand-right','reverse second shared grip','second child'],
]:[];
const results=[];
for(const [identity,part,other,otherPart,label,sourcePattern,targetPattern] of pairs){
 const match=(m,pattern)=>!pattern||m.actor.replaceAll('_',' ').includes(pattern);
 const a=surfaces.filter(m=>m.identity===identity&&m.part===part&&match(m,sourcePattern)),b=surfaces.filter(m=>m.identity===other&&m.part===otherPart&&match(m,targetPattern));if(!a.length||!b.length)throw Error(`Missing subject surfaces for ${label}`);
 let minimum=Infinity,penetrating=0,maximumDepth=0,worst=null,total=0;
 for(const mesh of a)for(let i=0;i<mesh.geometry.attributes.position.count;i++){
   const p=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i);let distance=Infinity,inside=false;
   for(const target of b){const nearby=target.bounds.clone().expandByScalar(.04).containsPoint(p);if(!nearby)continue;const nearest=target.probe.nearest(p);distance=Math.min(distance,nearest.distance);if(nearest.distance>.001&&target.probe.contains(p)){inside=true;if(nearest.distance>maximumDepth){maximumDepth=nearest.distance;worst=p.toArray();}}}
   minimum=Math.min(minimum,distance);if(inside)penetrating++;total++;
 }
 results.push({label,source:`${identity}/${part}`,target:`${other}/${otherPart}`,sampledVertices:total,minimumVertexSurfaceDistanceM:Number.isFinite(minimum)?minimum:null,verticesDeeperThan1mm:penetrating,maximumSampledPenetrationM:maximumDepth,worstPoint:worst});
}
const report={build:data.build,method:'Exported, posed room surfaces. Vertex-to-triangle distances and closed-surface ray parity. This supplements visual inspection; it does not prove the absence of every triangle intersection.',results};
await writeFile(`.cache/contact-study/${id}${suffix}-report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(results,null,2));
