import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { addGPortrait, addJanePortrait } from "./oleg_portrait.mjs";
import { paintedFabric } from "./painted_fabric.mjs";
import mayaURL from "./assets/figures/rigged-casual-maya.glb";

// A clothed CC0 rig provides human anatomy and poseable hands. All five Jane
// afterimages in frame 02 share her private-reference-based illustrated face.
let templatePromise;
export function loadRiggedJaneBase() {
  if (!templatePromise) templatePromise = new GLTFLoader().loadAsync(mayaURL)
    .then(({ scene }) => {
      const body = scene.getObjectByName("Maya_|_anatomical_body") ||
        scene.getObjectByName("Maya | anatomical body");
      if (!body?.isSkinnedMesh) throw new Error("Jane rig has no body mesh");
      const geometry = body.geometry.clone();
      const position = geometry.attributes.position;
      const indices = geometry.index.array;
      const kept = [];
      for (let i = 0; i < indices.length; i += 3) {
        if ([0, 1, 2].every(k => position.getY(indices[i + k]) < 1.43))
          kept.push(indices[i], indices[i + 1], indices[i + 2]);
      }
      geometry.setIndex(kept);
      body.geometry = geometry;
      return scene;
    });
  return templatePromise;
}

function turnBoneToward(model, name, childName, target) {
  model.updateMatrixWorld(true);
  const bone = model.getObjectByName(name);
  const child = model.getObjectByName(childName);
  if (!bone?.isBone || !child?.isBone) throw new Error(`Missing Jane rig bone ${name}`);
  const origin = bone.getWorldPosition(new THREE.Vector3());
  const current = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
  const desired = new THREE.Vector3(...target).sub(origin).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(current, desired);
  const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parent.multiply(delta.multiply(world)));
  model.updateMatrixWorld(true);
}

function loft(parent, name, rings, material, sides = 24) {
  const points = [], indices = [];
  for (let row = 0; row < rings.length; row++) {
    const [y, rx, rz, cx = 0, cz = 0] = rings[row];
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      points.push(cx + Math.cos(angle) * rx, y, cz + Math.sin(angle) * rz);
      if (row) {
        const a = (row - 1) * sides + side;
        const b = (row - 1) * sides + (side + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name;
  parent.add(mesh); return mesh;
}

function sculptGShortBob(head, faceY) {
  // A continuous, recessed hair shell follows the rounded bob in the painted
  // portrait. The face mesh sits in front of it, so there is no hard seam at
  // either temple when G is viewed from the side.
  const rings = [
    [faceY - .36, .115, .125, -.018],
    [faceY - .30, .18, .16, -.018],
    [faceY - .19, .203, .174, -.022],
    [faceY - .055, .207, .177, -.026],
    [faceY + .09, .183, .155, -.034],
    [faceY + .19, .13, .115, -.04],
    [faceY + .238, .012, .015, -.044],
  ];
  const sides = 48, vertices = [], colors = [], indices = [];
  const base = new THREE.Color(0x533e37);
  const warm = new THREE.Color(0x866451);
  for (let row = 0; row < rings.length; row++) {
    const [y, rx, rz, cz] = rings[row];
    for (let side = 0; side < sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const wave = .007 * Math.sin(angle * 9 + row * .8);
      const end = row === 0 ? .017 * Math.cos(angle * 8) : 0;
      const front = Math.max(0, Math.sin(angle));
      vertices.push(Math.cos(angle) * (rx + wave), y + end,
        Math.sin(angle) * (rz + wave * .6) + cz - .04 * front);
      const glint = .18 + .24 * (.5 + .5 * Math.sin(angle * 13 + row * .48));
      const shade = base.clone().lerp(warm, glint);
      colors.push(shade.r, shade.g, shade.b);
      if (row < rings.length - 1) {
        const n = row * sides + side;
        const next = row * sides + (side + 1) % sides;
        indices.push(n, next, n + sides,
          next, next + sides, n + sides);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const hair = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: .97,
    side: THREE.DoubleSide,
  }));
  hair.name = "G's continuous shoulder-length bob with painted fringe and soft ends";
  head.add(hair);
}

function sculptGBlouse(figure) {
  // Small sewn details suggest a real blouse without broad extrusions that
  // read as separate blocks across her chest at hallway viewing distance.
  const seam = new THREE.MeshStandardMaterial({ color: 0xd9cbbc,
    roughness: .98 });
  const neckEdge = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.13, 1.29, .16),
    new THREE.Vector3(-.068, 1.285, .19),
    new THREE.Vector3(0, 1.273, .202),
    new THREE.Vector3(.068, 1.285, .19),
    new THREE.Vector3(.13, 1.29, .16),
  ]);
  const stitching = new THREE.Mesh(new THREE.TubeGeometry(neckEdge, 20, .003, 5), seam);
  stitching.name = "G's finely stitched blouse neckline";
  figure.add(stitching);
  const placket = new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.254, .189),
      new THREE.Vector3(.005, 1.13, .199),
      new THREE.Vector3(.009, .98, .19),
    ]), 20, .006, 6), seam);
  placket.name = "G's sewn shirt placket";
  figure.add(placket);
  for (const y of [1.19, 1.09, .99]) {
    const button = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .004, 12),
      new THREE.MeshStandardMaterial({ color: 0xe1d4c3, roughness: .91 }));
    button.rotation.x = Math.PI / 2;
    button.position.set(.011, y, .203);
    button.name = "small pearl button on G's blouse";
    figure.add(button);
  }
}

export function makeRiggedJane(template, { height = 1.68, hands = null,
  shirtColor = 0x30394e, pantsColor = 0x293347,
  identity = "Jane" } = {}) {
  const isG = identity === "G";
  const figure = clone(template);
  figure.name = `${identity}'s posed, clothed three-dimensional figure`;
  const garment = figure.getObjectByName("female_casualsuit01");
  if (!garment) throw new Error("Jane rig has no garment");
  const fabric = new THREE.Color(shirtColor);
  garment.traverse((mesh) => {
    if (!mesh.isSkinnedMesh) return;
    mesh.material = mesh.material.clone();
    mesh.material.map = null;
    mesh.material.normalMap = null;
    mesh.material.color.setHex(mesh.material.name.includes("trousers") ?
      pantsColor : shirtColor);
    mesh.material.roughness = .94;
    mesh.material = paintedFabric(mesh.material);
    mesh.userData.solidFootprint = true;
  });
  const skin = figure.getObjectByName("Maya_|_anatomical_body") ||
    figure.getObjectByName("Maya | anatomical body");
  const geometry = skin.geometry.clone();
  const position = geometry.attributes.position;
  const colors = [];
  const flesh = new THREE.Color(isG ? 0xd4a082 : 0xca947f);
  for (let i = 0; i < position.count; i++) {
    // The source has bare shoulders. Paint full sleeves over the existing
    // skinned arms, leaving only actual hands skin-colored after the cuff.
    const x = Math.abs(position.getX(i));
    const sleeve = THREE.MathUtils.smoothstep(x, .392, .448);
    const color = fabric.clone().lerp(flesh, sleeve);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  skin.geometry = geometry;
  skin.material = new THREE.MeshStandardMaterial({ color: 0xffffff,
    vertexColors: true, roughness: .94, side: THREE.DoubleSide });

  const head = new THREE.Group();
  head.name = isG ? "G's sculpted head with painted likeness and short bob" :
    "Jane's sculpted head with her painted likeness and high bun";
  head.scale.set(isG ? .73 : .69, .60, isG ? .70 : .66);
  head.position.y = 1.43 * (1 - .60) + .015;
  figure.add(head);
  const y = 1.62;
  const headRings = [
    [y - .43, .052, .055, -.008], [y - .36, .12, .12, -.01],
    [y - .25, .155, .15, -.015], [y - .13, .172, .16, -.022],
    [y + .02, .17, .15, -.028], [y + .14, .14, .12, -.035],
    [y + .21, .09, .08, -.042], [y + .24, .01, .012, -.045],
  ];
  const skullGeometry = loft(head, `formed jaw, cheek and cranium beneath ${identity}'s portrait`,
    headRings, new THREE.MeshStandardMaterial({ color: flesh.getHex(),
      roughness: .94, side: THREE.DoubleSide }), 32);
  const skullColor = [];
  const dark = new THREE.Color(isG ? 0x533e37 : 0x332b2c);
  for (let row = 0; row < headRings.length; row++) {
    for (let side = 0; side < 32; side++) {
      const angle = side * Math.PI * 2 / 32;
      const back = Math.sin(angle) < .18;
      const crown = THREE.MathUtils.smoothstep(headRings[row][0] - y,
        back ? -.23 : .075, back ? -.12 : .16);
      const c = flesh.clone().lerp(dark, crown);
      skullColor.push(c.r, c.g, c.b);
    }
  }
  skullGeometry.geometry.setAttribute("color",
    new THREE.Float32BufferAttribute(skullColor, 3));
  skullGeometry.material.vertexColors = true;
  skullGeometry.material.color.setHex(0xffffff);
  const addFace = isG ? addGPortrait : addJanePortrait;
  addFace(head, y, [
    [-.43, .05, .055], [-.35, .13, .12], [-.25, .17, .15],
    [-.13, .18, .16], [.02, .17, .15], [.14, .14, .12],
  ], new THREE.MeshStandardMaterial({ color: flesh.getHex(), roughness: .94 }));
  if (isG) {
    sculptGShortBob(head, y);
    sculptGBlouse(figure);
  }
  else {
    loft(head, "Jane's high twisted bun with gathered hair",
      [[y + .20, .05, .05, 0, -.06], [y + .28, .10, .09, 0, -.07],
        [y + .38, .085, .08, 0, -.075], [y + .43, .015, .015, 0, -.075]],
      new THREE.MeshStandardMaterial({ color: 0x332b2c, roughness: .98 }), 20);
    for (let strand = 0; strand < 5; strand++) {
      const angle = strand * 1.26;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * .06, y + .28, -.007 + Math.sin(angle) * .075),
        new THREE.Vector3(Math.cos(angle + .6) * .09, y + .34,
          -.07 + Math.sin(angle + .6) * .08),
        new THREE.Vector3(Math.cos(angle + 1.2) * .04, y + .415,
          -.075 + Math.sin(angle + 1.2) * .035),
      ]);
      const strandMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, .007, 5),
        new THREE.MeshStandardMaterial({ color: 0x564039, roughness: .95 }));
      strandMesh.name = "combed strand in Jane's high bun"; head.add(strandMesh);
    }
  }
  for (const side of ["l", "r"]) {
    const sign = side === "l" ? 1 : -1;
    const target = hands?.[sign] || [sign * .33, .77, .16];
    const factor = 1.67 / height;
    const hand = target.map(value => value * factor);
    const shoulder = [sign * .195, 1.35, .012];
    const elbow = shoulder.map((value, axis) =>
      THREE.MathUtils.lerp(value, hand[axis], .53));
    elbow[0] += sign * .065;
    if (isG) {
      elbow[1] -= .12;
      elbow[2] += .06;
    }
    turnBoneToward(figure, `upperarm_${side}`, `lowerarm_${side}`, elbow);
    turnBoneToward(figure, `lowerarm_${side}`, `hand_${side}`, hand);
  }
  const scale = height / 1.67;
  figure.scale.set(isG ? scale * 1.04 : scale, scale,
    isG ? scale * 1.02 : scale);
  return figure;
}

export function makeRiggedG(template, options = {}) {
  return makeRiggedJane(template, { ...options, identity: "G" });
}
