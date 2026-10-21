import * as THREE from "three";
import { foliageLobe } from "./sculpted_foliage.mjs";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { addOpenSky } from "./open_sky.mjs";
import { addOlegPortrait, addJanePortrait, addZephrinePortrait,
  finishOlegPortraits } from "./oleg_portrait.mjs";
import { addContactShadow } from "./stage_shadows.mjs";

// A Roscoe Village walk imagined as a long paper street. The blue toy car is
// an original sculpted object informed by Oleg's Step2 product reference;
// no logo, private home address, or product photo is embedded in the room.
const root = new THREE.Group(); root.name = "Zephrine drives her blue car through Roscoe Village";
const C = {
  sky: 0xc1d2cc, road: 0x8b9292, sidewalk: 0xd7c7b1, mortar: 0xe0d3bf,
  brick: 0xb47866, coral: 0xcf957b, plum: 0x715a69, cream: 0xf1e3ca,
  blue: 0x2874a6, blueShade: 0x1e527c, silver: 0xc5cccb, brass: 0xc4a46c,
  dark: 0x39424a, bark: 0x5d514d, leaf: 0x6c8d74, paleLeaf: 0xa5b69a,
  window: 0x9bbec4, white: 0xf6eddb, janeSkin: 0xdca98d, olegSkin: 0xd8a17f,
  hair: 0x3b3032, zephHair: 0x715141, pink: 0xd57e8e, ink: 0x262e3b,
};
const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
const context = canvas.getContext("2d"), pixels = context.createImageData(64, 64);
let seed = 404404;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < pixels.data.length; i += 4) {
  const v = 226 + Math.floor(random() * 25);
  pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = v;
  pixels.data[i + 3] = 255;
}
context.putImageData(pixels, 0, 0);
const grain = new THREE.CanvasTexture(canvas); grain.colorSpace = THREE.SRGBColorSpace;
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, map: grain, roughness: .93, metalness: 0, side: THREE.DoubleSide, ...extra,
});
const M = Object.fromEntries(Object.entries(C).map(([key, value]) => [key, material(value)]));
function add(parent, name, geometry, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function box(parent, name, x, y, z, w, h, d, mat, solid = false) {
  const mesh = add(parent, name, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function beam(parent, name, a, b, r1, r2, mat, edges = 9) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
  const axis = to.clone().sub(from);
  const mesh = add(parent, name, new THREE.CylinderGeometry(r2, r1, axis.length(), edges),
    mat, ...from.clone().add(to).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return mesh;
}
function curve(parent, name, points, radius, mat, segments = 22) {
  return add(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(...point))), segments, radius, 7, false), mat);
}
function loft(parent, name, rings, mat, sides = 12, solid = false) {
  const vertices = [], uv = [], indices = [];
  for (let row = 0; row < rings.length; row++) for (let side = 0; side < sides; side++) {
    const [y, rx, rz, cx = 0, cz = 0] = rings[row];
    const angle = side * Math.PI * 2 / sides;
    vertices.push(cx + Math.cos(angle) * rx * (1 + .014 * Math.cos(angle * 7 + row)),
      y, cz + Math.sin(angle) * rz);
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
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = add(parent, name, geometry, mat);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function leaf(parent, x, y, z, scale, mat, yaw = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(-.42, .25, -.55, .7, 0, 1);
  shape.bezierCurveTo(.55, .7, .42, .25, 0, 0);
  const mesh = add(parent, "folded leaf on the block", new THREE.ExtrudeGeometry(shape,
    { depth: .025, bevelEnabled: false, curveSegments: 5 }), mat, x, y, z);
  mesh.scale.setScalar(scale); mesh.rotation.set(.38, yaw, .22);
  mesh.userData.batchLeaf = true;
}

const floor = new THREE.PlaneGeometry(10.8, 16.4, 30, 42);
floor.rotateX(-Math.PI / 2);
const floorColors = [];
for (let i = 0; i < floor.attributes.position.count; i++) {
  const x = floor.attributes.position.getX(i), z = floor.attributes.position.getZ(i);
  floor.attributes.position.setY(i, .008 * Math.sin(x * 3 + z * 2));
  const distance = Math.abs(x - .18 * Math.sin(z * .35));
  const pigment = new THREE.Color(distance < 2.1 ? C.sidewalk : C.road);
  pigment.offsetHSL(0, 0, (random() - .5) * .045);
  floorColors.push(pigment.r, pigment.g, pigment.b);
}
floor.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
floor.computeVertexNormals();
add(root, "walkable Chicago sidewalk widening into a memory street", floor,
  material(0xffffff, { vertexColors: true }));
for (const side of [-1, 1]) {
  for (let z = -7.9; z < 8.0; z += 1.4) {
    box(root, "hand-laid sidewalk joint", side * 1.92, .021, z,
      .018, .009, 1.38, M.mortar);
  }
  curve(root, "continuous curb", [[side * 2.21, .12, 8.15],
    [side * 2.18, .12, 3.9], [side * 2.23, .12, -.7],
    [side * 2.18, .12, -4.4], [side * 2.23, .12, -8.15]], .075, M.cream, 55);
}
addOpenSky(root, C.sky, C.sidewalk);

// Repeating stoops, bay windows and brick patterns suggest a Roscoe Village
// block without copying a private house or asserting an exact address.
for (const side of [-1, 1]) for (let unit = 0; unit < 4; unit++) {
  const z = -6.6 + unit * 4.1;
  const group = new THREE.Group(); group.name = "unaddressed brick two-flat with stoop";
  group.position.set(side * 4.58, 0, z); root.add(group);
  const front = -side * .63;
  const tint = [M.brick, M.coral, M.plum, M.brick][(unit + (side > 0 ? 1 : 0)) % 4];
  box(group, "solid brick facade", 0, 2.05, 0, 1.45, 4.1, 3.82, tint, true);
  box(group, "stone foundation", 0, .45, 0, 1.5, .9, 3.87, M.mortar);
  box(group, "projecting cornice", 0, 4.18, 0, 1.58, .16, 4.05, M.cream);
  for (let notch = 0; notch < 11; notch++) {
    const dz = -1.77 + notch * .355;
    box(group, "carved cornice dentil", front - side * .13, 4.01, dz,
      .17, .19, .13, M.cream);
  }
  box(group, "entrance door", front, 1.03, .05, .035, 1.75, .79,
    unit % 2 ? M.dark : M.blueShade);
  for (const level of [.61, 1.31]) box(group, "recessed painted door panel",
    front - side * .025, level, .05, .02, .43, .56, M.plum);
  add(group, "brass door knob", new THREE.IcosahedronGeometry(.028, 1),
    M.brass, front - side * .05, 1.03, .28);
  box(group, "glazed transom above the stoop", front - side * .025, 2.02, .05,
    .03, .2, .65, M.window);
  for (const dz of [-.35, .45]) box(group, "transom and door casing",
    front - side * .08, 1.12, dz, .16, 2.05, .06, M.cream);
  curve(group, "arched doorway lintel", [[front - side * .03, 1.89, -.34],
    [front - side * .03, 2.16, .04], [front - side * .03, 1.89, .44]], .04, M.cream);
  for (const level of [1.32, 2.73]) for (const dz of [-1.35, 1.27]) {
    box(group, "deep set bay window glass", front - side * .018, level, dz,
      .047, .82, .72, M.window);
    box(group, "painted window sill", front - side * .08, level - .47, dz,
      .17, .085, .91, M.cream);
    const crown = curve(group, "curved limestone window crown",
      [[front - side * .13, level + .49, dz - .46],
        [front - side * .17, level + .57, dz],
        [front - side * .13, level + .49, dz + .46]], .028, M.cream, 13);
    crown.name = "carved window crown";
    for (const edge of [-1, 1]) box(group, "narrow bay window upright",
      front - side * .095, level, dz + edge * .39, .15, .94, .04, M.cream);
    beam(group, "middle window muntin", [front - side * .105, level, dz - .38],
      [front - side * .105, level, dz + .38], .016, .016, M.cream, 5);
    beam(group, "vertical divided light", [front - side * .108, level - .39, dz],
      [front - side * .108, level + .39, dz], .012, .012, M.cream, 5);
    if (level < 2) {
      box(group, "shaped window planter", front - side * .14, level - .54, dz,
        .25, .12, .7, M.brass);
      for (const shift of [-.21, 0, .21]) curve(group, "small trailing planter vine",
        [[front - side * .19, level - .48, dz + shift],
          [front - side * .27, level - .63, dz + shift + .05],
          [front - side * .26, level - .76, dz + shift - .02]],
        .018, M.leaf, 9);
    }
  }
  for (let row = 0; row < 7; row++) for (let brick = 0; brick < 5; brick++) {
    const offset = row % 2 ? .22 : 0;
    const zz = -1.88 + brick * .81 + offset;
    if (Math.abs(zz) > 1.86) continue;
    box(group, "subtle brick mortar seam", front - side * .021,
      .59 + row * .48, zz, .015, .016, .63, M.mortar);
  }
  for (let step = 0; step < 3; step++) box(group, "three stoop steps",
    front - side * (.17 + step * .2), .1 + step * .12, .05,
    .34, .2 + step * .11, .92, M.cream, step === 2);
  for (const dz of [-.49, .58]) beam(group, "stoop railing",
    [front - side * .65, .34, dz], [front - side * .08, .98, dz],
    .025, .022, M.dark);
  for (const dz of [-.49, .58]) for (let rung = 1; rung <= 3; rung++) {
    const xx = front - side * (.65 - rung * .13);
    beam(group, "iron stoop baluster", [xx, .31, dz],
      [xx, .48 + rung * .12, dz], .012, .012, M.dark, 6);
  }
}

for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
  const x = side * 2.9, z = -5.8 + i * 3.9;
  loft(root, "solid leaning parkway tree trunk", [[0, .15, .13, x, z],
    [.72, .13, .11, x + side * .03, z],
    [1.65, .105, .09, x + side * .12, z - .06],
    [2.45, .065, .06, x + side * .18, z - .12]], M.bark, 10, true);
  for (const branch of [-1, 1]) {
    curve(root, "shaped tree branch", [[x + side * .12, 1.7, z],
      [x + side * (.3 + branch * .38), 2.48, z + branch * .25],
      [x + side * (.45 + branch * .68), 3.28, z + branch * .5]], .055, M.bark);
    foliageLobe(root, "scalloped parkway foliage among the upper branches",
      x + side * (.45 + branch * .55), 3.29, z + branch * .43,
      .75, .32, .54, branch < 0 ? C.leaf : C.paleLeaf, i * 3 + side + branch);
  }
  foliageLobe(root, "overlapping central tree crown", x + side * .2,
    3.32, z - .12, .74, .37, .62, C.leaf, i + side);
  for (let j = 0; j < 23; j++) leaf(root,
    x + (random() - .5) * 2.2, 2.9 + random() * .62,
    z + (random() - .5) * 2.1, .21 + random() * .14,
    j % 5 ? M.leaf : M.paleLeaf, random() * 6.28);
}

// The toy body has a purpose-drawn footprint and a raised, gently beveled
// shell. It is open at the seat, has four wheels, steering wheel and a push
// handle, and remains one solid obstacle for a visitor.
const car = new THREE.Group(); car.name = "sculpted blue toddler push car with Zephrine driving";
car.position.set(0, 0, 4.0); root.add(car);
const bodyShape = new THREE.Shape();
bodyShape.moveTo(-.35, -.83);
bodyShape.bezierCurveTo(-.51, -.77, -.53, -.49, -.5, -.21);
bodyShape.lineTo(-.48, .35);
bodyShape.bezierCurveTo(-.45, .8, -.21, .91, 0, .92);
bodyShape.bezierCurveTo(.21, .91, .45, .8, .48, .35);
bodyShape.lineTo(.5, -.21);
bodyShape.bezierCurveTo(.53, -.49, .51, -.77, .35, -.83);
bodyShape.closePath();
const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape,
  { depth: .37, bevelEnabled: true, bevelSize: .055, bevelThickness: .045,
    bevelSegments: 3, curveSegments: 18 });
bodyGeometry.rotateX(-Math.PI / 2);
const body = add(car, "solid curved blue Whisper Ride inspired body", bodyGeometry,
  M.blue, 0, .22, 0);
body.userData.solidFootprint = true;
const noseShape = new THREE.Shape();
noseShape.moveTo(-.38, .23);
noseShape.bezierCurveTo(-.48, .28, -.51, .42, -.43, .57);
noseShape.bezierCurveTo(-.31, .69, .31, .69, .43, .57);
noseShape.bezierCurveTo(.51, .42, .48, .28, .38, .23);
noseShape.closePath();
add(car, "rounded sculpted front of Zephrine's blue car",
  new THREE.ExtrudeGeometry(noseShape, { depth: .07, bevelEnabled: true,
    bevelSize: .04, bevelThickness: .025, bevelSegments: 3, curveSegments: 14 }),
  M.blue, 0, 0, .89);
curve(car, "silver contour of rounded front bumper",
  [[-.39, .29, .979], [0, .26, .991], [.39, .29, .979]], .018, M.silver);
box(car, "dark recessed seat", 0, .61, -.24, .58, .12, .43, M.dark);
box(car, "solid rising seat back", 0, .79, -.49, .57, .38, .12, M.blueShade, true);
const hoodShape = new THREE.Shape();
hoodShape.moveTo(-.43, -.87); hoodShape.bezierCurveTo(-.48, -.3, -.35, -.14, 0, -.15);
hoodShape.bezierCurveTo(.35, -.14, .48, -.3, .43, -.87); hoodShape.closePath();
const hoodGeometry = new THREE.ExtrudeGeometry(hoodShape,
  { depth: .09, bevelEnabled: true, bevelSize: .026, bevelThickness: .03,
    bevelSegments: 2, curveSegments: 15 });
hoodGeometry.rotateX(-Math.PI / 2);
add(car, "raised sculpted blue bonnet", hoodGeometry, M.blueShade, 0, .62, 0);
for (const side of [-1, 1]) for (const z of [-.56, .55]) {
  const wheel = add(car, "four quiet white wheels", new THREE.CylinderGeometry(.2, .2, .11, 15),
    M.silver, side * .49, .23, z);
  wheel.rotation.z = Math.PI / 2;
  const hub = add(car, "dark wheel hub", new THREE.CylinderGeometry(.08, .08, .118, 12),
    M.dark, side * .5, .23, z);
  hub.rotation.z = Math.PI / 2;
}
for (const side of [-1, 1]) {
  const lamp = box(car, "large pale curved toy headlamp",
    side * .3, .51, .973, .19, .115, .02, M.white);
  lamp.rotation.z = -side * .2;
  curve(car, "molded side crease", [[side * .51, .5, -.57],
    [side * .55, .53, .05], [side * .47, .56, .62]], .018, M.blueShade);
}
box(car, "small dark front grille", 0, .38, .92, .3, .095, .025, M.dark);
beam(car, "steering column", [0, .65, .34], [0, .86, .28], .035, .035, M.dark);
const wheel = add(car, "working-looking toy steering wheel",
  new THREE.TorusGeometry(.17, .024, 7, 20), M.dark, 0, .9, .32);
wheel.rotation.x = Math.PI / 2.5;
beam(car, "steering-wheel spoke", [-.12, .9, .32], [.12, .9, .32], .012, .012, M.dark, 5);
for (const side of [-1, 1]) {
  beam(car, "tall black parent push-handle shaft",
    [side * .22, .46, -.75], [side * .24, 1.48, -1.05], .039, .034, M.dark);
}
beam(car, "shared parent push grip", [-.37, 1.48, -1.05],
  [.37, 1.48, -1.05], .055, .055, M.dark);

function adult(name, x, z, outfit, options = {}) {
  const group = new THREE.Group(); group.name = `fully sculpted figure of ${name}`;
  group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
  const skin = options.skin || M.janeSkin, height = options.height || 1.69;
  addContactShadow(group, height);
  for (const side of [-1, 1]) {
    loft(group, "trouser leg", [[.08, .105, .1, side * .125],
      [.72, .12, .1, side * .13], [.8, .14, .12, side * .13]],
    options.pants || M.dark, 10);
    box(group, "solid walking shoe", side * .13, .07, .09, .23, .13, .31, M.dark);
  }
  loft(group, "folded shirt and solid body", [[.74, .255, .18],
    [.92, .3, .19], [height - .48, .26, .16],
    [height - .38, .2, .13]], outfit, 14, true);
  for (const side of [-1, 1]) {
    const hand = options.hands?.[side] || [side * .33, height - 1.0, .18];
    const elbow = [side * .35, (height - .72 + hand[1]) / 2, hand[2] * .55];
    beam(group, "sleeved shoulder", [side * .22, height - .42, 0], elbow,
      .09, .072, outfit);
    beam(group, "reaching forearm", elbow, hand, .072, .05, skin);
    loft(group, "individual formed hand", [[hand[1] - .06, .032, .034, hand[0], hand[2]],
      [hand[1], .048, .041, hand[0], hand[2]],
      [hand[1] + .02, .015, .015, hand[0], hand[2]]], skin, 8);
  }
  const headStart = group.children.length;
  const face = height - .04;
  loft(group, "carved face and cheekbone", [[face - .42, .06, .055],
    [face - .34, .14, .12], [face - .16, .17, .145],
    [face + .03, .15, .13], [face + .14, .02, .02]], skin, 15);
  if (options.oleg) addOlegPortrait(group, face,
    [[-.42, .06, .055], [-.34, .14, .12], [-.16, .17, .145],
      [.03, .15, .13], [.12, .055, .055]], skin);
  if (options.bun) addJanePortrait(group, face,
    [[-.42, .06, .055], [-.34, .14, .12], [-.16, .17, .145],
      [.03, .15, .13], [.12, .055, .055]], skin);
  for (const side of [-1, 1]) {
    if (!options.oleg && !options.bun) add(group, "small painted eye", new THREE.SphereGeometry(.02, 7, 6), M.white,
      side * .07, face - .15, .143);
    if (!options.oleg && !options.bun) add(group, "dark iris", new THREE.SphereGeometry(.011, 7, 5), M.dark,
      side * .07, face - .15, .163);
    if (!options.oleg && !options.bun) curve(group, "eyebrow", [[side * .027, face - .09, .15],
      [side * .075, face - .085, .155], [side * .115, face - .1, .14]],
      .008, M.hair);
  }
  if (!options.oleg && !options.bun) loft(group, "small nose", [[face - .27, .016, .017, 0, .155],
    [face - .16, .025, .03, 0, .17], [face - .145, .008, .008, 0, .156]], skin, 8);
  if (!options.oleg && !options.bun) curve(group, "quiet smile", [[-.05, face - .31, .12],
    [0, face - .323, .13], [.05, face - .31, .12]], .008, M.coral);
  loft(group, "layered dark hair", [[face + .03, .09, .08],
    [face + .11, .17, .13, 0, -.02], [face + .2, .13, .11, 0, -.03],
    [face + .25, .02, .02, 0, -.03]], M.hair, 14);
  if (options.bun) loft(group, "Jane's high bun", [[face + .18, .05, .04, 0, -.07],
    [face + .29, .13, .11, 0, -.07], [face + .4, .07, .06, 0, -.07],
    [face + .44, .01, .01, 0, -.07]], M.hair, 12);
  if (options.longHair) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    curve(group, "Oleg's medium wavy hair", [[side * (.12 + i * .018), face + .08, -.04],
      [side * (.19 + i * .02), face - .18, -.05],
      [side * (.15 + i * .02), face - .48, .01]], .026 - i * .003, M.hair);
  }
  if (options.beard && !options.oleg) for (const side of [-1, 1]) curve(group, "Oleg's short beard",
    [[side * .13, face - .27, .08], [side * .09, face - .36, .115],
      [0, face - .42, .1]], .029, M.hair);
  if (options.glasses && !options.oleg) for (const side of [-1, 1]) {
    curve(group, "Oleg's dark rectangular glasses", [[side * .015, face - .12, .18],
      [side * .12, face - .12, .17], [side * .12, face - .21, .16],
      [side * .015, face - .21, .18], [side * .015, face - .12, .18]], .01, M.dark);
  }
  if (options.oleg) {
    const head = new THREE.Group();
    head.name = `${name} proportioned sculpted head`;
    for (const child of group.children.slice(headStart)) head.add(child);
    head.scale.y = .65;
    head.position.y = (height - .46) * .35;
    group.add(head);
  }
  curve(group, "stitched neckline", [[-.14, height - .43, .13],
    [0, height - .49, .17], [.14, height - .43, .13]], .011, M.cream);
  return group;
}

adult("Oleg pushing with Jane", -1.08, 1.8, M.cream, {
  skin: M.olegSkin, height: 1.73, oleg: true, glasses: true, beard: true, longHair: true,
  hands: { "1": [.79, 1.48, 1.14], "-1": [-.38, 1.03, .27] }, yaw: .12,
});
adult("Jane pushing with Oleg", 1.08, 1.8, M.plum, {
  skin: M.janeSkin, bun: true, pants: M.dark,
  hands: { "-1": [-.79, 1.48, 1.14], "1": [.38, 1.03, .27] }, yaw: -.12,
});

const zeph = new THREE.Group(); zeph.name = "Zephrine enthusiastically steering her blue car";
zeph.position.set(0, 0, 4.0); root.add(zeph);
loft(zeph, "solid seated child's torso", [[.6, .17, .15, 0, -.22],
  [.82, .22, .17, 0, -.22], [1.02, .18, .14, 0, -.22]], M.pink, 12, true);
for (const side of [-1, 1]) {
  beam(zeph, "arm reaching for the steering wheel", [side * .17, .91, -.22],
    [side * .12, .89, .25], .065, .04, M.janeSkin);
  add(zeph, "tiny hand on wheel", new THREE.SphereGeometry(.046, 8, 6),
    M.janeSkin, side * .12, .89, .25);
}
loft(zeph, "Zephrine's smiling sculpted face", [[.96, .055, .06, 0, -.21],
  [1.05, .15, .12, 0, -.21], [1.24, .17, .145, 0, -.21],
  [1.41, .14, .12, 0, -.22], [1.48, .02, .02, 0, -.22]], M.janeSkin, 14);
const zephFace = new THREE.Group();
zephFace.position.z = -.21; zeph.add(zephFace);
addZephrinePortrait(zephFace, 1.44,
  [[-.48, .055, .06], [-.39, .15, .12], [-.2, .17, .145],
    [0, .14, .12], [.04, .02, .02]], M.janeSkin);
loft(zeph, "soft crown of brown curls", [[1.42, .13, .11, 0, -.23],
  [1.51, .18, .15, 0, -.24], [1.6, .13, .11, 0, -.24],
  [1.64, .02, .02, 0, -.24]], M.zephHair, 13);
for (const side of [-1, 1]) for (let i = 0; i < 4; i++) curve(zeph,
  "curled lock beside Zephrine's cheek", [[side * (.12 + i * .017), 1.53, -.26],
    [side * (.18 + i * .02), 1.34, -.21],
    [side * (.16 + i * .02), 1.15, -.17]], .018 - i * .002, M.zephHair, 13);

// Small brass wheel echoes and a few paper leaves lead the gaze along the
// walk without implying another event, date, or companion.
for (let i = 0; i < 8; i++) {
  const z = -7.0 + i * 1.12;
  for (const side of [-1, 1]) {
    const ring = add(root, "golden remembered wheel trace",
      new THREE.TorusGeometry(.13, .012, 6, 16), M.brass,
      side * .8, .035, z);
    ring.rotation.x = Math.PI / 2;
  }
}
for (let i = 0; i < 35; i++) {
  const side = i % 2 ? -1 : 1;
  leaf(root, side * (2.05 + random() * 1.1), .05,
    -7.6 + random() * 15.1, .12 + random() * .1,
    i % 4 ? M.leaf : M.coral, random() * 6.28);
}
// The parkway trees provide shade from the sides. Keep the street's center
// open to the sky instead of hanging disconnected twig garlands overhead.

async function authorRoom() {
  await finishOlegPortraits(root);
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(object => {
    if (!object.userData.batchLeaf) return;
    const list = groups.get(object.material) || [];
    list.push(object); groups.set(object.material, list);
  });
  for (const [mat, objects] of groups) {
    const geometry = mergeGeometries(objects.map(object =>
      object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
    if (!geometry) throw new Error("Could not batch street-tree leaves");
    for (const object of objects) object.parent.remove(object);
    add(root, "batched sculpted street-tree leaves", geometry, mat);
  }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffd6aa, 2.15);
  sun.position.set(-3, 6, 4); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xa0cdd8, 1.0);
  fill.position.set(4, 4, -3); scene.add(fill);
  scene.add(root);
  const view = gallery.frames[3].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 120);
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
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject;
    reader.readAsDataURL(new Blob([glb], { type: "model/gltf-binary" }));
  });
  return { preview, glb: glbData, objects: root.children.length };
}
window.__authorRoom = authorRoom;
