import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

// Jane's chosen Open House route is a single impossible city promenade. The
// order comes from the saved Pullman-first itinerary, not her preference rank.
const C = {
  sky: 0xd9d4ca, ground: 0x9b9997, street: 0xd3c2af,
  ink: 0x303949, brick: 0x9b5f59, warmBrick: 0xc37f67,
  limestone: 0xe6d8bd, arch: 0xbba9a3, bronze: 0xaa8455,
  glass: 0x6b949a, paleGlass: 0xb2c5c3, night: 0x404f69,
  gold: 0xe9c78d, mint: 0x8caaa0, rose: 0xd3958b,
  skin: 0xd7a489, hair: 0x493b3b, cream: 0xf2e5d4,
  fabric: 0x78939d, paper: 0xf5ebd9,
};
const art = createRoomArt({ index: 7, title: "Jane's chosen city route",
  width: 13.2, height: 16.0, depth: 27.8, colors: C, seed: 80808 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky(C.sky, true);
ground(C.street, (x, z) => new THREE.Color(C.ground).lerp(
  new THREE.Color(C.street), Math.exp(-Math.pow((x - .25 * Math.sin(z * .44)) / 1.7, 2)) * .84));
// Layered facades continue between the seven named stops. They make the route
// feel like a real piece of city fabric rather than objects on a blank plane.
for (const side of [-1,1]) for (let bay=0;bay<7;bay++) {
  const z=10.8-bay*3.55, x=side*6.12;
  const height=2.65+(bay*5%4)*.43;
  const mat=bay%3===0?M.warmBrick:bay%3===1?M.arch:M.limestone;
  box(root,"solid layered Chicago streetscape facade",x,height/2,z,
    .78,height,3.12,mat,true);
  box(root,"projecting civic cornice",side*5.7,height-.08,z,
    .26,.18,3.25,M.cream);
  for (let row=0;row<2;row++) for (let window=0;window<3;window++) {
    const wz=z-1.02+window*1.02,wy=.88+row*.98;
    box(root,"recessed city window",side*5.71,wy,wz,
      .035,.55,.37,M.night);
    box(root,"light stone window sill",side*5.65,wy-.34,wz,
      .13,.045,.47,M.cream);
  }
  if (bay%2===0) {
    box(root,"solid small city stoop",side*5.15,.2,z+.83,
      .55,.4,.7,M.limestone,true);
    for(let step=0;step<3;step++) box(root,"cut stone step",
      side*(5.18-step*.16),.08+step*.07,z+.83,
      .42,.16+step*.1,.65,M.pearl||M.cream);
  }
}

// An inlaid route bends through seven walkable architectural miniatures.
for (const side of [-1, 1]) curve(root, "thin brass edge of Jane's route",
  [[side * 1.4, .045, 13], [side * 1.28, .045, 8],
    [side * 1.57, .045, 3], [side * 1.22, .045, -2],
    [side * 1.5, .045, -8], [side * 1.15, .045, -13]],
  .025, M.gold, 72);
for (let z = -12; z <= 12; z += .87) {
  beam(root, "fine cut in stone pavement", [-1.34, .05, z],
    [1.34, .05, z + .07], .011, .011, M.limestone, 5);
}
function archedDoor(parent, x, z, y = 1.1, w = 1.55, h = 2.4, mat = M.ink) {
  box(parent, "deep doorway recess", x, y, z, w, h - .4, .12, mat, true);
  curve(parent, "formed lintel arch", [[x-w/2, h-.05, z+.1],
    [x-w*.3, h+.2, z+.1], [x, h+.35, z+.1],
    [x+w*.3, h+.2, z+.1], [x+w/2, h-.05, z+.1]], .085, M.limestone, 24);
}
function plaque(text, x, z, side) {
  const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 96;
  const c = canvas.getContext("2d");
  c.fillStyle = "#eee0c9"; c.fillRect(0, 0, 640, 96);
  c.strokeStyle = "#aa855e"; c.lineWidth = 5; c.strokeRect(4, 4, 632, 88);
  c.fillStyle = "#303949"; c.textAlign = "center";
  c.font = "600 37px Georgia, serif"; c.fillText(text, 320, 61);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const near = text === "Pullman";
  const px = near ? -1.65 : side * 2.15;
  const pz = near ? z - 1.3 : z + .48;
  const face = add(root, `route label ${text}`,
    new THREE.PlaneGeometry(2.15, .39), material,
    px, 1.13, pz);
  face.rotation.y = side < 0 ? .16 : -.16;
  box(root, "slim label stand", px, .57, pz - .01,
    .05, .94, .05, M.bronze);
}
function monument(name, z, side, material = M.brick) {
  const x = side * 4.25;
  const base = box(root, `solid ${name} sculpted foundation`, x, .18, z,
    3.7, .36, 3.2, material, true);
  base.userData.solidFootprint = true;
  return x;
}
// 1. Pullman's red-brick clock tower, neighborhood and labor story.
{
  const z = 9.5, x = monument("Pullman clock tower", z, -1, M.brick);
  box(root, "solid Pullman administration facade", x, 1.42, z,
    3.3, 2.25, 1.45, M.brick, true);
  box(root, "clock tower shaft", x, 3.34, z, .96, 2.25, 1.02, M.warmBrick, true);
  box(root, "stepped clock tower parapet", x, 4.65, z, 1.25, .28, 1.3, M.limestone);
  add(root, "round clock face", new THREE.CylinderGeometry(.29, .29, .03, 16),
    M.cream, x, 3.8, z + .54).rotation.x = Math.PI / 2;
  beam(root, "clock hand", [x, 3.8, z+.57], [x+.14, 3.94, z+.57], .012, .012, M.ink);
  for (const dx of [-1.16, 1.16]) {
    box(root, "Pullman tall window", x+dx, 1.65, z+.76, .37, .92, .04, M.night);
    curve(root, "arched Pullman window crown", [[x+dx-.23, 2.14, z+.8],
      [x+dx, 2.4, z+.8], [x+dx+.23, 2.14, z+.8]], .03, M.limestone);
  }
  plaque("Pullman", x, z, -1);
}
// 2. Avalon Regal: a minaret and an atmospheric star ceiling.
{
  const z = 5.8, x = monument("Avalon Regal Theater", z, 1, M.night);
  box(root, "solid layered theater facade", x, 1.48, z,
    3.2, 2.55, 1.6, M.rose, true);
  archedDoor(root, x, z+.87, 1.07, 1.38, 2.3, M.night);
  loft(root, "ornate minaret silhouette", [[.38, .34, .34, x+1.25, z-.25],
    [3.1, .26, .26, x+1.25, z-.25], [4.6, .19, .19, x+1.25, z-.25],
    [5.12, .03, .03, x+1.25, z-.25]], M.limestone, 12, true);
  for (let i = 0; i < 11; i++) {
    const sx = x - 1.35 + random() * 2.7, sz = z - .5 + random() * 1.2;
    add(root, "small theater sky star", new THREE.OctahedronGeometry(.035, 0),
      M.gold, sx, 2.87, sz);
  }
  plaque("Avalon Regal", x, z, 1);
}
// 3. The revived Stony Island Arts Bank, a civic archive of art.
{
  const z = 2.1, x = monument("Stony Island Arts Bank", z, -1, M.limestone);
  box(root, "solid neoclassical arts bank body", x, 1.45, z,
    3.35, 2.4, 1.6, M.limestone, true);
  for (const dx of [-1.18, -.41, .41, 1.18]) {
    beam(root, "arts bank broad stone column", [x+dx, .35, z+.88],
      [x+dx, 2.85, z+.88], .115, .115, M.cream);
    box(root, "column capital", x+dx, 2.86, z+.9, .33, .16, .29, M.arch);
  }
  box(root, "arts bank pediment", x, 3.0, z, 3.75, .24, 1.86, M.arch);
  for (let i = 0; i < 7; i++) box(root, "archive folio spine", x-1.2+i*.36,
    1.17, z+.99, .23, .48+random()*.33, .1, i%2?M.ink:M.brick);
  plaque("Stony Island Arts Bank", x, z, -1);
}
// 4. Narrow Bridge is a century-old community gathering space.
{
  const z = -1.65, x = monument("Narrow Bridge Arts Club", z, 1, M.brick);
  box(root, "solid former congregation building", x, 1.53, z,
    3.25, 2.55, 1.65, M.brick, true);
  archedDoor(root, x, z+.91, 1.15, 1.4, 2.45, M.night);
  for (const dx of [-1.14, 1.14]) {
    add(root, "colored meeting-window glass", new THREE.PlaneGeometry(.4, 1.28),
      new THREE.MeshBasicMaterial({ color: dx<0?C.glass:C.gold, side:THREE.DoubleSide }),
      x+dx, 1.91, z+.85);
    curve(root, "tall meeting-window tracery", [[x+dx-.22, 2.55, z+.88],
      [x+dx, 2.81, z+.88], [x+dx+.22, 2.55, z+.88]], .035, M.limestone);
  }
  plaque("Narrow Bridge", x, z, 1);
}
// 5. Palmisano, a quarry transformed into water and meadow.
{
  const z = -5.4, x = monument("Palmisano quarry park", z, -1, M.mint);
  for (let i = 0; i < 4; i++) box(root, "stepped former quarry ledge",
    x - .6 + i*.38, .45+i*.34, z-.35,
    2.3-i*.36, .25, 1.9-i*.2, i%2?M.limestone:M.arch, true);
  const pond = add(root, "small blue quarry pond", new THREE.CircleGeometry(.75, 22),
    M.glass, x+.84, .405, z+.86); pond.rotation.x = -Math.PI/2;
  for (let i=0;i<13;i++) {
    const px = x-1.5+random()*3, pz=z-.9+random()*1.8;
    curve(root, "park meadow grass", [[px,.28,pz],[px+.05,.66+random()*.3,pz]],
      .018, i%3?M.mint:M.gold, 7);
  }
  plaque("Palmisano Park", x, z, -1);
}
// 6. Saint Ignatius, an echo of masonry, arches and learning.
{
  const z = -9.15, x = monument("Saint Ignatius College Prep", z, 1, M.brick);
  box(root, "solid broad school masonry", x, 1.55, z, 3.35, 2.63, 1.55, M.brick, true);
  box(root, "layered school cornice", x, 3.02, z, 3.65, .22, 1.8, M.limestone);
  for (const dx of [-1.0, 0, 1.0]) {
    box(root, "recessed vertical school window", x+dx, 1.88, z+.81,
      .43, 1.08, .08, M.night);
    curve(root, "light arched school window", [[x+dx-.25,2.45,z+.85],
      [x+dx,2.76,z+.85],[x+dx+.25,2.45,z+.85]],.04,M.limestone);
  }
  plaque("Saint Ignatius", x, z, 1);
}
// 7. A quiet temple gate concludes the otherwise bustling city ribbon.
{
  const z = -12.05, x = monument("Zen Buddhist Temple", z, -1, M.mint);
  for (const dx of [-1.17, 1.17]) beam(root, "timber temple gate post",
    [x+dx,.36,z+.3],[x+dx,3.4,z+.3],.11,.11,M.bronze);
  box(root, "tiered temple gate roof", x, 3.5, z+.3, 3.1, .19, 1.4, M.ink);
  box(root, "upper timber eave", x, 3.82, z+.3, 2.48, .11, 1.03, M.bronze);
  curve(root, "quiet gate lintel rise", [[x-1.65,3.58,z+.45],
    [x,3.98,z+.45],[x+1.65,3.58,z+.45]],.055,M.gold);
  for (let i=0;i<17;i++) petal(root,"single quiet courtyard leaf",
    x-1.2+random()*2.4,.6+random()*2.9,z-.5+random()*1.5,
    .2,M.mint,random()*6.28);
  plaque("Zen Buddhist Temple", x, z, -1);
}

// Jane and Oleg become fellow travelers, not invented actors at any stop.
person("Jane walking the chosen route", 1.1, -3.2, 1.68,
  { skin:M.skin, hair:M.hair, outfit:M.rose, pants:M.ink, bun:true, yaw:.2 });
person("Oleg walking the chosen route", 1.65, -4.5, 1.78,
  { skin:M.skin, hair:M.hair, outfit:M.fabric, pants:M.ink,
    longHair:true, glasses:true, beard:true, yaw:.15 });
// The itinerary is tied together by a suspended urban sketchbook. Its arches
// and hanging panes change rhythm as Jane proceeds without boxing in the sky.
for (const z of [7.6, .2, -7.2]) {
  curve(root, "wide floating hand-drawn city arch",
    [[-6.1,4.75,z],[-3.2,5.55,z-.12],[0,5.78,z-.18],
      [3.2,5.55,z-.12],[6.1,4.75,z]], .035, M.bronze, 34);
  for (const x of [-4.2,-2.1,0,2.1,4.2]) {
    curve(root,"fine suspended map thread",
      [[x,5.35,z],[x+.05,4.95,z+.12]],.011,M.gold,7);
    const shard=add(root,"hanging translucent city-map pane",
      new THREE.PlaneGeometry(.31,.46),
      new THREE.MeshBasicMaterial({color:C.paleGlass,side:THREE.DoubleSide,
        transparent:true,opacity:.66}),x+.05,4.75,z+.12);
    shard.rotation.y=.14*Math.sin(x+z);
  }
}
for (let i=0;i<12;i++) {
  const x=-6.05+i*1.08, h=1.8+(i*7%5)*.43;
  box(root,"far folded city-skyline silhouette",x,h/2,-13.7,
    .91,h,.12,i%3?M.arch:M.night);
}
for (let i=0;i<17;i++) petal(root,"floating city-map fragment",
  (random()-.5)*12.2, 4.7+random()*.9, -12+random()*24,
  .22+random()*.16, i%3?M.paper:M.gold, random()*6.28);

window.__authorRoom = () => exportRoom({ key:0xffd2ad,
  fill:0xa8c9d4, ambient:1.7, keyPower:2.2 });
