// All dimensions are meters. The route is deliberately fixed so frame IDs stay put.
export const HALL_WIDTH = 4.4;
export const HALL_HEIGHT = 3.9;
export const FRAME_WIDTH = 2.45;
export const FRAME_HEIGHT = 3.12;
export const EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = 0.32;

export const PATH = Object.freeze([
  { x: 0, z: 0 },
  { x: 0, z: -18 },
  { x: 18, z: -18 },
  { x: 18, z: 2 },
  { x: 40, z: 2 },
  { x: 40, z: -20 },
]);

const dot = (a, b) => a.x * b.x + a.z * b.z;
const subtract = (a, b) => ({ x: a.x - b.x, z: a.z - b.z });
const add = (a, b) => ({ x: a.x + b.x, z: a.z + b.z });
const multiply = (a, scale) => ({ x: a.x * scale, z: a.z * scale });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function buildLayout(manifest) {
  if (!Array.isArray(manifest?.frames) || manifest.frames.length !== 41) {
    throw new Error("The gallery requires exactly 41 frames.");
  }
  if (manifest.sectionCounts?.join(",") !== "8,8,8,8,9") {
    throw new Error("The five gallery sections must contain 8, 8, 8, 8, and 9 frames.");
  }

  const sections = PATH.slice(0, -1).map((start, index) => {
    const end = PATH[index + 1];
    const delta = subtract(end, start);
    const length = Math.hypot(delta.x, delta.z);
    const forward = multiply(delta, 1 / length);
    return {
      index,
      start,
      end,
      length,
      forward,
      right: { x: -forward.z, z: forward.x },
      yaw: Math.atan2(forward.x, -forward.z),
    };
  });

  const ids = new Set();
  const slots = new Set();
  const sectionCounts = [0, 0, 0, 0, 0];
  const frames = manifest.frames.map((record, index) => {
    const expectedId = String(index + 1).padStart(2, "0");
    if (record.id !== expectedId || ids.has(record.id) || record.label !== expectedId) {
      throw new Error(`Frame ${index + 1} needs a stable, unique two-digit ID and label.`);
    }
    ids.add(record.id);
    const section = sections[record.section];
    if (!section || !["left", "right"].includes(record.side) || !Number.isInteger(record.bay)) {
      throw new Error(`Frame ${record.id} has an invalid section, side, or bay.`);
    }
    const side = record.side === "right" ? 1 : -1;
    const baysOnSide = record.side === "left"
      ? Math.ceil(manifest.sectionCounts[record.section] / 2)
      : Math.floor(manifest.sectionCounts[record.section] / 2);
    if (record.bay < 0 || record.bay >= baysOnSide) {
      throw new Error(`Frame ${record.id} has an invalid bay.`);
    }
    const slot = `${record.section}:${record.side}:${record.bay}`;
    if (slots.has(slot)) throw new Error(`Two frames cannot share slot ${slot}.`);
    slots.add(slot);
    if (!record.room || !Array.isArray(record.room.dimensionsM) ||
      record.room.dimensionsM.length !== 3 || record.room.dimensionsM.some((size) => !Number.isFinite(size) || size <= 0) ||
      !Array.isArray(record.room.entryPose?.position) || !Array.isArray(record.room.previewCamera?.position) ||
      !Array.isArray(record.room.previewCamera?.target) ||
      Boolean(record.room.previewImage) !== Boolean(record.room.modelUrl)) {
      throw new Error(`Frame ${record.id} has incomplete room metadata.`);
    }
    const along = 2.8 + record.bay * ((section.length - 5.6) / Math.max(1, baysOnSide - 1));
    const center = add(add(section.start, multiply(section.forward, along)), multiply(section.right, side * HALL_WIDTH / 2));
    sectionCounts[record.section] += 1;
    return { ...record, sectionData: section, sideSign: side, along, center };
  });
  if (sectionCounts.some((count, index) => count !== manifest.sectionCounts[index])) {
    throw new Error("Frame section counts do not match the gallery layout.");
  }
  return { sections, frames, outline: corridorOutline(sections) };
}

function intersectLines(pointA, directionA, pointB, directionB) {
  const cross = directionA.x * directionB.z - directionA.z * directionB.x;
  if (Math.abs(cross) < 1e-6) return pointB;
  const delta = subtract(pointB, pointA);
  const distance = (delta.x * directionB.z - delta.z * directionB.x) / cross;
  return add(pointA, multiply(directionA, distance));
}

export function corridorOutline(sections, halfWidth = HALL_WIDTH / 2) {
  const points = [sections[0].start, ...sections.map((section) => section.end)];
  const sidePoints = (sign) => points.map((point, index) => {
    if (index === 0) return add(point, multiply(sections[0].right, sign * halfWidth));
    if (index === sections.length) return add(point, multiply(sections.at(-1).right, sign * halfWidth));
    const previous = sections[index - 1];
    const next = sections[index];
    return intersectLines(
      add(point, multiply(previous.right, sign * halfWidth)), previous.forward,
      add(point, multiply(next.right, sign * halfWidth)), next.forward,
    );
  });
  return { left: sidePoints(-1), right: sidePoints(1) };
}

export function nearestSection(position, sections) {
  let closest = null;
  for (const section of sections) {
    const fromStart = subtract(position, section.start);
    const along = clamp(dot(fromStart, section.forward), 0, section.length);
    const point = add(section.start, multiply(section.forward, along));
    const distance = Math.hypot(position.x - point.x, position.z - point.z);
    if (!closest || distance < closest.distance) closest = { section, distance, along };
  }
  return closest;
}

export function isWalkable(position, layout, radius = PLAYER_RADIUS) {
  const first = layout.sections[0];
  const last = layout.sections.at(-1);
  const nearest = nearestSection(position, layout.sections);
  if (nearest.section.index === first.index && dot(subtract(position, first.start), first.forward) < radius) return false;
  if (nearest.section.index === last.index && dot(subtract(position, last.start), last.forward) > last.length - radius) return false;
  return nearest.distance <= HALL_WIDTH / 2 - radius;
}

export function moveWithCollision(position, desired, layout) {
  if (isWalkable(desired, layout)) return desired;
  const xOnly = { x: desired.x, z: position.z };
  const zOnly = { x: position.x, z: desired.z };
  if (isWalkable(xOnly, layout)) return xOnly;
  if (isWalkable(zOnly, layout)) return zOnly;
  return position;
}

export function nearestFrame(position, frames, maximumDistance = Infinity) {
  let closest = null;
  for (const frame of frames) {
    const distance = Math.hypot(position.x - frame.center.x, position.z - frame.center.z);
    if (distance < maximumDistance && (!closest || distance < closest.distance)) {
      closest = { frame, distance };
    }
  }
  return closest;
}

export function crossesPortal(previous, intended, frame, radius = PLAYER_RADIUS) {
  const outward = multiply(frame.sectionData.right, frame.sideSign);
  const before = dot(subtract(previous, frame.center), outward);
  const after = dot(subtract(intended, frame.center), outward);
  const lateral = Math.abs(dot(subtract(intended, frame.center), frame.sectionData.forward));
  return before < -radius && after >= -radius && lateral <= FRAME_WIDTH / 2 - radius;
}
