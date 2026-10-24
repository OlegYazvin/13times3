import * as THREE from 'three';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';
import {sculptSurface} from './sculpt_surface.mjs';

const bytes=await readFile('src/assets/explore/room02/room.glb');
const root=await sceneGeometryFromGLB(bytes);
let actor,plant,features;root.traverse(o=>{if(o.userData.sproutActor)actor=o;if(o.userData.sproutTarget)plant=o;});
assert.ok(actor&&plant,'Retain the requested rejection vignette');
actor.traverse(o=>{if(o.name.replaceAll('_',' ').includes('facial features and hairstyle'))features=o;});
assert.ok(features);
const eye=new THREE.Vector3(0,.145,.085).applyMatrix4(features.matrixWorld);
const target=new THREE.Vector3(0,1,0).applyMatrix4(plant.matrixWorld);
const forward=new THREE.Vector3(0,0,1).transformDirection(features.matrixWorld);
const gazeAngleDeg=THREE.MathUtils.radToDeg(forward.angleTo(target.clone().sub(eye).normalize()));
assert.ok(gazeAngleDeg<7,'Oleg must attend to the sprout');
const cache=new WeakMap();
function surface(mesh){
 if(cache.has(mesh))return cache.get(mesh);
 const p=[],v=new THREE.Vector3(),a=mesh.geometry.attributes.position;
 for(let i=0;i<a.count;i++){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);p.push(...v.toArray());}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setIndex(mesh.geometry.index.clone());
 geometry.computeBoundingBox();const result={geometry,box:geometry.boundingBox,probe:sculptSurface(geometry)};cache.set(mesh,result);return result;
}
const parts=part=>{const result=[];actor.traverse(o=>{if(o.isMesh&&o.userData.storyPart===part)result.push(o);});return result;};
const fist=parts('hand-left')[0],otherHand=parts('hand-right')[0],face=parts('face-neck')[0],shirt=parts('shirt')[0];
assert.ok(fist&&otherHand&&face&&shirt);
const fistSize=surface(fist).box.getSize(new THREE.Vector3()).toArray();
assert.ok(Math.max(...fistSize)<.14,'Raised hand must have a compact curled silhouette');
assert.ok(surface(fist).box.max.y>eye.y+.07,'Fist must be raised beside the head');
const contacts=[];
function wristSeam(mesh){
 // Compression recenters each mesh, so its node origin is not the wrist.
 // Find the actual open boundary ring of the packed anatomical hand.
 const edges=new Map(),index=mesh.geometry.index.array;
 for(let t=0;t<index.length;t+=3)for(let k=0;k<3;k++){
   const a=index[t+k],b=index[t+(k+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);
 }
 const ids=new Set([...edges].filter(([,n])=>n===1).flatMap(([key])=>key.split(':').map(Number)));
 assert.ok(ids.size>8,'An anatomical wrist boundary is required');
 const center=new THREE.Vector3(),v=new THREE.Vector3(),points=[];
 for(const id of ids){mesh.getVertexPosition(id,v).applyMatrix4(mesh.matrixWorld);center.add(v);points.push(v.clone());}
 center.divideScalar(ids.size);
 const normal=new THREE.Vector3();for(let i=2;i<points.length;i++){normal.crossVectors(points[1].clone().sub(points[0]),points[i].clone().sub(points[0]));if(normal.lengthSq()>1e-12)break;}normal.normalize();
 if(normal.dot(surface(mesh).box.getCenter(new THREE.Vector3()).sub(center))<0)normal.negate();
 return {center,normal};
}
for(const hand of[fist,otherHand]){
 const wrist=wristSeam(hand),a=surface(hand).geometry.attributes.position,v=new THREE.Vector3();
 for(const [targetMesh,label]of[[face,'head'],[shirt,'shirt'],...parts('trousers').map(o=>[o,'trousers'])]){
   let minimum=Infinity,penetrating=0,maximumDepth=0,worst=null;
   const targetSurface=surface(targetMesh);
   for(let i=0;i<a.count;i++){
     v.fromBufferAttribute(a,i);
     // The anatomical wrist deliberately enters its sleeve. Check the hand
     // beyond that joined cuff separately from this intended seam.
     if(targetMesh===shirt&&v.clone().sub(wrist.center).dot(wrist.normal)<.030)continue;
     const near=targetSurface.probe.nearest(v);minimum=Math.min(minimum,near.distance);
     if(near.distance>.001&&targetSurface.box.containsPoint(v)&&targetSurface.probe.contains(v)){penetrating++;if(near.distance>maximumDepth){maximumDepth=near.distance;worst={point:v.toArray(),distanceFromWristM:v.distanceTo(wrist.center)};}}
   }
   contacts.push({hand:hand.userData.storyPart,target:label,minimumVertexSurfaceDistanceM:minimum,verticesDeeperThan1mm:penetrating,maximumSampledPenetrationM:maximumDepth});
   assert.equal(penetrating,0,hand.userData.storyPart+' must clear '+label+' beyond its joined cuff: '+JSON.stringify({maximumDepth,worst}));
 }
}
const feet=parts('shoe').map(o=>surface(o).box.min.y);
assert.ok(feet.every(y=>Math.abs(y)<.003),'Both planted shoes meet the floor');
const result={recordedAt:new Date().toISOString(),modelSha256:createHash('sha256').update(bytes).digest('hex'),gazeAngleDeg,fistSizeM:fistSize,shoeBottomsM:feet,contacts,method:'Packed posed surfaces; full hand-vertex distances/containment against head, shirt and trousers, excluding the lower 30 mm wrist/cuff insertion measured from the actual open wrist boundary. Compact fist bounds and head attention supplement multi-angle visual inspection; these checks do not establish artistic likeness or exhaustively prove finger self-contact.'};
if(process.argv.includes('--report'))await writeFile('.cache/sprout-study/geometry.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
