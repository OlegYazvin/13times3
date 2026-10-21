import * as THREE from "three";
import {
  buildLayout, corridorOutline, framePlaqueText, HALL_WIDTH, HALL_HEIGHT, FRAME_HEIGHT, FRAME_WIDTH, portalOpening,
} from "./layout.mjs";

// Five related plaster washes give each turn a slightly different atmosphere.
const palettes = [
  { wall: "#b7a8a4", wash: "#dfc5b5", paper: "#ead9c4" },
  { wall: "#aeb5b4", wash: "#d7cec0", paper: "#e6dfcc" },
  { wall: "#b8aeb9", wash: "#e4cdbd", paper: "#eee0cf" },
  { wall: "#adb9af", wash: "#d9cdbc", paper: "#e8dfc9" },
  { wall: "#bcaeaf", wash: "#e4cbbb", paper: "#ead8ca" },
];
const wood = new THREE.MeshBasicMaterial({ color: 0x9b765e });
const woodHighlight = new THREE.MeshBasicMaterial({ color: 0xc5a483 });
const ivory = new THREE.MeshBasicMaterial({ color: 0xe6d6be });
const shadowTrim = new THREE.MeshBasicMaterial({ color: 0x8f786f });
const gold = new THREE.MeshBasicMaterial({ color: 0xc6a47b });

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function plasterTexture(base, wash) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d");
  context.fillStyle = base;
  context.fillRect(0, 0, 512, 512);
  const bloom = context.createRadialGradient(350, 175, 25, 300, 235, 390);
  bloom.addColorStop(0, wash);
  bloom.addColorStop(1, "rgba(255,255,255,0)");
  context.globalAlpha = .31;
  context.fillStyle = bloom;
  context.fillRect(0, 0, 512, 512);
  context.globalAlpha = 1;
  // Seeded stipple and brush haze, so reloading never rearranges the room.
  let seed = 173;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let index = 0; index < 340; index += 1) {
    context.fillStyle = index % 3 ? "rgba(255,247,232,.065)" : "rgba(75,57,61,.035)";
    context.beginPath();
    context.arc(random() * 512, random() * 512, .5 + random() * 4, 0, Math.PI * 2);
    context.fill();
  }
  return makeTexture(canvas);
}

function placeholderTexture(paper, index) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const context = canvas.getContext("2d");
  const ground = context.createLinearGradient(0, 0, 256, 384);
  ground.addColorStop(0, "#f2e7d7");
  ground.addColorStop(.55, paper);
  ground.addColorStop(1, "#cbbab0");
  context.fillStyle = ground;
  context.fillRect(0, 0, 256, 384);
  for (let layer = 0; layer < 4; layer += 1) {
    const x = 32 + layer * 63 + index * 8;
    const y = 75 + layer * 67;
    const haze = context.createRadialGradient(x, y, 4, x, y, 116);
    haze.addColorStop(0, layer % 2 ? "rgba(255,247,225,.43)" : "rgba(156,137,151,.24)");
    haze.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = haze;
    context.fillRect(0, 0, 256, 384);
  }
  context.lineCap = "round";
  for (let line = 0; line < 8; line += 1) {
    context.strokeStyle = line % 2 ? "rgba(255,251,237,.18)" : "rgba(115,97,99,.065)";
    context.lineWidth = 8 + line * 2;
    context.beginPath();
    const y = 80 + line * 32 + (index * 11 + line * 5) % 24;
    context.moveTo(-24, y);
    context.bezierCurveTo(59, y - 35, 120, y + 38, 282, y - 23);
    context.stroke();
  }
  return makeTexture(canvas);
}

function labelTexture(label, descriptive = false) {
  const canvas = document.createElement("canvas");
  canvas.width = descriptive ? 1024 : 256;
  canvas.height = descriptive ? 160 : 96;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  let fontSize = descriptive ? 94 : 74;
  context.font = `600 ${fontSize}px Georgia, serif`;
  if (descriptive) {
    while (context.measureText(label).width > 940 && fontSize > 46) {
      fontSize -= 2;
      context.font = `600 ${fontSize}px Georgia, serif`;
    }
  }
  context.fillStyle = "#5b463c";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvas.width / 2, canvas.height / 2 + (descriptive ? 5 : 1));
  return makeTexture(canvas);
}

function dustTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  const halo = context.createRadialGradient(32, 32, 0, 32, 32, 30);
  halo.addColorStop(0, "rgba(255,250,231,.65)");
  halo.addColorStop(.35, "rgba(255,237,203,.21)");
  halo.addColorStop(1, "rgba(255,237,203,0)");
  context.fillStyle = halo;
  context.fillRect(0, 0, 64, 64);
  return makeTexture(canvas);
}

function box(parent, name, x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function wallBetween(start, end, material, height = HALL_HEIGHT, centerY = HALL_HEIGHT / 2) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, .12), material);
  wall.position.set((start.x + end.x) / 2, centerY, (start.z + end.z) / 2);
  wall.rotation.y = Math.atan2(-dz, dx);
  return wall;
}

function flatPolygon(points, material, y) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].z);
  for (const point of points.slice(1)) shape.lineTo(point.x, point.z);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  return mesh;
}

function wallWithOpenings(scene, start, end, material, frames) {
  if (!frames.length) {
    scene.add(wallBetween(start, end, material));
    return;
  }
  const length = Math.hypot(end.x - start.x, end.z - start.z);
  const pointAt = (distance) => ({
    x: start.x + (end.x - start.x) * distance / length,
    z: start.z + (end.z - start.z) * distance / length,
  });
  const openings = frames.map((frame) => {
    const along = ((frame.center.x - start.x) * (end.x - start.x) +
      (frame.center.z - start.z) * (end.z - start.z)) / length;
    return { along, ...portalOpening(frame) };
  }).sort((a, b) => a.along - b.along);
  let cursor = 0;
  for (const opening of openings) {
    const left = opening.along - opening.width / 2;
    const right = opening.along + opening.width / 2;
    if (left > cursor) scene.add(wallBetween(pointAt(cursor), pointAt(left), material));
    scene.add(wallBetween(pointAt(left), pointAt(right), material,
      HALL_HEIGHT - opening.height, (HALL_HEIGHT + opening.height) / 2));
    cursor = right;
  }
  if (cursor < length) scene.add(wallBetween(pointAt(cursor), end, material));
}

function revealMaskTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const nx = (x - canvas.width / 2) / (canvas.width / 2);
    const ny = (y - canvas.height / 2) / (canvas.height / 2);
    const radial = Math.min(1, Math.hypot(nx * .82, ny * .88));
    const angle = Math.atan2(ny, nx);
    const brush = Math.sin(angle * 9 + radial * 7) * .025 +
      Math.sin(angle * 17 - radial * 4) * .012;
    const value = Math.max(.54, Math.min(1, .55 + (radial + brush) * .45));
    const offset = (y * canvas.width + x) * 4;
    image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = Math.round(value * 255);
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = makeTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

function frameMesh(frame, placeholderMaterials) {
  const section = frame.sectionData;
  const sectionGroup = new THREE.Group();
  sectionGroup.position.set(section.start.x, 0, section.start.z);
  sectionGroup.rotation.y = -section.yaw;

  const root = new THREE.Group();
  root.position.set(frame.sideSign * (HALL_WIDTH / 2 - .14), FRAME_HEIGHT / 2 + .08, -frame.along);
  root.rotation.y = frame.sideSign === 1 ? -Math.PI / 2 : Math.PI / 2;
  sectionGroup.add(root);

  if (!frame.room?.modelUrl) {
    box(root, "painted wooden frame back", 0, 0, .025, FRAME_WIDTH + .25, FRAME_HEIGHT + .25, .07, wood);
  }
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT), placeholderMaterials[frame.section]);
  surface.position.z = .09;
  root.add(surface);

  for (const sign of [-1, 1]) {
    box(root, "frame upright", sign * (FRAME_WIDTH / 2 + .055), 0, .14, .115, FRAME_HEIGHT + .22, .12, woodHighlight);
    box(root, "frame inner line", sign * (FRAME_WIDTH / 2 - .025), 0, .152, .025, FRAME_HEIGHT, .025, gold);
    box(root, "frame rail", 0, sign * (FRAME_HEIGHT / 2 + .055), .14, FRAME_WIDTH + .22, .115, .12, woodHighlight);
    box(root, "frame inner rail", 0, sign * (FRAME_HEIGHT / 2 - .025), .152, FRAME_WIDTH, .025, .025, gold);
  }

  const descriptive = Boolean(frame.room?.modelUrl);
  const plaqueWidth = descriptive ? 3.12 : .93;
  const plaqueHeight = descriptive ? .36 : .40;
  // Set finished-painting captions across the upper canvas. From the center
  // of this wide hall, an above-frame plaque falls outside the 75° view.
  const plaqueY = FRAME_HEIGHT / 2 + (descriptive ? -.63 : .29);
  box(root, descriptive ? "painting caption plaque" : "number plaque",
    0, plaqueY, .12, plaqueWidth, plaqueHeight, .07, ivory);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(descriptive ? 2.95 : .76, descriptive ? .28 : .32),
    new THREE.MeshBasicMaterial({ map: labelTexture(framePlaqueText(frame), descriptive), transparent: true, depthWrite: false }),
  );
  label.name = descriptive ? `painting caption: ${frame.room.caption}` : `frame number: ${frame.label}`;
  label.position.set(0, plaqueY, .163);
  root.add(label);
  return { group: sectionGroup, surface, root };
}

function addSconce(group, sign, along) {
  const wallX = sign * (HALL_WIDTH / 2 - .21);
  const z = -along;
  box(group, "sconce wall plate", wallX, 2.7, z, .07, .48, .28, wood);
  box(group, "sconce arm", sign * (HALL_WIDTH / 2 - .37), 2.65, z, .35, .045, .06, gold);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(.15, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe9bb }),
  );
  bulb.name = "warm glass wall lamp";
  bulb.position.set(sign * (HALL_WIDTH / 2 - .54), 2.76, z);
  group.add(bulb);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.19, .22, 16, 1, true), ivory);
  shade.position.set(bulb.position.x, 2.92, z);
  shade.rotation.z = Math.PI;
  group.add(shade);
}

function addArchitecture(scene, layout, section, palette, frames, floaters, moteMaterial) {
  const group = new THREE.Group();
  group.name = `gallery section ${section.index + 1} architectural details`;
  group.position.set(section.start.x, 0, section.start.z);
  group.rotation.y = -section.yaw;
  scene.add(group);
  const length = section.length;
  const plasterPanel = new THREE.MeshBasicMaterial({ color: palette.wall });
  for (const sign of [-1, 1]) {
    // The wall miters extend past or stop short of the path vertex at a turn.
    // Trim must follow those actual ends, or it leaves a bare, square patch.
    const wallSide = sign === -1 ? layout.outline.left : layout.outline.right;
    const alongWall = (point) => (point.x - section.start.x) * section.forward.x +
      (point.z - section.start.z) * section.forward.z;
    const wallStart = alongWall(wallSide[section.index]) + .04;
    const wallEnd = alongWall(wallSide[section.index + 1]) - .04;
    const openings = frames.filter((frame) => frame.section === section.index && frame.sideSign === sign && frame.room.modelUrl)
      .map((frame) => ({ start: frame.along - portalOpening(frame).width / 2,
        end: frame.along + portalOpening(frame).width / 2 })).sort((a, b) => a.start - b.start);
    let runs = [[wallStart, wallEnd]];
    for (const opening of openings) runs = runs.flatMap(([start, end]) => [
      [start, Math.min(end, opening.start)], [Math.max(start, opening.end), end],
    ].filter(([a, b]) => b > a));
    for (const [start, end] of runs) {
      const center = -(start + end) / 2;
      const runLength = end - start;
      box(group, "plaster wainscot", sign * (HALL_WIDTH / 2 - .105), .62, center, .035, 1.15, runLength, plasterPanel);
      box(group, "wooden skirting", sign * (HALL_WIDTH / 2 - .10), .18, center, .12, .34, runLength, wood);
      box(group, "chair rail", sign * (HALL_WIDTH / 2 - .10), 1.23, center, .10, .075, runLength, ivory);
      box(group, "ceiling cornice", sign * (HALL_WIDTH / 2 - .21), HALL_HEIGHT - .17, center, .24, .24, runLength, ivory);
      box(group, "cornice shadow", sign * (HALL_WIDTH / 2 - .17), HALL_HEIGHT - .35, center, .08, .035, runLength, shadowTrim);
    }

    const centers = frames.filter((frame) => frame.section === section.index && frame.sideSign === sign)
      .map((frame) => frame.along).sort((a, b) => a - b);
    const pilasters = [centers[0] - FRAME_WIDTH / 2 - .28];
    for (let bay = 1; bay < centers.length; bay += 1) pilasters.push((centers[bay - 1] + centers[bay]) / 2);
    pilasters.push(centers.at(-1) + FRAME_WIDTH / 2 + .28);
    for (const along of pilasters) {
      if (along <= wallStart + .4 || along >= wallEnd - .4) continue;
      box(group, "plaster pilaster", sign * (HALL_WIDTH / 2 - .17), 2.24, -along, .15, 4.18, .22, ivory);
      box(group, "pilaster capital", sign * (HALL_WIDTH / 2 - .20), 4.38, -along, .21, .16, .39, woodHighlight);
    }
    addSconce(group, sign, HALL_WIDTH / 2 + 4);
    addSconce(group, sign, length - HALL_WIDTH / 2 - 4);
  }

  for (let seam = 1.6; seam < length; seam += 1.65) {
    box(group, "stone floor joint", 0, .002, -seam, HALL_WIDTH - .35, .006, .012, shadowTrim);
  }
  for (const along of [length * .26, length * .52, length * .78]) {
    box(group, "painted ceiling beam", 0, HALL_HEIGHT - .075, -along, HALL_WIDTH - .18, .15, .11, ivory);
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .04, 32), woodHighlight);
    medallion.name = "round ceiling medallion";
    medallion.position.set(0, HALL_HEIGHT - .13, -along);
    group.add(medallion);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.19, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffebca }));
    lamp.name = "glowing ceiling globe";
    lamp.position.set(0, HALL_HEIGHT - .34, -along);
    group.add(lamp);
  }

  for (let mote = 0; mote < 2; mote += 1) {
    const sprite = new THREE.Sprite(moteMaterial);
    sprite.name = "soft drifting dust";
    sprite.position.set(mote ? 1.25 : -1.1, 3.35 + mote * .35, -length * (.37 + mote * .32));
    sprite.scale.set(.45, .45, 1);
    group.add(sprite);
    floaters.push({ sprite, baseY: sprite.position.y, phase: section.index * 1.3 + mote });
  }
}

export function createGalleryScene(manifest, assetBase = "/", assetVersion = "") {
  const layout = buildLayout(manifest);
  const scene = new THREE.Scene();
  // The render loop clears to this tone once; an opaque scene background would
  // erase the other world during the second portal pass.
  scene.background = null;
  scene.fog = new THREE.FogExp2(0xc9b5ae, .009);
  scene.add(new THREE.AmbientLight(0xfff0d8, 1.2));

  const outline = [...layout.outline.left, ...layout.outline.right.slice().reverse()];
  scene.add(flatPolygon(outline, new THREE.MeshBasicMaterial({ color: 0xc6ad99, side: THREE.DoubleSide }), -.015));
  const runnerOutline = corridorOutline(layout.sections, 1.1);
  scene.add(flatPolygon([...runnerOutline.left, ...runnerOutline.right.slice().reverse()],
    new THREE.MeshBasicMaterial({ color: 0xb49b8f, side: THREE.DoubleSide }), .022));
  const runnerBorder = new THREE.MeshBasicMaterial({ color: 0xd8c1a4, side: THREE.DoubleSide });
  const borderOutline = corridorOutline(layout.sections, 1.14);
  for (const side of ["left", "right"]) {
    scene.add(flatPolygon([...borderOutline[side], ...runnerOutline[side].slice().reverse()], runnerBorder, .025));
  }
  const ceilingWash = plasterTexture("#baa9ac", "#e1cbc4");
  ceilingWash.wrapS = THREE.RepeatWrapping;
  ceilingWash.wrapT = THREE.RepeatWrapping;
  ceilingWash.repeat.set(.06, .06);
  scene.add(flatPolygon(outline, new THREE.MeshBasicMaterial({ map: ceilingWash, side: THREE.DoubleSide }), HALL_HEIGHT));

  const wallMaterials = palettes.map((palette) => new THREE.MeshBasicMaterial({ map: plasterTexture(palette.wall, palette.wash) }));
  for (const [sideIndex, side] of [layout.outline.left, layout.outline.right].entries()) {
    for (let index = 0; index < layout.sections.length; index += 1) {
      wallWithOpenings(scene, side[index], side[index + 1], wallMaterials[index],
        layout.frames.filter((frame) => frame.section === index && frame.sideSign === (sideIndex ? 1 : -1) && frame.room.modelUrl));
    }
  }
  scene.add(wallBetween(layout.outline.left[0], layout.outline.right[0], wallMaterials[0]));
  scene.add(wallBetween(layout.outline.left.at(-1), layout.outline.right.at(-1), wallMaterials.at(-1)));

  const placeholderMaterials = palettes.map((palette, index) =>
    new THREE.MeshBasicMaterial({ map: placeholderTexture(palette.paper, index), side: THREE.FrontSide }));
  const frameMeshes = new Map();
  const textureLoader = new THREE.TextureLoader();
  const revealMask = revealMaskTexture();
  for (const frame of layout.frames) {
    const object = frameMesh(frame, placeholderMaterials);
    if (frame.room?.previewImage) {
      const texture = textureLoader.load(assetBase + frame.room.previewImage.replace(/^\//, "") + (assetVersion ? `?v=${assetVersion}` : ""));
      texture.colorSpace = THREE.SRGBColorSpace;
      object.surface.material = new THREE.MeshBasicMaterial({
        map: texture, alphaMap: revealMask, alphaTest: .5, side: THREE.FrontSide,
      });
    }
    scene.add(object.group);
    frameMeshes.set(frame.id, object);
  }

  const floaters = [];
  const moteMaterial = new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: .65, depthWrite: false });
  for (const section of layout.sections) addArchitecture(scene, layout, section, palettes[section.index], layout.frames, floaters, moteMaterial);

  return {
    scene,
    layout,
    frameMeshes,
    animate(time, reduceMotion) {
      if (reduceMotion) return;
      for (const { sprite, baseY, phase } of floaters) {
        sprite.position.y = baseY + Math.sin(time * .32 + phase) * .09;
      }
    },
  };
}
