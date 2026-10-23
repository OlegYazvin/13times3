import {portalPreviewCamera} from './portal_preview_camera.mjs';
import {replaceStoryFigures} from './storybook_figures.mjs';
import {finishStoryWorld} from './storyworld_finish.mjs';
import {caregivingBlanketPoint} from './scene02_arrangement.mjs';
import * as THREE from "three";
import { loadAdaptedTree, plantAdaptedTree } from "./adapted_tree.mjs";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import gallery from "../src/_data/gallery.json";
import { addRoomLighting, prepareRoomShadows } from "../client/explore/room-lighting.mjs";
import janeFaceURL from "./assets/room02/jane-face.webp";
import zephrineFaceURL from "./assets/room02/zephrine-face.webp";
import { addOpenSky } from "./open_sky.mjs";
import { addOlegPortrait, finishOlegPortraits } from "./oleg_portrait.mjs";
import { addContactShadow } from "./stage_shadows.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";
import { paintedFabric } from "./painted_fabric.mjs";
import { loadRiggedOlegBase, makeRiggedOleg } from "./rigged_oleg.mjs";
import { loadRiggedJaneBase, makeRiggedJane } from "./rigged_jane.mjs";

// A single impossible space: Oleg's desk opens into a street and four
// simultaneous acts of Jane's support. All figures and props have volume.
const root = new THREE.Group();
root.name = "Jane helped Oleg get a job — the work of holding things together";
const C = {
  plaster: 0xe5d8bd, ink: 0x343747, desk: 0x422f30, orange: 0xc76c49,
  brass: 0xb6925d, blue: 0x394f77, paleBlue: 0x90aabe, teal: 0x6f9695,
  street: 0xb8b1a5, sky: 0xb2c9d0, leaf: 0x738e73, darkLeaf: 0x526a61,
  skin: 0xdca784, paper: 0xf4e8d1, hair: 0x3b2d32, zephHair: 0x634739,
  amber: 0xe8b978, night: 0x606476, cream: 0xe7d9c4,
  janeSkin: 0xd8a18e, olegSkin: 0xd7a98d, blush: 0xbd746f,
  janeInk: 0x272e42, iris: 0x65736b, floral: 0xe5b8a4,
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
const paintedFaces = {};
const facesReady = Promise.all([
  ["jane", janeFaceURL],
  ["zephrine", zephrineFaceURL],
].map(([name, url]) => new Promise((resolve, reject) => {
  new THREE.TextureLoader().load(url, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.userData.mimeType = "image/webp";
    paintedFaces[name] = new THREE.MeshStandardMaterial({
      map: texture, roughness: .94, transparent: true, alphaTest: .025,
      side: THREE.DoubleSide, depthWrite: true,
    });
    resolve();
  }, undefined, reject);
})));

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
function shapedEye(parent, name, x, y, z, scale, white, iris) {
  const outline = new THREE.Shape();
  outline.moveTo(-.052, 0);
  outline.quadraticCurveTo(0, .035, .052, 0);
  outline.quadraticCurveTo(0, -.026, -.052, 0);
  const scl = scale || 1;
  const eye = add(parent, `${name} shaped eye`, new THREE.ExtrudeGeometry(outline,
    { depth: .009, bevelEnabled: true, bevelSize: .003, bevelThickness: .002,
      bevelSegments: 2, curveSegments: 8 }), white, x, y, z);
  eye.scale.setScalar(scl);
  const center = add(parent, `${name} colored iris`,
    new THREE.CylinderGeometry(.017, .017, .008, 16), iris,
    x, y - .001, z + .02);
  center.rotation.x = Math.PI / 2;
  add(parent, `${name} tiny reflected light`, new THREE.CylinderGeometry(.005, .005, .004, 8),
    white, x - .006, y + .007, z + .025).rotation.x = Math.PI / 2;
}
function curvedShoe(parent, side, material) {
  const x = side * .14;
  loft(parent, "formed shoe with toe and heel", [[.015, .105, .18, x, .13],
    [.055, .135, .22, x, .105], [.125, .12, .18, x, .075],
    [.17, .09, .13, x, .025]], material, 15, true);
  curve(parent, "shoe's stitched upper", [[x - .095, .11, .19],
    [x, .125, .27], [x + .095, .11, .19]], .006, M.brass, 12);
}
function paintedFaceShell(parent, name, height) {
  const rows = 24, columns = 22;
  const positions = [], uvs = [], indices = [];
  const base = height - .035;
  const profile = [
    [-.445, .055, .055], [-.385, .136, .116], [-.29, .178, .147],
    [-.18, .196, .162], [-.045, .18, .151], [.07, .145, .128],
    [.15, .027, .03],
  ];
  if (name === "oleg") {
    addOlegPortrait(parent, base, profile, M.olegSkin);
    return;
  }
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const u = col / columns, v = row / rows;
    const offsetY = -.445 + v * .555;
    const y = base + offsetY;
    let band = 0;
    while (band < profile.length - 2 && offsetY > profile[band + 1][0]) band++;
    const start = profile[band], end = profile[band + 1];
    const fraction = THREE.MathUtils.clamp((offsetY - start[0]) / (end[0] - start[0]), 0, 1);
    const rx = THREE.MathUtils.lerp(start[1], end[1], fraction);
    const rz = THREE.MathUtils.lerp(start[2], end[2], fraction);
    const around = (u - .5) * 1.93;
    const x = around * rx;
    const z = .007 + rz * Math.sqrt(Math.max(0, 1 - around * around));
    positions.push(x, y, z); uvs.push(u, v);
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = row * (columns + 1) + col;
    indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = add(parent, `${name} painted likeness on curved sculpted face`,
    geometry, M.skin);
  mesh.userData.paintedFace = name;
}

// The timber floor loosens into pavement and an outdoor lane, with the path
// kept clear through the middle for exploration and return to the gallery.
// The modeled street may stop at the collision rail, but its painted ground
// keeps going beyond the reachable area. That removes the square floor edge
// visible when looking past Jane and Oleg toward the open sky.
const floor = new THREE.PlaneGeometry(44, 50, 88, 100);
floor.rotateX(-Math.PI / 2);
const floorColors = [];
for (let i = 0; i < floor.attributes.position.count; i++) {
  const x = floor.attributes.position.getX(i), z = floor.attributes.position.getZ(i);
  floor.attributes.position.setY(i, 0);
  const interior = 1 - THREE.MathUtils.smoothstep(
    Math.hypot(x * .82, z * .72), 6.2, 11.5);
  const amount = THREE.MathUtils.lerp(1,
    THREE.MathUtils.smoothstep(x + .25 * Math.sin(z * .5), -.6, 2.2),
    interior);
  const pigment = new THREE.Color(C.desk).lerp(new THREE.Color(C.street), amount);
  pigment.offsetHSL(0, 0, (random() - .5) * .045);
  floorColors.push(pigment.r, pigment.g, pigment.b);
}
floor.setAttribute("color", new THREE.Float32BufferAttribute(floorColors, 3));
floor.computeVertexNormals();
// Fine scuffs and pigment lie within the same walkable ground, rather than
// sitting on it as scattered polyhedra and repeated raised gold stripes.
const floorCanvas=document.createElement("canvas");
floorCanvas.width=floorCanvas.height=512;
const floorCtx=floorCanvas.getContext("2d");
floorCtx.fillStyle="#f7f3e9";floorCtx.fillRect(0,0,512,512);
let floorSeed=0x0e1e6202;
const floorRandom=()=>((floorSeed=(1664525*floorSeed+1013904223)>>>0)/4294967296);
for(let i=0;i<4600;i++) {
  const x=floorRandom()*512,y=floorRandom()*512;
  const s=.3+floorRandom()*1.25;
  floorCtx.fillStyle=i%3===0?"rgba(72,59,55,.11)":
    "rgba(157,126,103,.12)";
  floorCtx.beginPath();floorCtx.ellipse(x,y,s,s*.38,
    floorRandom()*Math.PI,0,Math.PI*2);floorCtx.fill();
}
for(let i=0;i<78;i++) {
  const x=floorRandom()*512,y=floorRandom()*512;
  const length=12+floorRandom()*76;
  floorCtx.strokeStyle=i%4===0?"rgba(79,64,61,.16)":
    "rgba(169,146,119,.22)";
  floorCtx.lineWidth=.5+floorRandom()*1.2;
  floorCtx.beginPath();floorCtx.moveTo(x,y);
  floorCtx.bezierCurveTo(x+length*.25,y+2,
    x+length*.68,y-3,x+length,y+floorRandom()*5);
  floorCtx.stroke();
}
const floorMap=new THREE.CanvasTexture(floorCanvas);
floorMap.colorSpace=THREE.SRGBColorSpace;
floorMap.userData.mimeType="image/png";
const floorMaterial=material(0xffffff,{vertexColors:true,map:floorMap});
add(root,"continuous painted floor where home becomes street",floor,
  floorMaterial);
for(let z=-7.35;z<7.8;z+=.73)curve(root,
  "quiet wood plank joint dissolving into pavement",
  [[-6.15,.014,z],[-3.2,.022,z+.04],[-1.05,.025,z+.1]],
  .004,M.desk,12);

// The desk and street belong to one outdoor world with no visible roof seam.
addOpenSky(root, C.sky, C.street);

// A low plaster foundation anchors the remembered room. The street's other
// edge stays open to the sky; a formed garden rail marks the walking boundary
// without leaving a row of dark rectangular blocks against the horizon.
for (let z = -7; z <= 7; z += 2.2) {
  const height = 1.10;
  box(root, "low plaster foundation below the home windows", -5.95,
    height / 2, z, .23, height, 1.9, M.plaster);
}
for (let i = 0; i <= 8; i++) {
  const z = -7.55 + i * 1.89;
  loft(root, "tapered garden-rail upright seated in the pavement",
    [[.035,.061,.061,5.86,z],[.13,.052,.052,5.86,z],
      [.8,.034,.034,5.86,z],[1.03,.05,.05,5.86,z],
      [1.075,.011,.011,5.86,z]], M.ink, 10);
  if (i < 8) {
    const next = z + 1.89;
    for (const y of [.27,.93]) curve(root,
      "joined wrought garden rail following the street",
      [[5.86,y,z],[5.86,y + (y < .5 ? .005 : .025),z+.945],
        [5.86,y,next]], y < .5 ? .015 : .02, M.ink, 14);
    curve(root,"quiet arched garden grille between two posts",
      [[5.86,.3,z+.1],[5.86,.73,z+.47],
        [5.86,.79,z+.945],[5.86,.73,z+1.42],
        [5.86,.3,next-.1]],.011,M.brass,18);
  }
}
// The rail overlooks a continuing neighborhood, not the edge of a finite
// game board. All of this sits outside the reachable bounds and remains in
// frame 02's isolated portal world.
const outerRoad = add(root,"quiet street continuing beyond the garden rail",
  new THREE.PlaneGeometry(3.1, 42), material(0x989390), 8.12, .035, 0);
outerRoad.rotation.x = -Math.PI / 2;
for (const x of [6.55,9.71]) curve(root,
  "weathered curb that separates pavement from the neighborhood road",
  [[x,.045,-20],[x+.035,.047,0],[x,.045,20]],.026,M.plaster,48);
const housePalette=[0xb7836c,0xd6b697,0x9aaca7,0xc2a78e,0xc6b59f];
const houseHeights=[3.05,3.74,2.83,3.42,3.13];
for (let i=0;i<5;i++) {
  const z=-9.1+i*4.55;
  const front=12.05+.42*Math.sin(i*2.3);
  const h=houseHeights[i];
  const brick=material(housePalette[i]);
  const house=new THREE.Group();
  house.name="distant Chicago neighborhood house with its own roof and entrance";
  house.position.set(front,0,z);root.add(house);
  box(house,"masonry home with recessed street-facing front",
    1.5,h/2,0,3,h,3.55,brick);
  if (i%3===1) {
    box(house,"stepped parapet rising above a flat neighborhood roof",
      1.5,h+.18,0,3.13,.36,3.62,brick);
    for(const y of [h+.05,h+.38]) box(house,
      "projecting molded cap across the old parapet",
      -.06,y,0,.16,.07,3.78,M.paper);
  } else {
    // A pitched roof is one joined pair of sloping surfaces, with an actual
    // ridge and eaves rather than a decorative triangle pasted on a box.
    const roofPositions=[0,h,-1.94, 3.1,h,-1.94,
      0,h+.59,0, 3.1,h+.59,0,
      0,h,1.94, 3.1,h,1.94];
    const roofGeometry=new THREE.BufferGeometry();
    roofGeometry.setAttribute("position",new THREE.Float32BufferAttribute(roofPositions,3));
    roofGeometry.setIndex([0,1,2,1,3,2,2,3,4,3,5,4]);
    roofGeometry.computeVertexNormals();
    add(house,"two continuous pitched roof planes over the home",
      roofGeometry,M.desk);
    for(const side of [-1,1]) curve(house,"roof eave and shadow line",
      [[-.08,h,side*1.94],[1.5,h+.025,side*1.94],
        [3.16,h,side*1.94]],.027,M.brass,18);
  }
  box(house,"stone lintel band joining the upper windows",
    -.033,h-.31,0,.09,.08,3.5,M.paper);
  for(const story of [0,1]) for(const bay of [-1,1]) {
    const y=.95+story*1.13, wz=bay*.87;
    box(house,"deep window reveal in the colored brick",
      -.025,y,wz,.065,.7,.57,M.desk);
    box(house,"blue glass held inside the carved window",
      -.067,y,wz,.012,.59,.45,M.paleBlue);
    box(house,"window crossbar and mullion",
      -.083,y,wz,.012,.023,.48,M.paper);
    box(house,"masonry window sill with projecting shadow",
      -.091,y-.37,wz,.16,.045,.67,M.paper);
    for(const sign of [-1,1]) box(house,
      "narrow window casing joined to the sill",
      -.09,y,wz+sign*.25,.1,.75,.035,M.paper);
  }
  const doorZ=i%2?-.06:.14;
  box(house,"recessed dark front door below the window band",
    -.066,.53,doorZ,.036,1.03,.48,M.ink);
  box(house,"warm pane in the upper door",
    -.094,.76,doorZ,.016,.33,.29,M.amber);
  add(house,"small door handle set in the front leaf",
    new THREE.SphereGeometry(.025,8,6),M.brass,-.117,.48,
    doorZ+.15);
  for(let step=0;step<2;step++) box(house,
    "two shallow stone steps leading from street to home",
    -.18-step*.22,.06+step*.07,doorZ,.46-step*.08,
    .12+step*.14,.67,M.plaster);
  curve(house,"fine chimney cap above the roof",
    [[2.21,h+.3,-.73],[2.21,h+.9,-.73],
      [2.37,h+.9,-.73]],.047,M.orange,8);
}
for (const z of [-5.9, -.9, 4.1]) {
  box(root, "shallow plaster pier between home windows", -5.97, 2.35, z,
    .21, 4.7, .22, M.plaster);
  curve(root, "carved plaster capital over the home windows",
    [[-5.91, 4.47, z - .17], [-5.88, 4.62, z],
      [-5.91, 4.47, z + .17]], .035, M.brass, 12);
}
const cabinetShade = material(0xa85b43);
for (const x of [-4.75, -2.35]) {
  const cabinet = add(root, "two fitted orange drawer cabinets below the curved desk",
    new RoundedBoxGeometry(.83, .78, .98, 4, .045), cabinetShade,
    x, .43, 2.38);
  cabinet.userData.solidFootprint = true;
  for (let drawer = 0; drawer < 3; drawer++) {
    const y = .22 + drawer * .23;
    add(root, "inset drawer face with softened corners",
      new RoundedBoxGeometry(.69, .184, .027, 3, .013), M.orange,
      x, y, 2.881);
    curve(root, "formed metal drawer pull", [[x - .105, y, 2.902],
      [x, y + .012, 2.928], [x + .105, y, 2.902]],
      .008, M.brass, 10);
  }
  for (const side of [-1, 1]) for (const depth of [-1, 1]) {
    beam(root, "small recessed steel foot beneath drawer cabinet",
      [x + side * .29, .03, 2.38 + depth * .36],
      [x + side * .29, .08, 2.38 + depth * .36], .026, .026, M.ink, 8);
  }
}

// Folded city blocks sit behind the street without asserting a real address.
for (let i = 0; i < 7; i++) {
  const x = -.1 + i * .88;
  const height = 2.15 + .54 * Math.sin(i * 1.38) + (i % 3) * .24;
  const brick = i % 2 ? M.orange : M.plaster;
  box(root, "distant brick building body", x, height / 2, -9.35,
    .8, height, 2.52, brick);
  for (let row = 0; row < 3; row++) for (const offset of [-.17, .17]) {
    const wx = x + offset, wy = .63 + row * .58;
    box(root, "recessed dark glass in an apartment window", wx, wy,
      -8.077, .19, .29, .012, M.night);
    for (const side of [-1, 1]) box(root, "narrow masonry window jamb",
      wx + side * .105, wy, -8.063, .025, .33, .025, M.paper);
    box(root, "projecting stone window sill", wx, wy - .17,
      -8.034, .25, .025, .055, M.paper);
    curve(root, "arched lintel above neighborhood window",
      [[wx - .105, wy + .16, -8.05], [wx, wy + .23, -8.05],
        [wx + .105, wy + .16, -8.05]], .016, M.brass, 10);
  }
  for (let step = 0; step < 3; step++) box(root,
    "layered projecting masonry cornice", x, height + step * .052, -8.3,
    .86 + step * .035, .045, .46 + step * .022, step === 1 ? M.brass : M.desk);
  if (i % 3 === 0) {
    const roof = new THREE.Shape();
    roof.moveTo(-.43, 0); roof.lineTo(0, .34); roof.lineTo(.43, 0); roof.closePath();
    const geometry = new THREE.ExtrudeGeometry(roof,
      { depth: .28, bevelEnabled: true, bevelSize: .015,
        bevelThickness: .015, bevelSegments: 1 });
    add(root, "pitched roof with a hand-finished silhouette",
      geometry, M.desk, x, height + .1, -8.46);
  }
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
box(root, "monitor's muted work-window header", -4.45, 2.49, 3.848,
  1.37, .075, .009, M.blue);
for (const [x, y, width] of [[-4.86, 2.32, .44], [-4.83, 2.17, .38],
  [-4.84, 2.02, .4], [-4.86, 1.87, .35]]) {
  box(root, "unreadable job-search row on the monitor",
    x, y, 3.849, width, .018, .009, M.paleBlue);
  box(root, "small warm row marker", x - .28, y, 3.851,
    .027, .027, .01, M.brass);
}
box(root, "monitor's dark side pane", -4.1, 2.11, 3.849,
  .41, .72, .009, M.blue);
for (let i = 0; i < 3; i++) box(root,
  "quiet unreadable note in the side pane", -4.13,
  2.32 - i * .17, 3.856, .23 - .03 * i, .014, .01, M.paper);
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
  const window = new THREE.Group();
  window.name = "unbranded laptop windows with tiny unreadable search notes";
  window.position.set(0, .57, -.235);
  window.rotation.x = -.15;
  group.add(window);
  box(window, "thin display toolbar", 0, .36, .01, 1.04, .055, .01, M.blue);
  for (let row = 0; row < 5; row++) {
    box(window, "abstract unreadable laptop line", -.21, .22 - row * .115,
      .012, .43 - (row % 2) * .09, .015, .01,
      row === 0 ? M.brass : M.paper);
    box(window, "small search-list inset", .31, .22 - row * .115,
      .012, .2, .036, .01, row % 2 ? M.night : M.teal);
  }
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
// A real plaster partition and rail support the instruments from Oleg's
// reference desk. Without this, they read as props floating in the sky.
box(root, "solid plaster music wall beside the work desk", -5.02, 2.47, 5.87,
  1.92, 4.78, .14, M.plaster, true);
for (const side of [-1, 1]) {
  box(root, "carved timber edge of the music wall", -5.02 + side * .95,
    2.44, 5.97, .085, 4.69, .13, M.desk);
  curve(root, "fine brass line carved into the music-wall edge",
    [[-5.02 + side * .93, .33, 6.05],
      [-5.02 + side * .93, 2.45, 6.05],
      [-5.02 + side * .93, 4.5, 6.05]], .009, M.brass, 22);
}
curve(root, "shaped cornice above Oleg's hanging instruments",
  [[-6.02, 4.7, 6.0], [-5.55, 4.84, 6.0],
    [-5.02, 4.9, 6.0], [-4.49, 4.84, 6.0],
    [-4.02, 4.7, 6.0]], .06, M.desk, 23);
box(root, "aged timber rail below the hanging instruments", -5.02, 2.18, 6.02,
  1.76, .075, .2, M.desk);
for (const [x, tint] of [[-5.35, M.ink], [-4.58, M.orange]]) {
  add(root, "small brass hook fixing instrument to the wall",
    new THREE.TorusGeometry(.055, .012, 7, 12), M.brass,
    x, 4.13, 6.045);
  const instrument = new THREE.Group();
  instrument.name = "hanging string instrument";
  instrument.position.set(x, 3.35, 6.04); root.add(instrument);
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

// The street trees will be placed when the shared 3D source has loaded.
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

const janeFigures = [], olegFigures = [];
function person(name, x, z, height, outfit, options = {}) {
  const cloth = paintedFabric(outfit);
  const group = new THREE.Group();
  group.name = `fully sculpted figure of ${name}`;
  group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
  addContactShadow(group, height);
  const child = Boolean(options.child);
  const jane = Boolean(options.jane);
  if (jane) janeFigures.push({ group, hands: options.hands, height });
  const oleg = Boolean(options.oleg);
  if (oleg) olegFigures.push({ group, hands: options.hands, height,
    pose: options.olegPose || "desk" });
  const skin = jane ? M.janeSkin : oleg ? M.olegSkin : M.skin;
  const hair = options.hair || M.hair;
  const legHeight = height * (child ? .44 : .49);
  for (const s of [-1, 1]) {
    loft(group, "tailored trouser leg with knee and cuff", [[.13, .105, .11, s * .135],
      [.22, .11, .115, s * .13], [Math.max(.27, legHeight * .38), .13, .12, s * .135],
      [legHeight * .59, .115, .12, s * .125],
      [legHeight * .75, .14, .13, s * .135],
      [legHeight, .15, .13, s * .13], [legHeight + .09, .145, .125, s * .13]],
    paintedFabric(options.pants || M.ink), 16);
    curvedShoe(group, s, M.desk);
    curve(group, "fold of trouser at the knee", [[s * .23, legHeight * .56, .09],
      [s * .14, legHeight * .54, .13], [s * .045, legHeight * .58, .085]],
    .008, options.pants || M.ink, 9);
    curve(group, "creased trouser seam with formed knee", [[s * .135, .18, .107],
      [s * .145, legHeight * .45, .123],
      [s * .125, legHeight * .72, .119]], .005, M.night, 12);
  }
  loft(group, "tailored cloth silhouette with waist, chest and shoulders",
    [[legHeight - .05, jane ? .235 : .245, .17],
      [legHeight + .10, jane ? .25 : .27, .175],
      [height - .57, jane ? .27 : .29, .18],
      [height - .43, .205, .14]], cloth, 20, true);
  loft(group, "sculpted neck emerging from the collar", [[height - .465, .079, .072],
    [height - .39, .071, .068], [height - .34, .064, .064]], skin, 14);
  for (const s of [-1, 1]) {
    curve(group, "tailored side seam and cloth drape",
      [[s * .23, legHeight + .06, .118],
        [s * .26, height - .77, .12], [s * .26, height - .53, .105]],
      .009, jane ? M.night : M.paper, 13);
    curve(group, "tailored pocket opening",
      [[s * .14, legHeight + .17, .155],
        [s * .205, legHeight + .18, .15],
        [s * .235, legHeight + .24, .134]], .007,
      jane ? M.floral : M.brass, 10);
  }
  curve(group, "hem stitched into the garment", [[-.23, legHeight + .02, .15],
    [0, legHeight - .015, .18], [.23, legHeight + .02, .15]], .008,
  jane ? M.floral : M.brass, 14);
  if (jane) {
    curve(group, "soft V neckline", [[-.15, height - .44, .125],
      [0, height - .58, .2], [.15, height - .44, .125]], .014, M.floral, 14);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const fx = s * (.09 + i * .033), fy = height - .63 - i * .105;
      curve(group, "embroidered botanical sprig on Jane's blouse",
        [[fx, fy - .06, .196], [fx + s * .018, fy, .208],
          [fx + s * .05, fy + .043, .19]], .005, i % 2 ? M.paper : M.floral, 9);
    }
  } else if (oleg) {
    curve(group, "cream shirt's joined crew neck", [[-.18, height - .44, .11],
      [0, height - .5, .195], [.18, height - .44, .11]], .018, M.paper, 15);
    for (let i = 0; i < 3; i++) curve(group, "shirt fabric crease",
      [[-.12 + i * .1, height - .72, .173],
        [-.08 + i * .08, height - .82, .178],
        [-.1 + i * .09, height - .89, .164]], .006, M.paper, 7);
  }
  for (const s of [-1, 1]) {
    const shoulder = [s * .22, height - .46, 0];
    const hand = options.hands?.[s] || [s * .33, height - 1.02, .16];
    const elbow = [s * .36, (height - .72 + hand[1]) / 2, (hand[2] + .05) / 2];
    sculptSleevedArm(add, group, { shoulder, elbow, hand,
      outfit: cloth, skin, trim: jane ? M.floral : M.paper,
      size: Math.min(1, height / 1.7) });
    curve(group, "stitched sleeve seam", [[s * .25, height - .48, .09],
      [s * .34, height - .66, .092], [elbow[0], elbow[1], elbow[2] + .075]],
      .006, jane ? M.floral : M.paper, 10);
  }
  const head = new THREE.Group();
  head.name = `${name} modeled and painted head`;
  if (oleg) {
    const jawPivot = height - .48;
    head.position.y = jawPivot * .28;
    head.scale.set(.86, .72, .82);
  } else {
    head.position.y = (height - .26) * .2;
    head.scale.setScalar(.8);
  }
  group.add(head);
  const faceHeight = height - .035;
  loft(head, `${name} modeled cheeks, jaw and brow`,
    [[faceHeight - .445, .055, .055],
      [faceHeight - .385, jane ? .136 : .118, .116],
      [faceHeight - .29, jane ? .178 : .16, .147],
      [faceHeight - .18, jane ? .196 : .18, .162],
      [faceHeight - .045, jane ? .18 : .17, .151],
      [faceHeight + .07, .145, .128],
      [faceHeight + .15, .027, .03]], skin, 28);
  const zephrine = child && name.startsWith("Zephrine");
  if (jane || oleg || zephrine) paintedFaceShell(head,
    jane ? "jane" : oleg ? "oleg" : "zephrine", height);
  for (const s of [-1, 1]) {
    loft(head, "formed ear and earlobe", [[faceHeight - .28, .023, .031,
      s * .184, -.012], [faceHeight - .19, .037, .043, s * .184, -.012],
      [faceHeight - .085, .022, .027, s * .178, -.017]], skin, 12);
    if (!jane && !oleg && !zephrine) {
      shapedEye(head, name, s * .078, faceHeight - .17, .154,
        child ? .78 : 1, M.paper, M.ink);
      curve(head, "upper eyelid shaped along the eye", [[s * .027, faceHeight - .153, .166],
        [s * .078, faceHeight - .138, .183], [s * .133, faceHeight - .158, .16]],
      .008, hair, 12);
      curve(head, "individual angled eyebrow", [[s * .031, faceHeight - .085, .15],
        [s * .082, faceHeight - .07, .164], [s * .131, faceHeight - .094, .142]],
      .012, hair, 12);
    }
    if (jane) {
      add(head, "Jane's small pearl earring", new THREE.IcosahedronGeometry(.015, 1),
        M.paper, s * .192, faceHeight - .265, .017);
      for (let i = 0; i < 3; i++) add(head, "subtle cheek freckle",
        new THREE.IcosahedronGeometry(.0035, 0), M.blush,
        s * (.11 + i * .014), faceHeight - .27 + i * .012, .147);
    }
  }
  if (!jane && !oleg && !zephrine) {
    loft(head, "rounded sculpted nose with bridge and tip",
      [[faceHeight - .285, .029, .032, 0, .17],
        [faceHeight - .265, .036, .045, 0, .181],
        [faceHeight - .205, .024, .035, 0, .187],
        [faceHeight - .12, .018, .02, 0, .165]], skin, 13);
    curve(head, "upper lip with a gentle human expression",
      [[-.057, faceHeight - .325, .135], [0, faceHeight - .317, .166],
        [.057, faceHeight - .325, .135]], .010, M.orange, 16);
    curve(head, "lower lip", [[-.045, faceHeight - .336, .138],
      [0, faceHeight - .35, .151], [.045, faceHeight - .336, .138]],
    .006, M.blush, 12);
  }
  if (options.glasses && !oleg) for (const s of [-1, 1]) {
    beam(head, "glasses arm sweeping toward the ear", [s * .14,
      faceHeight - .16, .08], [s * .185, faceHeight - .165, .008],
      .008, .007, M.ink, 7);
  }
  if (!oleg) loft(head, "custom hairline and swept three-dimensional hair",
    [[faceHeight + .025, .135, .125, 0, -.034],
      [faceHeight + .11, .185, .15, 0, -.025],
      [faceHeight + .21, .15, .126, 0, -.04],
      [faceHeight + .26, .045, .045, 0, -.05]], hair, 22);
  if (jane) {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
      curve(head, "dark hair combed back to Jane's bun",
        [[s * (.045 + i * .038), faceHeight + .03, .14],
          [s * (.075 + i * .026), faceHeight + .18, .105],
          [s * .06, faceHeight + .31, -.075]],
      .011 + i * .002, hair, 12);
    loft(head, "Jane's high twisted bun, not a sphere",
      [[faceHeight + .245, .075, .065, 0, -.075],
        [faceHeight + .29, .12, .10, 0, -.08],
        [faceHeight + .375, .13, .11, 0, -.085],
        [faceHeight + .45, .082, .07, 0, -.085],
        [faceHeight + .49, .012, .016, 0, -.085]], hair, 18);
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI * .55;
      curve(head, "twisted strand in Jane's bun",
        [[.07 * Math.cos(angle), faceHeight + .33, -.02 + .075 * Math.sin(angle)],
          [.12 * Math.cos(angle + .7), faceHeight + .385,
            -.085 + .09 * Math.sin(angle + .7)],
          [.035 * Math.cos(angle + 1.4), faceHeight + .465,
            -.085 + .04 * Math.sin(angle + 1.4)]], .011, hair, 9);
    }
    for (const s of [-1, 1]) curve(head, "soft wisps beside Jane's ear",
      [[s * .17, faceHeight + .05, -.008],
        [s * .196, faceHeight - .18, .004],
        [s * .17, faceHeight - .3, .018]], .012, hair, 10);
  } else if (child) {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) curve(head,
      "Zephrine's loose curl", [[s * (.12 + i * .025), faceHeight + .09, -.03],
        [s * (.2 + i * .018), faceHeight - .13, .005],
        [s * (.15 + i * .02), faceHeight - .32, .04]],
    .014, hair, 12);
  }
  if (child) for (let i = 0; i < 6; i++) curve(group,
    "embroidered small floral mark on Zephrine's dress",
    [[-.14 + i * .06, height - .76 + .06 * (i % 2), .18],
      [-.12 + i * .06, height - .72 + .06 * (i % 2), .19]],
    .006, i % 2 ? M.teal : M.floral, 5);
  return group;
}

// Five versions of Jane are a deliberately symbolic afterimage. Distinct
// poses and nearby props tell the story without labels or copied photos.
person("Jane advising Oleg", -.95, 4.58, 1.68, M.janeInk,
  { jane: true, hands: { "-1": [-.42, 1.29, .25],
    "1": [.23, .91, .32] }, yaw: -.25 });
person("Oleg at the job-search desk", -1.35, 4.82, 1.73, M.cream,
  { oleg: true, glasses: true, yaw: .42 });
// The earlier large white sheet covered Oleg's clothes and pose. Small
// unbranded application notes now live at the real desk instead of floating
// over his chest.
const notes = new THREE.Group();
notes.name = "worn open job-search notebook with many blank attempts";
notes.position.set(-1.7, .9385, 3.95);
notes.rotation.y = -.18;
root.add(notes);
box(notes, "dark cloth notebook cover with rounded bevel", 0, 0, 0,
  .51, .017, .37, M.ink);
for (const side of [-1, 1]) {
  const page = box(notes, "cream page with an uneven hand-folded edge",
    side * .126, .012, 0, .237, .006, .345, M.paper);
  page.rotation.y = side * .035;
  for (let line = 0; line < 5; line++) box(notes,
    "short unreadable penciled job-search line", side * .126, .0154,
    -.115 + line * .047, .14 - .023 * (line % 3), .0006, .006, M.brass);
}
beam(notes, "stitched cloth notebook spine", [0, .015, -.18],
  [0, .015, .18], .011, .011, M.desk, 8);
const caringJane = person("Jane caring for Zephrine", -3.96, -3.5, 1.68, M.janeInk,
  { jane: true, hands: { "-1": [-.4, .74, .25], "1": [.37, .8, .27] }, yaw: -.23 });
person("Zephrine with Jane", -3.2, -3.22, 1.05, M.paper,
  { child: true, hair: M.zephHair, pants: M.teal, hands: { "-1": [-.31, .6, .18] } });
const householdJane = person("Jane keeping the household going", -4.2, -6.0, 1.68, M.janeInk,
  { jane: true, hands: { "1": [.54, .84, .36] }, yaw: .35 });
const contactsJane = person("Jane reaching out to contacts", 2.45, 1.9, 1.68, M.janeInk,
  { jane: true, hands: { "1": [.56, .91, .38], "-1": [-.35, .66, .2] }, yaw: -.55 });
for (const [x, z, height, color] of [[3.55, 1.3, 1.75, M.orange],
  [3.73, 2.52, 1.6, M.paleBlue]]) {
  person("unnamed person Jane approached outdoors", x, z, height, color,
    { hair: M.night, yaw: .25 });
}
person("Jane holding Oleg when the search was hard", -.45, -5.88,
  1.68, M.janeInk, { jane: true, hands: { "-1": [-.55, 1.05, .5],
    "1": [.45, 1.02, .49] }, yaw: .38 });
person("Oleg leaning into Jane's embrace", .12, -5.48, 1.73, M.cream,
  { oleg: true, glasses: true,
    hands: { "-1": [-.41, 1.02, .45], "1": [.38, .89, .38] },
    olegPose: "embrace", yaw: -.4 });

// A quiet kitchen and ordinary work make the support concrete.
const kitchenStart=root.children.length;
box(root, "home counter", -4.82, .71, -5.02, 1.55, 1.38, .58, M.plaster, true);
box(root, "counter's orange front", -4.82, .48, -4.71, 1.39, .7, .04, M.orange);
for (const x of [-5.18, -4.45]) {
  box(root, "cabinet pull", x, .55, -4.68, .22, .025, .025, M.brass);
}
add(root, 'small cooking pan',new THREE.LatheGeometry([[0,0],[.19,0],[.23,.012],[.24,.060],[.223,.065],[.215,.020],[0,.020]].map(([r,y])=>new THREE.Vector2(r*.72,y)),32),M.ink,-4.70,1.40,-5.01);
beam(root, "pan handle", [-4.54, 1.46, -5.02], [-4.24, 1.46, -4.94],
  .014, .011, M.ink,16);
const kitchen=new THREE.Group();kitchen.name='waist-height kitchen counter and attached pan';for(const object of root.children.slice(kitchenStart))kitchen.add(object);kitchen.scale.y=.70;kitchen.position.y=-.014;root.add(kitchen);
// The connection between the simultaneous versions of Jane is instead
// carried by the existing gold seam in the pavement and her repeated actions.

async function authorRoom() {
  await facesReady;
  const [rig, janeRig, treeSource] = await Promise.all([
    loadRiggedOlegBase(), loadRiggedJaneBase(), loadAdaptedTree(),
  ]);
  for (let i = 0; i < 6; i++) {
    plantAdaptedTree(root, treeSource, {
      x: 4.45 + .55 * Math.sin(i * 1.3), z: -6.25 + i * 2.42,
      scale: .41 + i % 3 * .018, rotation: i * 1.17 + .2,
      leafTint: i % 2 ? 0xaec2aa : 0xbacbb4,
      name: "branching tree along Jane's symbolic street",
      colliderRadius: .17,
    });
  }
  for (const { group, hands, height } of janeFigures) {
    group.clear();
    addContactShadow(group, height);
    group.add(makeRiggedJane(janeRig, { height, hands }));
  }
  // These small, physical role details let Jane's repeated presence read as
  // separate acts of support rather than five copies of a neutral figure.
  const apronShape = new THREE.Shape();
  apronShape.moveTo(-.19, .66);
  apronShape.quadraticCurveTo(-.24, .85, -.2, 1.03);
  apronShape.lineTo(-.09, 1.25);
  apronShape.quadraticCurveTo(0, 1.28, .09, 1.25);
  apronShape.lineTo(.2, 1.03);
  apronShape.quadraticCurveTo(.24, .85, .19, .66);
  apronShape.quadraticCurveTo(0, .62, -.19, .66);
  const apron = add(householdJane, "tailored kitchen apron with curved sewn hem",
    new THREE.ExtrudeGeometry(apronShape, { depth: .015,
      bevelEnabled: true, bevelSize: .006, bevelThickness: .004,
      bevelSegments: 2, curveSegments: 8 }), M.paper, 0, 0, .24);
  apron.rotation.x = -.06;
  for (const side of [-1, 1]) {
    curve(householdJane, "apron waist ties around Jane's working clothes",
      [[side * .15, 1.04, .25], [side * .24, 1.05, .19],
        [side * .28, 1.01, -.02]], .011, M.orange, 12);
    curve(householdJane, "stitched apron pocket edge",
      [[side * .02, .86, .26], [side * .09, .81, .263],
        [side * .16, .86, .25]], .006, M.brass, 10);
  }
  loft(contactsJane, "worn satchel with softened corners",
    [[.68, .18, .1, -.26, .12], [.76, .20, .12, -.26, .12],
      [.93, .195, .105, -.26, .12], [.97, .15, .07, -.26, .12]], M.orange, 18);
  curve(contactsJane, "satchel strap running over Jane's shoulder",
    [[-.26, .92, .16], [-.15, 1.1, .23], [.12, 1.42, .19],
      [.2, 1.48, .06]], .018, M.brass, 20);
  curve(contactsJane, "satchel flap and clasp",
    [[-.43, .87, .22], [-.26, .85, .245], [-.09, .87, .22]],
    .012, M.desk, 11);
  box(contactsJane, "small rounded brass satchel clasp", -.26, .82, .249,
    .045, .038, .012, M.brass);
  // A thin sagging sheet spans the two actual hand targets and hangs
  // forward under gravity; the previous extruded outline was a rigid tray.
  const positions=[],uvs=[],indices=[],cols=24,rows=18;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows;positions.push(...caregivingBlanketPoint(u,v));
    uvs.push(u,v);
    if(j<rows&&i<cols){const a=j*(cols+1)+i,b=a+1,c=a+cols+1;indices.push(a,c,b,b,c,c+1);}
  }
  const blanketGeometry=new THREE.BufferGeometry();blanketGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));blanketGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));blanketGeometry.setIndex(indices);blanketGeometry.computeVertexNormals();
  const blanket=add(caringJane,'soft child blanket draped between the caregiving hands',blanketGeometry,M.paleBlue);blanket.material=blanket.material.clone();blanket.material.side=THREE.DoubleSide;
  for (const { group, hands, height, pose } of olegFigures) {
    group.clear();
    addContactShadow(group, height);
    group.add(makeRiggedOleg(rig, { pose, height, hands,
      shirtEmbroidery: false }));
  }
  await finishOlegPortraits(root);
  root.traverse((object) => {
    if (object.userData.paintedFace) object.material = paintedFaces[object.userData.paintedFace];
  });
  replaceStoryFigures(root,'02');
  finishStoryWorld(root,'02');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  addRoomLighting(scene,'02');
  scene.add(root);
  const camera = portalPreviewCamera(gallery.frames[1].room);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  prepareRoomShadows(root,'02',renderer);
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
