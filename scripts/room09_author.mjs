import * as THREE from "three";
import { foliageLobe } from "./sculpted_foliage.mjs";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { openSky } from "./open_sky.mjs";
import { addOlegPortrait, addJanePortrait, addZephrinePortrait,
  finishOlegPortraits } from "./oleg_portrait.mjs";

// A single authored world: the painting and exported GLB share this root.
// The photographs stay private. Nothing here embeds a photographic image.
const root = new THREE.Group();
root.name = "First apples with friends — a harvest memory";
const P = {
  sky: 0xb8c8bf, distant: 0x789186, grass: 0x78845b, soil: 0x6f584a,
  path: 0xb9a077, bark: 0x5c5148, barkLight: 0x88725b, leaf: 0x8c9a5b,
  ochre: 0xd3a65d, red: 0x9d4c4b, crimson: 0x7c3a46, cream: 0xf0dbb0,
  teal: 0x247d90, blue: 0x3f647b, ink: 0x363d4e, timber: 0x7e5842,
};
const grainCanvas = document.createElement("canvas");
grainCanvas.width = grainCanvas.height = 128;
const grainContext = grainCanvas.getContext("2d");
const grainImage = grainContext.createImageData(128, 128);
let grainSeed = 511093;
for (let i = 0; i < grainImage.data.length; i += 4) {
  grainSeed = (grainSeed * 1664525 + 1013904223) >>> 0;
  const tone = 227 + grainSeed % 29;
  grainImage.data[i] = tone; grainImage.data[i + 1] = tone;
  grainImage.data[i + 2] = tone - 3; grainImage.data[i + 3] = 255;
}
grainContext.putImageData(grainImage, 0, 0);
const pigment = new THREE.CanvasTexture(grainCanvas);
pigment.colorSpace = THREE.SRGBColorSpace;
const mat = (color, options = {}) => new THREE.MeshStandardMaterial({
  color, map: pigment, roughness: .94, metalness: 0, side: THREE.DoubleSide, ...options,
});
const M = Object.fromEntries(Object.entries(P).map(([key, color]) => [key, mat(color)]));
const skin = mat(0xe6ae89);
const skinChild = mat(0xe5b38e);
const hairBrown = mat(0x4e382f);
const hairDark = mat(0x302b31);
const hairWarm = mat(0x715243);
const glass = mat(0x272b32);
const creamLight = mat(0xf8e9c8, { emissive: 0x3d3017, emissiveIntensity: .12 });
let seed = 90251008;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function put(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name; object.position.set(x, y, z); parent.add(object); return object;
}
function box(parent, name, x, y, z, w, h, d, material) {
  return put(parent, name, new THREE.BoxGeometry(w, h, d), material, x, y, z);
}
function bridge(parent, name, a, b, radiusA, radiusB, material, sides = 8) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const vector = end.clone().sub(start);
  const object = put(parent, name, new THREE.CylinderGeometry(radiusB, radiusA, vector.length(), sides),
    material, ...start.clone().add(end).multiplyScalar(.5).toArray());
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
  return object;
}
function tube(parent, name, points, radius, material, sides = 6) {
  return put(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))),
    Math.max(8, points.length * 5), radius, sides, false), material);
}
function sculptLoft(parent, name, rings, material, sides = 14) {
  const vertices = [], uvs = [], indices = [];
  for (let level = 0; level < rings.length; level++) for (let side = 0; side < sides; side++) {
    const ring = rings[level];
    const a = side * Math.PI * 2 / sides;
    const wobble = 1 + .018 * Math.sin(side * 7 + ring[0] * 11);
    vertices.push((ring[3] || 0) + Math.cos(a) * ring[1] * wobble, ring[0],
      (ring[4] || 0) + Math.sin(a) * ring[2] * wobble);
    uvs.push(side / sides, level / (rings.length - 1));
  }
  for (let level = 0; level < rings.length - 1; level++) for (let side = 0; side < sides; side++) {
    const a = level * sides + side, b = level * sides + (side + 1) % sides;
    indices.push(a, b, a + sides, b, b + sides, a + sides);
  }
  for (let side = 1; side < sides - 1; side++) {
    indices.push(0, side + 1, side);
    const top = (rings.length - 1) * sides;
    indices.push(top, top + side, top + side + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return put(parent, name, geometry, material);
}
function leaf(parent, name, x, y, z, length, width, angle, material) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-width, length * .24, -width * .72, length * .68, 0, length);
  shape.bezierCurveTo(width * .72, length * .68, width, length * .24, 0, 0);
  const mesh = put(parent, name, new THREE.ExtrudeGeometry(shape, { depth: .012, bevelEnabled: false,
    curveSegments: 5 }), material, x, y, z);
  mesh.rotation.set(Math.PI / 2 - .18, angle, -.15);
  mesh.userData.batchLeaf = true;
  return mesh;
}
function apple(parent, x, y, z, scale = 1, tint = M.red) {
  const group = new THREE.Group(); group.name = "hand-sculpted apple with leaf and stem";
  group.position.set(x, y, z); group.scale.setScalar(scale); parent.add(group);
  sculptLoft(group, "five-lobed ripe apple", [
    [0, .01, .01], [.04, .105, .092], [.11, .16, .145], [.19, .17, .16],
    [.265, .14, .135], [.32, .075, .065], [.31, .018, .019],
  ], tint, 15);
  bridge(group, "curved apple stem", [0, .309, 0], [.015, .398, .008], .011, .008, M.bark);
  leaf(group, "small folded apple leaf", .018, .385, 0, .13, .045, .7, M.leaf);
  return group;
}

// The floor is a continuous, walkable path. Rows and fences make its real
// rectangular collision boundary legible without turning the orchard into a box.
const floor = new THREE.PlaneGeometry(11.6, 14.2, 34, 42);
floor.rotateX(-Math.PI / 2);
const colors = [];
const position = floor.attributes.position;
for (let i = 0; i < position.count; i++) {
  const x = position.getX(i), z = position.getZ(i);
  const y = .045 * Math.sin(x * 2.7 + z * 1.3) + .025 * Math.cos(z * 3.7 - x);
  position.setY(i, y);
  const path = Math.max(0, 1 - Math.abs(x - .22 * Math.sin(z * .55)) / 1.38);
  const base = new THREE.Color(P.grass).lerp(new THREE.Color(P.path), path * .9);
  base.offsetHSL(0, 0, (rand() - .5) * .07);
  colors.push(base.r, base.g, base.b);
}
floor.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
floor.computeVertexNormals();
put(root, "uneven painted orchard earth and footpath", floor, mat(0xffffff, { vertexColors: true }));
for (let i = 0; i < 110; i++) {
  const x = (rand() - .5) * 11, z = (rand() - .5) * 13.5;
  if (Math.abs(x) < .9) continue;
  leaf(root, "fallen ochre leaf", x, .035, z, .10 + rand() * .12, .035 + rand() * .03,
    rand() * 6.28, i % 3 ? M.ochre : M.red);
}
for (let i = 0; i < 24; i++) {
  const z = 6.2 - i * .52, x = (rand() - .5) * 1.5;
  const pebble = put(root, "small stone pressed into the orchard path",
    new THREE.DodecahedronGeometry(.045 + rand() * .035, 0), i % 3 ? M.cream : M.barkLight,
    x, .04, z);
  pebble.scale.set(1.6, .32, .8);
}

// Broad sculpted hills and a color-washed sky stay behind the grove. They are
// geometry, with depth and side walls, never photographic planes or cutouts.
const openAir = openSky(P.sky, 15);
function skyPanel(name, width, x, z, angle = 0) {
  const panel = put(root, name, openAir.panel(width),
    openAir.sideMaterial, x, 7.5, z);
  panel.rotation.y = angle;
}
skyPanel("painted dusk sky at the orchard horizon", 11.64, 0, -7.085);
skyPanel("west horizon wrapping into the orchard", 14.24, -5.79, 0, Math.PI / 2);
skyPanel("east horizon wrapping into the orchard", 14.24, 5.79, 0, Math.PI / 2);
put(root, "open color-washed sky above the branches", openAir.roof(11.64, 14.24),
  openAir.topMaterial, 0, 14.99, 0);
for (const [shift, tint] of [[-6.84, M.distant], [-6.58, M.leaf]]) {
  const points = [];
  for (let i = 0; i <= 30; i++) {
    const x = -5.9 + i * 11.8 / 30;
    points.push(new THREE.Vector2(x, .7 + .34 * Math.sin(x * .65 + shift) + .16 * Math.cos(x * 1.9)));
  }
  const shape = new THREE.Shape(); shape.moveTo(-5.9, 0);
  for (const point of points) shape.lineTo(point.x, point.y);
  shape.lineTo(5.9, 0); shape.closePath();
  const hill = put(root, "layered distant Finger Lakes hill",
    new THREE.ExtrudeGeometry(shape, { depth: .18, bevelEnabled: false }), tint, 0, 0, shift);
  hill.material.side = THREE.DoubleSide;
}

// Trellis marks the same open doorway that the visitor sees from the hall.
for (const sign of [-1, 1]) {
  const post = bridge(root, "carved orchard gate post", [sign * 1.81, 0, 6.64],
    [sign * 1.8, 3.45, 6.64], .11, .095, M.timber);
  post.userData.solidFootprint = true;
  tube(root, "arching apple branch above the return doorway", [
    [sign * 1.81, 3.35, 6.64], [sign * 1.42, 3.74, 6.62],
    [sign * .72, 4.00, 6.58], [0, 4.08, 6.57],
  ], .075, M.bark);
  for (let i = 0; i < 7; i++) {
    const x = sign * (1.8 - i * .24);
    leaf(root, "gate vine leaf", x, 3.52 + .22 * Math.sin(i * .38), 6.59,
      .24, .10, sign * .4, i % 2 ? M.leaf : M.ochre);
  }
}

// Leaves curve over the path instead of ending at the tops of isolated trees.
// This high canopy makes the first framed glance feel like an invitation into
// a different world, while the opening itself stays clear to walk through.
for (const sign of [-1, 1]) {
  tube(root, "arching orchard canopy limb", [
    [sign * 3.12, 2.12, 3.3], [sign * 2.28, 3.28, 3.16],
    [sign * 1.2, 4.1, 3.02], [sign * .19, 4.36, 2.95],
  ], .07, M.bark);
  for (let i = 0; i < 33; i++) {
    const x = sign * (2.95 - rand() * 2.9);
    const y = 3.65 + rand() * .85;
    const z = 2.7 + rand() * .75;
    leaf(root, "overhead folded harvest leaf", x, y, z,
      .19 + rand() * .18, .08 + rand() * .04, rand() * 6.28,
      i % 4 ? M.leaf : M.ochre);
  }
  for (let i = 0; i < 5; i++) apple(root, sign * (.5 + i * .37),
    3.86 + rand() * .23, 3.15 + (rand() - .5) * .25, .49, M.crimson);
}

// Orchard rows: trunks, forked branches, folded leaves, and sculpted fruit.
function orchardTree(x, z, scale, index) {
  const tree = new THREE.Group(); tree.name = `apple tree ${index} with a forked crown`;
  tree.position.set(x, 0, z); tree.scale.setScalar(scale); root.add(tree);
  const trunk = sculptLoft(tree, "irregular solid apple trunk", [
    [0, .19, .18], [.35, .17, .15, .025], [.85, .15, .14, -.02],
    [1.5, .125, .12, .045], [2.0, .1, .09],
  ], M.bark, 9);
  trunk.userData.solidFootprint = true;
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * Math.PI * 2 / 5 + index * .28;
    const end = [Math.cos(a) * (.8 + .18 * rand()), 2.35 + rand() * .32,
      Math.sin(a) * (.65 + .2 * rand())];
    tube(tree, "angular fruit-tree limb", [[0, 1.3, 0],
      [end[0] * .5, 1.93, end[2] * .5], end], .055, M.bark, 7);
    foliageLobe(tree, "fruiting apple-tree canopy with a scalloped silhouette",
      end[0] * .86, end[1] + .08, end[2] * .86,
      .56, .28, .49, branch % 3 ? P.leaf : P.ochre, index * 7 + branch);
    for (let j = 0; j < 15; j++) {
      const lx = end[0] + (rand() - .5) * .85;
      const lz = end[2] + (rand() - .5) * .65;
      const ly = end[1] + (rand() - .5) * .65;
      leaf(tree, "folded fall orchard leaf", lx, ly, lz,
        .19 + rand() * .12, .075 + rand() * .035,
        rand() * 6.28, j % 5 ? (j % 3 ? M.leaf : M.ochre) : M.red);
    }
    if (branch % 2 === 0) for (let aIndex = 0; aIndex < 2; aIndex++) {
      apple(tree, end[0] + (rand() - .5) * .4, end[1] - .38 - rand() * .2,
        end[2] + (rand() - .5) * .35, .72 + rand() * .22,
        index % 3 ? M.red : M.crimson);
    }
  }
  for (let i = 0; i < 4; i++) {
    bridge(tree, "exposed root holding the orchard path", [0, .08, 0],
      [Math.cos(i * 1.57 + index) * .43, .06, Math.sin(i * 1.57 + index) * .43], .07, .028, M.bark);
  }
}
let treeIndex = 0;
for (const x of [-3.28, 3.28]) for (const z of [4.15, .25, -3.38]) {
  orchardTree(x + (rand() - .5) * .32, z, .95 + rand() * .14, treeIndex++);
}
for (const x of [-4.8, 4.8]) for (const z of [-5.15, 2.1]) {
  orchardTree(x, z, .82, treeIndex++);
}

// Low carved rails and layered hedges tell walkers where the world ends.
for (const side of [-1, 1]) {
  for (let z = -5.9; z < 6.2; z += 1.36) {
    bridge(root, "orchard boundary fence stake", [side * 5.52, 0, z],
      [side * 5.52, .91, z], .075, .06, M.timber);
    if (z < 5.4) for (const y of [.34, .67]) {
      box(root, "woven boundary rail", side * 5.52, y, z + .68, .06, .055, 1.36, M.barkLight);
    }
    for (let leafIndex = 0; leafIndex < 6; leafIndex++) {
      leaf(root, "mixed hedge leaf along the orchard edge",
        side * (5.26 + rand() * .26), .35 + rand() * .92, z + rand() * 1.1,
        .25 + rand() * .18, .09, rand() * 6.28,
        leafIndex % 3 ? M.leaf : M.ochre);
    }
  }
}

// A compressed dairy-barn memory sits at the far end of the orchard. The farm
// really has a converted dairy-barn store; this design is symbolic, not a copy.
const barn = new THREE.Group(); barn.name = "symbolic old farm-store barn";
barn.position.set(0, 0, -6.56); root.add(barn);
box(barn, "barn shadowed doorway", 0, 1.28, .11, 2.0, 2.44, .14, M.ink);
box(barn, "warm lamplit depth within the barn", 0, 1.28, .202, 1.76, 2.20, .025,
  mat(0x745740, { emissive: 0x7b3b18, emissiveIntensity: .35 }));
for (const y of [.62, 1.26, 1.88]) {
  box(barn, "farm-store timber shelf", 0, y, .23, 1.62, .07, .14, M.ochre);
  for (const x of [-.55, -.2, .18, .53]) {
    const jar = sculptLoft(barn, "glass jar of orchard preserves", [
      [y + .04, .092, .085, x, .31], [y + .2, .09, .083, x, .31],
      [y + .23, .077, .075, x, .31],
    ], x < 0 ? M.crimson : M.ochre, 9);
    jar.name = "preserves displayed in the old farm store";
    box(barn, "small paper jar lid", x, y + .24, .31, .16, .025, .14, M.cream);
  }
}
for (const x of [-2.52, 2.52]) box(barn, "timber barn pier", x, 1.45, 0, .27, 2.9, .36, M.timber);
box(barn, "weathered barn lintel", 0, 2.91, 0, 5.36, .22, .44, M.timber);
for (const sign of [-1, 1]) {
  const roof = box(barn, "sloped barn roof with layered shingles", sign * 1.38, 3.39, -.16,
    3.13, .13, 1.6, M.crimson);
  roof.rotation.z = -sign * .36;
  for (let i = 0; i < 9; i++) {
    box(barn, "hand-painted barn weatherboard", sign * 1.78, .19 + i * .29, .14,
      1.3, .235, .07, i % 3 ? M.barkLight : M.timber);
  }
}
for (const x of [-.99, .99]) box(barn, "open barn door frame", x, 1.25, .18, .13, 2.5, .13, M.cream);
box(barn, "barn loft beam", 0, 3.0, .16, 2.1, .08, .12, M.ochre);
for (const x of [-2.17, 2.17]) {
  const round = put(barn, "carved barn-window rosette", new THREE.TorusGeometry(.18, .024, 5, 14),
    M.cream, x, 2.38, .22);
  round.rotation.x = .03;
  box(barn, "cross on barn window", x, 2.38, .23, .03, .27, .03, M.ochre);
}
function crate(x, z, color = M.timber) {
  const crateGroup = new THREE.Group(); crateGroup.name = "farm-stand produce crate";
  crateGroup.position.set(x, 0, z); root.add(crateGroup);
  box(crateGroup, "crate bottom", 0, .11, 0, .75, .1, .56, color).userData.solidFootprint = true;
  for (const sign of [-1, 1]) {
    box(crateGroup, "slatted crate side", sign * .38, .25, 0, .055, .26, .6, color);
    box(crateGroup, "slatted crate end", 0, .25, sign * .29, .78, .26, .055, color);
  }
  return crateGroup;
}
function gourd(parent, x, y, z, scale, color) {
  const fruit = sculptLoft(parent, "ridged autumn gourd", [
    [0, .045, .055], [.07, .19, .17], [.18, .22, .2], [.3, .15, .15], [.34, .045, .045],
  ], color, 10);
  fruit.position.set(x, y, z); fruit.scale.setScalar(scale);
  bridge(parent, "curled squash stem", [x, y + .34 * scale, z], [x + .04, y + .45 * scale, z],
    .02, .012, M.bark);
}
for (const x of [-2.25, 2.25]) {
  const c = crate(x, -5.46);
  for (let i = 0; i < 5; i++) gourd(c, (rand() - .5) * .48, .27,
    (rand() - .5) * .34, .56 + rand() * .2, i % 2 ? M.ochre : M.leaf);
  for (let i = 0; i < 12; i++) {
    const offset = (rand() - .5) * 1.1;
    leaf(root, "flowering fall mum at the farm stand", x + offset, .47 + rand() * .72,
      -5.65 + (rand() - .5) * .6, .12, .045, rand() * 6.28,
      i % 2 ? M.ochre : M.crimson);
  }
}

// One thin painted memory ribbon winds through the upper branches. The fruit
// and fallen leaves remain the real visual subjects.
for (const [offset, material] of [[0, M.ochre], [.19, M.cream]]) {
  tube(root, "hand-drawn harvest breeze between the trees", [
    [-4.75, 3.36 + offset, -3.7], [-3.0, 4.05 + offset, -3.2],
    [-1.2, 4.46 + offset, -3.6], [.7, 4.33 + offset, -3.1],
    [2.75, 4.52 + offset, -3.8], [4.75, 4.16 + offset, -3.5],
  ], .011, material, 5);
}

// Sculpted figures use lofts, folds, seams, and raised facial features. They
// remain three-dimensional from every side. No reference photo is in the GLB.
function face(parent, height, hair, { glasses = false, beard = false, bun = false, longHair = false, oleg = false, jane = false, zephrine = false } = {}) {
  const head = sculptLoft(parent, "faceted cheek and jaw portrait", [
    [height - .42, .065, .07], [height - .34, .145, .13],
    [height - .16, .173, .15], [height + .02, .15, .14],
    [height + .13, .09, .085], [height + .17, .018, .018],
  ], skin, 15);
  head.name = "sculpted portrait face";
  if (oleg) addOlegPortrait(parent, height,
    [[-.42, .065, .07], [-.34, .145, .13], [-.16, .173, .15],
      [.02, .15, .14], [.13, .09, .085]], skin);
  if (jane) addJanePortrait(parent, height,
    [[-.42, .065, .07], [-.34, .145, .13], [-.16, .173, .15],
      [.02, .15, .14], [.13, .09, .085]], skin);
  if (zephrine) addZephrinePortrait(parent, height,
    [[-.42, .065, .07], [-.34, .145, .13], [-.16, .173, .15],
      [.02, .15, .14], [.13, .09, .085]], skin);
  for (const s of [-1, 1]) {
    put(parent, "warm ear and cheek detail", new THREE.DodecahedronGeometry(.037, 0), skin,
      s * .166, height - .22, .01);
    if (!oleg && !jane && !zephrine) put(parent, "painted eye white", new THREE.SphereGeometry(.026, 9, 7), M.cream,
      s * .069, height - .15, .145);
    if (!oleg && !jane && !zephrine) put(parent, "small dark iris", new THREE.SphereGeometry(.013, 8, 6), M.ink,
      s * .069, height - .15, .168);
    if (!oleg && !jane && !zephrine) tube(parent, "expressive brow", [[s * .032, height - .09, .15],
      [s * .072, height - .08, .155], [s * .112, height - .092, .14]], .009, hair);
  }
  if (!oleg && !jane && !zephrine) sculptLoft(parent, "small raised nose", [[height - .28, .017, .019, 0, .15],
    [height - .16, .024, .027, 0, .178], [height - .14, .008, .01, 0, .16]], skin, 8);
  if (!oleg && !jane && !zephrine) tube(parent, "gentle portrait mouth", [[-.052, height - .315, .119],
    [0, height - .329, .133], [.052, height - .315, .119]], .009, M.red);
  if (beard && !oleg) {
    for (const s of [-1, 1]) tube(parent, "short painted beard", [
      [s * .12, height - .28, .085], [s * .085, height - .37, .115],
      [0, height - .41, .099]], .035, hair);
  }
  if (glasses && !oleg) {
    for (const s of [-1, 1]) {
      tube(parent, "dark rectangular glasses rim", [[s * .015, height - .116, .181],
        [s * .121, height - .116, .17], [s * .124, height - .205, .162],
        [s * .018, height - .205, .181], [s * .015, height - .116, .181]], .009, glass, 5);
      bridge(parent, "spectacle temple", [s * .12, height - .15, .16],
        [s * .18, height - .16, -.01], .008, .007, glass, 5);
    }
  }
  sculptLoft(parent, "layered hair cap", [[height + .04, .09, .08],
    [height + .1, .17, .14, 0, -.028], [height + .19, .14, .125, 0, -.03],
    [height + .245, .035, .04, 0, -.03]], hair, 15);
  for (let i = 0; i < 7; i++) {
    const x = -.16 + i * .053;
    tube(parent, "carved hair lock", [[x, height + .16, .108],
      [x + (i - 3) * .008, height + .05, .15], [x + .012, height - .03, .136]],
    .012, i % 3 ? hair : M.barkLight);
  }
  if (bun) sculptLoft(parent, "Jane's top bun", [[height + .19, .055, .05, 0, -.08],
    [height + .3, .12, .11, 0, -.085], [height + .4, .08, .07, 0, -.085],
    [height + .43, .014, .012, 0, -.085]], hair, 12);
  if (longHair) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = s * (.13 + i * .017);
    tube(parent, "long wavy hair around shoulders", [[x, height + .06, -.02],
      [x + s * .05, height - .22, -.05], [x + s * .025, height - .56, .005]],
      .029 - i * .003, hair);
  }
}
function person(name, x, z, height, outfit, hair, options = {}) {
  const group = new THREE.Group(); group.name = `three-dimensional portrait of ${name}`;
  group.position.set(x, 0, z); root.add(group);
  const legHeight = height * .43;
  for (const s of [-1, 1]) {
    const leg = sculptLoft(group, "cloth trouser leg with taper", [
      [.07, .13, .13, s * .15], [.21, .115, .11, s * .15],
      [legHeight, .105, .105, s * .14], [legHeight + .15, .14, .12, s * .13],
    ], options.pants || M.ink, 10);
    leg.rotation.z = s * .03;
    const shoe = sculptLoft(group, "shaped walking shoe with rounded toe", [
      [.015, .115, .18, s * .15, .1], [.07, .145, .21, s * .15, .09],
      [.145, .11, .15, s * .15, .035], [.17, .07, .1, s * .15, 0],
    ], options.shoes || M.bark, 14);
    shoe.rotation.y = s * .07;
    box(group, "shoe sole", s * .15, .012, .08, .28, .03, .4, M.ink);
  }
  const torso = sculptLoft(group, "tailored garment silhouette, solid for collision", [
    [legHeight, .29, .18], [legHeight + .15, .32, .21],
    [height - .57, .27, .18], [height - .43, .21, .15],
  ], outfit, 15);
  torso.userData.solidFootprint = true;
  for (const s of [-1, 1]) {
    const shoulder = [s * .24, height - .48, 0];
    const hand = options.handTargets?.[s] || [s * (options.armsWide ? .49 : .33), height - 1.0, .17];
    const elbow = [s * (options.armsWide ? .44 : .34),
      (height - .76 + hand[1]) / 2 + .09, (hand[2] + .04) / 2];
    bridge(group, "sleeved arm with shaped elbow", shoulder, elbow, .105, .09, outfit, 10);
    bridge(group, "folded sleeve", elbow, hand, .085, .06, outfit, 10);
    sculptLoft(group, "five-finger hand silhouette", [[hand[1] - .095, .043, .036, hand[0], hand[2]],
      [hand[1], .054, .044, hand[0], hand[2]],
      [hand[1] + .018, .025, .02, hand[0], hand[2]]], options.child ? skinChild : skin, 9);
  }
  face(group, height - .04, hair, { ...options, oleg: name === "Oleg",
    jane: name === "Jane", zephrine: name === "Zephrine" });
  tube(group, "stitched garment neckline", [[-.15, height - .44, .1],
    [0, height - .48, .18], [.15, height - .44, .1]], .017, M.cream);
  if (options.jacket) {
    box(group, "raised zipper seam", 0, height - .79, .2, .012, .51, .014, M.ochre);
    for (const s of [-1, 1]) {
      tube(group, "folded jacket collar", [[0, height - .44, .13],
        [s * .1, height - .49, .22], [s * .17, height - .56, .2]], .025, M.cream);
      box(group, "angled jacket pocket", s * .19, height - .96, .2, .15, .015, .015, M.barkLight);
    }
  }
  for (const s of [-1, 1]) tube(group, "cloth side seam", [[s * .27, legHeight + .05, .1],
    [s * .29, legHeight + .25, .1], [s * .24, height - .5, .09]], .009, M.barkLight);
  return group;
}

// Zephrine's observed teal vest, apple-print clothes, and bitten apple anchor
// the composition. Her small posture and thoughtful glance are sculpted, not
// photo-textured. Jane, Oleg, Matt, Tanya and two children complete the visit.
const zephrine = person("Zephrine", 0, 3.05, 1.16, M.cream, hairWarm,
  { child: true, pants: M.cream, shoes: M.blue,
    handTargets: { "-1": [-.13, .66, .31], "1": [.16, .62, .31] } });
for (const s of [-1, 1]) {
  const panel = box(zephrine, "quilted teal vest panel", s * .12, .67, .175,
    .18, .42, .035, M.teal);
  panel.rotation.z = s * -.05;
  for (let row = 0; row < 4; row++) box(zephrine, "vest quilting seam",
    s * .12, .5 + row * .1, .198, .17, .006, .008, M.blue);
  for (let i = 0; i < 3; i++) {
    const patch = put(zephrine, "tiny painted apple motif on the dress",
      new THREE.DodecahedronGeometry(.032, 0), M.red, s * (.08 + i * .08), .32 + i * .13, .179);
    patch.scale.set(1, 1.15, .42);
  }
}
box(zephrine, "teal vest zipper", 0, .69, .21, .012, .42, .012, M.cream);
apple(zephrine, .11, .55, .3, 1.0, M.crimson);
const bite = put(zephrine, "pale bitten spot on Zephrine's first apple",
  new THREE.DodecahedronGeometry(.062, 1), M.cream, .08, .82, .37);
bite.scale.set(1.1, .48, .28);
person("Jane", -1.58, 1.15, 1.67, M.blue, hairDark,
  { bun: true, pants: M.ink, handTargets: { "1": [.52, .96, .34] } });
person("Oleg", 1.65, 1.12, 1.75, M.ink, hairBrown,
  { glasses: true, beard: true, longHair: true, pants: M.ink,
    handTargets: { "-1": [-.48, .91, .32] }, jacket: true });
person("Matt", -3.05, -.65, 1.73, M.red, hairWarm,
  { glasses: true, beard: true, pants: M.ink, jacket: true });
person("Tanya", 3.05, -.75, 1.67, M.cream, hairBrown,
  { glasses: true, longHair: true, pants: M.blue, jacket: true });
person("friend's older child", -2.4, .46, 1.18, M.leaf, hairBrown,
  { child: true, pants: M.blue });
person("friend's younger child", 2.45, .42, .94, M.ochre, hairWarm,
  { child: true, pants: M.blue });

// The orchard offers discoveries from several angles: a picked-apple basket,
// a leaf-shaped route, and layered harvest color near the old barn.
const basket = new THREE.Group(); basket.name = "woven basket of harvested apples";
basket.position.set(-1.0, 0, 4.45); root.add(basket);
sculptLoft(basket, "solid wicker basket with flared lip", [[.05, .29, .22],
  [.28, .34, .27], [.39, .39, .31], [.42, .36, .29]], M.timber, 15).userData.solidFootprint = true;
for (let i = 0; i < 8; i++) {
  const a = i * Math.PI * 2 / 8;
  bridge(basket, "diagonal wicker strand", [Math.cos(a) * .28, .09, Math.sin(a) * .22],
    [Math.cos(a + .13) * .38, .38, Math.sin(a + .13) * .29], .012, .01, M.ochre);
}
tube(basket, "arching basket handle", [[-.31, .35, 0], [-.2, .77, 0],
  [.2, .77, 0], [.31, .35, 0]], .035, M.barkLight);
for (let i = 0; i < 6; i++) apple(basket, (rand() - .5) * .45,
  .39 + rand() * .09, (rand() - .5) * .34, .58, i % 3 ? M.red : M.ochre);
for (let i = 0; i < 14; i++) {
  const x = -4.25 + rand() * 8.5, z = -4.7 + rand() * 9.7;
  if (Math.abs(x) < 1.15 && z > -2 && z < 3) continue;
  apple(root, x, .045, z, .45 + rand() * .2, i % 4 ? M.red : M.ochre);
}

async function authorRoom() {
  await finishOlegPortraits(root);
  // All leaves use the same few pigments. Merge their transformed geometry so
  // the mobile GPU sees a handful of draw calls instead of hundreds.
  root.updateMatrixWorld(true);
  const leavesByMaterial = new Map();
  root.traverse((object) => {
    if (!object.userData?.batchLeaf) return;
    const list = leavesByMaterial.get(object.material) || [];
    list.push(object); leavesByMaterial.set(object.material, list);
  });
  for (const [material, objects] of leavesByMaterial) {
    const geometry = mergeGeometries(objects.map((object) =>
      object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
    if (!geometry) throw new Error("Could not merge orchard leaves");
    for (const object of objects) object.parent.remove(object);
    put(root, "layered three-dimensional orchard leaves", geometry, material);
  }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(P.sky);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  const key = new THREE.DirectionalLight(0xffd8a2, 2.4);
  key.position.set(-2.5, 5.6, 3.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xb3d6db, .8);
  fill.position.set(3.3, 3.2, -2); scene.add(fill);
  scene.add(root);
  const view = gallery.frames[8].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 35);
  camera.position.fromArray(view.position); camera.lookAt(...view.target);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735, Math.round(735 * FRAME_HEIGHT / FRAME_WIDTH));
  document.body.append(renderer.domElement);
  renderer.render(scene, camera);
  const preview = renderer.domElement.toDataURL("image/webp", .87);
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
