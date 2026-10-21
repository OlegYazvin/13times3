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
  const x = i * 1.09;
  const tall = 2.0 + 1.2 * Math.cos(i * .35);
  box(root, "tall abstract window of possibility", x, 2.7,
    -8.61, .9, tall, .06, i % 2 ? M.paleGlass : M.paper);
  box(root, "warm narrow stone mullion", x + .49, 2.75,
    -8.54, .065, tall + .16, .09, M.brass);
}

// Heavy inward-leaning ribs at the near end release into a wide open arch.
// They are architectural resistance, not portraits of real people.
for (let row = 0; row < 4; row++) {
  const z = 5.9 - row * 3.5;
  const spread = 3.55 + row * .52;
  for (const side of [-1, 1]) {
    loft(root, "solid irregular brick column opening outward", [[0, .3, .25,
      side * spread, z], [1.2, .25, .24, side * (spread - .15 + row * .07), z],
      [3.4, .21, .2, side * (spread - .45 + row * .15), z - .09],
      [5.38, .15, .15, side * (spread - .18 + row * .2), z - .18]],
    row < 2 ? M.brick : M.brickLight, 10, true);
    for (let band = 1; band < 5; band++) {
      const y = band * 1.02;
      box(root, "mortar course on the old brick rib",
        side * (spread - .24 + row * .1), y, z - .05,
        .49, .045, .51, M.mortar);
    }
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
for (let i = 0; i < 18; i++) {
  const z = -7.6 + i * .9;
  const page = box(root, "unwritten pale paper tile underfoot",
    -2.25 + .15 * Math.sin(i * .8), .045, z,
    .13 + random() * .08, .011, .17, i % 3 ? M.paper : M.brass);
  page.rotation.y = .25 * Math.sin(i);
}

// Abstract dark shutters stand behind the family at one side. Their strips
// bend toward a bright, open fan behind Jane and carry no words or faces.
for (let i = 0; i < 9; i++) {
  const x = 2.8 + i * .25, z = 4.2 - i * .85;
  const shutter = box(root, "empty rigid office shutter without a person",
    x, 2.65, z, .1, 3.55 + i * .09, .54, i % 3 ? M.ink : M.brick, true);
  shutter.rotation.z = -.09 - i * .025;
}
for (let i = 0; i < 13; i++) {
  const a = -1.32 + i * .22;
  const near = [0, 1.95, -.2];
  const far = [Math.sin(a) * 4.9, 4.66 + .5 * Math.cos(a), -2.7];
  const ribbon = curve(root, "folded gold light spreading from Jane's resolve",
    [near, [Math.sin(a) * 1.7, 3.25, -1.2], far],
    .025, i % 3 ? M.brass : M.amber, 24);
  ribbon.userData.decorative = true;
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
const jane = person("Jane standing up for her family", 0, 1.65, 1.75, {
  skin: M.skin, hair: M.hair, outfit: M.fabric, pants: M.navy,
  bun: true, hands: { "-1": [-.72, 1.5, .26], "1": [.72, 1.55, .26] },
  yaw: 0,
});
curve(root, "open arc held above Jane's shoulders", [[-.74, 1.63, 1.96],
  [0, 2.05, 1.98], [.74, 1.66, 1.96]], .02, M.amber);
person("Oleg beside Jane during the move", -2.05, -.74, 1.73, {
  skin: M.skin, hair: M.hair, outfit: M.navy, pants: M.ink,
  glasses: true, beard: true, longHair: true,
  hands: { "1": [.28, .9, .42] }, yaw: .22,
});
person("Zephrine kept close to her parents", -1.27, -.43, 1.05, {
  skin: M.skin, hair: M.zephHair, outfit: M.pink, skirt: M.rose,
  pants: M.olive, dress: true, curls: true,
  hands: { "-1": [-.32, .62, .25] }, yaw: -.12,
});

// The ceiling breaks into folded paper windows and soaring leaves on the
// open side. They give the feeling of release without a literal victory sign.
for (let i = 0; i < 34; i++) {
  const x = (random() - .5) * 10.8, z = -7.5 + random() * 10.2;
  const y = 4.54 + random() * 1.23;
  petal(root, "paper leaf caught in the new air", x, y, z,
    .23 + random() * .23, i % 4 ? M.paper : M.amber, random() * 6.28);
}
for (let i = 0; i < 9; i++) {
  const x = -4.4 + i * 1.08;
  const z = -6.6 + .36 * Math.cos(i * .6);
  box(root, "tall warm folded skylight", x, 6.31, z,
    .77, .04, 1.54, i % 2 ? M.paper : M.amber);
}

window.__authorRoom = () => exportRoom({ key: 0xffd1a4, fill: 0xa5c8d0,
  ambient: 1.62, keyPower: 2.15 });
