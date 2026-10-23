import {portalPreviewCamera} from './portal_preview_camera.mjs';
import {replaceStoryFigures} from './storybook_figures.mjs';
import {finishStoryWorld} from './storyworld_finish.mjs';
import {TOY_CAR_SCALE,TOY_CAR_Y} from './scene04_arrangement.mjs';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { addRoomLighting, prepareRoomShadows } from "../client/explore/room-lighting.mjs";
import { addOpenSky } from "./open_sky.mjs";
import { addOlegPortrait, addJanePortrait, addZephrinePortrait,
  finishOlegPortraits } from "./oleg_portrait.mjs";
import { addContactShadow } from "./stage_shadows.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";
import { paintedFabric } from "./painted_fabric.mjs";
import { loadRiggedOlegBase, makeRiggedOleg } from "./rigged_oleg.mjs";
import { loadAdaptedTree, plantAdaptedTree } from "./adapted_tree.mjs";

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
const masonryCanvas=document.createElement("canvas");
masonryCanvas.width=masonryCanvas.height=256;
const masonry=masonryCanvas.getContext("2d");
masonry.fillStyle="#d9d4cb";masonry.fillRect(0,0,256,256);
for(let row=0;row<13;row++) for(let col=-1;col<7;col++) {
  const x=col*44+(row%2)*22,y=row*20;
  const tone=226+Math.floor(random()*22);
  masonry.fillStyle=`rgb(${tone},${tone-2},${tone-4})`;
  masonry.fillRect(x+2,y+2,41,17);
  masonry.fillStyle="rgba(69,49,48,.055)";
  masonry.fillRect(x+5+random()*20,y+5,8+random()*12,1.3);
}
const brickTexture=new THREE.CanvasTexture(masonryCanvas);
brickTexture.colorSpace=THREE.SRGBColorSpace;
brickTexture.wrapS=brickTexture.wrapT=THREE.RepeatWrapping;
brickTexture.repeat.set(2,3);
brickTexture.userData.mimeType="image/png";
const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, map: grain, roughness: .93, metalness: 0, side: THREE.DoubleSide, ...extra,
});
const M = Object.fromEntries(Object.entries(C).map(([key, value]) => [key, material(value)]));
const brickFacades=[C.brick,C.coral,C.plum,C.brick].map(color=>
  material(color,{map:brickTexture}));
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
    indices.push(a, a + sides, b, b, a + sides, b + sides);
  }
  for (let side = 1; side < sides - 1; side++) {
    indices.push(0, side, side + 1);
    const top = (rings.length - 1) * sides;
    indices.push(top, top + side + 1, top + side);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = add(parent, name, geometry, mat);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}

const floor = new THREE.PlaneGeometry(10.8, 16.4, 30, 42);
floor.rotateX(-Math.PI / 2);
const floorColors = [];
for (let i = 0; i < floor.attributes.position.count; i++) {
  const x = floor.attributes.position.getX(i), z = floor.attributes.position.getZ(i);
  floor.attributes.position.setY(i, (Math.abs(x)<2.1?.001:.008) * Math.sin(x * 3 + z * 2));
  const distance = Math.abs(x - .18 * Math.sin(z * .35));
  const pigment = new THREE.Color(distance < 2.1 ? C.road : C.sidewalk);
  pigment.offsetHSL(0, 0, (random() - .5) * .045);
  floorColors.push(pigment.r, pigment.g, pigment.b);
}
floor.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
floor.computeVertexNormals();
add(root, "walkable Chicago sidewalk widening into a memory street", floor,
  material(0xffffff, { vertexColors: true }));
const streetContinuation=new THREE.PlaneGeometry(144,144,96,96);
streetContinuation.rotateX(-Math.PI/2);
streetContinuation.translate(0,-.006,-12);
const distantPigment=[];
for(let i=0;i<streetContinuation.attributes.position.count;i++) {
  const x=streetContinuation.attributes.position.getX(i),
    z=streetContinuation.attributes.position.getZ(i);
  const bend=-2.5*THREE.MathUtils.smoothstep(-z,18,45);
  const lane=Math.abs(x-bend-.18*Math.sin(z*.35));
  const color=new THREE.Color(lane<2.1?C.road:C.sidewalk);
  color.offsetHSL(0,0,(random()-.5)*.035);
  distantPigment.push(color.r,color.g,color.b);
}
streetContinuation.setAttribute("color",
  new THREE.Float32BufferAttribute(distantPigment,3));
streetContinuation.computeVertexNormals();
add(root,"nonwalkable continuation of the Roscoe Village block into the open sky",
  streetContinuation,material(0xffffff,{vertexColors:true}));
for (const side of [-1, 1]) {
  for (let z = -7.9; z < 8.0; z += 1.4) {
    box(root, "hand-laid sidewalk joint", side * 2.65, .021, z,
      .018, .009, 1.38, M.mortar);
  }
  curve(root, "continuous curb", [[side * 2.21, .12, 8.15],
    [side * 2.18, .12, 3.9], [side * 2.23, .12, -.7],
    [side * 2.18, .12, -4.4], [side * 2.23, .12, -8.15],
    [side*2.2,.12,-17.8],[side*2.2,.12,-28]], .075, M.cream, 80);
}
addOpenSky(root, C.sky, C.sidewalk);

// Repeating stoops, bay windows and brick patterns suggest a Roscoe Village
// block without copying a private house or asserting an exact address.
for (const side of [-1, 1]) for (let unit = -3; unit < 4; unit++) {
  const z = -6.6 + unit * 4.1;
  const group = new THREE.Group(); group.name = "unaddressed brick two-flat with stoop";
  group.position.set(side * (4.58+((unit+4)%3)*.12), 0, z);group.scale.y=.94+((unit+4+(side>0?1:0))%3)*.09;root.add(group);
  const front = -side * .63;
  const tint = brickFacades[((unit + (side > 0 ? 1 : 0)) % 4 + 4) % 4];
  box(group, "solid brick facade", side*1.775, 2.05, 0, 5.0, 4.1, 3.82,
    tint, unit>=0);
  box(group, "stone foundation", side*1.775, .45, 0, 5.05, .9, 3.87, M.mortar);
  box(group, "projecting cornice", side*1.775, 4.18, 0, 5.13, .16, 4.05, M.cream);
  if(unit%2===0) {
    curve(group,"shaped limestone parapet rising above the two-flat",[
      [front-side*.12,4.26,-1.9],
      [front-side*.12,4.43,-1.22],
      [front-side*.12,4.49,0],
      [front-side*.12,4.43,1.22],
      [front-side*.12,4.26,1.9]],.065,M.cream,32);
    for(const dz of [-1.24,1.24]) box(group,
      "short carved roof pier joined to the parapet",
      front-side*.12,4.33,dz,.21,.28,.23,M.mortar);
  } else {
    for(const dz of [-1.43,-.48,.48,1.43]) box(group,
      "stepped brick parapet above the cornice",
      front-side*.07,4.34,dz,.24,.32,.49,tint);
    box(group,"continuous limestone cap across stepped roofline",
      front-side*.12,4.51,0,.25,.07,3.8,M.cream);
  }
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
    if (dz < 0) {
      // One stack of the paired windows becomes a true projecting Chicago
      // bay. The flat glazing behind it is a dark inner reveal, not the
      // visible facade. Give the bay three faces and a continuous stone sill
      // so its silhouette reads from the middle of the street.
      const projection = front - side * .27;
      box(group, "projecting three-sided bay center glass",
        projection, level, dz, .043, .79, .48, M.window);
      for (const wing of [-1, 1]) {
        const pane = box(group, "angled glazed wing of Chicago bay",
          front - side * .15, level, dz + wing * .335,
          .038, .79, .26, M.window);
        pane.rotation.y = side * wing * .57;
        beam(group, "carved vertical bay corner",
          [projection - side * .027, level - .43, dz + wing * .25],
          [projection - side * .027, level + .43, dz + wing * .25],
          .034, .034, M.cream, 8);
      }
      box(group, "continuous limestone bay sill",
        front - side * .18, level - .49, dz,
        .39, .12, .99, M.cream);
      box(group, "projecting bay canopy with a shaped lip",
        front - side * .18, level + .48, dz,
        .4, .13, 1.02, M.cream);
      curve(group, "fine metal mullion across bay glazing", [
        [projection - side * .03, level, dz - .24],
        [projection - side * .033, level, dz],
        [projection - side * .03, level, dz + .24]], .014, M.brass, 12);
    }
  }
  box(group, "stone bay spandrel between stories",
    front - side * .18, 2.05, -1.35, .36, .44, .84, M.mortar);
  for (const dz of [-.75, .85]) {
    const lamp = box(group, "wall-mounted porch lantern with metal cap",
      front - side * .14, 1.85, dz, .17, .29, .14, M.dark);
    lamp.rotation.x = .06;
    box(group, "warm porch lantern glass", front - side * .185,
      1.85, dz, .06, .17, .1, M.cream);
    beam(group, "lantern bracket fixed to brick",
      [front, 1.96, dz], [front - side * .21, 1.96, dz],
      .018, .018, M.dark, 7);
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

// The toy body has a purpose-drawn footprint and a raised, gently beveled
// shell. It is open at the seat, has four wheels, steering wheel and a push
// handle, and remains one solid obstacle for a visitor.
const car = new THREE.Group(); car.name = "sculpted blue toddler push car with Zephrine driving";
car.position.set(0, TOY_CAR_Y, 4.0); root.add(car);
const bodyShape = new THREE.Shape();
bodyShape.moveTo(-.35, -.83);
bodyShape.bezierCurveTo(-.51, -.77, -.53, -.49, -.5, -.21);
bodyShape.lineTo(-.48, .35);
bodyShape.bezierCurveTo(-.45, .8, -.21, .91, 0, .92);
bodyShape.bezierCurveTo(.21, .91, .45, .8, .48, .35);
bodyShape.lineTo(.5, -.21);
bodyShape.bezierCurveTo(.53, -.49, .51, -.77, .35, -.83);
bodyShape.closePath();
// The occupied cabin must be an actual recess. Previously this extrusion was
// solid underneath the child, with a seat simply placed on top of the shell.
const cabin=new THREE.Path();
cabin.moveTo(-.29,-.43);cabin.lineTo(.29,-.43);
cabin.quadraticCurveTo(.36,-.43,.36,-.34);
cabin.lineTo(.36,.56);cabin.quadraticCurveTo(.36,.67,.24,.67);
cabin.lineTo(-.24,.67);cabin.quadraticCurveTo(-.36,.67,-.36,.56);
cabin.lineTo(-.36,-.34);cabin.quadraticCurveTo(-.36,-.43,-.29,-.43);
cabin.closePath();bodyShape.holes.push(cabin);
const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape,
  { depth: .37, bevelEnabled: true, bevelSize: .026, bevelThickness: .03,
    bevelSegments: 3, curveSegments: 18 });
bodyGeometry.rotateX(-Math.PI / 2);
const body = add(car, "solid curved blue Whisper Ride inspired body", bodyGeometry,
  M.blue, 0, .22, 0);
body.userData.solidFootprint = true;
box(car,"recessed molded footwell floor inside the open cabin",0,.21,-.15,.64,.03,1.02,M.blueShade);
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
add(car, 'dark recessed seat',new RoundedBoxGeometry(.62,.12,.43,4,.035),M.dark,0,.40,-.24);
add(car, 'solid rising seat back',new RoundedBoxGeometry(.62,.30,.12,4,.025),M.blueShade,0,.56,-.49).userData.solidFootprint=true;
const hoodShape = new THREE.Shape();
hoodShape.moveTo(-.43, -1.00); hoodShape.bezierCurveTo(-.48, -.62, -.35, -.48, 0, -.48);
hoodShape.bezierCurveTo(.35, -.48, .48, -.62, .43, -1.00); hoodShape.closePath();
const hoodGeometry = new THREE.ExtrudeGeometry(hoodShape,
  { depth: .09, bevelEnabled: true, bevelSize: .026, bevelThickness: .03,
    bevelSegments: 2, curveSegments: 15 });
hoodGeometry.rotateX(-Math.PI / 2);
add(car, "raised sculpted blue bonnet", hoodGeometry, M.blueShade, 0, .62, 0);
for (const side of [-1, 1]) for (const z of [-.56, .55]) {
  const wheel = add(car, "four quiet white wheels", new THREE.CylinderGeometry(.2, .2, .11, 15),
    M.silver, side * .585, .23, z);
  wheel.rotation.z = Math.PI / 2;
  const hub = add(car, "dark wheel hub", new THREE.CylinderGeometry(.08, .08, .118, 12),
    M.dark, side * .597, .23, z);
  hub.rotation.z = Math.PI / 2;
  curve(car, "molded blue arch above a visible white wheel",
    [[side * .53, .25, z - .22], [side * .54, .46, z],
      [side * .53, .25, z + .22]], .025, M.blueShade, 14);
}
for (const side of [-1, 1]) {
  const lamp = add(car, "domed pale headlamp on the car's front",
    new THREE.SphereGeometry(1, 16, 10), M.white,
    side * .31, .52, 1.025);
  lamp.scale.set(.115, .068, .035);
  curve(car, "small painted surround for each headlamp",
    [[side * .22, .55, 1.021], [side * .31, .595, 1.027],
      [side * .4, .55, 1.021]], .01, M.silver, 12);
  curve(car, "molded side crease", [[side * .51, .5, -.57],
    [side * .55, .53, .05], [side * .47, .56, .62]], .018, M.blueShade);
}
const grille = box(car, "recessed dark front grille", 0, .39, 1.024,
  .32, .095, .025, M.dark);
grille.rotation.x = -.05;
for (const offset of [-.085, 0, .085]) box(car,
  "fine silver divider in the front grille", offset, .39, 1.044,
  .012, .073, .008, M.silver);
curve(car, "silver contour of rounded front bumper",
  [[-.4, .27, 1.05], [0, .25, 1.06], [.4, .27, 1.05]],
  .02, M.silver);
beam(car, "steering column", [0, .65, .34], [0, .86, .28], .035, .035, M.dark);
const wheel = add(car, "working-looking toy steering wheel",
  new THREE.TorusGeometry(.17, .024, 7, 20), M.dark, 0, .9, .32);
wheel.rotation.x = Math.PI / 4;
beam(car, "steering-wheel spoke", [-.12, .9, .32], [.12, .9, .32], .012, .012, M.dark, 5);
for (const side of [-1, 1]) {
  const holder = add(car, "deep molded cup holder beside the steering wheel",
    new THREE.TorusGeometry(.07, .018, 7, 18), M.blueShade,
    side * .335, .7, .28);
  holder.rotation.x = Math.PI / 2;
  box(car, "cup-holder dark well", side * .335, .691, .28,
    .1, .012, .1, M.dark);
}
curve(car,'continuous molded parent push-handle stem',[[0,.53,-.55],[0,.89,-.68],[0,1.27,-.92],[0,1.48,-1.05]],.07,M.dark,40);
beam(car, 'shared parent push grip',[-.37,1.48,-1.05],[.37,1.48,-1.05],.025,.025,M.dark,20);
car.scale.fromArray(TOY_CAR_SCALE);

function adult(name, x, z, outfit, options = {}) {
  const cloth = paintedFabric(outfit);
  const group = new THREE.Group(); group.name = `fully sculpted figure of ${name}`;
  group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
  const skin = options.skin || M.janeSkin, height = options.height || 1.69;
  addContactShadow(group, height);
  const hip = height * .49;
  for (const side of [-1, 1]) {
    loft(group, "trouser leg with knee and tapered ankle", [[.13, .09, .09, side * .125],
      [hip * .48, .105, .10, side * .13],
      [hip * .68, .11, .105, side * .13],
      [hip, .14, .115, side * .13]],
    paintedFabric(options.pants || M.dark), 10);
    loft(group, "sculpted walking shoe with toe, sole and instep",
      [[.014, .09, .10, side * .13, .055],
        [.045, .11, .145, side * .13, .045],
        [.09, .115, .13, side * .13, .02],
        [.15, .075, .075, side * .13, -.025]], M.dark, 14);
  }
  loft(group, "folded shirt and solid body", [[hip - .03, .245, .17],
    [hip + .17, .28, .185], [height - .48, .25, .16],
    [height - .38, .2, .13]], cloth, 14, true);
  for (const side of [-1, 1]) {
    const hand = options.hands?.[side] || [side * .33, height - 1.0, .18];
    const elbow = [side * .35, (height - .72 + hand[1]) / 2, hand[2] * .55];
    sculptSleevedArm(add, group, {
      shoulder: [side * .22, height - .42, 0], elbow, hand,
      outfit: cloth, skin, trim: M.cream,
      size: Math.min(1, height / 1.7),
    });
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
  if (!options.oleg) loft(group, "layered dark hair", [[face + .03, .09, .08],
    [face + .11, .17, .13, 0, -.02], [face + .2, .13, .11, 0, -.03],
    [face + .25, .02, .02, 0, -.03]], M.hair, 14);
  if (options.bun) loft(group, "Jane's high bun", [[face + .18, .05, .04, 0, -.07],
    [face + .29, .13, .11, 0, -.07], [face + .4, .07, .06, 0, -.07],
    [face + .44, .01, .01, 0, -.07]], M.hair, 12);
  if (options.longHair && !options.oleg) for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
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
    head.scale.set(.86, .72, .82);
    head.position.y = (height - .46) * .28;
    group.add(head);
  }
  curve(group, "stitched neckline", [[-.14, height - .43, .13],
    [0, height - .49, .17], [.14, height - .43, .13]], .011, M.cream);
  return group;
}

const oleg = adult("Oleg pushing with Jane", -.7, 2.48, M.cream, {
  skin: M.olegSkin, height: 1.73, oleg: true, glasses: true, beard: true, longHair: true,
  hands: { "1": [.4, 1.48, .47], "-1": [-.38, 1.03, .27] }, yaw: .12,
});
adult("Jane pushing with Oleg", .7, 2.48, M.plum, {
  skin: M.janeSkin, bun: true, pants: M.dark,
  hands: { "-1": [-.4, 1.48, .47], "1": [.38, 1.03, .27] }, yaw: -.12,
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
for (const side of [-1, 1]) curve(zeph,
  "fastened seat belt across Zephrine's clothed torso",
  [[side * .22, .88, -.04], [side * .16, .73, -.007],
    [side * .045, .62, .035]], .012, M.silver, 14);
box(zeph, "small central seat belt buckle", 0, .62, .04,
  .09, .05, .025, M.dark);
loft(zeph, "Zephrine's smiling sculpted face", [[.96, .055, .06, 0, -.21],
  [1.05, .15, .12, 0, -.21], [1.24, .17, .145, 0, -.21],
  [1.41, .14, .12, 0, -.22], [1.48, .02, .02, 0, -.22]], M.janeSkin, 14);
const zephFace = new THREE.Group();
zephFace.position.z = -.21; zeph.add(zephFace);
addZephrinePortrait(zephFace, 1.44,
  [[-.48, .055, .06], [-.39, .15, .12], [-.2, .17, .145],
    [0, .14, .12], [.04, .02, .02]], M.janeSkin);
loft(zeph, "close fitted back crown under Zephrine's painted curls", [
  [1.4, .105, .085, 0, -.245], [1.48, .155, .13, 0, -.255],
  [1.54, .142, .115, 0, -.26], [1.58, .07, .065, 0, -.26],
  [1.59, .008, .008, 0, -.26]], M.zephHair, 20);
for (const side of [-1, 1]) for (let i = 0; i < 3; i++) curve(zeph,
  "fine curled hair behind Zephrine's face", [
    [side * (.115 + i * .012), 1.47, -.29],
    [side * (.15 + i * .015), 1.37, -.28],
    [side * (.13 + i * .014), 1.25, -.255]],
  .008 - i * .001, M.zephHair, 11);

// A few actual cast-iron utility covers ground the long block. The former
// repeated gold wheel glyphs looked like loose rings scattered on the road.
for(const [x,z] of [[-.65,-2.2],[.75,-6.25]]) {
  const plate=add(root,"recessed cast-iron street utility cover",
    new THREE.CircleGeometry(.28,28),M.dark,x,.025,z);
  plate.rotation.x=-Math.PI/2;
  const rim=add(root,"solid circular edge of cast-iron cover",
    new THREE.TorusGeometry(.28,.016,7,30),M.mortar,x,.029,z);
  rim.rotation.x=Math.PI/2;
  for(let notch=0;notch<6;notch++) {
    const a=notch*Math.PI/3;
    beam(root,"radial raised casting on street cover",
      [x+Math.cos(a)*.08,.03,z+Math.sin(a)*.08],
      [x+Math.cos(a)*.22,.03,z+Math.sin(a)*.22],
      .006,.006,M.mortar,5);
  }
}
// Ground scatter previously stood upright above the pavement like loose
// polygon flags. The attached tree canopy already supplies the foliage.
// The parkway trees provide shade from the sides. Keep the street's center
// open to the sky instead of hanging disconnected twig garlands overhead.

async function authorRoom() {
  const rig = await loadRiggedOlegBase();
  const treeModel = await loadAdaptedTree();
  for (const side of [-1, 1]) for (let i = -3; i < 4; i++) {
    const x = side * 2.9, z = -5.8 + i * 3.9;
    const scale = .48 + ((i + 4) % 3) * .022;
    plantAdaptedTree(root, treeModel, {
      x, z, scale: scale * (side < 0 ? 1 : .97),
      rotation: i * 1.79 + side * 2.2,
      leafTint: side < 0 ? 0xb5c5ad : 0xc2ceb8,
      name: "detailed parkway tree on the Roscoe Village block",
      colliderRadius: .17,
    });
  }
  const blocks=root.children.filter(o=>o.name==='unaddressed brick two-flat with stoop');
  for(const side of[-1,1])for(let i=0;i<5;i++){
    const building=blocks.filter(o=>Math.sign(o.position.x)===side)[i%7].clone(true),z=-24-i*4.4;
    building.name='full-depth distant neighborhood volume following the continuing street';
    building.position.set(side*(4.58+(i%3)*.12)-2.5*THREE.MathUtils.smoothstep(-z,18,45),0,z);
    building.rotation.y=-.04*(1+Math.sin(i*.7));
    building.traverse(o=>{o.userData={...o.userData,solidFootprint:false};if(o.isMesh){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(0xb6c3b8),.20+i*.07);}});root.add(building);
  }
  oleg.clear();
  addContactShadow(oleg, 1.73);
  oleg.add(makeRiggedOleg(rig, {
    pose: "push", height: 1.73,
    hands: { "1": [.4, 1.48, .47], "-1": [-.38, 1.03, .27] },
    shirtColor: M.cream.color.getHex(), pantsColor: M.dark.color.getHex(),
    shirtEmbroidery: false,
  }));
  await finishOlegPortraits(root);
  replaceStoryFigures(root,'04');
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
  finishStoryWorld(root,'04');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  addRoomLighting(scene,'04');
  scene.add(root);
  const camera = portalPreviewCamera(gallery.frames[3].room);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  prepareRoomShadows(root,'04',renderer);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735, Math.round(735 / camera.aspect));
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
