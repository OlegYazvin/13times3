import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { openSky } from "./open_sky.mjs";

// A friendship remembered across visits: two Chicago play spaces and a dance
// floor meet in one impossible garden. The places are suggestions, not a claim
// that a particular piece of equipment was used on a particular day.
const root = new THREE.Group();
root.name = "Jane made room for Zephrine and Charlize's friendship";
const C = {
  sky: 0xc4d6d5, ground: 0x9aab9c, moss: 0x647e70, deep: 0x415c65,
  leaf: 0x7f9a7b, paleLeaf: 0xb4c1a0, lilac: 0xaa9cba, blush: 0xda9f9b,
  peach: 0xd79a84, pink: 0xd2667d, blue: 0x486178, cream: 0xefe1c8,
  brass: 0xc5a56e, bark: 0x665659, ink: 0x353c4d, warmSkin: 0xd9a281,
  darkSkin: 0x9a6048, hair: 0x4c3430, darkHair: 0x241f27, white: 0xf4e6d0,
};
const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
const context = canvas.getContext("2d");
const image = context.createImageData(64, 64);
let seed = 303333;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < image.data.length; i += 4) {
  const value = 226 + Math.floor(random() * 27);
  image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
  image.data[i + 3] = 255;
}
context.putImageData(image, 0, 0);
const grain = new THREE.CanvasTexture(canvas); grain.colorSpace = THREE.SRGBColorSpace;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, map: grain, roughness: .93, metalness: 0, side: THREE.DoubleSide, ...extra,
});
const M = Object.fromEntries(Object.entries(C).map(([key, value]) => [key, mat(value)]));
function add(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function box(parent, name, x, y, z, w, h, d, material, solid = false) {
  const mesh = add(parent, name, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function beam(parent, name, a, b, r1, r2, material, sides = 8) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const axis = end.clone().sub(start);
  const mesh = add(parent, name, new THREE.CylinderGeometry(r2, r1, axis.length(), sides),
    material, ...start.clone().add(end).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return mesh;
}
function curve(parent, name, points, radius, material, segments = 20) {
  return add(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(...point))), segments, radius, 7, false), material);
}
function loft(parent, name, rings, material, sides = 12, solid = false) {
  const positions = [], uv = [], indices = [];
  for (let row = 0; row < rings.length; row++) for (let side = 0; side < sides; side++) {
    const [y, rx, rz, cx = 0, cz = 0] = rings[row];
    const angle = side * Math.PI * 2 / sides;
    const nudge = 1 + .013 * Math.cos(angle * 7 + row);
    positions.push(cx + Math.cos(angle) * rx * nudge, y, cz + Math.sin(angle) * rz * nudge);
    uv.push(side / sides, row / (rings.length - 1));
  }
  for (let row = 0; row < rings.length - 1; row++) for (let side = 0; side < sides; side++) {
    const a = row * sides + side, b = row * sides + (side + 1) % sides;
    indices.push(a, b, a + sides, b, b + sides, a + sides);
  }
  for (let side = 1; side < sides - 1; side++) {
    indices.push(0, side + 1, side);
    const top = (rings.length - 1) * sides;
    indices.push(top, top + side, top + side + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = add(parent, name, geometry, material);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function petal(parent, name, x, y, z, scale, material, tilt = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(-.55, .23, -.5, .82, 0, 1);
  shape.bezierCurveTo(.5, .82, .55, .23, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape,
    { depth: .025, bevelEnabled: false, curveSegments: 5 });
  const mesh = add(parent, name, geometry, material, x, y, z);
  mesh.scale.setScalar(scale); mesh.rotation.set(.24, tilt, .18);
  mesh.userData.batchPetal = true;
  return mesh;
}

// The ground and four-sided sky make an outdoor world even after Jane crosses
// the canvas. The forward side stays open for a real view back into the hall.
const ground = new THREE.PlaneGeometry(11.8, 14.4, 28, 34);
ground.rotateX(-Math.PI / 2);
const groundColors = [];
for (let i = 0; i < ground.attributes.position.count; i++) {
  const x = ground.attributes.position.getX(i), z = ground.attributes.position.getZ(i);
  ground.attributes.position.setY(i, .02 * Math.sin(x * 2.8 + z * 1.6));
  const color = new THREE.Color(C.ground).lerp(new THREE.Color(C.cream),
    .5 * Math.exp(-Math.pow(x / 1.2, 2)) + .23 * Math.exp(-Math.pow((z + 3.5) / 1.7, 2)));
  color.offsetHSL(0, 0, (random() - .5) * .045);
  groundColors.push(color.r, color.g, color.b);
}
ground.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
ground.computeVertexNormals();
add(root, "the ground where park visits become a dance floor", ground,
  mat(0xffffff, { vertexColors: true }));
const openAir = openSky(C.sky, 14);
for (const x of [-5.88, 5.88]) {
  const side = add(root, "wraparound watercolor sky", openAir.panel(14.4),
    openAir.sideMaterial, x, 7, 0); side.rotation.y = Math.PI / 2;
}
add(root, "far sky behind the shared memories", openAir.panel(11.8),
  openAir.sideMaterial, 0, 7, -7.19);
add(root, "pale sky overhead", openAir.roof(11.8, 14.4),
  openAir.topMaterial, 0, 13.99, 0);

// Three generous paths braid through the space. The middle stays clear from
// the threshold to the central pair, with side routes around the play pieces.
for (let line = -2; line <= 2; line++) {
  curve(root, "fine brass line through the visits", [[line * .2, .035, 6.85],
    [line * .18 + Math.sin(line) * .13, .04, 3.6],
    [line * .22, .04, .6], [line * .12, .04, -2.6],
    [line * .32, .04, -5.7]], .012, line === 0 ? M.brass : M.cream, 45);
}
for (let i = 0; i < 42; i++) {
  const x = (random() - .5) * 10.9, z = (random() - .5) * 13.2;
  if (Math.abs(x) < 1.15 && z > -3.3) continue;
  petal(root, "small painted leaf fallen beside the path", x, .038, z,
    .095 + random() * .09, i % 4 ? M.brass : M.pink, random() * 6.28);
}

// A quiet, shaded Fellger-like play nook on the left. The smallness is a
// setting cue. The flower-table is a symbolic game, not a documented event.
for (const [x, z] of [[-5.15, -4.7], [-5.1, -.2], [-4.7, 4.2]]) {
  loft(root, "solid hand-carved shade tree", [[0, .24, .2, x, z],
    [.7, .21, .17, x + .03, z], [1.55, .15, .13, x - .04, z],
    [2.3, .1, .09, x + .02, z]], M.bark, 9, true);
  curve(root, "branch canopy", [[x, 1.8, z], [x + .55, 2.5, z + .25],
    [x + 1.25, 2.83, z + .35]], .08, M.bark);
  curve(root, "branch canopy", [[x, 1.72, z], [x - .45, 2.48, z - .3],
    [x - .9, 2.8, z - .75]], .07, M.bark);
  for (let i = 0; i < 18; i++) petal(root, "layered park canopy leaf",
    x + (random() - .5) * 2.3, 2.55 + random() * .55,
    z + (random() - .5) * 1.7, .24 + random() * .15,
    i % 3 ? M.leaf : M.paleLeaf, random() * 6.28);
}
box(root, "soft shaded play surface", -3.45, .035, -3.55,
  3.75, .055, 2.9, M.lilac);
for (let i = 0; i < 9; i++) {
  const x = -4.9 + (i % 3) * 1.45, z = -4.35 + Math.floor(i / 3) * .8;
  box(root, "soft playground tile", x, .072, z, 1.37, .01, .73,
    i % 2 ? M.blush : M.lilac);
}
const playTable = loft(root, "solid petal-shaped play table", [[.6, .29, .29, -3.7, -3.65],
  [.82, .39, .35, -3.7, -3.65], [.87, .74, .62, -3.7, -3.65]], M.cream, 12, true);
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5;
  petal(root, "pretend-food flower arranged on play table",
    -3.7 + Math.cos(angle) * .32, .89, -3.65 + Math.sin(angle) * .3,
    .16, i % 2 ? M.peach : M.pink, angle);
}

// A larger Hamlin-like park sweep on the right, with arched rails and broad
// paths. No exact playground apparatus is asserted by the reference photos.
const bridge = new THREE.Group(); bridge.name = "storybook park bridge";
bridge.position.set(3.55, 0, -3.9); root.add(bridge);
box(bridge, "solid curved play bridge deck", 0, .48, 0, 3.6, .22, 1.12, M.brass, true);
for (const side of [-1, 1]) {
  curve(bridge, "low flowing bridge rail", [[-1.8, .72, side * .55],
    [-.9, 1.22, side * .55], [0, 1.34, side * .55],
    [.9, 1.22, side * .55], [1.8, .72, side * .55]], .058, M.bark, 34);
  for (const x of [-1.5, -.75, 0, .75, 1.5]) {
    beam(bridge, "bridge rail baluster", [x, .58, side * .55],
      [x, 1.17 + .17 * (1 - Math.abs(x) / 1.8), side * .55],
      .029, .025, M.bark);
  }
}
for (const x of [2.05, 5.05]) box(root, "solid park bench base", x, .32, .45,
  .65, .64, 1.15, M.bark, true);
box(root, "park bench seat", 3.55, .71, .45, 3.85, .14, 1.12, M.cream, true);
curve(root, "arched park bench back", [[1.68, 1.04, .9], [2.6, 1.5, 1.01],
  [3.55, 1.58, 1.05], [4.5, 1.5, 1.01], [5.42, 1.04, .9]], .055, M.bark, 32);

// A dance room rises from the same garden. Its open ribs, floor and barre
// imply class without blocking the two girls or adding literal class signs.
for (let i = -4; i <= 4; i++) {
  box(root, "warm dance floorboard", i * .55, .065, -6.35, .51, .07, 1.65,
    i % 2 ? M.cream : M.brass);
}
for (const side of [-1, 1]) {
  beam(root, "solid dance-room column", [side * 2.5, 0, -5.55],
    [side * 2.5, 3.22, -5.55], .11, .08, M.bark).userData.solidFootprint = true;
  curve(root, "paper arch between garden and studio",
    [[side * 2.5, 3.0, -5.55], [side * 2.0, 3.65, -5.62],
      [0, 4.12, -5.72], [-side * 2.0, 3.65, -5.62],
      [-side * 2.5, 3.0, -5.55]], .05, side < 0 ? M.brass : M.cream, 36);
}
box(root, "dance barre", 0, 1.34, -6.99, 4.9, .045, .055, M.bark);
for (const x of [-2.24, 0, 2.24]) beam(root, "barre bracket", [x, 1.35, -6.99],
  [x, 1.25, -7.16], .025, .022, M.brass);
for (let i = 0; i < 7; i++) {
  const ribbon = curve(root, "long translucent memory ribbon",
    [[-2.9 + i * .85, 4.2, -5.5], [-2.7 + i * .85, 3.55, -4.4],
      [-2.5 + i * .85, 3.4, -2.8], [-2.15 + i * .85, 3.05, -1.0]],
    .018, i % 2 ? M.pink : M.cream, 34);
  ribbon.userData.decorative = true;
}

function figure(name, x, z, height, options) {
  const person = new THREE.Group(); person.name = `solid sculpted figure of ${name}`;
  person.position.set(x, 0, z); person.rotation.y = options.yaw || 0; root.add(person);
  const skin = mat(options.skin), hair = mat(options.hair);
  const outfit = mat(options.outfit), skirt = mat(options.skirt || options.outfit);
  const leg = height * .42;
  for (const side of [-1, 1]) {
    loft(person, "shaped leg", [[.07, .095, .09, side * .125],
      [leg, .12, .105, side * .12], [leg + .08, .13, .1, side * .12]],
    options.pants ? mat(options.pants) : skin, 9);
    box(person, "solid shoe", side * .125, .07, .09, .22, .14, .28,
      options.shoe ? mat(options.shoe) : M.ink);
  }
  loft(person, "tailored clothing with a solid body", [[leg, .23, .17],
    [leg + .17, .3, .19], [height - .52, .245, .15],
    [height - .39, .195, .13]], outfit, 13, true);
  if (options.dress) {
    loft(person, "flared dancing skirt", [[leg - .18, .39, .3],
      [leg, .33, .25], [leg + .19, .235, .18]], skirt, 15);
    if (options.stripes) for (let index = 0; index < 7; index++) {
      const angle = index * Math.PI * 2 / 7;
      beam(person, "navy stripe on Charlize's dress",
        [Math.cos(angle) * .32, leg - .1, Math.sin(angle) * .255],
        [Math.cos(angle) * .24, leg + .13, Math.sin(angle) * .19],
        .018, .014, M.blue, 6);
    }
  }
  for (const side of [-1, 1]) {
    const shoulder = [side * .2, height - .44, 0];
    const hand = options.hands?.[side] || [side * .3, height - .91, .12];
    const elbow = [side * .3, (height - .64 + hand[1]) / 2, hand[2] * .6];
    beam(person, "sleeved arm", shoulder, elbow, .082, .07, outfit);
    beam(person, "reaching forearm", elbow, hand, .067, .05, skin);
    loft(person, "small formed hand", [[hand[1] - .045, .03, .032, hand[0], hand[2]],
      [hand[1], .043, .035, hand[0], hand[2]],
      [hand[1] + .025, .015, .015, hand[0], hand[2]]], skin, 8);
  }
  const face = height - .035;
  loft(person, "carved cheeks and chin", [[face - .4, .06, .06],
    [face - .31, .14, .115], [face - .15, .165, .14],
    [face + .04, .14, .12], [face + .14, .02, .02]], skin, 15);
  for (const side of [-1, 1]) {
    add(person, "painted eye white", new THREE.SphereGeometry(.022, 7, 6), M.white,
      side * .067, face - .16, .143);
    add(person, "painted iris", new THREE.SphereGeometry(.012, 7, 5), M.ink,
      side * .067, face - .16, .164);
    curve(person, "fine eyebrow", [[side * .025, face - .105, .146],
      [side * .07, face - .093, .153], [side * .11, face - .107, .14]], .007, hair);
  }
  loft(person, "sculpted nose", [[face - .255, .015, .017, 0, .145],
    [face - .155, .025, .027, 0, .17], [face - .14, .008, .008, 0, .152]], skin, 8);
  curve(person, "gentle smile", [[-.045, face - .3, .112],
    [0, face - .317, .128], [.045, face - .3, .112]], .008, M.pink);
  loft(person, "layered hair, not a spherical cap", [[face + .03, .1, .085],
    [face + .11, .17, .13, 0, -.02], [face + .2, .13, .1, 0, -.04],
    [face + .24, .025, .02, 0, -.04]], hair, 14);
  if (options.bun) loft(person, "high tied hair", [[face + .15, .045, .04, 0, -.06],
    [face + .27, .12, .11, 0, -.06], [face + .38, .075, .07, 0, -.06],
    [face + .42, .01, .01, 0, -.06]], hair, 12);
  if (options.curls) for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const xx = side * (.12 + i * .02);
    curve(person, "loose curl beside Zephrine's cheek",
      [[xx, face + .1, -.015], [xx + side * .06, face - .03, .04],
        [xx + side * .07, face - .19, .04], [xx + side * .03, face - .29, .07]],
      .019 - i * .002, hair, 15);
  }
  curve(person, "stitched neckline", [[-.13, height - .41, .12],
    [0, height - .48, .16], [.13, height - .41, .12]], .012, M.cream);
  if (options.dress && options.stripes) {
    for (let i = 0; i < 5; i++) box(person, "soft stripe across fitted top",
      0, height - .56 - i * .065, .194, .39, .022, .012, i % 2 ? M.blue : M.white);
    box(person, "pink ribbon waist", 0, leg + .1, .18, .55, .035, .02, M.pink);
  }
  return person;
}

// The held hands and mirrored head tilt quote the supplied photos without
// publishing them. The girls have distinct skin, hair and clothing shapes.
const zeph = figure("Zephrine", -.58, -1.8, 1.13, {
  skin: C.warmSkin, hair: C.hair, outfit: C.peach, skirt: C.blush,
  shoe: C.pink, dress: true, curls: true, yaw: -.13,
  hands: { "1": [.36, .63, .22], "-1": [-.3, .73, .1] },
});
zeph.rotation.z = -.045;
zeph.position.z = 2.0;
const charlize = figure("Charlize", .58, 2.0, 1.17, {
  skin: C.darkSkin, hair: C.darkHair, outfit: C.white, skirt: C.white,
  shoe: C.ink, dress: true, stripes: true, bun: true, yaw: .12,
  hands: { "-1": [-.36, .63, .22], "1": [.3, .73, .1] },
});
charlize.rotation.z = .045;
curve(root, "linked hands of two friends", [[-.25, .63, 2.22],
  [0, .61, 2.29], [.25, .63, 2.22]], .023, M.brass);

// Jane and Aibike become friends too. Aibike is a stylized parent figure;
// no unprovided face likeness or invented biographical details are claimed.
figure("Jane making time for friendship", -2.55, -.55, 1.68, {
  skin: C.warmSkin, hair: C.hair, outfit: C.blue, pants: C.deep,
  bun: true, yaw: -.28,
  hands: { "1": [.46, 1.05, .35], "-1": [-.33, .84, .15] },
});
figure("Aibike, Charlize's mother", 2.55, -.55, 1.66, {
  skin: C.darkSkin, hair: C.darkHair, outfit: C.lilac, pants: C.ink,
  bun: true, yaw: .28,
  hands: { "-1": [-.46, 1.05, .35], "1": [.33, .84, .15] },
});
for (let i = 0; i < 5; i++) {
  curve(root, "thread of plans and repeated visits", [[-2.1, 1.85 + i * .1, -.5],
    [-1.25, 2.65 + i * .15, .35], [0, 2.82 + i * .16, 1.2],
    [1.25, 2.65 + i * .15, .35], [2.1, 1.85 + i * .1, -.5]],
    .009, i % 2 ? M.pink : M.brass, 43);
}

// A high woven canopy gives the open sky a room-like upper edge while the
// real scene remains visible through the picture from farther down the hall.
for (const side of [-1, 1]) {
  curve(root, "sweeping branch above the friendship", [[side * 5.62, 3.15, 2.25],
    [side * 4.2, 3.8, 1.92], [side * 2.2, 4.25, 1.6],
    [0, 4.52, 1.25]], .06, M.bark, 38);
  for (let i = 0; i < 20; i++) {
    const x = side * (1.0 + i * .21);
    petal(root, "folded leaves of the friendship canopy", x,
      4.42 - .018 * i + (random() - .5) * .25,
      1.55 + (random() - .5) * .72, .2 + random() * .16,
      i % 4 ? M.paleLeaf : M.blush, random() * 6.28);
  }
}
for (let i = 0; i < 7; i++) {
  const x = -3.6 + i * 1.2, z = -.8 + .25 * Math.sin(i * 1.7);
  curve(root, "hanging thread of remembered afternoons", [[x, 4.45, z],
    [x + .05, 4.06, z + .03], [x, 3.58, z + .05]], .007, M.brass, 13);
  for (let j = 0; j < 5; j++) {
    const angle = j * Math.PI * 2 / 5;
    petal(root, "little five-petal memory flower", x + Math.cos(angle) * .12,
      3.42 + Math.sin(angle) * .12, z + .03,
      .12, j % 2 ? M.pink : M.cream, angle);
  }
}

// Small paper memories float overhead and painted foliage frames the center.
for (let i = 0; i < 20; i++) {
  const x = -4.1 + (i % 7) * 1.33, y = 3.65 + Math.sin(i * 1.8) * .65;
  const z = -3.6 + Math.floor(i / 7) * 2.4;
  petal(root, "floating leaf of another afternoon together", x, y, z,
    .2 + random() * .16, i % 3 ? M.cream : M.pink, random() * 6.28);
}
for (const side of [-1, 1]) {
  curve(root, "garden border branch", [[side * 5.55, .16, 6.4],
    [side * 5.4, .28, 2.1], [side * 5.6, .26, -2.2],
    [side * 5.35, .17, -6.7]], .07, M.bark, 52);
  for (let i = 0; i < 18; i++) petal(root, "low leaves along room edge",
    side * (5.1 + random() * .42), .16 + random() * .23,
    -6.7 + i * .72, .22 + random() * .1, i % 4 ? M.leaf : M.blush,
    random() * 6.28);
}

async function authorRoom() {
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(object => {
    if (!object.userData.batchPetal) return;
    const list = groups.get(object.material) || [];
    list.push(object); groups.set(object.material, list);
  });
  for (const [material, objects] of groups) {
    const geometry = mergeGeometries(objects.map(object =>
      object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
    if (!geometry) throw new Error("Could not merge leaves");
    for (const object of objects) object.parent.remove(object);
    add(root, "grouped dimensional leaves and petals", geometry, material);
  }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffdfad, 2.1);
  key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xa3cfdd, .95);
  fill.position.set(4, 4, -3); scene.add(fill);
  scene.add(root);
  const view = gallery.frames[2].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 40);
  camera.position.fromArray(view.position); camera.lookAt(...view.target);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735, Math.round(735 * FRAME_HEIGHT / FRAME_WIDTH));
  document.body.append(renderer.domElement);
  renderer.render(scene, camera);
  const preview = renderer.domElement.toDataURL("image/webp", .86);
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, { binary: true, maxTextureSize: 1024 });
  renderer.dispose();
  const glbData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); reader.onerror = reject;
    reader.readAsDataURL(new Blob([glb], { type: "model/gltf-binary" }));
  });
  return { preview, glb: glbData, objects: root.children.length };
}
window.__authorRoom = authorRoom;
