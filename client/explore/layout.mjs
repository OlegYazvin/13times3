// Three curated galleries for twelve memories and one planned trip. All 41
// canonical frame records remain in the manifest, independently of exhibition.
export const HALL_WIDTH = 10.8;
export const HALL_HEIGHT = 6.6;
export const FRAME_WIDTH = 3.35;
export const FRAME_HEIGHT = 4.1;
export const EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = 0.45;

export function framePlaqueText(frame) {
  return frame.room?.modelUrl ? frame.room.caption : frame.planned ? `${frame.planned.title} · planned` : frame.label;
}

export function portalOpening(frame) {
  return {
    width: Math.min(FRAME_WIDTH, frame.room.dimensionsM[0] - .4),
    height: Math.min(FRAME_HEIGHT, frame.room.dimensionsM[1] - .25),
  };
}

export function portalCanvas(room) {
  const opening=portalOpening({room});
  // Keep the physical painting inside the live opening, including short
  // worlds such as the signup cave. Its top must end at the lintel.
  return {width:opening.width,height:opening.height-.08,bottom:.08};
}

export const PATH = Object.freeze([
  { x: 0, z: 0 },
  { x: 0, z: -26 },
  { x: 28, z: -26 },
  { x: 28, z: 4 },
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
  // These are the original storage slots, retained for compatibility. The
  // exhibit list controls which records are hung and where visitors find them.
  if (manifest.sectionCounts?.join(",") !== "8,8,8,8,9") throw new Error("Preserve the 41 canonical storage slots.");
  const exhibition = manifest.exhibit?.sections;
  if (!Array.isArray(exhibition) || exhibition.length !== PATH.length-1 ||
      exhibition.some(s=>!s.title || !Array.isArray(s.frames) || s.frames.length<4)) {
    throw new Error("The exhibit needs three titled galleries with explicit frame orders.");
  }

  const sections = PATH.slice(0, -1).map((start, index) => {
    const end = PATH[index + 1];
    const delta = subtract(end, start);
    const length = Math.hypot(delta.x, delta.z);
    const forward = multiply(delta, 1 / length);
    return {
      index,
      title: exhibition[index].title,
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
  for (const [index,record] of manifest.frames.entries()) {
    const expectedId = String(index + 1).padStart(2, "0");
    if (record.id !== expectedId || ids.has(record.id) || record.label !== expectedId) {
      throw new Error(`Frame ${index + 1} needs a stable, unique two-digit ID and label.`);
    }
    ids.add(record.id);
    if (!Number.isInteger(record.section) || record.section<0 || record.section>4 || !["left", "right"].includes(record.side) || !Number.isInteger(record.bay)) {
      throw new Error(`Frame ${record.id} has an invalid section, side, or bay.`);
    }
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
    if (record.room.modelUrl && (!Array.isArray(record.room.colliders) ||
      !record.room.colliders.every((collider) => collider.shape === "circle"
        ? [collider.x, collider.z, collider.radius].every(Number.isFinite) && collider.radius > 0
        : [collider.minX, collider.maxX, collider.minZ, collider.maxZ].every(Number.isFinite) &&
          collider.minX < collider.maxX && collider.minZ < collider.maxZ))) {
      throw new Error(`Frame ${record.id} needs valid obstacle footprints for its room.`);
    }
    if (record.room.modelUrl && (typeof record.room.caption !== "string" ||
      !record.room.caption.trim() || record.room.caption.length > 48)) {
      throw new Error(`Frame ${record.id} needs a short painting caption.`);
    }
    if(record.room.walkablePolygon&&(!Array.isArray(record.room.walkablePolygon)||record.room.walkablePolygon.length<3||record.room.walkablePolygon.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))))throw new Error(`Frame ${record.id} has an invalid floor boundary.`);
    sectionCounts[record.section] += 1;
  }
  if (sectionCounts.some((count, index) => count !== manifest.sectionCounts[index])) {
    throw new Error("Frame section counts do not match the gallery layout.");
  }
  const placements=new Map();
  for (const [index,s] of exhibition.entries()) for (const [slot,id] of s.frames.entries()) {
    if (!ids.has(id) || placements.has(id)) throw new Error(`Invalid or duplicate exhibited frame ${id}.`);
    placements.set(id,{section:index,side:slot%2?'right':'left',bay:Math.floor(slot/2)});
  }
  if (manifest.frames.some(f=>f.room.modelUrl&&!placements.has(f.id))) throw new Error("Every published memory must remain exhibited.");
  const frames=manifest.frames.filter(f=>placements.has(f.id)).map(record=>{
    const placement=placements.get(record.id),section=sections[placement.section],side=placement.side==='right'?1:-1;
    const bays=Math.ceil((exhibition[placement.section].frames.length-(side===1?1:0))/2);
    const margin=HALL_WIDTH/2+FRAME_WIDTH/2+.4;
    const along=margin+placement.bay*(section.length-2*margin)/Math.max(1,bays-1);
    const center=add(add(section.start,multiply(section.forward,along)),multiply(section.right,side*HALL_WIDTH/2));
    return {...record,...placement,sectionData:section,sideSign:side,along,center};
  });
  return { sections, frames, exhibitionOrder:exhibition.flatMap(s=>s.frames), storedFrameCount:manifest.frames.length, outline: corridorOutline(sections) };
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
