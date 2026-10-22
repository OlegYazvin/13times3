import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

// Blueberries of Indiana, near La Porte, becomes an expansive summer field
// of adult-height or taller bushes and deep-blue fruit (plant scale correction pending). G helps Zephrine pick; Zephrine rides
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

const berryGeometry = new THREE.SphereGeometry(.024, 12, 8);
const leafGeometry = (() => {
  const positions = [], uv = [], indices = [];
  const rows = 8;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const half = .17 * Math.pow(Math.sin(Math.PI * t), .82)
      * (1 + .026 * Math.sin(t * 17));
    for (const side of [-1, 0, 1]) {
      positions.push(side * half, t,
        .06 * Math.sin(Math.PI * t) * (1 - Math.abs(side) * .65));
      uv.push((side + 1) / 2, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let side = 0; side < 2; side++) {
    const a = row * 3 + side, b = a + 3;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
})();
function blueberryLeaf(parent, start, tip, width, material) {
  const from = new THREE.Vector3(...start), to = new THREE.Vector3(...tip);
  const direction = to.clone().sub(from);
  const leaf = new THREE.Mesh(leafGeometry, material);
  leaf.name = "shaped blueberry leaf growing from a twig";
  leaf.position.copy(from);
  leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  leaf.scale.set(width / .17, direction.length(), width / .17);
  parent.add(leaf);
}
function blueberry(parent, x, y, z, light = false) {
  const berry = add(parent, "small round blueberry with pale bloom",
    berryGeometry, light ? M.berryLight : M.berry, x, y, z);
  berry.userData.batchPetal = true;
  const calyx = petal(parent, "tiny pointed blueberry calyx", x - .012,
    y + .021, z + .013, .012, M.berryDark, .6);
  calyx.userData.batchPetal = true;
}
function bush(x, z, height = 1.45, central = false) {
  const group = new THREE.Group(); group.name = central
    ? "solid high blueberry bush G points out to Zephrine"
    : "solid rounded blueberry shrub along a summer row";
  group.position.set(x, 0, z); root.add(group);
  loft(group, "solid branching bush crown and stems", [[0, .032, .03],
    [.24, .026, .022], [height * .65, .021, .022],
    [height, .009, .009]], M.bark, 10, true);
  for (let arm = 0; arm < 7; arm++) {
    const angle = arm * Math.PI * 2 / 7 + .25 * Math.sin(z);
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const span = central ? 1.2 : .73 + .22 * random();
    const tipY = height * (.7 + random() * .33);
    const branchPoints=[[dx*.12, .02, dz*.12], [dx * span * .48, height * .57, dz * span * .48],
        [dx * span, tipY, dz * span]];
    const branchCurve=new THREE.CatmullRomCurve3(branchPoints.map(p=>new THREE.Vector3(...p)));
    curve(group, "arching branch carrying blueberries",branchPoints,.016,M.bark,18);
    // Earlier broad foliage lobes hid all of the branch and leaf work and
    // turned each shrub into a stack of oval trays. Let the leaves themselves
    // make the canopy; their small stems stay visibly attached to the wood.
    const acrossX = -dz, acrossZ = dx;
    for (let leafIndex = 0; leafIndex < 18; leafIndex++) {
      const t = .22 + leafIndex * .04;
      const side = leafIndex % 2 ? -1 : 1;
      const base = branchCurve.getPoint(t).toArray();
      const stem = [base[0] + acrossX * side * .046, base[1] + .014,
        base[2] + acrossZ * side * .046];
      beam(group, "fine woody stem holding a blueberry leaf", base, stem,
        .009, .005, M.bark, 6);
      const tip = [stem[0] + acrossX * side * (.085 + .012 * (leafIndex % 3)) + dx * .045,
        stem[1] + .06 + .012 * (leafIndex % 2),
        stem[2] + acrossZ * side * (.085 + .012 * (leafIndex % 3)) + dz * .045];
      blueberryLeaf(group, stem, tip, .044 + .006 * (leafIndex % 3),
        leafIndex % 3 ? M.leaf : M.paleLeaf);
    }
    for (let cluster = 0; cluster < 2; cluster++) {
      const t = .7 + cluster * .18;
      const stem = branchCurve.getPoint(t).toArray();
      for (let fruit = 0; fruit < 3; fruit++) {
        const side = fruit - 1;
        const berryAt = [stem[0] + acrossX * side * .058 + dx * .035,
          stem[1] - .09 - fruit * .018,
          stem[2] + acrossZ * side * .058 + dz * .035];
        beam(group, "short pedicel connecting blueberry to branch", stem,
          [berryAt[0], berryAt[1] + .029, berryAt[2]], .006, .003, M.bark, 6);
        blueberry(group, ...berryAt, fruit % 3 === 0);
      }
    }
  }
  return group;
}
for (const side of [-1, 1]) for (const offset of [2.65, 4.75]) {
  for (let i = 0; i < 5; i++) {
    const z = -6.8 + i * 3.35 + (offset > 3 ? 1.18 : 0);
    bush(side * offset, z, .78 + .18 * Math.sin(i * 1.9 + offset));
  }
}
bush(.95, -.45, 1.65, true);
// This single low bough gives Zephrine something she can actually reach from
// Oleg's shoulders. The shrub roots outside the walking lane; its fruit hangs
// at her hand height instead of floating somewhere across the field.
{
  const reach=new THREE.Group();reach.name="fruiting blueberry bough beside Zephrine";
  reach.position.set(1.35,0,2.85);root.add(reach);
  const stem=loft(reach,"solid rooted blueberry shrub beside the family",
    [[0,.045,.043],[.42,.037,.035],[.96,.026,.025],
      [1.42,.012,.012]],M.bark,12,true);
  stem.userData.solidFootprint=true;
  curve(reach,"bent woody branch ending at Zephrine's reaching hand",
    [[0,.85,0],[-.31,1.32,-.04],[-.88,1.74,-.08],
      [-1.58,1.88,-.04]],.023,M.bark,24);
  const fruitingCurve=new THREE.CatmullRomCurve3([[0,.85,0],[-.31,1.32,-.04],[-.88,1.74,-.08],[-1.58,1.88,-.04]].map(p=>new THREE.Vector3(...p)));
  for(let i=0;i<30;i++) {
    const point=fruitingCurve.getPoint(.08+i*.03),side=i%2?-1:1;
    const start=point.toArray(),tip=[point.x+side*.07,point.y+.055,point.z+side*.12];
    blueberryLeaf(reach,start,tip,.045+i%3*.005,i%3?M.leaf:M.paleLeaf);
  }
  for(let cane=0;cane<6;cane++){
    // This rear cane previously grew through G's clothed torso and resting
    // arm after the interaction was brought together. Keep that volume clear.
    if(cane===1)continue;
    const angle=cane*2.4,dx=Math.cos(angle),dz=Math.sin(angle),height=1.10+cane%3*.19;
    const path=new THREE.CatmullRomCurve3([[dx*.13,.02,dz*.13],[dx*.34,.54,dz*.34],[dx*.62,height,dz*.62]].map(p=>new THREE.Vector3(...p)));
    curve(reach,"slender basal cane forming the blueberry shrub",path.getPoints(16).map(p=>p.toArray()),.012,M.bark,18);
    for(let leaf=0;leaf<14;leaf++){
      const p=path.getPoint(.21+leaf*.052),side=leaf%2?-1:1;
      blueberryLeaf(reach,p.toArray(),[p.x-dz*side*.12+dx*.05,p.y+.07,p.z+dx*side*.12+dz*.05],.047,leaf%3?M.leaf:M.paleLeaf);
    }
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

// Oleg confirms bushes at least adult height; the current low planting needs
// rescaling. Keep the sky open and attach foliage to real canes, with clear rows.

window.__authorRoom = () => exportRoom();
