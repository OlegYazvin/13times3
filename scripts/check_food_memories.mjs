import * as THREE from 'three';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
const bytes=await readFile('src/assets/explore/room06/room.glb'),root=await sceneGeometryFromGLB(bytes),stations=[];root.traverse(o=>{if(o.userData.foodStation)stations.push(o);});
const v=new THREE.Vector3(),rows=[];
for(const station of stations){
 const objects=[];
 station.traverse(o=>{if(!o.isMesh)return;const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);p.push(...v.toArray());}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(o.geometry.index?Array.from(o.geometry.index.array):Array.from({length:p.length/3},(_,i)=>i));g.computeBoundingBox();let actor=false;for(let a=o;a&&a!==station;a=a.parent)if(a.userData.storyFigure)actor=true;objects.push({o,g,name:o.name.replaceAll('_',' '),actor,box:g.boundingBox,probe:sculptSurface(g)});});
 function sample(part,match,label,closed=true){const hands=objects.filter(m=>m.o.userData.storyPart===part),targets=objects.filter(match);if(!hands.length||!targets.length)throw Error('Missing '+station.userData.foodStation+': '+label);let min=Infinity,depth=0,inside=0;for(const hand of hands){const p=hand.g.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);let penetration=false;for(const target of targets){const n=target.probe.nearest(v);min=Math.min(min,n.distance);if(closed&&n.distance>.001&&target.box.containsPoint(v)&&target.probe.contains(v)){penetration=true;depth=Math.max(depth,n.distance);}}if(penetration)inside++;}}rows.push({food:station.userData.foodStation,part,label,minimumSurfaceDistanceM:min,verticesDeeperThan1mm:inside,maxSampledPenetrationM:depth});}
 const id=station.userData.foodStation;
 if(id==='smoothie')for(const side of['hand-left','hand-right'])sample(side,m=>m.name.startsWith('small smoothie cup'),'palm/cup');
 else if(id==='rice')sample('hand-right',m=>m.name.startsWith('slender spoon handle'),'thumb/index against spoon handle',false);
 else sample('hand-right',m=>!m.actor&&m.box.min.y>.60&&!/table|chair/.test(m.name),'hand and carried food');
 sample('trousers',m=>m.name.startsWith('formed child seat'),'seated thigh support');
}
assert.equal(stations.length,6,'Six distinct toddler food arrangements');
assert.deepEqual(new Set(stations.map(o=>o.userData.foodStation)),new Set(['nigiri','avocado','blueberries','rice','smoothie','chicken']));
assert.equal(rows.length,13,'Seven hand contacts and six supported seats');
for(const row of rows){
 assert.ok(row.minimumSurfaceDistanceM<.0012,`${row.food}: ${row.label} needs real contact`);
 assert.equal(row.verticesDeeperThan1mm,0,`${row.food}: ${row.label} must not penetrate`);
}
const colliders=[];root.traverse(o=>{if(o.userData.solidFootprint){const b=new THREE.Box3().setFromObject(o);assert.ok(!b.isEmpty());assert.ok(b.max.x>b.min.x&&b.max.z>b.min.z,'Solid room geometry needs a valid physical footprint: '+o.name);colliders.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});}});
const manifestPath='src/_data/gallery.json',gallery=JSON.parse(await readFile(manifestPath)),room=gallery.frames.find(f=>f.id==='06').room;
assert.equal(room.caption,'Zephrine eats all the food');assert.equal(room.title,'Jane ended breast feeding');
if(process.argv.includes('--sync-colliders')){room.colliders=colliders;await writeFile(manifestPath,JSON.stringify(gallery,null,2)+'\n');}
else{
 assert.equal(room.colliders.length,colliders.length,'Food room fallback footprint count');
 for(const box of colliders)assert.ok(room.colliders.some(b=>['minX','maxX','minZ','maxZ'].every(k=>Math.abs(b[k]-box[k])<.002)),'Food room fallback follows current geometry');
}
const result={modelSha256:createHash('sha256').update(bytes).digest('hex'),recordedAt:new Date().toISOString(),method:'Full exported hand/trouser vertices against food and chair surfaces. Distances and closed-mesh containment supplement visual inspection; they do not prove all contact coverage. Spoon handle distance is measured without containment because its tube ends are open.',rows,colliders};
if(process.argv.includes('--report'))await writeFile('.cache/food-memories/contacts.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({modelSha256:result.modelSha256,foodMemories:stations.length,contactPairs:rows.length,noSelectedPenetrationOver1mm:true,maxContactGapM:Math.max(...rows.map(r=>r.minimumSurfaceDistanceM)),collisionFootprints:colliders.length}));
