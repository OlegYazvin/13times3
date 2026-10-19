import * as THREE from "three";
import {
  buildLayout, HALL_WIDTH, HALL_HEIGHT, FRAME_HEIGHT, FRAME_WIDTH,
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

function labelTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 256, 96);
  context.font = "600 74px Georgia, serif";
  context.fillStyle = "#5b463c";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 128, 49);
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

function wallBetween(start, end, material) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, HALL_HEIGHT, .12), material);
  wall.position.set((start.x + end.x) / 2, HALL_HEIGHT / 2, (start.z + end.z) / 2);
  wall.rotation.y = Math.atan2(-dz, dx);
  return wall;
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

  box(root, "painted wooden frame back", 0, 0, .025, FRAME_WIDTH + .25, FRAME_HEIGHT + .25, .07, wood);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT), placeholderMaterials[frame.section]);
  surface.position.z = .09;
  root.add(surface);

  for (const sign of [-1, 1]) {
    box(root, "frame upright", sign * (FRAME_WIDTH / 2 + .055), 0, .14, .115, FRAME_HEIGHT + .22, .12, woodHighlight);
    box(root, "frame inner line", sign * (FRAME_WIDTH / 2 - .025), 0, .152, .025, FRAME_HEIGHT, .025, gold);
    box(root, "frame rail", 0, sign * (FRAME_HEIGHT / 2 + .055), .14, FRAME_WIDTH + .22, .115, .12, woodHighlight);
    box(root, "frame inner rail", 0, sign * (FRAME_HEIGHT / 2 - .025), .152, FRAME_WIDTH, .025, .025, gold);
  }

  box(root, "number plaque", 0, FRAME_HEIGHT / 2 + .29, .12, .93, .40, .07, ivory);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.76, .32),
    new THREE.MeshBasicMaterial({ map: labelTexture(frame.label), transparent: true, depthWrite: false }),
  );
  label.position.set(0, FRAME_HEIGHT / 2 + .29, .163);
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

function addArchitecture(scene, section, palette, frames, floaters, moteMaterial) {
  const group = new THREE.Group();
  group.name = `gallery section ${section.index + 1} architectural details`;
  group.position.set(section.start.x, 0, section.start.z);
  group.rotation.y = -section.yaw;
  scene.add(group);
  const length = section.length;
  const plasterPanel = new THREE.MeshBasicMaterial({ color: palette.wall });
  const runner = new THREE.MeshBasicMaterial({ color: section.index % 2 ? 0xb59a92 : 0xb49b8f });
  const border = new THREE.MeshBasicMaterial({ color: 0xd8c1a4 });
  const innerTurnSigns = [1, 1, -1, -1];

  box(group, "soft fabric runner", 0, .012, -length / 2, 2.2, .018, length - .35, runner);
  for (const sign of [-1, 1]) {
    const startInset = section.index > 0 && innerTurnSigns[section.index - 1] === sign ? HALL_WIDTH / 2 + .12 : .05;
    const endInset = section.index < 4 && innerTurnSigns[section.index] === sign ? HALL_WIDTH / 2 + .12 : .05;
    const wallLength = length - startInset - endInset;
    const wallCenter = -(startInset + wallLength / 2);
    box(group, "runner stitched edge", sign * 1.13, .023, -length / 2, .035, .008, length - .55, border);
    box(group, "plaster wainscot", sign * (HALL_WIDTH / 2 - .105), .62, wallCenter, .035, 1.15, wallLength, plasterPanel);
    box(group, "wooden skirting", sign * (HALL_WIDTH / 2 - .10), .18, wallCenter, .12, .34, wallLength, wood);
    box(group, "chair rail", sign * (HALL_WIDTH / 2 - .10), 1.23, wallCenter, .10, .075, wallLength, ivory);
    box(group, "ceiling cornice", sign * (HALL_WIDTH / 2 - .21), HALL_HEIGHT - .17, wallCenter, .24, .24, wallLength, ivory);
    box(group, "cornice shadow", sign * (HALL_WIDTH / 2 - .17), HALL_HEIGHT - .35, wallCenter, .08, .035, wallLength, shadowTrim);

    const centers = frames.filter((frame) => frame.section === section.index && frame.sideSign === sign)
      .map((frame) => frame.along).sort((a, b) => a - b);
    const pilasters = [centers[0] - FRAME_WIDTH / 2 - .28];
    for (let bay = 1; bay < centers.length; bay += 1) pilasters.push((centers[bay - 1] + centers[bay]) / 2);
    pilasters.push(centers.at(-1) + FRAME_WIDTH / 2 + .28);
    for (const along of pilasters) {
      if (along <= startInset + .11 || along >= length - endInset - .11) continue;
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
  scene.background = new THREE.Color(0xc9b5ae);
  scene.fog = new THREE.FogExp2(0xc9b5ae, .009);
  scene.add(new THREE.AmbientLight(0xfff0d8, 1.2));

  const polygon = new THREE.Shape();
  const outline = [...layout.outline.left, ...layout.outline.right.slice().reverse()];
  polygon.moveTo(outline[0].x, outline[0].z);
  for (const point of outline.slice(1)) polygon.lineTo(point.x, point.z);
  polygon.closePath();
  const floorGeometry = new THREE.ShapeGeometry(polygon);
  floorGeometry.rotateX(Math.PI / 2);
  const floor = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({ color: 0xc6ad99, side: THREE.DoubleSide }));
  floor.position.y = -.015;
  scene.add(floor);
  const ceilingWash = plasterTexture("#baa9ac", "#e1cbc4");
  ceilingWash.wrapS = THREE.RepeatWrapping;
  ceilingWash.wrapT = THREE.RepeatWrapping;
  ceilingWash.repeat.set(.06, .06);
  const ceiling = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({ map: ceilingWash, side: THREE.DoubleSide }));
  ceiling.position.y = HALL_HEIGHT;
  scene.add(ceiling);

  const wallMaterials = palettes.map((palette) => new THREE.MeshBasicMaterial({ map: plasterTexture(palette.wall, palette.wash) }));
  for (const side of [layout.outline.left, layout.outline.right]) {
    for (let index = 0; index < layout.sections.length; index += 1) {
      scene.add(wallBetween(side[index], side[index + 1], wallMaterials[index]));
    }
  }
  scene.add(wallBetween(layout.outline.left[0], layout.outline.right[0], wallMaterials[0]));
  scene.add(wallBetween(layout.outline.left.at(-1), layout.outline.right.at(-1), wallMaterials.at(-1)));

  const placeholderMaterials = palettes.map((palette, index) =>
    new THREE.MeshBasicMaterial({ map: placeholderTexture(palette.paper, index), side: THREE.FrontSide }));
  const frameMeshes = new Map();
  const textureLoader = new THREE.TextureLoader();
  for (const frame of layout.frames) {
    const object = frameMesh(frame, placeholderMaterials);
    if (frame.room?.previewImage) {
      const texture = textureLoader.load(assetBase + frame.room.previewImage.replace(/^\//, "") + (assetVersion ? `?v=${assetVersion}` : ""));
      texture.colorSpace = THREE.SRGBColorSpace;
      object.surface.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
    }
    scene.add(object.group);
    frameMeshes.set(frame.id, object);
  }

  const floaters = [];
  const moteMaterial = new THREE.SpriteMaterial({ map: dustTexture(), transparent: true, opacity: .65, depthWrite: false });
  for (const section of layout.sections) addArchitecture(scene, section, palettes[section.index], layout.frames, floaters, moteMaterial);

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
