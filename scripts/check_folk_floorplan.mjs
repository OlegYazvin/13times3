import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import * as THREE from 'three';
import {RoomManager,collidersFromScene,insideRoomPolygon} from '../client/explore/rooms.mjs';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';import {folkFloorplan,upstairsBarPosition} from './scene12_floorplan.mjs';
const gallery=JSON.parse(await readFile('src/_data/gallery.json')),frame=gallery.frames[11];assert.deepEqual(frame.room.walkablePolygon,folkFloorplan);
const root=await sceneGeometryFromGLB(await readFile('src/assets/explore/room12/room.glb'));let floor,counter,ceiling,stairOuter,stairEnd,bar;
root.traverse(o=>{if(o.userData.venueBar==='beat-kitchen')bar=o;const name=o.name.replaceAll('_',' ');if(name==='enclosed outer stairwell wall')stairOuter=o;if(name==='stairwell end wall below the upstairs roof')stairEnd=o;if(o.isMesh&&name.includes('continuous ceiling fitted'))ceiling=o;if(o.isMesh&&o.userData.beatKitchenCounter)counter=o;if(o.isMesh&&o.name.replaceAll('_',' ').includes('one continuous oak floor fitted'))floor=o;});assert.ok(floor&&counter,'Packed floor and wrapping counter must retain inspectable surfaces');
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
function hit(mesh,x,z){ray.set(new THREE.Vector3(x,3,z),down);return ray.intersectObject(mesh,false)[0]?.point.y??null;}
for(const [x,z]of[[0,-3],[1,-10.2],[-5,-8.7],[3.2,2.8],[-3.2,2.8],[0,8.8]])assert.ok(Math.abs(hit(floor,x,z))<.002,'The packed floor supports its actual room and portal routes');
for(const [x,z]of[[6.6,-3],[-6.8,-10.5],[-1.85,-9]])assert.equal(hit(floor,x,z),null,'No invisible rectangular floor fills a recess or chimney notch');
const [bx,,bz]=upstairsBarPosition;
for(const [x,z]of[[0,.39],[1.30,-.3],[-1.65,.18]])assert.ok(Math.abs(hit(counter,bx+x,bz+z)-1.12)<.002,'Guest-facing counter bands have a continuous supported surface');
for(const [x,z]of[[0,-.4],[1.55,.55],[-1.85,.60]])assert.equal(hit(counter,bx+x,bz+z),null,'The inner well and clipped corners stay empty in the exported mesh');
assert.ok(ceiling&&stairOuter&&stairEnd,'The stair void stays enclosed by actual walls and roof');
ray.set(new THREE.Vector3(6.3,1.5,-2.3),new THREE.Vector3(0,1,0));assert.ok(ray.intersectObject(ceiling,false)[0]?.distance<5,'There is a roof above the interior stairwell');
ray.set(new THREE.Vector3(6.3,1.5,-2.3),new THREE.Vector3(1,0,0));assert.ok(ray.intersectObject(stairOuter,true)[0]?.distance<1.1,'The stairwell side blocks the exterior');
ray.set(new THREE.Vector3(6.3,1.5,-2.3),new THREE.Vector3(0,0,-1));assert.ok(ray.intersectObject(stairEnd,true)[0]?.distance<3.3,'The stairwell end blocks the exterior');
assert.ok(bar,'The upstairs bar retains its coherent arrangement');
const stools=[];bar.traverse(o=>{if(o.name.replaceAll('_',' ').startsWith('fitted bar stool with legs and footrests'))stools.push(o);});assert.equal(stools.length,5);
for(const stool of stools){const b=new THREE.Box3().setFromObject(stool);for(const x of[b.min.x,b.max.x])for(const z of[b.min.z,b.max.z])assert.ok(insideRoomPolygon(x,z,folkFloorplan,.11),'Bar stools must clear the actual room walls');}
const manager=new RoomManager({gallery:{layout:{frames:[]}},player:{x:0,z:-5.1}});manager.active={frame,group:new THREE.Group(),colliders:collidersFromScene(root)};manager.mode='room';
for(const [x,z]of[[-2.3,-7.75],[-4.6,-7.75],[-4.6,-7.1],[-4.6,-7.75],[-2.3,-7.75],[0,-5.1]]){manager.move({x,z});assert.ok(Math.hypot(manager.player.x-x,manager.player.z-z)<.08,'The exported bar has a usable service entrance and exit');}
console.log(JSON.stringify({barServiceEntranceAndExitClear:true,barStoolsClearWalls:true,stairwellEnclosed:true,packedFloorMatchesIrregularPlan:true,stairCutoutHasNoFloor:true,barServiceWellOpen:true,barCornersAreAngled:true,floorVertices:folkFloorplan.length}));
