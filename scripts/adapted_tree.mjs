import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import treeUrl from "./assets/common/quaternius-tree.glb";

// Quaternius's CC0 tree is adapted once for the storybook outdoor worlds.
// The full source and license are recorded in the site credits.
let sourcePromise;
export function loadAdaptedTree() {
  sourcePromise ??= new GLTFLoader().loadAsync(treeUrl).then(gltf => gltf.scene);
  return sourcePromise;
}

export function plantAdaptedTree(parent, source, {
  x, z, scale = .5, rotation = 0, leafTint = 0xb5c5ad,
  name = "detailed branching tree", colliderRadius = .15,
}) {
  const tree = source.clone(true);
  tree.name = name;
  tree.scale.setScalar(scale);
  tree.rotation.y = rotation;
  tree.position.set(x, .13, z);
  tree.traverse(part => {
    if (!part.isMesh) return;
    part.material = part.material.clone();
    part.material.normalMap = null;
    part.material.roughness = .98;
    if (part.material.name.includes("Leaves")) {
      part.material.color.set(leafTint);
      part.material.side = THREE.DoubleSide;
    }
  });
  parent.add(tree);
  // Only the trunk obstructs walking; its canopy is above head height.
  const core = new THREE.Mesh(new THREE.CylinderGeometry(
    colliderRadius * .82, colliderRadius, 2.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x59493f, roughness: .98 }));
  core.name = "solid tree trunk collision core";
  core.position.set(x, 1.08, z);
  core.userData.solidFootprint = true;
  parent.add(core);
  return tree;
}

// Preserve a room's hand-authored fruiting branches and their attached apples
// while replacing only its smooth placeholder crown with modeled foliage.
export function attachAdaptedCanopy(parent, source, {
  y = .85, scale = .43, tint = 0xb7aa73,
  name = "branch-connected modeled fruit-tree foliage",
} = {}) {
  source.updateMatrixWorld(true);
  const canopy = new THREE.Group();
  canopy.name = name;
  canopy.position.y = y;
  canopy.scale.setScalar(scale);
  source.traverse(part => {
    if (!part.isMesh || !part.material.name.includes("Leaves")) return;
    const leaves = part.clone();
    leaves.name = "shaped overlapping leaves in the orchard crown";
    leaves.material = part.material.clone();
    leaves.material.color.set(tint);
    leaves.material.normalMap = null;
    leaves.material.roughness = .98;
    leaves.material.side = THREE.DoubleSide;
    leaves.matrix.copy(part.matrixWorld);
    leaves.matrix.decompose(leaves.position, leaves.quaternion, leaves.scale);
    canopy.add(leaves);
  });
  if (canopy.children.length === 0) throw new Error("Adapted tree has no foliage mesh");
  parent.add(canopy);
  return canopy;
}
