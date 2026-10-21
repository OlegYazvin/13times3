import * as THREE from "three";
import olegFaceURL from "./assets/room02/oleg-face.webp";

// The illustrated likeness is wrapped around a modeled cheek and jaw. The
// reference photographs stay private; only this small painted texture ships.
let portraitMaterialPromise;
const portraitMeshes = new WeakMap();

export function addOlegPortrait(parent, faceY, profile, fallbackMaterial) {
  const rows = 24, columns = 24;
  const positions = [], uvs = [], indices = [];
  const bottom = profile[0][0], top = profile.at(-1)[0];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const u = col / columns, v = row / rows;
    const offset = bottom + v * (top - bottom);
    let band = 0;
    while (band < profile.length - 2 && offset > profile[band + 1][0]) band++;
    const a = profile[band], b = profile[band + 1];
    const t = THREE.MathUtils.clamp((offset - a[0]) / (b[0] - a[0]), 0, 1);
    const rx = THREE.MathUtils.lerp(a[1], b[1], t);
    const rz = THREE.MathUtils.lerp(a[2], b[2], t);
    const around = (u - .5) * 1.92;
    positions.push(around * rx, faceY + offset,
      .008 + rz * Math.sqrt(Math.max(0, 1 - around * around)));
    uvs.push(u, v);
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = row * (columns + 1) + col;
    indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, fallbackMaterial);
  mesh.name = "Oleg's painted likeness on a curved three-dimensional face";
  parent.add(mesh);
  portraitMeshes.set(mesh, true);
  return mesh;
}

export async function finishOlegPortraits(root) {
  const meshes = [];
  root.traverse((object) => { if (portraitMeshes.has(object)) meshes.push(object); });
  if (!meshes.length) return;
  portraitMaterialPromise ||= new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(olegFaceURL, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(new THREE.MeshBasicMaterial({ map: texture, transparent: true,
        alphaTest: .025, side: THREE.DoubleSide, depthWrite: true }));
    }, undefined, reject);
  });
  const material = await portraitMaterialPromise;
  for (const mesh of meshes) mesh.material = material;
}
