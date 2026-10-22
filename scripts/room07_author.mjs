import * as THREE from "three";
import { foliageLobe } from "./sculpted_foliage.mjs";
import { createRoomArt } from "./room_art.mjs";

// Blueberries of Indiana, near La Porte, becomes an expansive summer field
// of low bushes and deep-blue fruit. G helps Zephrine pick; Zephrine rides
// on Oleg's shoulders. This is not frame 09's autumn apple orchard.
const C = {
  sky: 0xadcbd0, ground: 0xa6b7a0, grass: 0x7b9f7c,
  deepGrass: 0x4f7568, leaf: 0x668969, paleLeaf: 0xa3b995,
  bark: 0x665a58, berry: 0x334b85, berryLight: 0x5f74a8,
  berryDark: 0x292f5f, bloom: 0xb6c5d2, gold: 0xe2c58d,
  cream: 0xf2e5cd, paper: 0xf5eada, linen: 0xe8dbcc,
  ink: 0x39475b, skin: 0xd5a184, hair: 0x3f3536,
  gHair: 0x60494a, zephHair: 0x755448, fabric: 0x425f84,
  rose: 0xd48d8b, peach: 0xdab19d, warm: 0xbf9374,
};
const art = createRoomArt({ index: 6,
  title: "G shows Zephrine blueberries while Oleg carries her high",
  width: 12.8, height: 15.0, depth: 16.6, colors: C, seed: 707707 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky(C.sky, true);
ground(C.ground, (x, z) => {
  const path = Math.exp(-Math.pow((x - .23 * Math.sin(z * .4)) / 1.45, 2));
  return new THREE.Color(C.grass).lerp(new THREE.Color(C.linen), path * .68);
});

// The far horizon is a sequence of folded field ridges, not a fabricated
// farm building. No date, cultivar or exact row is claimed by the scene.
for (let layer = 0; layer < 3; layer++) {
  const shape = new THREE.Shape();
  shape.moveTo(-6.4, 0);
  for (let i = 0; i <= 14; i++) {
    const x = -6.4 + i * .92;
    const y = 1.0 + layer * .43 + .35 * Math.sin(i * .72 + layer * .8)
      + .12 * Math.sin(i * 1.9);
    shape.lineTo(x, y);
  }
  shape.lineTo(6.4, 0); shape.closePath();
  add(root, "folded distant blueberry-field horizon",
    new THREE.ExtrudeGeometry(shape, { depth: .08, bevelEnabled: false }),
    layer === 0 ? M.deepGrass : layer === 1 ? M.leaf : M.paleLeaf,
    0, 0, -8.2 + layer * .25);
}
for (const side of [-1, 1]) {
  curve(root, "natural lane edge through low rows",
    [[side * 1.35, .05, 8.0], [side * 1.47, .05, 4.8],
      [side * 1.36, .05, 1.0], [side * 1.55, .05, -2.5],
      [side * 1.48, .05, -7.8]], .022, M.gold, 49);
}

const berryGeometry = new THREE.SphereGeometry(.055, 7, 5);
function blueberry(parent, x, y, z, light = false) {
  const berry = add(parent, "small round blueberry with pale bloom",
    berryGeometry, light ? M.berryLight : M.berry, x, y, z);
  berry.userData.batchPetal = true;
  const calyx = petal(parent, "tiny pointed blueberry calyx", x - .02,
    y + .046, z + .037, .055, M.berryDark, .6);
  calyx.userData.batchPetal = true;
}
function bush(x, z, height = 1.45, central = false) {
  const group = new THREE.Group(); group.name = central
    ? "solid high blueberry bush G points out to Zephrine"
    : "solid rounded blueberry shrub along a summer row";
  group.position.set(x, 0, z); root.add(group);
  loft(group, "solid branching bush crown and stems", [[0, .18, .18],
    [.34, .21, .19], [height * .65, .12, .13],
    [height, .045, .05]], M.bark, 10, true);
  for (let arm = 0; arm < 5; arm++) {
    const angle = arm * Math.PI * 2 / 5 + .25 * Math.sin(z);
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const span = central ? 1.2 : .73 + .22 * random();
    const tipY = height * (.7 + random() * .33);
    curve(group, "arching branch carrying blueberries",
      [[0, .38, 0], [dx * span * .48, height * .77, dz * span * .48],
        [dx * span, tipY, dz * span]], .036, M.bark, 18);
    foliageLobe(group, "thick blueberry leaves surrounding the fruiting branch",
      dx * span * .65, tipY - .04, dz * span * .65,
      .36, .18, .31, arm % 2 ? C.leaf : C.paleLeaf, z * 2 + arm);
    for (let leafIndex = 0; leafIndex < 9; leafIndex++) {
      const t = .34 + random() * .66;
      const xx = dx * span * t + (random() - .5) * .28;
      const zz = dz * span * t + (random() - .5) * .29;
      petal(group, "overlapping cut-paper blueberry leaf", xx,
        height * (.71 + .2 * Math.sin(t * 2.5)) + (random() - .5) * .28,
        zz, .19 + random() * .14,
        leafIndex % 4 ? M.leaf : M.paleLeaf, angle + random() * .6);
    }
    for (let fruit = 0; fruit < 4; fruit++) {
      const t = .6 + random() * .35;
      blueberry(group, dx * span * t + (random() - .5) * .15,
        height * (.7 + .18 * Math.sin(t * 2.4)) - .04 - fruit * .025,
        dz * span * t + (random() - .5) * .17,
        fruit % 3 === 0);
    }
  }
  return group;
}
for (const side of [-1, 1]) for (const offset of [2.65, 4.75]) {
  for (let i = 0; i < 5; i++) {
    const z = -6.8 + i * 3.35 + (offset > 3 ? 1.18 : 0);
    bush(side * offset, z, 1.15 + .28 * Math.sin(i * 1.9 + offset));
  }
}
bush(.95, -.45, 2.18, true);
// This single low bough gives Zephrine something she can actually reach from
// Oleg's shoulders. The shrub roots outside the walking lane; its fruit hangs
// at her hand height instead of floating somewhere across the field.
{
  const reach=new THREE.Group();reach.name="fruiting blueberry bough beside Zephrine";
  reach.position.set(1.75,0,2.62);root.add(reach);
  const stem=loft(reach,"solid rooted blueberry shrub beside the family",
    [[0,.14,.13],[.42,.13,.12],[.96,.09,.085],
      [1.42,.045,.045]],M.bark,12,true);
  stem.userData.solidFootprint=true;
  curve(reach,"bent woody branch ending at Zephrine's reaching hand",
    [[0,.85,0],[-.31,1.32,-.04],[-.88,1.74,-.08],
      [-1.58,1.88,-.04]],.043,M.bark,24);
  for(let i=0;i<13;i++) {
    const t=.19+i/15;
    const x=-.32-t*1.34,z=-.05+.07*Math.sin(i*1.8);
    const y=1.27+.59*Math.sin(t*Math.PI*.65);
    const side=i%2?-1:1;
    const leaf=petal(reach,"veined leaf on Zephrine's reachable bough",
      x+side*.075,y+.035,z+side*.065,
      .17+random()*.08,i%3?M.leaf:M.paleLeaf,side*.48);
    leaf.rotation.z=side*.35;
  }
  for(let cluster=0;cluster<4;cluster++) {
    const x=-1.14-cluster*.12,z=-.06+(cluster%2)*.08;
    curve(reach,"tiny blueberry fruiting pedicel",
      [[x,1.89,z],[x-.035,1.75-cluster*.025,z+.03]],
      .009,M.bark,8);
    for(let b=0;b<3;b++) blueberry(reach,
      x+(b-1)*.064,1.73-cluster*.025-(b%2)*.065,
      z+.04+b*.025,b===1);
  }
}

// Jane shares the outing; Oleg, G and Zephrine are the central memory.
const oleg = person("Oleg with Zephrine on his shoulders", -.58, 3.12, 1.75, {
  skin: M.skin, hair: M.hair, outfit: M.fabric, pants: M.ink,
  glasses: true, beard: true, longHair: true,
  hands: { "-1": [-.2, 1.43, -.19], "1": [.2, 1.43, -.19] }, yaw: -.14,
});
const zeph = person("Zephrine picking her own blueberries up high",
  -.58, 2.86, 1.04, {
    skin: M.skin, hair: M.zephHair, outfit: M.rose, skirt: M.peach,
    pants: M.fabric, dress: true, curls: true,
    hands: { "1": [.66, .67, -.38], "-1": [-.29, .66, .15] }, yaw: -.1,
  });
zeph.position.y = 1.39; zeph.scale.setScalar(.72);
const g = person("G helping Zephrine discover blueberries", 2.0, 3.05, 1.62, {
  skin: M.skin, hair: M.gHair, outfit: M.cream, pants: M.ink,
  hands: { "-1": [-.66, 1.07, -.28], "1": [.3, .88, .24] }, yaw: .27,
});
person("Jane enjoying the blueberry outing", -2.54, 1.33, 1.68, {
  skin: M.skin, hair: M.hair, outfit: M.paleLeaf, pants: M.ink,
  bun: true, hands: { "1": [.4, .8, .36] }, yaw: -.28,
});

// One woven picking pail and bright fruit connect the family with the field.
const pail = new THREE.Group(); pail.name = "solid woven berry picking pail";
pail.position.set(2.4, 0, 3.84); root.add(pail);
const basket = add(pail, "solid small woven pail",
  new THREE.CylinderGeometry(.31, .25, .45, 12, 1, true), M.linen,
  0, .29, 0);
basket.userData.solidFootprint = true;
for (let stripe = 0; stripe < 5; stripe++) {
  const ring = add(pail, "woven band around berry pail",
    new THREE.TorusGeometry(.29 - stripe * .006, .01, 5, 18), M.bark,
    0, .14 + stripe * .08, 0);
  ring.rotation.x = Math.PI / 2;
}
curve(pail, "arched carrying handle", [[-.3, .5, 0],
  [-.15, .8, 0], [0, .86, 0], [.15, .8, 0], [.3, .5, 0]], .025, M.bark);
for (let i = 0; i < 10; i++) {
  const a = i * Math.PI * 2 / 10;
  blueberry(pail, Math.cos(a) * .19, .53 + .035 * (i % 3),
    Math.sin(a) * .18, i % 3 === 0);
}

// Blueberry bushes are low. Let the summer sky remain truly open above the
// field rather than suspending branch-and-leaf strips across the walking path.

window.__authorRoom = () => exportRoom({ key: 0xffdfb2,
  fill: 0xa1d4df, ambient: 1.68, keyPower: 2.0 });
