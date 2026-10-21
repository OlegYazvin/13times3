import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";

// A single impossible space: Oleg's desk opens into a street and four
// simultaneous acts of Jane's support. All figures and props have volume.
const root = new THREE.Group();
root.name = "Jane helped Oleg get a job — the work of holding things together";
const C = {
  plaster: 0xe5d8bd, ink: 0x343747, desk: 0x422f30, orange: 0xc76c49,
  brass: 0xb6925d, blue: 0x394f77, paleBlue: 0x90aabe, teal: 0x6f9695,
  street: 0xb8b1a5, sky: 0xb2c9d0, leaf: 0x738e73, darkLeaf: 0x526a61,
  skin: 0xdca784, paper: 0xf4e8d1, hair: 0x3b2d32, zephHair: 0x634739,
  amber: 0xe8b978, night: 0x606476,
};
const grainCanvas = document.createElement("canvas");
grainCanvas.width = grainCanvas.height = 64;
const grainContext = grainCanvas.getContext("2d");
const pixels = grainContext.createImageData(64, 64);
let seed = 220221;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < pixels.data.length; i += 4) {
  const shade = 229 + Math.floor(random() * 22);
  pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
  pixels.data[i + 3] = 255;
}
grainContext.putImageData(pixels, 0, 0);
const grain = new THREE.CanvasTexture(grainCanvas);
grain.colorSpace = THREE.SRGBColorSpace;
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, map: grain, roughness: .94, metalness: 0, side: THREE.DoubleSide, ...extra,
});
const M = Object.fromEntries(Object.entries(C).map(([key, value]) => [key, material(value)]));
const glow = new THREE.MeshBasicMaterial({ color: C.amber, side: THREE.DoubleSide });
const skyMaterial = new THREE.MeshBasicMaterial({ color: C.sky, side: THREE.DoubleSide });

function add(parent, name, geometry, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function box(parent, name, x, y, z, w, h, d, mat, solid = false) {
  const mesh = add(parent, name, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function beam(parent, name, a, b, ra, rb, mat, edges = 9) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const axis = end.clone().sub(start);
  const mesh = add(parent, name, new THREE.CylinderGeometry(rb, ra, axis.length(), edges), mat,
    ...start.clone().add(end).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return mesh;
}
function curve(parent, name, points, radius, mat, segments = 24) {
  return add(parent, name, new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))),
    segments, radius, 7, false), mat);
}
function loft(parent, name, rings, mat, sides = 14, solid = false) {
  const positions = [], uv = [], index = [];
  for (let row = 0; row < rings.length; row++) for (let side = 0; side < sides; side++) {
    const [y, rx, rz, cx = 0, cz = 0] = rings[row];
    const theta = side * Math.PI * 2 / sides;
    const nudge = 1 + .014 * Math.cos(theta * 7 + row);
    positions.push(cx + Math.cos(theta) * rx * nudge, y,
      cz + Math.sin(theta) * rz * nudge);
    uv.push(side / sides, row / (rings.length - 1));
  }
  for (let row = 0; row < rings.length - 1; row++) for (let side = 0; side < sides; side++) {
    const a = row * sides + side, b = row * sides + (side + 1) % sides;
    index.push(a, b, a + sides, b, b + sides, a + sides);
  }
  for (let side = 1; side < sides - 1; side++) {
    index.push(0, side + 1, side);
    const top = (rings.length - 1) * sides;
    index.push(top, top + side, top + side + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index); geometry.computeVertexNormals();
  const mesh = add(parent, name, geometry, mat);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function foldedLeaf(parent, x, y, z, size, mat, angle = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.quadraticCurveTo(-size * .46, size * .45, 0, size);
  shape.quadraticCurveTo(size * .46, size * .45, 0, 0);
  const mesh = add(parent, "folded street-tree leaf", new THREE.ExtrudeGeometry(shape,
    { depth: .018, bevelEnabled: false, curveSegments: 6 }), mat, x, y, z);
  mesh.rotation.set(Math.PI / 2 - .3, angle, .25);
  mesh.userData.batchLeaf = true;
}

// The timber floor loosens into pavement and an outdoor lane, with the path
// kept clear through the middle for exploration and return to the gallery.
const floor = new THREE.PlaneGeometry(12.4, 17.2, 32, 45);
floor.rotateX(-Math.PI / 2);
const floorColors = [];
for (let i = 0; i < floor.attributes.position.count; i++) {
  const x = floor.attributes.position.getX(i), z = floor.attributes.position.getZ(i);
  floor.attributes.position.setY(i, .017 * Math.sin(x * 2.4 + z * 1.5));
  const amount = THREE.MathUtils.smoothstep(x + .25 * Math.sin(z * .5), -.6, 2.2);
  const pigment = new THREE.Color(C.desk).lerp(new THREE.Color(C.street), amount);
  pigment.offsetHSL(0, 0, (random() - .5) * .045);
  floorColors.push(pigment.r, pigment.g, pigment.b);
}
floor.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
floor.computeVertexNormals();
add(root, "floor where home turns into an outdoor street", floor,
  material(0xffffff, { vertexColors: true }));
for (let z = -7.75; z < 7.8; z += .37) {
  const line = curve(root, "dark curved wood grain flowing toward the street",
    [[-6.15, .014, z], [-3.2, .022, z + .07], [-.55, .026, z + .12]], .009,
    z % 2 > 0 ? M.brass : M.orange, 12);
  line.userData.decorative = true;
}
for (let i = 0; i < 70; i++) {
  const x = .8 + random() * 5.1, z = -7.6 + random() * 15;
  if (Math.abs(x) < 1.5 && z > 4.9) continue;
  const stone = add(root, "small painted pavement stone", new THREE.DodecahedronGeometry(.055, 0),
    i % 3 ? M.paper : M.brass, x, .029, z);
  stone.scale.set(1.7, .2, 1.1);
}

// Four sides of a watercolor sky are actual room geometry. The front stays
// open so the return doorway reveals the real gallery.
for (const x of [-6.17, 6.17]) {
  const side = add(root, "watercolor horizon wall", new THREE.PlaneGeometry(17.22, 6.45),
    skyMaterial, x, 3.2, 0);
  side.rotation.y = Math.PI / 2;
}
add(root, "distant outdoors wrapping the home", new THREE.PlaneGeometry(12.4, 6.45),
  skyMaterial, 0, 3.2, -8.59);
const ceiling = new THREE.PlaneGeometry(12.4, 17.2);
ceiling.rotateX(Math.PI / 2);
add(root, "sky and ceiling becoming one", ceiling, skyMaterial, 0, 6.4, 0);

// Solid rear and side landscape cues define the walkable perimeter without
// placing an opaque wall across the portrait view.
for (const x of [-5.95, 5.95]) {
  for (let z = -7; z <= 7; z += 2.2) {
    const height = 1.15 + .35 * Math.sin(z * .7 + x);
    box(root, "low folded garden boundary", x, height / 2, z, .23, height, 1.9,
      x < 0 ? M.plaster : M.darkLeaf);
  }
}
for (let i = 0; i < 6; i++) {
  const z = -6.7 + i * 2.3;
  box(root, "room's warm plaster pilaster", -5.97, 2.4, z, .25, 4.8, .17, M.plaster);
  curve(root, "timber beam dissolving into the sky",
    [[-5.95, 4.65, z], [-3.6, 5.04 + .1 * i, z -.2], [-1.3, 5.5, z -.4],
      [.45, 5.75, z -.8]], .045, i % 2 ? M.brass : M.desk);
}
for (let i = 0; i < 5; i++) {
  const x = -5.3 + i * 1.2;
  box(root, "orange drawer cabinet under curved desk", x, .42, 2.3, .96, .81, 1.06, M.orange,
    i === 0 || i === 4);
  for (let drawer = 0; drawer < 2; drawer++) {
    box(root, "drawer face", x, .28 + drawer * .36, 2.847, .76, .27, .025, M.orange);
    box(root, "brass drawer handle", x, .28 + drawer * .36, 2.865, .18, .02, .025, M.brass);
  }
}

// Folded city blocks sit behind the street without asserting a real address.
for (let i = 0; i < 7; i++) {
  const x = -.1 + i * .88;
  const height = 2.15 + .54 * Math.sin(i * 1.38) + (i % 3) * .24;
  box(root, "distant folded brick neighborhood", x, height / 2, -8.3,
    .8, height, .42, i % 2 ? M.orange : M.plaster);
  for (let row = 0; row < 3; row++) for (const offset of [-.16, .16]) {
    box(root, "tiny pale apartment window", x + offset, .58 + row * .61,
      -8.065, .16, .28, .015, row % 2 ? M.paper : M.paleBlue);
  }
  box(root, "small cornice on the skyline", x, height, -8.3,
    .88, .09, .52, M.desk);
}
for (const z of [-4.8, -1.4, 2.0]) {
  const x = -5.78;
  box(root, "tall luminous wall window", x, 2.76, z,
    .035, 2.25, 1.13, M.paleBlue);
  for (const sign of [-1, 1]) box(root, "warm window upright", x + .03,
    2.76, z + sign * .58, .07, 2.42, .09, M.brass);
  box(root, "window sill", x + .07, 1.57, z, .14, .09, 1.29, M.brass);
  curve(root, "arched top of a remembered room", [[x + .07, 3.9, z - .58],
    [x + .07, 4.12, z], [x + .07, 3.9, z + .58]], .045, M.brass);
}

// The real desk's wide dark arc is a thick extruded shape, not a flat photo.
const deskShape = new THREE.Shape();
deskShape.moveTo(-5.52, 3.65);
deskShape.bezierCurveTo(-5.7, 2.55, -4.4, 1.95, -3.45, 1.75);
deskShape.bezierCurveTo(-1.65, 1.28, -.8, 1.85, -.46, 2.98);
deskShape.lineTo(-.55, 4.35);
deskShape.bezierCurveTo(-1.9, 4.02, -3.6, 4.17, -5.52, 4.35);
deskShape.closePath();
const deskGeometry = new THREE.ExtrudeGeometry(deskShape,
  { depth: .13, bevelEnabled: true, bevelSize: .06, bevelThickness: .04, bevelSegments: 2, curveSegments: 18 });
deskGeometry.rotateX(Math.PI / 2);
const desk = add(root, "Oleg's dark curved standing desk, solid at waist height", deskGeometry,
  M.desk, 0, .89, 0);
desk.userData.solidFootprint = true;
curve(root, "burnished edge of the desk", [[-5.5, .99, 3.63], [-4.65, .99, 2.5],
  [-3.5, .99, 1.81], [-2.2, .99, 1.65], [-.57, .99, 2.93]], .023, M.brass);

// Monitors, two laptops, chair, webcam, glass and wall instruments make the
// uploaded desk unmistakable without reproducing a photographic surface.
box(root, "large blank dark monitor", -4.45, 2.02, 3.73, 1.62, 1.32, .12, M.ink);
box(root, "monitor's thin brass frame", -4.45, 2.02, 3.81, 1.69, 1.39, .025, M.brass);
box(root, "blank monitor glass", -4.45, 2.02, 3.838, 1.53, 1.23, .008, M.night);
beam(root, "monitor stem", [-4.45, 1.02, 3.77], [-4.45, 1.38, 3.77], .045, .047, M.ink);
box(root, "webcam above screen", -4.45, 2.735, 3.83, .33, .11, .11, M.ink);
function laptop(x, z, scale, screen) {
  const group = new THREE.Group(); group.name = "unbranded open laptop";
  group.position.set(x, 1.02, z); group.scale.setScalar(scale); root.add(group);
  box(group, "keyboard case", 0, .035, .17, 1.25, .07, .79, M.ink);
  for (let row = 0; row < 4; row++) for (let key = 0; key < 11; key++) {
    box(group, "raised key", -.53 + key * .105, .076, -.12 + row * .13,
      .074, .011, .083, M.night);
  }
  const lid = box(group, "open laptop display", 0, .57, -.27, 1.27, 1.02, .045, M.ink);
  lid.rotation.x = -.15;
  const face = box(group, "blank laptop glass", 0, .58, -.245, 1.16, .9, .008, screen);
  face.rotation.x = -.15;
}
laptop(-4.42, 2.68, .8, M.night);
laptop(-1.04, 2.65, .71, M.paleBlue);
const chair = new THREE.Group(); chair.name = "gray upholstered swivel chair";
chair.position.set(-3.15, 0, 5.02); root.add(chair);
loft(chair, "shaped chair back", [[.64, .44, .12], [1.04, .47, .17],
  [1.42, .41, .14], [1.62, .32, .1]], M.street, 16, true);
loft(chair, "cushioned chair seat", [[.45, .28, .3, 0, .15],
  [.58, .42, .43, 0, .13], [.72, .34, .33, 0, .13]], M.street, 14, true);
beam(chair, "chair pedestal", [0, .1, .16], [0, .45, .16], .065, .05, M.ink);
for (let i = 0; i < 5; i++) {
  const a = i * Math.PI * 2 / 5;
  beam(chair, "chair foot", [0, .13, .16], [Math.cos(a) * .4, .07, .16 + Math.sin(a) * .4],
    .05, .027, M.ink);
}
for (const [x, tint] of [[-5.35, M.ink], [-4.58, M.orange]]) {
  const instrument = new THREE.Group();
  instrument.name = "hanging string instrument";
  instrument.position.set(x, 3.35, 6.1); root.add(instrument);
  loft(instrument, "carved waist and resonating body", [[-.65, .012, .025],
    [-.57, .15, .07], [-.39, .17, .08], [-.23, .105, .066],
    [-.04, .14, .07], [.13, .11, .05], [.22, .02, .02]], tint, 16);
  beam(instrument, "slender neck", [0, .15, 0], [0, .65, 0], .028, .025, M.desk);
  for (let string = -2; string <= 2; string++) {
    beam(instrument, "instrument string", [string * .014, -.42, .083],
      [string * .014, .63, .032], .0018, .0018, M.paper, 5);
  }
}
add(root, "little drinking glass on desk",
  new THREE.CylinderGeometry(.075, .063, .18, 12, 1, true),
  material(0xb8d2d1, { transparent: true, opacity: .7 }), -.77, 1.1, 3.62);
box(root, "small pile of blank job-search pages", -4.12, 1.04, 3.38, .48, .025, .62, M.paper);
for (let i = 0; i < 3; i++) box(root, "paper edge", -4.12 + i * .02,
  1.067 + i * .012, 3.35 - i * .025, .45, .008, .58, M.paper);

// The open street has handmade trees, lamplights, a winding garden edge and
// a few anonymous contacts. These are part of Jane's symbolic effort.
for (let i = 0; i < 6; i++) {
  const x = 4.45 + .55 * Math.sin(i * 1.3), z = -6.25 + i * 2.42;
  const tree = new THREE.Group(); tree.name = "branching street tree";
  tree.position.set(x, 0, z); root.add(tree);
  const trunk = loft(tree, "solid irregular tree trunk", [[0, .17, .15],
    [.6, .14, .12, .025], [1.4, .11, .1, -.016], [2.2, .075, .08]], M.desk, 10, true);
  for (const s of [-1, 1]) {
    curve(tree, "branch sweeping over the sidewalk", [[0, 1.42, 0],
      [s * .47, 2.12, -.11], [s * .85, 2.78, -.24]], .055, M.desk);
    for (let leafIndex = 0; leafIndex < 17; leafIndex++) {
      foldedLeaf(tree, s * (.4 + random() * 1.02), 2.45 + random() * .55,
        (random() - .5) * 1.15, .17 + random() * .15,
        leafIndex % 4 ? M.leaf : M.brass, random() * 6);
    }
  }
}
curve(root, "golden sidewalk seam carrying contacts toward Oleg's desk",
  [[1.1, .035, -7], [1.55, .04, -4.3], [2.25, .045, -1.8],
    [1.44, .035, .3], [.83, .033, 3.6], [0, .04, 6.7]], .028, M.brass, 60);
for (const [x, z] of [[3.2, -5.3], [2.7, -.9], [3.7, 3.4]]) {
  beam(root, "streetlight pole", [x, 0, z], [x, 3.35, z], .075, .058, M.ink)
    .userData.solidFootprint = true;
  curve(root, "streetlight hooked arm", [[x, 3.35, z], [x - .34, 3.69, z],
    [x - .85, 3.65, z]], .045, M.ink);
  loft(root, "small hood casting amber warmth", [[3.4, .29, .22, x - .85, z],
    [3.55, .19, .14, x - .85, z], [3.64, .055, .045, x - .85, z]], M.ink);
  box(root, "warm lamp glass", x - .85, 3.385, z, .32, .045, .22, glow);
}

function person(name, x, z, height, outfit, options = {}) {
  const group = new THREE.Group();
  group.name = `fully sculpted figure of ${name}`;
  group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
  const child = Boolean(options.child);
  const legHeight = height * .43;
  for (const s of [-1, 1]) {
    loft(group, "tailored trouser leg", [[.08, .11, .11, s * .135],
      [legHeight, .115, .11, s * .13], [legHeight + .09, .14, .12, s * .13]],
    options.pants || M.ink, 10);
    box(group, "solid walking shoe", s * .14, .065, .08, .25, .13, .33, M.desk);
  }
  loft(group, "solid folded clothing silhouette", [[legHeight, .25, .17],
    [legHeight + .16, .31, .19], [height - .54, .27, .16],
    [height - .43, .22, .14]], outfit, 14, true);
  for (const s of [-1, 1]) {
    const shoulder = [s * .22, height - .46, 0];
    const hand = options.hands?.[s] || [s * .33, height - 1.02, .16];
    const elbow = [s * .36, (height - .72 + hand[1]) / 2, (hand[2] + .05) / 2];
    beam(group, "sleeved upper arm", shoulder, elbow, .095, .077, outfit);
    beam(group, "reaching forearm", elbow, hand, .08, .055, outfit);
    loft(group, "shaped open hand", [[hand[1] - .07, .036, .032, hand[0], hand[2]],
      [hand[1], .05, .04, hand[0], hand[2]],
      [hand[1] + .02, .018, .017, hand[0], hand[2]]], M.skin, 9);
  }
  const faceHeight = height - .035;
  loft(group, "cheek and jaw portrait", [[faceHeight - .42, .06, .065],
    [faceHeight - .34, .14, .12], [faceHeight - .16, .17, .145],
    [faceHeight + .02, .15, .13], [faceHeight + .15, .02, .02]], M.skin, 15);
  for (const s of [-1, 1]) {
    add(group, "small eye white", new THREE.SphereGeometry(.026, 8, 6), M.paper,
      s * .069, faceHeight - .155, .143);
    add(group, "dark iris", new THREE.SphereGeometry(.013, 7, 5), M.ink,
      s * .069, faceHeight - .155, .167);
    curve(group, "eyebrow", [[s * .03, faceHeight - .095, .15],
      [s * .075, faceHeight - .085, .158], [s * .115, faceHeight - .1, .142]], .01, M.hair);
  }
  loft(group, "small sculpted nose", [[faceHeight - .27, .017, .019, 0, .155],
    [faceHeight - .16, .027, .029, 0, .178],
    [faceHeight - .14, .008, .01, 0, .158]], M.skin, 8);
  curve(group, "gentle expression", [[-.05, faceHeight - .31, .12],
    [0, faceHeight - .324, .134], [.05, faceHeight - .31, .12]], .009, M.orange);
  if (options.beard) for (const s of [-1, 1]) curve(group, "Oleg's short beard",
    [[s * .13, faceHeight - .28, .08], [s * .08, faceHeight - .37, .115],
      [0, faceHeight - .42, .1]], .034, M.hair);
  if (options.glasses) for (const s of [-1, 1]) {
    curve(group, "Oleg's dark rectangular glasses", [[s * .012, faceHeight - .12, .18],
      [s * .12, faceHeight - .12, .17], [s * .12, faceHeight - .21, .16],
      [s * .016, faceHeight - .21, .18], [s * .012, faceHeight - .12, .18]], .01, M.ink);
    beam(group, "glasses temple", [s * .12, faceHeight - .15, .16],
      [s * .18, faceHeight - .16, -.01], .008, .007, M.ink, 5);
  }
  loft(group, "layered hair rather than a round cap", [[faceHeight + .04, .09, .08],
    [faceHeight + .12, .17, .14, 0, -.02],
    [faceHeight + .21, .13, .11, 0, -.025],
    [faceHeight + .25, .028, .03, 0, -.025]], options.hair || M.hair, 15);
  for (let i = 0; i < 6; i++) {
    const xx = -.15 + i * .06;
    curve(group, "carved hair lock", [[xx, faceHeight + .15, .11],
      [xx + .015, faceHeight + .05, .15], [xx + .02, faceHeight - .035, .13]],
      .013, options.hair || M.hair);
  }
  if (options.bun) loft(group, "Jane's distinctive high bun", [[faceHeight + .2, .05, .04, 0, -.075],
    [faceHeight + .3, .13, .11, 0, -.085],
    [faceHeight + .4, .08, .07, 0, -.085],
    [faceHeight + .43, .01, .01, 0, -.085]], options.hair || M.hair, 12);
  if (options.longHair) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const xx = s * (.13 + i * .018);
    curve(group, "Oleg's medium wavy hair", [[xx, faceHeight + .04, -.02],
      [xx + s * .05, faceHeight - .24, -.05],
      [xx + s * .025, faceHeight - .52, .004]], .025 - i * .003, M.hair);
  }
  curve(group, "stitched neckline", [[-.14, height - .45, .12],
    [0, height - .49, .18], [.14, height - .45, .12]], .016, M.paper);
  if (child) for (let i = 0; i < 4; i++) box(group, "pattern on Zephrine's dress",
    -.14 + i * .09, height - .74 + .08 * (i % 2), .19, .026, .04, .01, M.teal);
  return group;
}

// Five versions of Jane are a deliberately symbolic afterimage. Distinct
// poses and nearby props tell the story without labels or copied photos.
person("Jane advising Oleg", -.05, 4.58, 1.68, M.blue,
  { bun: true, hands: { "-1": [-.83, 1.18, .4], "1": [.35, .83, .3] }, yaw: -.42 });
const oleg = person("Oleg at the job-search desk", -1.35, 4.82, 1.73, M.ink,
  { glasses: true, beard: true, longHair: true, hands: { "-1": [-.34, 1.03, .42],
    "1": [.34, 1.02, .43] }, yaw: .42 });
const pageInHand = box(oleg, "a blank folded page held in the long search",
  0, 1.07, .47, .43, .42, .018, M.paper);
pageInHand.rotation.z = -.12;
for (let line = 0; line < 3; line++) box(oleg, "unreadable mark on the page",
  -.03, 1.2 - line * .1, .486, .23 - line * .035, .012, .008, M.brass);
person("Jane caring for Zephrine", -3.96, -3.5, 1.68, M.blue,
  { bun: true, hands: { "-1": [-.4, .74, .25], "1": [.37, .8, .27] }, yaw: -.23 });
person("Zephrine with Jane", -3.2, -3.22, 1.05, M.paper,
  { child: true, hair: M.zephHair, pants: M.teal, hands: { "-1": [-.31, .6, .18] } });
person("Jane keeping the household going", -4.2, -6.0, 1.68, M.blue,
  { bun: true, hands: { "1": [.54, .84, .36] }, yaw: .35 });
person("Jane reaching out to contacts", 2.45, 1.9, 1.68, M.blue,
  { bun: true, hands: { "1": [.56, .91, .38], "-1": [-.35, .66, .2] }, yaw: -.55 });
for (const [x, z, height, color] of [[3.55, 1.3, 1.75, M.orange],
  [3.73, 2.52, 1.6, M.paleBlue]]) {
  person("unnamed person Jane approached outdoors", x, z, height, color,
    { hair: M.night, yaw: .25 });
}
person("Jane holding Oleg when the search was hard", -.45, -5.88,
  1.68, M.blue, { bun: true, hands: { "-1": [-.55, 1.05, .5],
    "1": [.45, 1.02, .49] }, yaw: .38 });
person("Oleg leaning into Jane's embrace", .12, -5.48, 1.73, M.ink,
  { glasses: true, beard: true, longHair: true,
    hands: { "-1": [-.41, 1.02, .45], "1": [.38, .89, .38] }, yaw: -.4 });

// A quiet kitchen and ordinary work make the support concrete. Thin arcs of
// brass tie each Jane together as one person across the impossible world.
box(root, "home counter", -4.82, .71, -5.02, 1.55, 1.38, .58, M.plaster, true);
box(root, "counter's orange front", -4.82, .48, -4.71, 1.39, .7, .04, M.orange);
for (const x of [-5.18, -4.45]) {
  box(root, "cabinet pull", x, .55, -4.68, .22, .025, .025, M.brass);
}
add(root, "small cooking pan", new THREE.CylinderGeometry(.24, .21, .07, 12),
  M.ink, -4.88, 1.44, -5.01);
beam(root, "pan handle", [-4.68, 1.46, -5.02], [-4.22, 1.46, -4.94],
  .028, .023, M.ink);
for (let i = 0; i < 5; i++) {
  curve(root, "gold thread of Jane's invisible labor", [
    [-4.15 + i * .15, 1.95, -5.8], [-3.1 + i * .21, 3.0 + i * .09, -4.7],
    [-1.2 + i * .13, 3.35 + i * .16, -2.1],
    [.9 + i * .18, 3.08 + i * .14, -1.2],
    [1.6 + i * .2, 2.7 + i * .12, .18]],
    .009, i % 2 ? M.brass : M.paper, 40);
}
for (let i = 0; i < 13; i++) {
  const x = -4.6 + i * .43, y = 3.96 + .2 * Math.sin(i * .7), z = -2.4 + .18 * i;
  const page = box(root, "blank folded page floating toward the street", x, y, z,
    .19, .23, .016, M.paper);
  page.rotation.set(.15 + i * .12, i * .16, .3 * Math.sin(i));
}
for (let i = 0; i < 8; i++) {
  const x = -3.9 + i * .9, y = 4.62 + .45 * Math.sin(i * .7), z = -.6 - .31 * i;
  const sail = box(root, "folded blank page drifting above the search",
    x, y, z, .46, .27, .025, M.paper);
  sail.rotation.set(.16 + i * .11, i * .17, .28 * Math.sin(i));
  curve(root, "fine fold in airborne paper", [[x - .18, y, z + .022],
    [x, y + .018, z + .028], [x + .18, y, z + .02]], .007, M.brass);
}

async function authorRoom() {
  // Batch small leaves into one mesh per pigment before exporting for phones.
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse((object) => {
    if (!object.userData.batchLeaf) return;
    const list = groups.get(object.material) || [];
    list.push(object); groups.set(object.material, list);
  });
  for (const [mat, objects] of groups) {
    const geometry = mergeGeometries(objects.map(object =>
      object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
    if (!geometry) throw new Error("Could not batch leaves");
    for (const object of objects) object.parent.remove(object);
    add(root, "layered leaves above the outdoor street", geometry, mat);
  }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const key = new THREE.DirectionalLight(0xffd9a8, 2.1);
  key.position.set(-3, 6, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xa8d4dc, 1.0);
  fill.position.set(4, 3, -2); scene.add(fill);
  scene.add(root);
  const view = gallery.frames[1].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 38);
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
