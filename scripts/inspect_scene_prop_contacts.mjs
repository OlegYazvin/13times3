import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';
import {subjectMeshesInRoot} from '../client/explore/subject-meshes.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
const id=process.argv[2]||'04',bytes=await readFile(`src/assets/explore/room${id}/room.glb`),root=await sceneGeometryFromGLB(bytes),subjects=subjectMeshesInRoot(root),props=[];
const inverse=root.matrixWorld.clone().invert(),point=new THREE.Vector3();
root.traverse(o=>{
 if(!o.isMesh)return;
 // Meshopt may expose normalized integer attributes. Decode to floating point
 // before transforming; applying a world matrix to their integer buffers
 // would clamp/wrap room coordinates and invalidate every distance.
 const positions=[];for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,point).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);positions.push(...point.toArray());}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(o.geometry.index?Array.from(o.geometry.index.array):Array.from({length:positions.length/3},(_,i)=>i));geometry.computeBoundingBox();props.push({name:o.name.replaceAll('_',' '),geometry,bounds:geometry.boundingBox});
});
const pairs=id==='04'?[
 ['Zephrine','shoe','recessed molded footwell floor','feet against the molded footwell'],
 ['Zephrine','shoe','solid curved blue Whisper Ride inspired body','shoe clearance inside the cabin shell'],
 ['Zephrine','trousers','dark recessed seat','thigh support on the seat'],
 ['Zephrine','shirt','solid rising seat back','back clearance against the molded seat'],
 ['Zephrine','hand-left','working-looking toy steering wheel','left steering grip'],
 ['Zephrine','hand-right','working-looking toy steering wheel','right steering grip'],
 ['Jane','hand-left','shared parent push grip','Jane pushing the actual grip'],
 ['Oleg','hand-right','shared parent push grip','Oleg pushing the actual grip'],
]:id==='09'?[
 ['Zephrine','hand-left','closed first apple with an actual concave bite','left palm and fingers beneath the first apple'],
 ['Zephrine','hand-right','closed first apple with an actual concave bite','right palm and fingers beneath the first apple'],
]:id==='01'?[
 ['Jane','hand-left','shaped walnut signup desk top','resting hand on the actual signup desk'],
 ['Jane','writing-pen','desk paper','pencil tip on the supported signup paper'],
 ['Jane','trousers','formed wooden chair seat beneath the seated thighs','signup chair supporting the seated thighs'],
]:id==='02'?[
 ['Jane','hand-right','pan handle','household grip on the actual pan handle','keeping the household'],
 ['Jane','hand-left','home counter','resting household hand on the counter','keeping the household'],
 ['Zephrine','hand-left','soft child blanket draped','child index touching the shared cloth',null,false],
]:[];
if(!pairs.length)throw Error(`No prop contact arrangement registered for scene ${id}`);
const results=[],v=new THREE.Vector3();
for(const [identity,part,name,label,actorPattern,closed=true] of pairs){
 const source=subjects.filter(m=>m.identity===identity&&m.part===part&&(!actorPattern||m.actor.replaceAll('_',' ').includes(actorPattern))),targets=props.filter(m=>m.name.startsWith(name));if(!source.length||!targets.length)throw Error(`Missing actual exported surfaces for ${label}`);
 for(const target of targets)target.probe??=sculptSurface(target.geometry);
 let minimum=Infinity,penetrating=0,maximumDepth=0,nearest=null,total=0;
 for(const mesh of source)for(let i=0;i<mesh.positions.length;i+=3){v.fromArray(mesh.positions,i);total++;let inside=false;for(const target of targets){const near=target.probe.nearest(v);if(near.distance<minimum){minimum=near.distance;nearest={source:v.toArray(),target:near.point.toArray()};}if(closed&&near.distance>.001&&target.bounds.containsPoint(v)&&target.probe.contains(v)){inside=true;maximumDepth=Math.max(maximumDepth,near.distance);}}if(inside)penetrating++;}
 results.push({label,identity,part,target:name,vertices:total,minimumVertexSurfaceDistanceM:minimum,containmentTested:closed,verticesDeeperThan1mm:closed?penetrating:null,maximumSampledPenetrationM:closed?maximumDepth:null,nearest});
}
const report={build:{id,modelSha256:createHash('sha256').update(bytes).digest('hex'),recordedAt:new Date().toISOString()},method:'Every posed source vertex against actual decoded prop triangles. Closed prop containment supplements distance; visual inspection and support coverage remain separate requirements.',results};await writeFile(`.cache/contact-study/${id}-prop-contacts.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(results.map(({nearest,...r})=>r),null,2));
