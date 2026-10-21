import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

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
  zephHair: 0x755b4e, fabric: 0x536880, paper: 0xf5e8d8,
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
for (let i = 0; i < 7; i++) {
  const z = -5.15 + i * 1.55;
  curve(root, "arching linen rib overhead", [[-4.3, 4.2, z],
    [-2.5, 4.87, z + .08], [0, 5.08, z + .12],
    [2.5, 4.87, z + .08], [4.3, 4.2, z]],
  .053, i % 3 ? M.silver : M.rose, 38);
  for (const side of [-1, 1]) {
    const piece = box(root, "overlapping linen sail under the vaulted ceiling",
      side * (1.2 + .07 * i), 4.91, z - .18,
      1.95, .055, .79, i % 2 ? M.silver : M.cream);
    piece.rotation.z = side * .17;
  }
}

// The back wall is a broad daylight opening made of folded panes, not a
// portal to another place. It balances grief on one side and release on the
// other, with no text or medical instruction.
box(root, "pale solid wall behind the quiet chair", 0, 2.56, -5.79,
  8.95, 5.11, .15, M.cream);
for (let i = 0; i < 9; i++) {
  const x = -3.5 + i * .88;
  const h = 2.6 + 1.05 * Math.cos(x * .45);
  box(root, "folded daylight glass", x, 2.25, -5.66,
    .78, h, .045, i < 4 ? M.paleBlue : M.peach);
  box(root, "slim window upright", x + .4, 2.25, -5.59,
    .045, h + .13, .06, M.wood);
}
curve(root, "window arch becoming a new horizon", [[-4.0, 3.85, -5.55],
  [-2.7, 4.54, -5.58], [0, 4.83, -5.6],
  [2.7, 4.54, -5.58], [4.0, 3.85, -5.55]], .075, M.gold, 35);

// Layered woven rug and a few small objects hold the memory at human scale.
const rug = add(root, "solid woven rug under the nursing chair",
  new THREE.CylinderGeometry(2.4, 2.52, .035, 32), M.cream,
  0, .032, .15);
rug.scale.z = .71;
for (let i = 0; i < 5; i++) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.58 + i * .15, .01, 5, 54,
    Math.PI * 2), i % 2 ? M.rose : M.gold);
  arc.name = "woven curved rug line";
  arc.rotation.x = Math.PI / 2; arc.position.set(0, .061, .15);
  arc.scale.z = .71; root.add(arc);
}
for (let i = 0; i < 38; i++) {
  const angle = i * 2.39996, radius = 2.55 + random() * 1.45;
  const x = Math.cos(angle) * radius, z = .15 + Math.sin(angle) * radius * .78;
  petal(root, "small fallen cloth petal", x, .048, z,
    .14 + random() * .11, i % 3 ? M.rose : M.gold, angle);
}
box(root, "solid low side table", 2.48, .38, -.72,
  .83, .76, .72, M.wood, true);
box(root, "folded blanket on a nearby table", 2.48, .79, -.72,
  .65, .08, .52, M.paleBlue);
for (let i = 0; i < 5; i++) curve(root, "small woven blanket fold",
  [[2.18 + i * .12, .84, -.98], [2.18 + i * .12, .86, -.72],
    [2.18 + i * .12, .84, -.46]], .006, M.silver, 12);
box(root, "solid empty ottoman", -2.48, .29, -.76,
  .86, .58, .78, M.blue, true);

// The chair carries the full collision footprint for Jane and Zephrine.
const chair = new THREE.Group(); chair.name = "solid deeply cushioned nursing chair";
chair.position.set(0, 0, .15); root.add(chair);
box(chair, "solid cushioned chair seat and occupied footprint", 0, .54, 0,
  1.62, .18, 1.41, M.wood, true);
for (const side of [-1, 1]) {
  box(chair, "open chair side apron", side * .68, .36, 0,
    .12, .52, 1.3, M.wood, true);
}
loft(chair, "high sculpted upholstered chair back", [[.55, .72, .15, 0, -.55],
  [.92, .8, .19, 0, -.59], [1.48, .74, .2, 0, -.64],
  [1.99, .57, .16, 0, -.68], [2.14, .37, .1, 0, -.68]], M.blue, 15, true);
for (const side of [-1, 1]) {
  loft(chair, "formed upholstered armrest", [[.44, .17, .54, side * .68, .13],
    [.7, .22, .55, side * .71, .11], [.96, .21, .49, side * .72, .08]],
  M.fabric, 10, true);
  beam(chair, "shaped chair leg", [side * .57, 0, -.48],
    [side * .57, .51, -.48], .07, .07, M.wood);
  beam(chair, "shaped chair leg", [side * .57, 0, .46],
    [side * .57, .51, .46], .07, .07, M.wood);
}

// Jane is seated and fully clothed. A sweater panel remains between her and
// Zephrine; there is no anatomy or exposed skin under the neckline.
const jane = new THREE.Group(); jane.name = "fully clothed sculpted Jane nursing Zephrine";
jane.position.set(0, 0, .15); root.add(jane);
loft(jane, "solid clothed seated body", [[.64, .28, .28, 0, .05],
  [.91, .34, .25, 0, .03], [1.21, .29, .21, 0, -.02],
  [1.43, .22, .16, 0, -.04]], M.fabric, 15, true);
box(jane, "continuous modest sweater front", 0, 1.1, .22,
  .5, .58, .035, M.fabric);
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
  [-.37, .91, .38], .1, .075, M.fabric);
beam(jane, "forearm under Zephrine's back", [-.37, .91, .38],
  [.32, .76, .53], .078, .055, M.skin);
beam(jane, "sweater sleeve at the chair arm", [.24, 1.33, -.02],
  [.58, .96, .37], .1, .072, M.fabric);
beam(jane, "open forearm returning to Jane", [.58, .96, .37],
  [.82, .88, .43], .067, .05, M.skin);
loft(jane, "open hand on the chair's edge", [[.83, .033, .034, .82, .43],
  [.9, .05, .04, .82, .43], [.92, .013, .014, .82, .43]], M.skin, 8);
const head = new THREE.Group(); head.name = "Jane's quiet face looking toward Zephrine";
head.position.set(-.03, 0, -.06); head.rotation.z = -.07; jane.add(head);
loft(head, "carved face and jaw", [[1.41, .06, .06], [1.5, .145, .12],
  [1.68, .17, .145], [1.86, .15, .13], [1.98, .02, .02]], M.skin, 15);
for (const side of [-1, 1]) {
  add(head, "soft downturned eye", new THREE.SphereGeometry(.021, 7, 6),
    M.paper, side * .066, 1.74, .143);
  add(head, "dark iris", new THREE.SphereGeometry(.01, 7, 5),
    M.ink, side * .066, 1.732, .163);
  curve(head, "gentle brow", [[side * .027, 1.795, .15],
    [side * .075, 1.789, .157], [side * .11, 1.795, .14]], .007, M.hair);
}
loft(head, "small sculpted nose", [[1.59, .016, .018, 0, .15],
  [1.73, .026, .029, 0, .17], [1.745, .008, .008, 0, .15]], M.skin, 8);
curve(head, "tender mixed expression", [[-.046, 1.55, .12],
  [0, 1.54, .133], [.046, 1.55, .12]], .009, M.rose);
loft(head, "layered dark hair", [[1.87, .1, .08],
  [1.96, .17, .14, 0, -.02], [2.06, .13, .1, 0, -.035],
  [2.1, .02, .02, 0, -.035]], M.hair, 14);
loft(head, "Jane's familiar high bun", [[2.05, .06, .05, 0, -.08],
  [2.17, .13, .11, 0, -.09], [2.28, .075, .07, 0, -.09],
  [2.31, .01, .01, 0, -.09]], M.hair, 12);

// A small fully sculpted, clothed Zephrine leans across Jane's lap. Turning
// the whole figure keeps the face, curls, hands, dress, and shoes dimensional
// from every angle instead of making the child a side-view cutout or oval.
const child = person("Zephrine nestled at Jane's clothed chest", .64, .47, 1.07, {
  skin: M.skin, hair: M.zephHair, outfit: M.peach, skirt: M.rose,
  pants: M.blue, shoes: M.rose, dress: true, curls: true,
  hands: { "-1": [-.27, .72, .2], "1": [.31, .63, .17] },
});
child.position.y = .61;
child.rotation.z = .87;
child.scale.setScalar(.9);

// A ribbon of small enclosed shapes returns to Jane's open side: sorrow is
// present, but the composition leaves her room to move forward as herself.
for (let i = 0; i < 7; i++) {
  const x = .8 + i * .43, y = 1.2 + i * .36, z = -.2 - i * .29;
  curve(root, "loosening thread from the chair into new space",
    [[.6, .96, .28], [x, y, z], [x + .36, y + .33, z - .27]],
    .009, i % 2 ? M.rose : M.gold, 17);
  petal(root, "folded leaf of grief and freedom", x + .36,
    y + .33, z - .27, .17 + i * .015,
    i % 2 ? M.gold : M.paper, i * .8);
}

window.__authorRoom = () => exportRoom({ key: 0xffd6bc,
  fill: 0xa5bac9, ambient: 1.7, keyPower: 1.85 });
