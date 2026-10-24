import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import * as THREE from 'three';
import {insideRoomPolygon,RoomManager} from '../client/explore/rooms.mjs';
import {folkFloorplan,offsetOpenPath,upstairsBarEdge} from '../scripts/scene12_floorplan.mjs';

test('the upstairs boundary admits its bays and rejects the former rectangular corners and stair recess',()=>{
 for(const [x,z]of[[0,-3],[1,-10.2],[-5,-8.7],[-3.2,2.8],[3.2,2.8],[0,8.8]])assert.equal(insideRoomPolygon(x,z,folkFloorplan),true,`${x},${z} belongs to the continuous room`);
 for(const [x,z]of[[6.6,-3],[-6.8,-10.5],[-1.85,-9.0],[1,-10.7],[4.95,-3]])assert.equal(insideRoomPolygon(x,z,folkFloorplan),false,`${x},${z} has no floor or insufficient body clearance`);
});
test('room movement respects the authored footprint even within the old outer dimensions',()=>{
 const gallery=JSON.parse(readFileSync(new URL('../src/_data/gallery.json',import.meta.url))),frame=gallery.frames[11];assert.deepEqual(frame.room.walkablePolygon,folkFloorplan);
 const manager=new RoomManager({gallery:{layout:{frames:[]}},player:{x:4.4,z:-3}}),group=new THREE.Group();group.updateMatrixWorld(true);manager.active={frame,group,colliders:[]};manager.mode='room';
 manager.move({x:6.6,z:-3});assert.ok(manager.player.x<4.81,'The camera cannot enter the stair cutout through the old rectangular floor area');assert.equal(manager.canStand({x:1,z:-10.2}),true);
});
test('the bar has angled returns and a real open inner well',()=>{
 const inner=offsetOpenPath(upstairsBarEdge,.65);assert.equal(inner.length,upstairsBarEdge.length);assert.ok(inner.flat().every(Number.isFinite));
 assert.ok(Math.abs(upstairsBarEdge[2][0]-upstairsBarEdge[1][0])>.1&&Math.abs(upstairsBarEdge[2][1]-upstairsBarEdge[1][1])>.1);
 assert.ok(inner[3][0]-inner[2][0]>1.5,'The service well has usable width');assert.ok(Math.abs(inner[2][1]-.03)<1e-9,'The front counter band leaves the central well empty');
});
