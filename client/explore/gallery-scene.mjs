import * as THREE from "three";
import {
  buildLayout, HALL_WIDTH, HALL_HEIGHT, FRAME_HEIGHT, FRAME_WIDTH,
} from "./layout.mjs";

const palettes = [
  { wall: 0x17283c, portal: "#234c65", light: 0x70d9dc },
  { wall: 0x252039, portal: "#59446d", light: 0xc7a0ff },
  { wall: 0x152f36, portal: "#2e6764", light: 0x96e3be },
  { wall: 0x30243b, portal: "#75516e", light: 0xffb8bc },
  { wall: 0x1b2c40, portal: "#415a7a", light: 0xb5c9ff },
];

function placeholderTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 128, 256);
  gradient.addColorStop(0, "#081525");
  gradient.addColorStop(.52, color);
  gradient.addColorStop(1, "#0a1425");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 256);
  const glow = context.createRadialGradient(64, 124, 3, 64, 124, 120);
  glow.addColorStop(0, "rgba(255,255,255,.12)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 128, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function labelTexture(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 256, 96);
  context.font = "600 72px Arial, sans-serif";
  context.fillStyle = "#f3f0e9";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 128, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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

function frameMesh(frame, placeholderMaterials, railMaterials) {
  const section = frame.sectionData;
  const sectionGroup = new THREE.Group();
  sectionGroup.position.set(section.start.x, 0, section.start.z);
  sectionGroup.rotation.y = -section.yaw;

  const root = new THREE.Group();
  root.position.set(frame.sideSign * (HALL_WIDTH / 2 - .14), FRAME_HEIGHT / 2 + .08, -frame.along);
  root.rotation.y = frame.sideSign === 1 ? -Math.PI / 2 : Math.PI / 2;
  sectionGroup.add(root);

  const surface = new THREE.Mesh(
    new THREE.PlaneGeometry(FRAME_WIDTH, FRAME_HEIGHT),
    placeholderMaterials[frame.section],
  );
  surface.position.z = .09;
  root.add(surface);

  const rail = railMaterials[frame.section];
  const vertical = new THREE.BoxGeometry(.09, FRAME_HEIGHT + .15, .11);
  for (const sign of [-1, 1]) {
    const post = new THREE.Mesh(vertical, rail);
    post.position.set(sign * (FRAME_WIDTH / 2 + .045), 0, .13);
    root.add(post);
  }
  const horizontal = new THREE.BoxGeometry(FRAME_WIDTH + .18, .09, .11);
  for (const sign of [-1, 1]) {
    const beam = new THREE.Mesh(horizontal, rail);
    beam.position.set(0, sign * (FRAME_HEIGHT / 2 + .045), .13);
    root.add(beam);
  }

  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(1.07, .38, .06),
    new THREE.MeshBasicMaterial({ color: 0x142334 }),
  );
  plaque.position.set(0, FRAME_HEIGHT / 2 + .26, .11);
  root.add(plaque);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.93, .34),
    new THREE.MeshBasicMaterial({ map: labelTexture(frame.label), transparent: true, depthWrite: false }),
  );
  label.position.set(0, FRAME_HEIGHT / 2 + .26, .15);
  root.add(label);
  return { group: sectionGroup, surface, root };
}

export function createGalleryScene(manifest) {
  const layout = buildLayout(manifest);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1522);
  scene.fog = new THREE.FogExp2(0x0a1522, .015);
  scene.add(new THREE.AmbientLight(0xadc5e3, 1.3));

  const polygon = new THREE.Shape();
  const outline = [...layout.outline.left, ...layout.outline.right.slice().reverse()];
  polygon.moveTo(outline[0].x, outline[0].z);
  for (const point of outline.slice(1)) polygon.lineTo(point.x, point.z);
  polygon.closePath();
  const floorGeometry = new THREE.ShapeGeometry(polygon);
  floorGeometry.rotateX(Math.PI / 2);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x182536, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -.015;
  scene.add(floor);
  const ceiling = new THREE.Mesh(floorGeometry, new THREE.MeshBasicMaterial({ color: 0x111b2a, side: THREE.DoubleSide }));
  ceiling.position.y = HALL_HEIGHT;
  scene.add(ceiling);

  const wallMaterials = palettes.map((palette) => new THREE.MeshBasicMaterial({ color: palette.wall }));
  for (const side of [layout.outline.left, layout.outline.right]) {
    for (let index = 0; index < layout.sections.length; index += 1) {
      scene.add(wallBetween(side[index], side[index + 1], wallMaterials[index]));
    }
  }
  scene.add(wallBetween(layout.outline.left[0], layout.outline.right[0], wallMaterials[0]));
  scene.add(wallBetween(layout.outline.left.at(-1), layout.outline.right.at(-1), wallMaterials.at(-1)));

  const placeholderMaterials = palettes.map((palette) =>
    new THREE.MeshBasicMaterial({ map: placeholderTexture(palette.portal), side: THREE.FrontSide }));
  const railMaterials = palettes.map((palette) =>
    new THREE.MeshBasicMaterial({ color: palette.light }));
  const frameMeshes = new Map();
  for (const frame of layout.frames) {
    const object = frameMesh(frame, placeholderMaterials, railMaterials);
    scene.add(object.group);
    frameMeshes.set(frame.id, object);
  }

  const floaters = [];
  for (const section of layout.sections) {
    const palette = palettes[section.index];
    const corridorDetail = new THREE.Group();
    corridorDetail.position.set(section.start.x, 0, section.start.z);
    corridorDetail.rotation.y = -section.yaw;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(.065, .012, section.length),
      new THREE.MeshBasicMaterial({ color: palette.light, transparent: true, opacity: .42 }),
    );
    line.position.set(0, .018, -section.length / 2);
    corridorDetail.add(line);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(2.02, .026, 5, 36, Math.PI),
      new THREE.MeshBasicMaterial({ color: palette.light, transparent: true, opacity: .48 }),
    );
    arch.position.set(0, 1.72, -1.25);
    corridorDetail.add(arch);
    scene.add(corridorDetail);
    const midpoint = {
      x: (section.start.x + section.end.x) / 2,
      z: (section.start.z + section.end.z) / 2,
    };
    const light = new THREE.PointLight(palette.light, 13, 9, 2);
    light.position.set(midpoint.x, 3.25, midpoint.z);
    scene.add(light);
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.22 + section.index * .025, 1),
      new THREE.MeshBasicMaterial({ color: palette.light, transparent: true, opacity: .65 }),
    );
    orb.position.set(midpoint.x, 3.27, midpoint.z);
    scene.add(orb);
    floaters.push({ orb, baseY: orb.position.y, phase: section.index * 1.3 });
  }

  return {
    scene,
    layout,
    frameMeshes,
    animate(time, reduceMotion) {
      if (reduceMotion) return;
      for (const { orb, baseY, phase } of floaters) {
        orb.position.y = baseY + Math.sin(time * .55 + phase) * .12;
        orb.rotation.y = time * .14;
      }
    },
  };
}
