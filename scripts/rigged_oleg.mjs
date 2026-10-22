import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { paintedFabric } from "./painted_fabric.mjs";
import samURL from "./assets/figures/rigged-casual-sam.glb";
import headAtlasURL from "./assets/room02/oleg-head-atlas.webp";
import olegFaceDepth from "./assets/room02/oleg-face-depth.json" with { type: "json" };

// A CC0 MakeHuman-derived clothed rig is the anatomical understructure. The
// original generic head is removed. Its clothing and bones are adapted to
// Oleg's reference-based illustrated portrait and each story's actual pose.
let templatePromise;
let headAtlas;
export function loadRiggedOlegBase() {
  if (!templatePromise) templatePromise = Promise.all([
    new GLTFLoader().loadAsync(samURL),
    new THREE.TextureLoader().loadAsync(headAtlasURL),
  ]).then(([{ scene }, texture]) => {
      headAtlas = texture;
      headAtlas.colorSpace = THREE.SRGBColorSpace;
      headAtlas.userData.mimeType = "image/webp";
      const original = scene.getObjectByName("Sam_|_anatomical_body");
      if (!original?.isSkinnedMesh) throw new Error("Oleg rig has no body mesh");
      const geometry = original.geometry.clone();
      const position = geometry.attributes.position;
      const indices = geometry.index.array;
      const kept = [];
      for (let i = 0; i < indices.length; i += 3) {
        if ([0, 1, 2].every(k => position.getY(indices[i + k]) < 1.515))
          kept.push(indices[i], indices[i + 1], indices[i + 2]);
      }
      geometry.setIndex(kept);
      original.geometry = geometry;
      return scene;
    });
  return templatePromise;
}

function turnBoneToward(model, name, childName, target) {
  model.updateMatrixWorld(true);
  const bone = model.getObjectByName(name);
  const child = model.getObjectByName(childName);
  if (!bone?.isBone || !child?.isBone) throw new Error(`Missing Oleg rig bone ${name}`);
  const origin = bone.getWorldPosition(new THREE.Vector3());
  const current = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
  const desired = new THREE.Vector3(...target).sub(origin).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(current, desired);
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parent.multiply(delta.multiply(world)));
  model.updateMatrixWorld(true);
}

export function makeRiggedOleg(template, { pose = "desk", height = 1.73,
  hands = null, shirtColor = 0xe7d9c4, pantsColor = 0x263448,
  shirtEmbroidery = true } = {}) {
  const figure = clone(template);
  figure.name = `Oleg's clothed three-dimensional figure, ${pose} pose`;
  const unrelatedAccessory = figure.getObjectByName("Phone");
  unrelatedAccessory?.parent.remove(unrelatedAccessory);
  for (const [name, color] of [
    ["male_casualsuit02_1", shirtColor],
    ["male_casualsuit02_2", pantsColor],
  ]) {
    const mesh = figure.getObjectByName(name);
    if (!mesh?.isSkinnedMesh) throw new Error(`Missing Oleg garment ${name}`);
    mesh.material = mesh.material.clone();
    mesh.material.map = null;
    mesh.material.normalMap = null;
    mesh.material.color.setHex(color);
    mesh.material.roughness = .94;
    mesh.material = paintedFabric(mesh.material);
    if (name.endsWith("1")) mesh.userData.solidFootprint = true;
  }
  const skin = figure.getObjectByName("Sam_|_anatomical_body");
  skin.material = skin.material.clone();
  skin.material.map = null;
  skin.material.color.setHex(0xdfae94);
  skin.material.roughness = .94;
  // The body is already trimmed at the jaw. A sculpted, curved painted head
  // sits over the neck; the reference photo itself never enters the GLB.
  const head = new THREE.Group();
  head.name = "Oleg's reference-based painted likeness on a sculpted head";
  // The former head ended well below the rig's natural crown and its face
  // became anonymous at hallway distance. Keep the jaw seated at the trimmed
  // neck while restoring a human-sized cranium and readable features.
  const headHeight = .585;
  head.scale.set(.72, headHeight, .68);
  head.position.y = 1.47 - 1.315 * headHeight;
  figure.add(head);
  const headRings = [
    [-.445, .052, .057, -.016], [-.375, .122, .12, -.02],
    [-.27, .158, .145, -.026], [-.14, .175, .158, -.03],
    [.025, .165, .146, -.036], [.115, .141, .124, -.043],
    [.155, .112, .099, -.048], [.174, .067, .061, -.05],
    [.181, .008, .012, -.05],
  ];
  const points = [], uvs = [], indices = [], sides = 48;
  const rows = (headRings.length - 1) * 4;
  for (let row = 0; row <= rows; row++) {
    const section = Math.min(headRings.length - 2, Math.floor(row / 4));
    const t = (row - section * 4) / 4;
    const ring = headRings[section].map((value, i) =>
      THREE.MathUtils.lerp(value, headRings[section + 1][i], t));
    const [y, rx, rz, offset] = ring;
    for (let s = 0; s < sides; s++) {
      const angle = s * Math.PI * 2 / sides;
      const forward = Math.sin(angle);
      const sideWave=(.006*Math.sin(angle*7+y*18)+
        .0035*Math.sin(angle*13-y*23))*
        THREE.MathUtils.smoothstep(y,-.25,-.04);
      const frontU = s / (sides / 2);
      const frontV = THREE.MathUtils.clamp((y + .445) / .595, 0, 1);
      const reliefRow = Math.round(frontV * 24);
      const reliefCol = Math.round(frontU * 24);
      const relief = s <= sides / 2 ?
        .55 * olegFaceDepth.relief[reliefRow * 25 + reliefCol] : 0;
      points.push(Math.cos(angle)*(rx+sideWave),1.76+y,
        forward*(rz+sideWave*.55)+offset+relief);
      uvs.push(s / sides, frontV);
    }
  }
  for (let row = 0; row < rows; row++)
    for (let s = 0; s < sides; s++) {
      const a = row * sides + s, b = row * sides + (s + 1) % sides;
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  const headGeometry = new THREE.BufferGeometry();
  headGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  headGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  headGeometry.setIndex(indices);
  headGeometry.computeVertexNormals();
  const underpainting = new THREE.Mesh(headGeometry,
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: headAtlas,
      roughness: .95, side: THREE.DoubleSide }));
  underpainting.name = "one painted sculpted head with continuous cheeks hair and beard";
  head.add(underpainting);
  const glassesInk = new THREE.MeshStandardMaterial({ color: 0x27292e,
    roughness: .8 });
  for (const side of [-1, 1]) {
    const temple = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * .13, 1.62, .15),
        new THREE.Vector3(side * .18, 1.61, .075),
        new THREE.Vector3(side * .185, 1.6, -.035),
      ]), 10, .006, 6), glassesInk);
    temple.name = "painted glasses temple fitted to Oleg's continuous head";
    head.add(temple);
  }
  if (shirtEmbroidery &&
    new THREE.Color(shirtColor).getHSL({ h: 0, s: 0, l: 0 }).l > .48) {
    // A small wordless version of the sun-and-cloud drawing on Oleg's light
    // shirt in his reference photo makes the recurring garment his own.
    const ink = new THREE.MeshStandardMaterial({ color: 0x343139,
      roughness: .96, side: THREE.DoubleSide });
    const sun = new THREE.Mesh(new THREE.TorusGeometry(.035, .004, 5, 20), ink);
    sun.name = "small embroidered sun on Oleg's shirt";
    sun.position.set(-.105, 1.245, .237); figure.add(sun);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028,
        .014, 6), ink);
      ray.name = "stitched sun ray";
      ray.position.set(-.105 + Math.cos(angle) * .053,
        1.245 + Math.sin(angle) * .053, .238);
      ray.rotation.z = angle - Math.PI / 2;
      figure.add(ray);
    }
    const cloud = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-.014, 1.17, .243),
        new THREE.Vector3(.01, 1.185, .244),
        new THREE.Vector3(.024, 1.178, .245),
        new THREE.Vector3(.05, 1.196, .242),
        new THREE.Vector3(.077, 1.17, .235),
      ]), 18, .0035, 6), ink);
    cloud.name = "wordless cloud stitched into Oleg's shirt";
    figure.add(cloud);
  }
  const targets = pose === "embrace" ? {
    l: { elbow: [-.35, 1.25, .23], hand: [-.45, 1.08, .44] },
    r: { elbow: [.3, 1.24, .18], hand: [.24, 1.02, .41] },
  } : {
    l: { elbow: [.31, 1.25, .19], hand: [.30, 1.08, .43] },
    r: { elbow: [-.31, 1.25, .19], hand: [-.30, 1.08, .43] },
  };
  if (hands) for (const side of ["l", "r"]) {
    const sign = side === "l" ? 1 : -1;
    const supplied = hands[sign];
    if (!supplied) continue;
    const factor = 1.87 / height;
    const hand = supplied.map(value => value * factor);
    const shoulder = [sign * .194, 1.405, .014];
    const elbow = shoulder.map((value, axis) =>
      THREE.MathUtils.lerp(value, hand[axis], .53));
    elbow[0] += sign * .065;
    elbow[1] -= .025;
    targets[side] = { elbow, hand };
  }
  for (const side of ["l", "r"]) {
    turnBoneToward(figure, `upperarm_${side}`, `lowerarm_${side}`,
      targets[side].elbow);
    turnBoneToward(figure, `lowerarm_${side}`, `hand_${side}`,
      targets[side].hand);
  }
  figure.scale.setScalar(height / 1.87);
  return figure;
}
