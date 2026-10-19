import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildLayout, crossesPortal, HALL_WIDTH, isWalkable,
  moveWithCollision, nearestSection, PATH, PLAYER_RADIUS,
} from "../client/explore/layout.mjs";
import { roomIsReady } from "../client/explore/rooms.mjs";

const manifest = JSON.parse(readFileSync(new URL("../src/_data/gallery.json", import.meta.url)));
const layout = buildLayout(manifest);

test("41 stable frame slots follow five connected winding sections", () => {
  assert.equal(layout.frames.length, 41);
  assert.deepEqual(layout.frames.map((frame) => frame.id), Array.from({ length: 41 }, (_, index) => String(index + 1).padStart(2, "0")));
  assert.deepEqual(layout.sections.map((section) => section.index), [0, 1, 2, 3, 4]);
  for (let index = 1; index < PATH.length - 1; index += 1) {
    assert.equal(isWalkable(PATH[index], layout), true, `turn ${index} must connect`);
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

test("blank frames are solid; a future room triggers only when crossed from the hall", () => {
  const frame = layout.frames[0];
  assert.equal(roomIsReady(frame), false);
  const outward = frame.sectionData.right;
  const sign = frame.sideSign;
  const center = frame.center;
  const inside = { x: center.x - outward.x * sign * (PLAYER_RADIUS + .15), z: center.z - outward.z * sign * (PLAYER_RADIUS + .15) };
  const crossing = { x: center.x - outward.x * sign * (PLAYER_RADIUS - .08), z: center.z - outward.z * sign * (PLAYER_RADIUS - .08) };
  assert.equal(crossesPortal(inside, crossing, frame), true);
  assert.equal(crossesPortal(crossing, inside, frame), false);
  const missed = { x: crossing.x + frame.sectionData.forward.x * 2, z: crossing.z + frame.sectionData.forward.z * 2 };
  assert.equal(crossesPortal(inside, missed, frame), false);
  const fixture = { ...frame, room: { ...frame.room, previewImage: "/fixtures/painting.webp", modelUrl: "/fixtures/room.glb" } };
  assert.equal(roomIsReady(fixture), true);
});
