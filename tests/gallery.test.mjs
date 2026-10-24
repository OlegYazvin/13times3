import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import {
  buildLayout, framePlaqueText, FRAME_WIDTH, HALL_WIDTH, isWalkable,
  moveWithCollision, nearestSection, PATH, portalOpening,
} from "../client/explore/layout.mjs";
import { collidersFromScene, RoomManager, roomIsReady } from "../client/explore/rooms.mjs";

const manifest = JSON.parse(readFileSync(new URL("../src/_data/gallery.json", import.meta.url)));
const layout = buildLayout(manifest);

test("41 stable frame slots follow five connected winding sections", () => {
  assert.equal(layout.frames.length, 41);
  assert.deepEqual(layout.frames.map((frame) => frame.id), Array.from({ length: 41 }, (_, index) => String(index + 1).padStart(2, "0")));
  assert.deepEqual(layout.sections.map((section) => section.index), [0, 1, 2, 3, 4]);
  for (let index = 1; index < PATH.length - 1; index += 1) {
    assert.equal(isWalkable(PATH[index], layout), true, `turn ${index} must connect`);
  }
  for (const frame of layout.frames) {
    assert.ok(frame.along - FRAME_WIDTH / 2 > HALL_WIDTH / 2,
      `frame ${frame.id} must clear the preceding turn`);
    assert.ok(frame.along + FRAME_WIDTH / 2 < frame.sectionData.length - HALL_WIDTH / 2,
      `frame ${frame.id} must clear the following turn`);
  }
});

test("rooms render in a separate world so their floor plans may overlap", () => {
  const hall = new THREE.Scene();
  const manager = new RoomManager({ gallery: { layout, scene: hall },
    player: { x: 0, z: -9 } });
  assert.notEqual(manager.roomScene, hall);
  assert.notEqual(manager.portalScene, hall);
  assert.equal(manager.roomScene.children.length, 0);
});

test("movement stays inside the hallway and slides along its walls", () => {
  const start = { x: 0, z: -9 };
  assert.equal(isWalkable(start, layout), true);
  assert.equal(isWalkable({ x: HALL_WIDTH / 2, z: -9 }, layout), false);
  const destination = moveWithCollision(start, { x: HALL_WIDTH / 2, z: -8 }, layout);
  assert.equal(destination.x, 0);
  assert.equal(destination.z, -8);
  const section=layout.sections[2];
  assert.equal(nearestSection({x:section.start.x+section.forward.x*12,z:section.start.z+section.forward.z*12},layout.sections).section.index,2);
});

test("frames 01–12 have room-sized openings and the other frames stay solid", () => {
  const frame = layout.frames[0];
  assert.equal(roomIsReady(frame), true);
  assert.equal(roomIsReady(layout.frames[1]), true);
  assert.equal(roomIsReady(layout.frames[2]), true);
  assert.equal(roomIsReady(layout.frames[3]), true);
  assert.equal(roomIsReady(layout.frames[4]), true);
  assert.equal(roomIsReady(layout.frames[5]), true);
  assert.equal(roomIsReady(layout.frames[6]), true);
  assert.equal(roomIsReady(layout.frames[7]), true);
  assert.equal(roomIsReady(layout.frames[8]), true);
  assert.equal(roomIsReady(layout.frames[9]), true);
  assert.equal(roomIsReady(layout.frames[10]), true);
  assert.equal(layout.frames.every((record, index) => index <= 11 || !roomIsReady(record)), true);
  assert.deepEqual(portalOpening(frame), { width: 3.35, height: 3.35 });
  assert.deepEqual(portalOpening(layout.frames[1]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[2]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[3]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[4]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[5]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[6]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[7]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[8]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[9]), { width: 3.35, height: 4.1 });
  assert.deepEqual(portalOpening(layout.frames[10]), { width: 3.35, height: 4.1 });
  assert.equal(framePlaqueText(frame), "Zephrine's first stage");
  assert.equal(framePlaqueText(layout.frames[1]), "Jane kept me going");
  assert.equal(framePlaqueText(layout.frames[2]), "A friendship Jane made room for");
  assert.equal(framePlaqueText(layout.frames[3]), "Zephrine's blue car");
  assert.equal(framePlaqueText(layout.frames[4]), "Jane held her ground");
  assert.equal(framePlaqueText(layout.frames[5]), "Zephrine eats all the food");
  assert.equal(framePlaqueText(layout.frames[6]), "Blueberries with G");
  assert.equal(framePlaqueText(layout.frames[7]), "Jane's chosen city route");
  assert.equal(framePlaqueText(layout.frames[8]), "First apples with friends");
  assert.equal(framePlaqueText(layout.frames[9]), "A day of shared play");
  assert.equal(framePlaqueText(layout.frames[10]), "Wondering at the fish with G");
  assert.equal(roomIsReady(layout.frames[11]), true);
  assert.deepEqual(portalOpening(layout.frames[11]), { width: 3.35, height: 4.1 });
  assert.equal(framePlaqueText(layout.frames[11]), "A place in the circle");
  assert.equal(framePlaqueText(layout.frames[12]), "13");
});

function roomManager(colliders = layout.frames[0].room.colliders) {
  const frame = layout.frames[0];
  const player = { x: frame.center.x + .55, z: frame.center.z };
  const manager = new RoomManager({ gallery: { layout }, player });
  const group = new THREE.Group();
  group.position.set(frame.center.x - frame.room.dimensionsM[2] / 2, 0, frame.center.z);
  group.rotation.y = Math.PI / 2;
  manager.active = { frame, group, colliders };
  return manager;
}

test("walking through frame 01 keeps one world position in both directions", () => {
  const manager = roomManager();
  const leftWall = -HALL_WIDTH / 2;
  assert.equal(manager.canStand({ x: leftWall + .35, z: manager.player.z }), true);
  manager.move({ x: leftWall - .6, z: manager.player.z });
  assert.ok(Math.abs(manager.player.x - (leftWall - .6)) < .01);
  manager.move({ x: 0, z: manager.player.z });
  assert.ok(Math.abs(manager.player.x) < .01);
  assert.equal(manager.canStand({ x: leftWall, z: manager.player.z + 2 }), false,
    "the wall beside the opening remains solid");
  assert.equal(manager.canStand({ x: HALL_WIDTH / 2, z: manager.player.z }), false,
    "the blank frame on the opposite wall stays solid");
});

test("room 01 stage, desk, people, and boundary block movement", () => {
  const manager = roomManager();
  manager.mode = "room";
  const position = (x, z) => manager.roomToWorld({ x, z });
  assert.equal(manager.canStand(position(.1, -1)), false, "stage");
  assert.equal(manager.canStand(position(-1.2, .5)), false, "desk");
  assert.equal(manager.canStand(position(-.47, .05)), false, "Jane");
  assert.equal(manager.canStand(position(1.1, -1.53)), false, "Zephrine");
  assert.equal(manager.canStand(position(2.5, 0)), false, "side wall");
  assert.equal(manager.canStand(position(0, -2.5)), false, "back wall");
  manager.player.x = position(1.1, 1.8).x;
  manager.player.z = position(1.1, 1.8).z;
  manager.move(position(1.1, -2.4));
  assert.ok(manager.worldToRoom(manager.player).z > -.8,
    "a long movement cannot tunnel through the stage");
});

test("room collision wins where an independent world overlaps hallway coordinates", () => {
  const manager = roomManager();
  const place = { x: 0, z: manager.active.frame.center.z };
  const local = manager.worldToRoom(place);
  manager.active.frame = { ...manager.active.frame, room: {
    ...manager.active.frame.room, dimensionsM: [30, 3.6, 30],
  } };
  manager.active.colliders = [{ minX: local.x - .2, maxX: local.x + .2,
    minZ: local.z - .2, maxZ: local.z + .2 }];
  assert.equal(isWalkable(place, layout), true);
  manager.mode = "room";
  assert.equal(manager.canStand(place), false, "hallway floor must not erase room obstacles");
  manager.mode = "hall";
  assert.equal(manager.canStand(place), true, "the hall remains walkable in its own world");
});

test("a long movement stops at a thin post instead of resuming beyond it", () => {
  const manager = roomManager([{ minX: -.25, maxX: .25, minZ: -.05, maxZ: .05 }]);
  manager.active.frame = { ...manager.active.frame, room: {
    ...manager.active.frame.room, dimensionsM: [12, 3.6, 12],
  } };
  manager.mode = "room";
  Object.assign(manager.player, manager.roomToWorld({ x: 0, z: 1 }));
  manager.move(manager.roomToWorld({ x: 0, z: -1 }));
  assert.ok(manager.worldToRoom(manager.player).z > .45,
    "the player must remain on the approach side after a two-meter step");
});

test("solid footprints travel with authored 3D model parts", () => {
  const scene = new THREE.Scene();
  const person = new THREE.Group();
  person.position.set(1, 0, -1);
  person.userData.solidFootprint = true;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.4, 1, .3));
  torso.position.y = 1;
  person.add(torso);
  scene.add(person);
  const floorMark = new THREE.Mesh(new THREE.BoxGeometry(2, .01, 2));
  scene.add(floorMark);
  const [solid] = collidersFromScene(scene);
  for (const [key, expected] of Object.entries({minX: .8, maxX: 1.2, minZ: -1.15, maxZ: -.85})) {
    assert.ok(Math.abs(solid[key] - expected) < 1e-6);
  }
  const manager = roomManager([solid]);
  manager.mode = "room";
  assert.equal(manager.canStand(manager.roomToWorld({x:1,z:-1})), false);
});

test("the folk jam keeps both interiors accessible around its freestanding portal", () => {
  const frame = layout.frames[11],outward={x:frame.sectionData.right.x*frame.sideSign,z:frame.sectionData.right.z*frame.sideSign};
  assert.ok(frame.room.portalZ < frame.room.dimensionsM[2]/2-5,
    "the opposite venue needs usable space behind the actual doorway");
  const group=new THREE.Group();group.position.set(frame.center.x+outward.x*frame.room.portalZ,0,frame.center.z+outward.z*frame.room.portalZ);group.rotation.y=Math.atan2(-outward.x,-outward.z);
  const manager=new RoomManager({gallery:{layout},player:{x:0,z:0}});
  manager.active={frame,group,colliders:frame.room.colliders};manager.mode='room';
  assert.equal(manager.canStand(manager.roomToWorld({x:.20,z:.65})),false,
    'Jane’s extended shoes block the area beyond her seated torso');
  for(const x of [-3.2,3.2]){
    Object.assign(manager.player,manager.roomToWorld({x,z:1.4}));
    manager.move(manager.roomToWorld({x,z:4.7}));
    assert.equal(manager.mode,'room');assert.ok(manager.worldToRoom(manager.player).z>4.5);
  }
  Object.assign(manager.player,manager.roomToWorld({x:0,z:4.7}));
  manager.move(manager.roomToWorld({x:0,z:1.7}));
  assert.equal(manager.mode,'room','walking through the back of the arch remains in the jam world');
  Object.assign(manager.player,manager.roomToWorld({x:0,z:2.2}));
  manager.move(manager.roomToWorld({x:0,z:3.4}));
  assert.equal(manager.mode,'hall','crossing the actual return face reaches the hallway');
});
