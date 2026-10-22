import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { addJanePortrait } from "./oleg_portrait.mjs";
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

export function makeRiggedJane(template, { height = 1.68, hands = null,
  shirtColor = 0x30394e, pantsColor = 0x293347 } = {}) {
  const figure = clone(template);
  figure.name = "Jane's posed, clothed three-dimensional figure";
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
  const flesh = new THREE.Color(0xca947f);
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
  head.name = "Jane's sculpted head with her painted likeness and high bun";
  head.scale.set(.69, .60, .66);
  head.position.y = 1.43 * (1 - .60) + .015;
  figure.add(head);
  const y = 1.62;
  const headRings = [
    [y - .43, .052, .055, -.008], [y - .36, .12, .12, -.01],
    [y - .25, .155, .15, -.015], [y - .13, .172, .16, -.022],
    [y + .02, .17, .15, -.028], [y + .14, .14, .12, -.035],
    [y + .21, .09, .08, -.042], [y + .24, .01, .012, -.045],
  ];
  const skullGeometry = loft(head, "formed jaw, cheek and cranium beneath Jane's portrait",
    headRings, new THREE.MeshStandardMaterial({ color: 0xc89580,
      roughness: .94, side: THREE.DoubleSide }), 32);
  const skullColor = [];
  const dark = new THREE.Color(0x332b2c);
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
  addJanePortrait(head, y, [
    [-.43, .05, .055], [-.35, .13, .12], [-.25, .17, .15],
    [-.13, .18, .16], [.02, .17, .15], [.14, .14, .12],
  ], new THREE.MeshStandardMaterial({ color: 0xc89580, roughness: .94 }));
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
  for (const side of ["l", "r"]) {
    const sign = side === "l" ? 1 : -1;
    const target = hands?.[sign] || [sign * .33, .77, .16];
    const factor = 1.67 / height;
    const hand = target.map(value => value * factor);
    const shoulder = [sign * .195, 1.35, .012];
    const elbow = shoulder.map((value, axis) =>
      THREE.MathUtils.lerp(value, hand[axis], .53));
    elbow[0] += sign * .065;
    turnBoneToward(figure, `upperarm_${side}`, `lowerarm_${side}`, elbow);
    turnBoneToward(figure, `lowerarm_${side}`, `hand_${side}`, hand);
  }
  figure.scale.setScalar(height / 1.67);
  return figure;
}
