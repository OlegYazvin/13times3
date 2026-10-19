import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import {
  buildLayout, crossesPortal, FRAME_WIDTH, HALL_WIDTH, isWalkable,
  moveWithCollision, nearestSection, PATH, PLAYER_RADIUS,
} from "../client/explore/layout.mjs";
import { collidersFromScene, moveWithinRoom, roomIsReady } from "../client/explore/rooms.mjs";

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

test("movement stays inside the hallway and slides along its walls", () => {
  const start = { x: 0, z: -9 };
  assert.equal(isWalkable(start, layout), true);
  assert.equal(isWalkable({ x: HALL_WIDTH / 2, z: -9 }, layout), false);
  const destination = moveWithCollision(start, { x: HALL_WIDTH / 2, z: -8 }, layout);
  assert.equal(destination.x, 0);
  assert.equal(destination.z, -8);
  assert.equal(nearestSection({ x: 18, z: -10 }, layout.sections).section.index, 2);
});

test("frame 01 is enterable only across its threshold; other frames stay solid", () => {
  const frame = layout.frames[0];
  assert.equal(roomIsReady(frame), true);
  assert.equal(layout.frames.slice(1).every((record) => !roomIsReady(record)), true);
  const outward = frame.sectionData.right;
  const sign = frame.sideSign;
  const center = frame.center;
  const inside = { x: center.x - outward.x * sign * (PLAYER_RADIUS + .15), z: center.z - outward.z * sign * (PLAYER_RADIUS + .15) };
  const crossing = { x: center.x - outward.x * sign * (PLAYER_RADIUS - .08), z: center.z - outward.z * sign * (PLAYER_RADIUS - .08) };
  assert.equal(crossesPortal(inside, crossing, frame), true);
  assert.equal(crossesPortal(crossing, inside, frame), false);
  const missed = { x: crossing.x + frame.sectionData.forward.x * 2, z: crossing.z + frame.sectionData.forward.z * 2 };
  assert.equal(crossesPortal(inside, missed, frame), false);
});

test("room 01 walls, doorway, desk, stage, and figures stop movement", () => {
  const room = layout.frames[0].room;
  assert.deepEqual(moveWithinRoom({x:0,z:2.2},{x:0,z:2.42},room).exit,true);
  assert.deepEqual(moveWithinRoom({x:1.5,z:2.2},{x:1.5,z:2.42},room).exit,false);
  assert.ok(moveWithinRoom({x:-.1,z:.5},{x:-.3,z:.5},room).x > -.3);
  assert.ok(moveWithinRoom({x:.1,z:-.35},{x:.1,z:-.5},room).z > -.5);
  assert.deepEqual(moveWithinRoom({x:-1.57,z:-.5},{x:-1.57,z:-.25},room).z,-.5);
  assert.deepEqual(moveWithinRoom({x:1.1,z:-.45},{x:1.1,z:-.9},room).z,-.45);
  assert.ok(Math.abs(moveWithinRoom({x:0,z:2.2},{x:3,z:2.2},room).x-2.38)<1e-9);
  assert.ok(moveWithinRoom({x:0,z:1.4},{x:0,z:-2.4},room).z > -.6,
    "a long movement should not tunnel through the stage");
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
  const room = layout.frames[0].room;
  assert.equal(moveWithinRoom({x:1,z:-.5},{x:1,z:-1},room,[solid]).z > -.85, true);
});
