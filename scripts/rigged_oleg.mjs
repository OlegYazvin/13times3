import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { addOlegPortrait } from "./oleg_portrait.mjs";
import samURL from "./assets/figures/rigged-casual-sam.glb";

// A CC0 MakeHuman-derived clothed rig is the anatomical understructure. The
// original generic head is removed. Its clothing and bones are adapted to
// Oleg's reference-based illustrated portrait and each story's actual pose.
let templatePromise;
export function loadRiggedOlegBase() {
  if (!templatePromise) templatePromise = new GLTFLoader().loadAsync(samURL)
    .then(({ scene }) => {
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
  hands = null, shirtColor = 0xe7d9c4, pantsColor = 0x263448 } = {}) {
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
    if (name.endsWith("1")) mesh.userData.solidFootprint = true;
  }
  const skin = figure.getObjectByName("Sam_|_anatomical_body");
  skin.material = skin.material.clone();
  skin.material.map = null;
  skin.material.color.setHex(0xc7957f);
  skin.material.roughness = .94;
  // The body is already trimmed at the jaw. A sculpted, curved painted head
  // sits over the neck; the reference photo itself never enters the GLB.
  const head = new THREE.Group();
  head.name = "Oleg's reference-based painted likeness on a sculpted head";
  head.scale.set(.65, .48, .65 * .94);
  head.position.y = 1.51 * (1 - .48) + .055;
  figure.add(head);
  addOlegPortrait(head, 1.76, [
    [-.445, .055, .055], [-.385, .136, .116],
    [-.29, .178, .147], [-.18, .196, .162],
    [-.045, .18, .151], [.07, .145, .128], [.15, .027, .03],
  ], new THREE.MeshStandardMaterial({ color: 0xc7957f, roughness: .94 }));
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
