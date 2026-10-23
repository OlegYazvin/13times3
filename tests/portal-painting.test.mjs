import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {portalCanvas,portalOpening} from '../client/explore/layout.mjs';
import {portalPreviewCamera} from '../scripts/portal_preview_camera.mjs';
const frames=JSON.parse(readFileSync(new URL('../src/_data/gallery.json',import.meta.url))).frames.filter(f=>f.room.modelUrl);

test('painting corners project through the physical opening, including the short cave',()=>{
 for(const frame of frames){
   const {room}=frame,{width,height,bottom}=portalCanvas(room),opening=portalOpening(frame),camera=portalPreviewCamera(room),portal=room.portalZ??room.dimensionsM[2]/2;
   assert.ok(Math.abs(height+bottom-opening.height)<1e-9,`${frame.id}: painting ends at the lintel`);
   camera.updateMatrixWorld(true);
   for(const [x,y,nx,ny] of [[-width/2,bottom,-1,-1],[width/2,bottom+height,1,1]]){
     const projected=new THREE.Vector3(x,y,portal+.23).project(camera);
     assert.ok(Math.abs(projected.x-nx)<1e-9&&Math.abs(projected.y-ny)<1e-9,`${frame.id}: matching corner rays`);
   }
 }
 assert.ok(Math.abs(portalCanvas(frames[0].room).height-3.27)<1e-9);
});
