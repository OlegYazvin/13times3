import * as THREE from "three";
import olegFaceURL from "./assets/room02/oleg-face.webp";
import janeFaceURL from "./assets/room02/jane-face.webp";
import gFaceURL from "./assets/room02/g-face.webp";
import zephrineFaceURL from "./assets/room02/zephrine-face.webp";

// The illustrated likeness is wrapped around a modeled cheek and jaw. The
// reference photographs stay private; only this small painted texture ships.
const portraitMaterialPromises = new Map();
const portraitMeshes = new WeakMap();
const hairPaint = new THREE.MeshStandardMaterial({ color: 0x382b2b,
  roughness: .94, side: THREE.DoubleSide });
const framePaint = new THREE.MeshStandardMaterial({ color: 0x28282e,
  roughness: .72, side: THREE.DoubleSide });

function raisedLine(parent, name, points, radius, material) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 12, radius, 6), material);
  mesh.name = name;
  parent.add(mesh);
}

function shapeOlegPortrait(parent, faceY) {
  // The painted lenses retain their fine detail; sculpted temples, hair and
  // beard give the portrait depth in profile without covering the eyes.
  for (const side of [-1, 1]) {
    raisedLine(parent, "Oleg's glasses temple behind the ear", [
      [side * .13, faceY - .16, .15],
      [side * .177, faceY - .17, .075],
      [side * .187, faceY - .17, -.035],
    ], .006, framePaint);
    raisedLine(parent, "Oleg's cheek-length sideburn", [
      [side * .163, faceY + .045, .052],
      [side * .185, faceY - .09, .012],
      [side * .177, faceY - .245, .018],
      [side * .139, faceY - .305, .072],
    ], .02, hairPaint);
    for (let lock = 0; lock < 3; lock++) {
      const x = side * (.16 + lock * .013);
      raisedLine(parent, "separate swept lock around Oleg's ear", [
        [x * .77, faceY + .19, -.055],
        [x, faceY + .025, -.09 - lock * .012],
        [x * 1.12, faceY - .18, -.07],
        [x * .92, faceY - .39 - lock * .035, .025],
      ], .017 - lock * .002, hairPaint);
    }
    raisedLine(parent, "short beard wrapping Oleg's jaw in profile", [
      [side * .137, faceY - .29, .095],
      [side * .12, faceY - .365, .11],
      [side * .067, faceY - .414, .102],
      [0, faceY - .427, .09],
    ], .014, hairPaint);
  }
}

function addPortrait(parent, faceY, profile, fallbackMaterial, person) {
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
    const angle = (u - .5) * 2.22;
    const x = Math.sin(angle) * rx;
    // Real cheek, brow and nose relief prevents the likeness reading as a
    // flat photograph stuck to the front of an otherwise sculpted head.
    const bump = person === "Oleg" ?
      .036 * Math.exp(-Math.pow((u - .5) / .11, 2) - Math.pow((v - .48) / .2, 2)) +
      .012 * Math.exp(-Math.pow((Math.abs(u - .5) - .23) / .13, 2) - Math.pow((v - .43) / .24, 2)) :
      .017 * Math.exp(-Math.pow((u - .5) / .14, 2) - Math.pow((v - .49) / .23, 2));
    positions.push(x, faceY + offset, .009 + Math.cos(angle) * rz + bump);
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
  mesh.name = `${person}'s painted likeness on a curved three-dimensional face`;
  parent.add(mesh);
  portraitMeshes.set(mesh, person);
  return mesh;
}

export function addOlegPortrait(parent, faceY, profile, fallbackMaterial) {
  const mesh = addPortrait(parent, faceY, profile, fallbackMaterial, "Oleg");
  shapeOlegPortrait(parent, faceY);
  return mesh;
}

export function addJanePortrait(parent, faceY, profile, fallbackMaterial) {
  return addPortrait(parent, faceY, profile, fallbackMaterial, "Jane");
}

export function addGPortrait(parent, faceY, profile, fallbackMaterial) {
  return addPortrait(parent, faceY, profile, fallbackMaterial, "G");
}

export function addZephrinePortrait(parent, faceY, profile, fallbackMaterial) {
  return addPortrait(parent, faceY, profile, fallbackMaterial, "Zephrine");
}

export async function finishOlegPortraits(root) {
  const meshes = [];
  root.traverse((object) => { if (portraitMeshes.has(object)) meshes.push(object); });
  for (const person of new Set(meshes.map(mesh => portraitMeshes.get(mesh)))) {
    if (!portraitMaterialPromises.has(person)) {
      portraitMaterialPromises.set(person, new Promise((resolve, reject) => {
        const url = { Oleg: olegFaceURL, Jane: janeFaceURL,
          G: gFaceURL, Zephrine: zephrineFaceURL }[person];
        new THREE.TextureLoader().load(url, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.userData.mimeType = "image/webp";
          resolve(new THREE.MeshStandardMaterial({ map: texture, roughness: .94,
            transparent: true, alphaTest: .025, side: THREE.DoubleSide,
            depthWrite: true }));
        }, undefined, reject);
      }));
    }
    const material = await portraitMaterialPromises.get(person);
    for (const mesh of meshes) if (portraitMeshes.get(mesh) === person) mesh.material = material;
  }
}
