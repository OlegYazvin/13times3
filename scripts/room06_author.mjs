import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";
import { addJanePortrait } from "./oleg_portrait.mjs";

// A private transition rendered with tenderness. Jane's sweater covers her
// chest completely; Zephrine is nestled against the outside of the cloth.
// The moment is maternal, nonsexual, still, and without invented biographical
// details such as a date or a last-feed conversation.
const C = {
  sky: 0xaaa7b6, ground: 0xc8b6b7, dusk: 0x797994,
  shadow: 0x545774, blue: 0x5b738a, paleBlue: 0x9eb3b9,
  peach: 0xe5b1a1, rose: 0xcb8f9a, cream: 0xf2dec9,
  gold: 0xdfb884, silver: 0xe2d7d1, wood: 0x786e75,
  ink: 0x373d52, skin: 0xd9a58d, hair: 0x46373b,
  zephHair: 0x755b4e, fabric: 0x536880, sweater: 0x9a6879,
  paper: 0xf5e8d8,
};
const art = createRoomArt({ index: 5,
  title: "Jane and Zephrine at the tender end of breastfeeding",
  width: 9.4, height: 5.2, depth: 11.8, colors: C, seed: 606606 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky();
ground(C.ground, (x, z) => {
  const warmth = THREE.MathUtils.smoothstep(x * .85 - z * .08, -3.5, 3.8);
  return new THREE.Color(C.dusk).lerp(new THREE.Color(C.peach), warmth * .65);
});

// A vaulted fabric sanctuary is intentionally unlike the office, orchard,
// stage or street. Folded cloth panels give the walls actual depth.
for (const side of [-1, 1]) {
  const wallPositions = [], wallUvs = [], wallIndices = [];
  for (let zi = 0; zi <= 24; zi++) for (let yi = 0; yi <= 8; yi++) {
    const z = -5.78 + zi * 11.56 / 24;
    const y = yi * 4.35 / 8;
    const x = side * (4.47 - .09 * Math.sin(z * 2.15 + y * .4)
      * Math.sin(Math.PI * yi / 8));
    wallPositions.push(x, y, z);
    wallUvs.push(zi / 24, yi / 8);
  }
  for (let zi = 0; zi < 24; zi++) for (let yi = 0; yi < 8; yi++) {
    const a = zi * 9 + yi, b = a + 1, c = a + 9, d = c + 1;
    wallIndices.push(a, b, c, b, d, c);
  }
  const drapery = new THREE.BufferGeometry();
  drapery.setAttribute("position", new THREE.Float32BufferAttribute(wallPositions, 3));
  drapery.setAttribute("uv", new THREE.Float32BufferAttribute(wallUvs, 2));
  drapery.setIndex(wallIndices); drapery.computeVertexNormals();
  add(root, "continuous gathered fabric side wall", drapery,
    side < 0 ? M.paleBlue : M.rose);
  for (let i = 0; i < 7; i++) {
    const z = -5.35 + i * 1.74;
    const pleat = loft(root, "sculpted vertical fabric wall pleat",
      [[0, .13, .17, side * 4.46, z],
        [1.0, .2, .2, side * 4.43, z + .04],
        [2.7, .18, .22, side * 4.41, z - .05],
        [4.4, .11, .13, side * 4.35, z]],
      i % 3 ? M.dusk : M.blue, 9, true);
    pleat.userData.solidFootprint = true;
    curve(root, "fine edge of the fabric fold", [[side * 4.35, .2, z + .12],
      [side * 4.27, 2.3, z + .14], [side * 4.32, 4.42, z + .11]],
    .018, i % 2 ? M.silver : M.rose);
  }
}
// Sew the vault into continuous curved panels. The former separate flat
// rectangles left sky-colored gaps and read as scaffolding from the doorway.
const vaultY = (x, z) => 4.12 + .9 * (1 - (x / 4.4) ** 2)
  + .035 * Math.sin(z * 1.7 + x * .65);
for (let panel = 0; panel < 8; panel++) {
  const x0 = -4.4 + panel * 1.1, x1 = x0 + 1.1;
  const positions = [], uvs = [], indices = [];
  for (let zi = 0; zi <= 18; zi++) for (let xi = 0; xi <= 4; xi++) {
    const x = x0 + (x1 - x0) * xi / 4;
    const z = -5.78 + zi * 11.56 / 18;
    positions.push(x, vaultY(x, z), z);
    uvs.push(xi / 4, zi / 18);
  }
  for (let zi = 0; zi < 18; zi++) for (let xi = 0; xi < 4; xi++) {
    const a = zi * 5 + xi, b = a + 1, c = a + 5, d = c + 1;
    indices.push(a, b, c, b, d, c);
  }
  const fabric = new THREE.BufferGeometry();
  fabric.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  fabric.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  fabric.setIndex(indices); fabric.computeVertexNormals();
  add(root, "continuous gathered linen vault panel", fabric,
    panel % 3 === 1 ? M.silver : M.cream);
  if (panel > 0) {
    const x = x0;
    curve(root, "stitched lengthwise vault seam",
      Array.from({ length: 9 }, (_, i) => {
        const z = -5.68 + i * 1.42;
        return [x, vaultY(x, z) - .018, z];
      }), .011, panel % 2 ? M.rose : M.gold, 48);
  }
}
for (let i = 0; i < 6; i++) {
  const z = -4.9 + i * 1.9;
  curve(root, "gently arched transverse fabric seam",
    Array.from({ length: 13 }, (_, j) => {
      const x = -4.3 + j * 8.6 / 12;
      return [x, vaultY(x, z) - .015, z];
    }), .016, i % 2 ? M.silver : M.rose, 48);
}

// The back wall is a broad daylight opening made of folded panes, not a
// portal to another place. It balances grief on one side and release on the
// other, with no text or medical instruction.
box(root, "pale solid wall behind the quiet chair", 0, 2.56, -5.79,
  8.95, 5.11, .15, M.cream);
for (let i = 0; i < 9; i++) {
  const x = -3.5 + i * .88;
  const h = 2.6 + 1.05 * Math.cos(x * .45);
  const pane = new THREE.Shape();
  pane.moveTo(-.36, 0); pane.lineTo(.36, 0);
  pane.lineTo(.36, h - .4);
  pane.quadraticCurveTo(.33, h - .16, 0, h);
  pane.quadraticCurveTo(-.33, h - .16, -.36, h - .4);
  pane.closePath();
  add(root, "tall arched stained daylight pane",
    new THREE.ExtrudeGeometry(pane,
      { depth: .035, bevelEnabled: false, curveSegments: 8 }),
    i < 4 ? M.paleBlue : M.peach, x, .73, -5.66);
  curve(root, "lead line around arched daylight pane",
    [[x - .36, .73, -5.6], [x - .36, .73 + h - .4, -5.6],
      [x, .73 + h, -5.6], [x + .36, .73 + h - .4, -5.6],
      [x + .36, .73, -5.6]], .018, M.wood, 24);
}
curve(root, "window arch becoming a new horizon", [[-4.0, 3.85, -5.55],
  [-2.7, 4.54, -5.58], [0, 4.83, -5.6],
  [2.7, 4.54, -5.58], [4.0, 3.85, -5.55]], .075, M.gold, 35);

// Layered woven rug and a few small objects hold the memory at human scale.
const memoryZ=2.0;
const rug = add(root, "solid woven rug under the nursing chair",
  new THREE.CylinderGeometry(2.4, 2.52, .035, 32), M.cream,
  0, .032, .15+memoryZ);
rug.scale.z = .71;
for (let i = 0; i < 5; i++) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.58 + i * .15, .01, 5, 54,
    Math.PI * 2), i % 2 ? M.rose : M.gold);
  arc.name = "woven curved rug line";
  arc.rotation.x = Math.PI / 2; arc.position.set(0, .061, .15+memoryZ);
  arc.scale.z = .71; root.add(arc);
}
box(root, "solid low side table", 2.48, .38, -.72+memoryZ,
  .83, .76, .72, M.wood, true);
box(root, "folded blanket on a nearby table", 2.48, .79, -.72+memoryZ,
  .65, .08, .52, M.paleBlue);
for (let i = 0; i < 5; i++) curve(root, "small woven blanket fold",
  [[2.18 + i * .12, .84, -.98+memoryZ],
    [2.18 + i * .12, .86, -.72+memoryZ],
    [2.18 + i * .12, .84, -.46+memoryZ]], .006, M.silver, 12);
box(root, "solid empty ottoman", -2.48, .29, -.76+memoryZ,
  .86, .58, .78, M.blue, true);

// The chair carries the full collision footprint for Jane and Zephrine.
const chair = new THREE.Group(); chair.name = "solid deeply cushioned nursing chair";
chair.position.set(0, 0, .15+memoryZ); root.add(chair);
loft(chair, "solid soft tailored chair seat and occupied footprint",
  [[.43, .69, .59, 0, -.03], [.52, .81, .68, 0, -.02],
    [.61, .77, .64, 0, -.035], [.66, .58, .5, 0, -.06]],
  M.fabric, 24, true);
for (const side of [-1, 1]) {
  box(chair, "short inset chair side apron", side * .59, .32, -.13,
    .075, .26, .92, M.wood, true);
}
loft(chair, "high sculpted upholstered chair back", [[.55, .66, .15, 0, -.55],
  [.92, .75, .19, 0, -.59], [1.45, .69, .2, 0, -.64],
  [1.78, .48, .16, 0, -.68], [1.89, .29, .1, 0, -.68]], M.blue, 19, true);
for (const side of [-1, 1]) {
  loft(chair, "formed upholstered armrest", [[.44, .17, .54, side * .68, .13],
    [.7, .22, .55, side * .71, .11], [.96, .21, .49, side * .72, .08]],
  M.fabric, 10, true);
  beam(chair, "shaped chair leg", [side * .57, 0, -.48],
    [side * .57, .51, -.48], .07, .07, M.wood);
  beam(chair, "shaped chair leg", [side * .57, 0, .46],
    [side * .57, .51, .46], .07, .07, M.wood);
}
for (let i = -2; i <= 2; i++) {
  curve(chair, "upholstery seam following the chair back",
    [[i * .13, .81, -.39], [i * .14, 1.19, -.42],
      [i * .115, 1.52, -.48], [i * .08, 1.78, -.57]],
    .009, i % 2 ? M.paleBlue : M.silver, 18);
}

// Jane is seated and fully clothed. A sweater panel remains between her and
// Zephrine; there is no anatomy or exposed skin under the neckline.
const jane = new THREE.Group(); jane.name = "fully clothed sculpted Jane nursing Zephrine";
jane.position.set(0, 0, .15+memoryZ); root.add(jane);
loft(jane, "solid clothed seated body", [[.64, .28, .28, 0, .05],
  [.91, .34, .25, 0, .03], [1.21, .29, .21, 0, -.02],
  [1.43, .22, .16, 0, -.04]], M.sweater, 15, true);
box(jane, "continuous modest sweater front", 0, 1.1, .22,
  .5, .58, .035, M.sweater);
curve(jane, "closed sweater neckline", [[-.17, 1.39, .12],
  [0, 1.35, .19], [.17, 1.39, .12]], .017, M.silver);
for (const side of [-1, 1]) {
  beam(jane, "clothed thigh resting on chair", [side * .16, .71, .13],
    [side * .19, .53, .5], .16, .14, M.shadow);
  beam(jane, "lower leg by the chair", [side * .19, .53, .5],
    [side * .2, .14, .64], .13, .11, M.shadow);
  box(jane, "solid soft house shoe", side * .2, .075, .76,
    .27, .15, .35, M.wood);
}
beam(jane, "sweater sleeve supporting Zephrine", [-.25, 1.33, -.02],
  [-.37, .91, .38], .1, .075, M.sweater);
beam(jane, "forearm under Zephrine's back", [-.37, .91, .38],
  [.32, .76, .53], .078, .055, M.skin);
beam(jane, "sweater sleeve at the chair arm", [.24, 1.33, -.02],
  [.58, .96, .37], .1, .072, M.sweater);
beam(jane, "open forearm returning to Jane", [.58, .96, .37],
  [.82, .88, .43], .067, .05, M.skin);
loft(jane, "open hand on the chair's edge", [[.83, .033, .034, .82, .43],
  [.9, .05, .04, .82, .43], [.92, .013, .014, .82, .43]], M.skin, 8);
const head = new THREE.Group(); head.name = "Jane's quiet face looking toward Zephrine";
head.position.set(-.03, 0, -.06); head.rotation.z = -.07; jane.add(head);
loft(head, "carved face and jaw", [[1.41, .06, .06], [1.5, .145, .12],
  [1.68, .17, .145], [1.86, .15, .13], [1.98, .02, .02]], M.skin, 15);
addJanePortrait(head,1.84,[[-.43,.06,.06],[-.34,.145,.12],
  [-.16,.17,.145],[.02,.15,.13],[.14,.02,.02]],M.skin);
loft(head, "layered dark hair", [[1.87, .1, .08],
  [1.96, .17, .14, 0, -.02], [2.06, .13, .1, 0, -.035],
  [2.1, .02, .02, 0, -.035]], M.hair, 14);
loft(head, "Jane's familiar high bun", [[2.05, .06, .05, 0, -.08],
  [2.17, .13, .11, 0, -.09], [2.28, .075, .07, 0, -.09],
  [2.31, .01, .01, 0, -.09]], M.hair, 12);

// A small fully sculpted, clothed Zephrine leans across Jane's lap. Turning
// the whole figure keeps the face, curls, hands, dress, and shoes dimensional
// from every angle instead of making the child a side-view cutout or oval.
const child = person("Zephrine nestled at Jane's clothed chest", .64, .47+memoryZ, 1.07, {
  skin: M.skin, hair: M.zephHair, outfit: M.peach, skirt: M.rose,
  pants: M.blue, shoes: M.rose, dress: true, curls: true,
  hands: { "-1": [-.27, .72, .2], "1": [.31, .63, .17] },
});
child.position.y = .61;
child.rotation.z = .87;
child.scale.setScalar(.9);

window.__authorRoom = () => exportRoom();
