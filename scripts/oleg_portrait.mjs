import * as THREE from "three";
import olegFaceURL from "./assets/room02/oleg-face-v3.webp";
import janeFaceURL from "./assets/room02/jane-face.webp";
import gFaceURL from "./assets/room02/g-face.webp";
import zephrineFaceURL from "./assets/room02/zephrine-face.webp";

// The illustrated likeness is wrapped around a modeled cheek and jaw. The
// reference photographs stay private; only this small painted texture ships.
const portraitMaterialPromises = new Map();
const portraitMeshes = new WeakMap();
const hairPaint = new THREE.MeshStandardMaterial({ color: 0x49352f,
  roughness: .94, side: THREE.DoubleSide });
const hairGlint = new THREE.MeshStandardMaterial({ color: 0x624a3e,
  roughness: .98, side: THREE.DoubleSide });
const framePaint = new THREE.MeshStandardMaterial({ color: 0x28282e,
  roughness: .72, side: THREE.DoubleSide });

function raisedLine(parent, name, points, radius, material) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 12, radius, 6), material);
  mesh.name = name;
  parent.add(mesh);
}

function taperedLock(parent, name, points, radii, material) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const positions = [], uvs = [], indices = [];
  const rows = 12, sides = 8;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const center = path.getPoint(t);
    const tangent = path.getTangent(t).normalize();
    const across = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
    const depth = tangent.clone().cross(across).normalize();
    const step = t * (radii.length - 1), low = Math.floor(step);
    const radius = THREE.MathUtils.lerp(radii[low],
      radii[Math.min(low + 1, radii.length - 1)], step - low);
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      const point = center.clone()
        .addScaledVector(across, Math.cos(angle) * radius)
        .addScaledVector(depth, Math.sin(angle) * radius * .62);
      positions.push(point.x, point.y, point.z);
      uvs.push(side / sides, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let side = 0; side < sides; side++) {
    const a = row * sides + side, b = row * sides + (side + 1) % sides;
    indices.push(a, b, a + sides, b, b + sides, a + sides);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  parent.add(mesh);
}

function sculptHairBehindFace(parent, faceY) {
  const profile = [
    [-.43, .09, .075, -.045],
    [-.31, .15, .12, -.04],
    [-.12, .17, .14, -.037],
    [.07, .17, .143, -.035],
    [.19, .14, .12, -.04],
    [.27, .065, .07, -.045],
    [.325, .012, .018, -.045],
  ];
  const sides = 40, rows = (profile.length - 1) * 4;
  const positions = [], uvs = [], indices = [];
  for (let row = 0; row <= rows; row++) {
    const segment = Math.min(profile.length - 2, Math.floor(row / 4));
    const t = (row - segment * 4) / 4;
    const a = profile[segment], b = profile[segment + 1];
    const [y,width,depth,offsetZ] = a.map((value,i) =>
      THREE.MathUtils.lerp(value,b[i],t));
    for (let side = 0; side <= sides; side++) {
      // Leave the center front open. The painted face already supplies the
      // hairline there; this modeled shell gives the side and back volume.
      const angle = 1.68 + side / sides * (Math.PI * 2 - 3.36);
      positions.push(Math.sin(angle) * width, faceY + y,
        Math.cos(angle) * depth + offsetZ);
      uvs.push(side / sides, row / rows);
    }
  }
  for (let row = 0; row < rows; row++) for (let side = 0; side < sides; side++) {
    const a = row * (sides + 1) + side;
    indices.push(a, a + 1, a + sides + 1, a + 1, a + sides + 2, a + sides + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, hairPaint);
  mesh.name = "shaped back and side hair with open painted hairline";
  parent.add(mesh);
}

function shapeOlegPortrait(parent, faceY, { hairShell = true } = {}) {
  // The painted lenses retain their fine detail; sculpted temples, hair and
  // beard give the portrait depth in profile without covering the eyes.
  if (hairShell) sculptHairBehindFace(parent, faceY);
  for (const side of [-1, 1]) {
    // These are actual raised frames following the brow and cheek contour.
    // The lenses in the painted texture supply fine detail, while this rim
    // keeps the glasses recognizable from a three-quarter view.
    raisedLine(parent, "Oleg's shaped rectangular spectacle rim", [
      [side * .014, faceY - .122, .187],
      [side * .043, faceY - .108, .19],
      [side * .13, faceY - .115, .168],
      [side * .139, faceY - .189, .152],
      [side * .105, faceY - .228, .168],
      [side * .034, faceY - .224, .19],
      [side * .014, faceY - .122, .187],
    ], .0065, framePaint);
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
    taperedLock(parent, "one swept hair lock framing Oleg's ear", [
      [side * .115, faceY + .205, -.01],
      [side * .16, faceY + .04, -.08],
      [side * .182, faceY - .17, -.065],
      [side * .155, faceY - .40, .005],
    ], [.008, .023, .019, .002], hairGlint);
    raisedLine(parent, "short beard wrapping Oleg's jaw in profile", [
      [side * .137, faceY - .29, .095],
      [side * .12, faceY - .365, .11],
      [side * .067, faceY - .414, .102],
      [0, faceY - .427, .09],
    ], .014, hairPaint);
  }
  raisedLine(parent, "bridge joining Oleg's glasses", [
    [-.018, faceY - .137, .191],
    [0, faceY - .145, .195],
    [.018, faceY - .137, .191],
  ], .0065, framePaint);
  // The illustrated face already carries the fine swept hairline. More
  // raised locks across it looked like angular armor at walking distance.
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
    // Oleg's earlier face sat proud of the head as a separate mask. Nest its
    // painted surface nearer the sculpted brow and cheeks while retaining the
    // modeled nose relief. Other portraits retain their established fit.
    positions.push(x, faceY + offset,
      (person === "Oleg" ? -.018 : .009) + Math.cos(angle) * rz + bump);
    // The source painting includes loose hair beyond the facial oval. Crop a
    // little of that margin on Oleg's 3D mapping so his actual eyes, glasses,
    // nose and jaw fill the sculpt instead of becoming a small mask inside a
    // much larger dark hair silhouette.
    uvs.push(person === "Oleg" ? .15 + u * .70 : u,
      person === "Oleg" ? .08 + v * .84 : v);
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

export function addOlegPortrait(parent, faceY, profile, fallbackMaterial,
  options = {}) {
  const mesh = addPortrait(parent, faceY, profile, fallbackMaterial, "Oleg");
  shapeOlegPortrait(parent, faceY, options);
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
