import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

// Jane's office move is a symbolic account of her resolve, not a literal
// recreation of a dispute. Empty rigid forms stand in for resistance; no
// identifiable staff, company marks, agreement text or confrontation appear.
const C = {
  sky: 0x777684, ground: 0x63616b, floorDark: 0x5c5965,
  floorWarm: 0xd0b390, brick: 0x966c6a, brickLight: 0xb38176,
  mortar: 0xc9a79a, glass: 0x9ab7b9, paleGlass: 0xc2d0c9,
  ink: 0x343a48, paper: 0xf0ddbe, brass: 0xd1aa67,
  rose: 0xb47d88, amber: 0xe7bd79, olive: 0x84947b,
  skin: 0xd8a487, hair: 0x3e3033, fabric: 0x416777,
  navy: 0x394b61, zephHair: 0x6f5145, pink: 0xd6a0a0,
};
const art = createRoomArt({ index: 4,
  title: "Jane standing firm while an office closes around the family",
  width: 12.6, height: 6.5, depth: 17.8, colors: C, seed: 505505 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky();
ground(C.floorDark, (x, z) => {
  const open = THREE.MathUtils.smoothstep(-z + .18 * Math.sin(x), -2, 7);
  return new THREE.Color(C.floorDark).lerp(new THREE.Color(C.floorWarm), open * .68);
});

// Exposed red brick and large glazed bays recall the North Center workspace
// only as visual vocabulary. The panels never carry a real address or logo.
for (const side of [-1, 1]) {
  for (let i = 0; i < 5; i++) {
    const z = -7.1 + i * 3.55;
    box(root, "solid brick pier between high windows", side * 6.12, 3.22,
      z, .35, 6.43, .4, i % 2 ? M.brick : M.brickLight, true);
    box(root, "tall silver-blue shared-workspace window", side * 6.13,
      3.1, z + 1.48, .045, 3.83, 2.44, M.glass);
    box(root, "deep lower brick spandrel", side * 6.09, .59,
      z + 1.48, .25, 1.18, 2.48, M.brick);
    for (const y of [1.2, 4.99]) box(root, "continuous stone sill and lintel",
      side * 6.02, y, z + 1.48, .31, .12, 2.52, M.mortar);
    for (const zz of [z + .32, z + 2.64]) box(root,
      "slender vertical window mullion", side * 6.01, 3.1, zz,
      .1, 3.95, .09, M.ink);
    beam(root, "crossbar across broad office window",
      [side * 5.99, 3.1, z + .28], [side * 5.99, 3.1, z + 2.68],
      .025, .025, M.mortar, 6);
  }
}
box(root, "far wall of warm paper and brick", 0, 3.18, -8.75,
  12.3, 6.3, .18, M.brickLight);
for (let i = -5; i <= 5; i++) {
  if (i < -3 || i > 3) continue;
  const x = i * 1.55;
  const tall = 3.08 + .32 * Math.cos(i * .45);
  const pane = new THREE.Shape();
  pane.moveTo(-.59, 0); pane.lineTo(.59, 0);
  pane.lineTo(.59, tall - .46);
  pane.quadraticCurveTo(.55, tall, 0, tall);
  pane.quadraticCurveTo(-.55, tall, -.59, tall - .46);
  pane.closePath();
  add(root, "arched industrial daylight window",
    new THREE.ExtrudeGeometry(pane,
      { depth: .035, bevelEnabled: false, curveSegments: 8 }),
    i < 0 ? M.paleGlass : M.paper, x, 1.18, -8.62);
  curve(root, "masonry arch around daylight window",
    [[x - .62, 1.18, -8.54], [x - .62, 1.18 + tall - .45, -8.54],
      [x, 1.18 + tall, -8.54], [x + .62, 1.18 + tall - .45, -8.54],
      [x + .62, 1.18, -8.54]], .043, M.mortar, 24);
  beam(root, "slender transom within window",
    [x - .58, 2.88, -8.53], [x + .58, 2.88, -8.53],
    .021, .021, M.brass, 6);
}

// Heavy inward-leaning ribs at the near end release into a wide open arch.
// They are architectural resistance, not portraits of real people.
for (let row = 0; row < 4; row++) {
  const z = 5.9 - row * 3.5;
  const spread = 3.55 + row * .52;
  for (const side of [-1, 1]) {
    const centerAt = y => side * (spread - .12 * y / 5.35);
    loft(root, "solid chamfered masonry pier opening outward",
      [[0, .34, .35, centerAt(0), z],
        [.28, .34, .35, centerAt(.28), z],
        [1.2, .31, .33, centerAt(1.2), z],
        [3.4, .29, .31, centerAt(3.4), z],
        [5.28, .31, .33, centerAt(5.28), z]],
    row < 2 ? M.brick : M.brickLight, 8, true);
    box(root, "carved broad stone plinth at each pier", centerAt(.12),
      .14, z, .79, .28, .8, M.mortar, true);
    box(root, "projecting stone capital supporting the arch",
      centerAt(5.25), 5.24, z, .79, .2, .8, M.mortar);
    for (let band = 1; band < 7; band++) {
      const y = band * .75;
      box(root, "mortar bed following the masonry pier",
        centerAt(y), y, z, .635, .018, .635, M.mortar);
    }
    for (const offset of [-.16, .16]) curve(root,
      "long chamfer line cut into the pier face",
      [[centerAt(.27) + offset, .28, z + .34],
        [centerAt(2.65) + offset, 2.65, z + .31],
        [centerAt(5.16) + offset, 5.16, z + .33]],
      .012, M.brickLight, 18);
  }
  curve(root, "handmade arch loosening above Jane",
    [[-spread + .2, 5.23, z], [-spread * .58, 5.7 + row * .12, z - .1],
      [0, 6.14 + row * .07, z - .2],
      [spread * .58, 5.7 + row * .12, z - .1],
      [spread - .2, 5.23, z]], .06,
    row < 2 ? M.ink : M.brass, 38);
}

// A torn strip of the old office floor straightens and brightens where Jane
// stands. The narrow dark side channels remain explorable, not dead ends.
for (let lane = -2; lane <= 2; lane++) {
  curve(root, "stone seam resolving into an open path",
    [[lane * .75, .035, 8.55], [lane * .64 + .12, .04, 4.2],
      [lane * .85, .04, .5], [lane * 1.0, .04, -3.9],
      [lane * 1.2, .04, -8.1]],
    .019, lane === 0 ? M.brass : M.mortar, 48);
}
for (let i = 0; i < 11; i++) {
  const z = -7.85 + i * 1.5;
  curve(root, "continuous transverse joint in the stone walkway",
    [[-3.15, .037, z], [-1.55, .039, z + .06],
      [0, .038, z], [1.55, .039, z - .06], [3.15, .037, z]],
    .008, M.mortar, 24);
}

// Three hinged partition leaves retain the pressure of a former workspace,
// but are recognizable as doors rather than a comb of unexplained bars.
for (let i = 0; i < 3; i++) {
  const x = 4.35 + i * .48, z = 3.55 - i * 1.16;
  const partition = new THREE.Group();
  partition.name = "folding office partition leaf with inset glass";
  partition.position.set(x, 0, z);
  partition.rotation.y = (i % 2 ? -.28 : .27);
  root.add(partition);
  box(partition, "solid timber-framed folding partition", 0, 1.77, 0,
    .88, 3.54, .15, M.ink, true);
  box(partition, "recessed frosted upper partition glass", 0, 2.35, .083,
    .65, 1.86, .025, M.glass);
  box(partition, "recessed lower timber partition panel", 0, .68, .084,
    .66, 1.04, .02, M.brick);
  for (const side of [-1, 1]) beam(partition, "visible brass hinge pin",
    [side * .44, .5, 0], [side * .44, 3.18, 0],
    .015, .015, M.brass, 6);
  add(partition, "small brass partition pull",
    new THREE.TorusGeometry(.065, .013, 6, 12), M.brass,
    .27, 1.21, .106);
}

// A few moving boxes, a vacant shared table and phone booth are enough to
// identify an office move without replaying an invented confrontation.
for (const [x, z, w, h] of [[-4.8, 5.8, .92, .65], [-4.35, 4.74, .68, .72],
  [4.83, -5.55, .9, .82]]) {
  box(root, "solid unmarked moving box", x, h / 2, z,
    w, h, .75, M.paper, true);
  box(root, "fold in the box lid", x, h + .014, z,
    w + .03, .028, .79, M.mortar);
  curve(root, "tape seam across the box lid", [[x, h + .033, z - .33],
    [x, h + .034, z], [x, h + .033, z + .33]], .012, M.brass);
}
box(root, "solid empty shared work table", 4.7, .72, -3.65,
  1.75, 1.44, .85, M.ink, true);
box(root, "pale work surface", 4.7, 1.46, -3.65,
  1.85, .1, .96, M.paper);
for (const x of [-5.0, 5.0]) {
  box(root, "solid quiet phone-booth alcove", x, 1.58, -6.4,
    1.2, 3.16, 1.28, M.ink, true);
  box(root, "translucent booth door", x * .99, 1.64, -5.72,
    .82, 2.9, .05, M.glass);
}

// Jane is the visual answer to the room's pressure. Oleg and Zephrine remain
// nearby as a family, while Jane's open palms and stance own the moment.
const jane = person("Jane standing up for her family", 0, 3.45, 1.75, {
  skin: M.skin, hair: M.hair, outfit: M.fabric, pants: M.navy,
  bun: true, hands: { "-1": [-.43, 1.03, .34], "1": [.28, 1.51, .48] },
  yaw: 0,
});
person("Oleg beside Jane during the move", -2.05, 1.06, 1.73, {
  skin: M.skin, hair: M.hair, outfit: M.navy, pants: M.ink,
  glasses: true, beard: true, longHair: true,
  hands: { "1": [.28, .9, .42] }, yaw: .22,
});
person("Zephrine kept close to her parents", -1.27, 1.37, 1.05, {
  skin: M.skin, hair: M.zephHair, outfit: M.pink, skirt: M.rose,
  pants: M.olive, dress: true, curls: true,
  hands: { "-1": [-.32, .62, .25] }, yaw: -.12,
});

// A continuous plaster vault replaces floating paper and roof rectangles.
// The broad unbroken sweep carries the move from dark to warm daylight.
const ceilingPositions = [], ceilingColors = [], ceilingUvs = [], ceilingIndices = [];
const shade = new THREE.Color(C.brickLight), light = new THREE.Color(C.paper);
for (let zi = 0; zi <= 24; zi++) for (let xi = 0; xi <= 20; xi++) {
  const x = -6.2 + xi * 12.4 / 20, z = -8.85 + zi * 17.7 / 24;
  const y = 6.0 + .19 * (1 - (x / 6.2) ** 2)
    + .025 * Math.sin(z * 1.6 + x * .3);
  ceilingPositions.push(x, y, z);
  const pigment = shade.clone().lerp(light,
    .13 + .55 * THREE.MathUtils.smoothstep(-z, -6.0, 7.0));
  ceilingColors.push(pigment.r, pigment.g, pigment.b);
  ceilingUvs.push(xi / 20, zi / 24);
}
for (let zi = 0; zi < 24; zi++) for (let xi = 0; xi < 20; xi++) {
  const a = zi * 21 + xi, b = a + 1, c = a + 21, d = c + 1;
  ceilingIndices.push(a, b, c, b, d, c);
}
const ceiling = new THREE.BufferGeometry();
ceiling.setAttribute("position", new THREE.Float32BufferAttribute(ceilingPositions, 3));
ceiling.setAttribute("color", new THREE.Float32BufferAttribute(ceilingColors, 3));
ceiling.setAttribute("uv", new THREE.Float32BufferAttribute(ceilingUvs, 2));
ceiling.setIndex(ceilingIndices); ceiling.computeVertexNormals();
add(root, "one continuous plaster vault over the opened office", ceiling,
  new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .96,
    side: THREE.DoubleSide }));

window.__authorRoom = () => exportRoom({ key: 0xffd1a4, fill: 0xa5c8d0,
  ambient: 1.62, keyPower: 2.15 });
