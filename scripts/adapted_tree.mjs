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
