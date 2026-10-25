import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoomManager,collidersFromScene} from '../client/explore/rooms.mjs';
import {roomFloorHeight} from '../client/explore/room-floors.mjs';
import {officeWalkSurfaces,officeRoute} from '../scripts/scene05_office_plan.mjs';
const frame={room:{dimensionsM:[12.6,9,34],portalZ:8.9,walkSurfaces:officeWalkSurfaces}};
function manager(colliders=[]){const m=new RoomManager({gallery:{layout:{frames:[]}},player:{x:2,y:1.65,z:1}});m.active={frame,group:new THREE.Group(),colliders};m.mode='room';return m;}
test('the visitor climbs both turning flights continuously and returns to the foyer',()=>{
 const m=manager();let previous=m.player.y;
 for(const point of officeRoute){m.move({x:point[0],z:point[1]});assert.ok(Math.hypot(m.player.x-point[0],m.player.z-point[1])<.08,JSON.stringify({point,actual:m.player}));assert.ok(m.player.y>=previous-.001);previous=m.player.y;}
 assert.ok(Math.abs(m.player.y-4.85)<1e-5);
 for(const [x,z]of [...officeRoute].reverse())m.move({x,z});
 assert.ok(Math.abs(m.player.y-1.65)<1e-5);
});
test('the upper floor cannot be reached by stepping across the void or a floor-height jump',()=>{
 assert.equal(roomFloorHeight(frame.room,0,-7,0),null);
 assert.equal(roomFloorHeight(frame.room,5.6,-3,0),null);
 assert.equal(roomFloorHeight(frame.room,0,-12,3.2),3.2);
 assert.equal(roomFloorHeight({},0,0,3.2),0);
 const m=manager();m.move({x:0,z:-12});assert.ok(m.player.z>-6.36);assert.equal(m.player.y,1.65);
});
test('upper furniture blocks at the office floor, with height-specific collision',()=>{
 const m=manager([{minX:-.3,maxX:.3,minZ:-12.3,maxZ:-11.7,minY:3.2,maxY:4.3}]);
 m.player={x:0,y:4.85,z:-10.8};assert.equal(m.canStand({x:0,y:4.85,z:-12},'room'),false);
 const lower=manager([{minX:1.8,maxX:2.2,minZ:.5,maxZ:1.5,minY:3.2,maxY:4.3}]);assert.equal(lower.canStand({x:2,z:1},'room'),true);
 const g=new THREE.Group(),box=new THREE.Mesh(new THREE.BoxGeometry(1,1,1));box.position.y=4;box.userData={solidFootprint:true,heightAwareCollision:true};g.add(box);assert.equal(collidersFromScene(g)[0].minY,3.5);
});
