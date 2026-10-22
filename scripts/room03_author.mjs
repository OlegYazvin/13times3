import {replaceStoryFigures} from './storybook_figures.mjs';
import {finishStoryWorld} from './storyworld_finish.mjs';
import * as THREE from "three";
import { loadAdaptedTree, plantAdaptedTree } from "./adapted_tree.mjs";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { addRoomLighting } from "../client/explore/room-lighting.mjs";
import { addOpenSky } from "./open_sky.mjs";
import { addJanePortrait, addZephrinePortrait, addCharlizePortrait,
  finishOlegPortraits } from "./oleg_portrait.mjs";
import { addContactShadow } from "./stage_shadows.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";
import { paintedFabric } from "./painted_fabric.mjs";

// A friendship remembered across visits: two Chicago play spaces and a dance
// floor meet in one impossible garden. The places are suggestions, not a claim
// that a particular piece of equipment was used on a particular day.
const root = new THREE.Group();
root.name = "Jane made room for Zephrine and Charlize's friendship";
const C = {
  sky: 0xc4d6d5, ground: 0x9aab9c, moss: 0x647e70, deep: 0x415c65,
  leaf: 0x7f9a7b, paleLeaf: 0xb4c1a0, lilac: 0xaa9cba, blush: 0xda9f9b,
  peach: 0xd79a84, pink: 0xd2667d, blue: 0x486178, cream: 0xefe1c8,
  brass: 0xc5a56e, bark: 0x665659, ink: 0x353c4d, warmSkin: 0xd9a281,
  darkSkin: 0x9a6048, hair: 0x4c3430, darkHair: 0x241f27, white: 0xf4e6d0,
};
const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
const context = canvas.getContext("2d");
const image = context.createImageData(64, 64);
let seed = 303333;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < image.data.length; i += 4) {
  const value = 226 + Math.floor(random() * 27);
  image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
  image.data[i + 3] = 255;
}
context.putImageData(image, 0, 0);
const grain = new THREE.CanvasTexture(canvas); grain.colorSpace = THREE.SRGBColorSpace;
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, map: grain, roughness: .93, metalness: 0, side: THREE.DoubleSide, ...extra,
});
const M = Object.fromEntries(Object.entries(C).map(([key, value]) => [key, mat(value)]));
function add(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function box(parent, name, x, y, z, w, h, d, material, solid = false) {
  const mesh = add(parent, name, new THREE.BoxGeometry(w, h, d), material, x, y, z);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function beam(parent, name, a, b, r1, r2, material, sides = 8) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const axis = end.clone().sub(start);
  const mesh = add(parent, name, new THREE.CylinderGeometry(r2, r1, axis.length(), sides),
    material, ...start.clone().add(end).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return mesh;
}
function curve(parent, name, points, radius, material, segments = 20) {
  return add(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
    points.map(point => new THREE.Vector3(...point))), segments, radius, 7, false), material);
}
function loft(parent, name, rings, material, sides = 12, solid = false) {
  const positions = [], uv = [], indices = [];
  for (let row = 0; row < rings.length; row++) for (let side = 0; side < sides; side++) {
    const [y, rx, rz, cx = 0, cz = 0] = rings[row];
    const angle = side * Math.PI * 2 / sides;
    const nudge = 1 + .013 * Math.cos(angle * 7 + row);
    positions.push(cx + Math.cos(angle) * rx * nudge, y, cz + Math.sin(angle) * rz * nudge);
    uv.push(side / sides, row / (rings.length - 1));
  }
  for (let row = 0; row < rings.length - 1; row++) for (let side = 0; side < sides; side++) {
    const a = row * sides + side, b = row * sides + (side + 1) % sides;
    indices.push(a, b, a + sides, b, b + sides, a + sides);
  }
  for (let side = 1; side < sides - 1; side++) {
    indices.push(0, side + 1, side);
    const top = (rings.length - 1) * sides;
    indices.push(top, top + side, top + side + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = add(parent, name, geometry, material);
  if (solid) mesh.userData.solidFootprint = true;
  return mesh;
}
function petal(parent, name, x, y, z, scale, material, tilt = 0) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(-.55, .23, -.5, .82, 0, 1);
  shape.bezierCurveTo(.5, .82, .55, .23, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape,
    { depth: .025, bevelEnabled: false, curveSegments: 5 });
  const mesh = add(parent, name, geometry, material, x, y, z);
  mesh.scale.setScalar(scale); mesh.rotation.set(.24, tilt, .18);
  mesh.userData.batchPetal = true;
  return mesh;
}

// The ground and four-sided sky make an outdoor world even after Jane crosses
// the canvas. The forward side stays open for a real view back into the hall.
const ground = new THREE.PlaneGeometry(48, 52, 100, 110);
ground.rotateX(-Math.PI / 2);
const groundColors = [];
for (let i = 0; i < ground.attributes.position.count; i++) {
  const x = ground.attributes.position.getX(i), z = ground.attributes.position.getZ(i);
  ground.attributes.position.setY(i, .02 * Math.sin(x * 2.8 + z * 1.6));
  const color = new THREE.Color(C.ground).lerp(new THREE.Color(C.cream),
    .5 * Math.exp(-Math.pow(x / 1.2, 2)) + .23 * Math.exp(-Math.pow((z + 3.5) / 1.7, 2)));
  color.offsetHSL(0, 0, (random() - .5) * .045);
  groundColors.push(color.r, color.g, color.b);
}
ground.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
ground.computeVertexNormals();
add(root, "the ground where park visits become a dance floor", ground,
  mat(0xffffff, { vertexColors: true }));
addOpenSky(root, C.sky, C.ground);

// One continuous inlaid walk holds the repeated visits together. Its painted
// pigment changes gently across the stone, without loose tile polygons.
const pathCenter=z=>.12*Math.sin(z*.33)+.055*Math.sin(z*.91);
const pathHalfWidth=z=>1.27+.1*Math.sin(z*.27+.4);
{
  const vertices=[],colors=[],uv=[],indices=[],rows=48,columns=12;
  for(let row=0;row<=rows;row++) {
    const z=7.1-row*13.7/rows;
    for(let col=0;col<=columns;col++) {
      const across=col/columns*2-1;
      const x=pathCenter(z)+across*pathHalfWidth(z);
      vertices.push(x,.035+.003*Math.sin(z*2+x*3),z);
      uv.push(col/columns,row/rows);
      const color=new THREE.Color(C.ground)
        .lerp(new THREE.Color(C.cream),.67)
        .lerp(new THREE.Color(C.blush),.06+.05*Math.sin(z*.55+x*.75))
        .lerp(new THREE.Color(C.lilac),.05+.06*Math.sin(z*.94-x*.6));
      color.offsetHSL(0,0,(random()-.5)*.016);
      colors.push(color.r,color.g,color.b);
      if(row<rows&&col<columns) {
        const n=row*(columns+1)+col;
        indices.push(n,n+columns+1,n+1,n+1,n+columns+1,n+columns+2);
      }
    }
  }
  const path=new THREE.BufferGeometry();
  path.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  path.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  path.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  path.setIndex(indices);path.computeVertexNormals();
  add(root,"continuous hand-laid path through recurring friendship visits",
    path,mat(0xffffff,{vertexColors:true}));
}
for(const side of [-1,1]) curve(root,"fine brass edge of the inlaid garden walk",
  Array.from({length:25},(_,i)=>{
    const z=7-i*13.5/24;
    return [pathCenter(z)+side*pathHalfWidth(z),.045,z];
  }),.012,M.brass,49);
for(let seam=0;seam<10;seam++) {
  const z=6.25-seam*1.26;
  curve(root,"quiet curved joint between inlaid garden stones",
    [[pathCenter(z)-pathHalfWidth(z)*.96,.041,z-.1],
      [pathCenter(z),.042,z+.07*Math.sin(seam*1.2)],
      [pathCenter(z)+pathHalfWidth(z)*.96,.041,z+.08]],
    .004,M.ground,13);
}
// Cluster rooted stems along the walk. Broad low foliage volumes looked like
// sacks at human eye height, so the leaves and flowers grow from visible stalks.
for(const side of [-1,1]) for(let patch=0;patch<16;patch++) {
  const z=6.5-patch*.78;
  if(z>.55&&z<2.4) continue; // Jane and Aibike keep their clear silhouettes.
  const x=side*(1.72+.24*Math.sin(patch*1.8));
  for(let stalk=0;stalk<3;stalk++) {
    const sx=x+side*(stalk-1)*.13,sz=z+(stalk-1)*.18;
    const height=.33+.12*((patch+stalk)%3);
    curve(root,"rooted flowering stalk in the friendship garden",
      [[sx,.025,sz],[sx+side*.035,height*.55,sz-.025],
        [sx-side*.026,height,sz-.06]],.011,M.moss,10);
    for(const wing of [-1,1]) petal(root,
      "leaf attached to the garden stalk",
      sx+wing*.03,height*.31,sz-.025,.16,
      (patch+stalk)%3?M.leaf:M.paleLeaf,wing*.58);
    if((patch+stalk)%3===0) for(let pet=0;pet<5;pet++) {
      const a=pet*Math.PI*2/5;
      const bloom=petal(root,"small layered flower on its rooted stalk",
        sx+Math.cos(a)*.045,height+Math.sin(a)*.035,
        sz-.06,.095,patch%2?M.blush:M.cream,a);
      bloom.rotation.z=a;
    }
  }
}
for (let i = 0; i < 15; i++) {
  const x = (random() - .5) * 10.9, z = (random() - .5) * 13.2;
  if (Math.abs(x) < 1.15 && z > -3.3) continue;
  petal(root, "small painted leaf fallen beside the path", x, .038, z,
    .095 + random() * .09, i % 4 ? M.brass : M.pink, random() * 6.28);
}
for(const side of [-1,1]) for(let patch=0;patch<8;patch++) {
  const x=side*(1.7+random()*.95),z=5.9-patch*.82;
  const height=.26+random()*.24;
  curve(root,"living flower stem beside the path",
    [[x,.035,z],[x+side*.04,height*.58,z-.04],
      [x-side*.035,height,z-.1]],.018,M.moss,10);
  for(const wing of [-1,1]) petal(root,"low garden leaf attached to stem",
    x+wing*.055,height*.36,z-.03,.18,
    patch%3?M.leaf:M.paleLeaf,wing*.54);
  for(let flower=0;flower<5;flower++) {
    const a=flower*Math.PI*2/5;
    const bloom=petal(root,"overlapping dimensional garden flower",
      x+Math.cos(a)*.065,height+Math.sin(a)*.05,z-.1,
      .13,patch%3?M.blush:M.cream,a);
    bloom.rotation.z=a;
  }
  add(root,"tiny flower heart",new THREE.IcosahedronGeometry(.035,1),
    M.brass,x,height,z-.085);
}

// A quiet, shaded Fellger-like play nook on the left. The smallness is a
// setting cue. The flower-table is a symbolic game, not a documented event.
const parkTreePositions = [
  [-5.15, -4.7], [-5.1, -.2], [-4.7, 4.2],
  [4.83, 3.55], [4.95, -2.2],
];
box(root, "soft shaded play surface", -3.45, .035, -3.55,
  3.75, .055, 2.9, M.lilac);
for (let i = 0; i < 9; i++) {
  const x = -4.9 + (i % 3) * 1.45, z = -4.35 + Math.floor(i / 3) * .8;
  box(root, "soft playground tile", x, .072, z, 1.37, .01, .73,
    i % 2 ? M.blush : M.lilac);
}
const playTable = loft(root, "solid petal-shaped play table", [[.6, .29, .29, -3.7, -3.65],
  [.82, .39, .35, -3.7, -3.65], [.87, .74, .62, -3.7, -3.65]], M.cream, 12, true);
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5;
  petal(root, "pretend-food flower arranged on play table",
    -3.7 + Math.cos(angle) * .32, .89, -3.65 + Math.sin(angle) * .3,
    .16, i % 2 ? M.peach : M.pink, angle);
}

// A larger Hamlin-like park sweep on the right, with arched rails and broad
// paths. No exact playground apparatus is asserted by the reference photos.
const bridge = new THREE.Group(); bridge.name = "storybook park bridge";
bridge.position.set(3.55, 0, -3.9); root.add(bridge);
const bridgeTop=x=>.57+.2*(1-(x/1.8)**2);
{
  // Build the cambered deck as one joined timber shell. The former flat box
  // contradicted the arch of its rails and read as a platform from the path.
  const vertices=[],uv=[],indices=[];
  function quad(a,b,c,d) {
    const n=vertices.length/3;
    for(const p of [a,b,c,d]) vertices.push(...p);
    uv.push(0,0,1,0,0,1,1,1);
    indices.push(n,n+1,n+2,n+1,n+3,n+2);
  }
  for(let step=0;step<24;step++) {
    const x0=-1.8+step*.15,x1=x0+.15;
    const y0=bridgeTop(x0),y1=bridgeTop(x1);
    quad([x0,y0,-.57],[x1,y1,-.57],[x0,y0,.57],[x1,y1,.57]);
    quad([x0,y0-.14,.57],[x1,y1-.14,.57],
      [x0,y0-.14,-.57],[x1,y1-.14,-.57]);
    for(const side of [-1,1]) quad(
      [x0,y0,side*.57],[x1,y1,side*.57],
      [x0,y0-.14,side*.57],[x1,y1-.14,side*.57]);
  }
  quad([-1.8,bridgeTop(-1.8),-.57],[-1.8,bridgeTop(-1.8),.57],
    [-1.8,bridgeTop(-1.8)-.14,-.57],[-1.8,bridgeTop(-1.8)-.14,.57]);
  quad([1.8,bridgeTop(1.8),.57],[1.8,bridgeTop(1.8),-.57],
    [1.8,bridgeTop(1.8)-.14,.57],[1.8,bridgeTop(1.8)-.14,-.57]);
  const timber=new THREE.BufferGeometry();
  timber.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  timber.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  timber.setIndex(indices);timber.computeVertexNormals();
  add(bridge,"solid cambered plank-built bridge deck",timber,M.brass)
    .userData.solidFootprint=true;
}
for(let plank=1;plank<12;plank++) {
  const x=-1.8+plank*3.6/12,y=bridgeTop(x)+.006;
  curve(bridge,"seam between shaped bridge planks",
    [[x,y,-.54],[x,y+.005,0],[x,y,.54]],.008,M.bark,9);
}
for (const side of [-1, 1]) {
  const railX=[-1.8,-.9,0,.9,1.8];
  curve(bridge, "low flowing bridge rail", railX.map(x=>
    [x,bridgeTop(x)+.58,side*.55]), .055, M.bark, 34);
  curve(bridge,"lower shaped bridge rail",railX.map(x=>
    [x,bridgeTop(x)+.27,side*.55]),.026,M.cream,34);
  curve(bridge,"carved fascia following the bridge's camber",
    railX.map(x=>[x,bridgeTop(x)-.07,side*.58]),.025,M.bark,34);
  for (const x of [-1.5, -.75, 0, .75, 1.5]) {
    beam(bridge, "bridge rail baluster", [x, bridgeTop(x), side * .55],
      [x, bridgeTop(x)+.56, side * .55],
      .029, .025, M.bark);
  }
}
for (const x of [2.05, 5.05]) {
  box(root, "solid park bench base", x, .32, .45,
    .3, .64, .62, M.bark, true);
  for (const z of [.25, .6]) beam(root, "curved bench iron support",
    [x, .1, z], [x, .66, z], .035, .03, M.deep);
}
box(root, "solid shaped park bench seat", 3.55, .69, .43,
  3.67, .12, .66, M.bark, true);
for (const z of [.2, .34, .48, .62]) box(root,
  "separate painted wood slat on the bench seat",
  3.55, .77, z, 3.78, .055, .105, M.cream);
for (const y of [1.07, 1.26, 1.45]) curve(root,
  "curved timber slat in the bench back",
  [[1.75, y - .22, .79], [2.6, y + .05, .9],
    [3.55, y + .12, .92], [4.5, y + .05, .9], [5.35, y - .22, .79]],
  .034, y === 1.26 ? M.brass : M.bark, 32);

// A dance pavilion rises from the garden. Its solid carved arch and floor
// read as a built threshold while preserving the tall open sky above.
for (let i = -4; i <= 4; i++) {
  box(root, "warm dance floorboard", i * .55, .065, -6.35, .51, .07, 1.65,
    i % 2 ? M.cream : M.brass);
}
for (const side of [-1, 1]) {
  loft(root,"solid carved dance pavilion post",[
    [0,.2,.2,side*2.5,-5.55],[.16,.24,.21,side*2.5,-5.55],
    [.32,.17,.16,side*2.5,-5.55],[2.85,.15,.14,side*2.5,-5.55],
    [3.13,.2,.18,side*2.5,-5.55]],M.bark,20,true);
  for(const offset of [-.065,0,.065]) curve(root,
    "continuous flute cut into the dance pavilion post",
    [[side*2.5+offset,.31,-5.382],[side*2.5+offset,1.55,-5.402],
      [side*2.5+offset,2.85,-5.4]],.008,M.brass,16);
}
{
  const archY=x=>4.08-.98*(x/2.5)**2;
  const shape=new THREE.Shape();
  shape.moveTo(-2.56,archY(-2.5)+.13);
  for(let step=0;step<=40;step++) {
    const x=-2.56+step*5.12/40;
    shape.lineTo(x,archY(Math.max(-2.5,Math.min(2.5,x)))+.13);
  }
  for(let step=40;step>=0;step--) {
    const x=-2.56+step*5.12/40;
    shape.lineTo(x,archY(Math.max(-2.5,Math.min(2.5,x)))-.13);
  }
  shape.closePath();
  add(root,"joined sculpted timber arch above the open dance floor",
    new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,
      bevelSize:.018,bevelThickness:.018,bevelSegments:2}),
    M.bark,0,0,-5.69);
  curve(root,"gold inlay following the inner dance arch",
    Array.from({length:25},(_,i)=>{
      const x=-2.5+i*5/24;
      return [x,archY(x)-.105,-5.429];
    }),.018,M.brass,48);
}
curve(root,"rounded wooden dance barre",
  [[-2.45,1.34,-6.99],[0,1.34,-6.99],[2.45,1.34,-6.99]],
  .044,M.bark,24);
for (const x of [-2.24, 0, 2.24]) beam(root, "barre bracket", [x, 1.35, -6.99],
  [x, 1.25, -7.16], .025, .022, M.brass);
function figure(name, x, z, height, options) {
  const jane = name.startsWith("Jane");
  const zephrine = name.startsWith("Zephrine");
  const charlize = name.startsWith("Charlize");
  const painted = jane || zephrine || charlize;
  const person = new THREE.Group(); person.name = `solid sculpted figure of ${name}`;
  person.position.set(x, 0, z); person.rotation.y = options.yaw || 0; root.add(person);
  addContactShadow(person, height);
  const skin = mat(options.skin), hair = mat(options.hair);
  const outfit = paintedFabric(mat(options.outfit));
  const skirt = paintedFabric(mat(options.skirt || options.outfit));
  const childFigure = height < 1.45;
  const leg = height * (childFigure ? .44 : .49);
  for (const side of [-1, 1]) {
    loft(person, "shaped leg", [[.07, .095, .09, side * .125],
      [leg, .12, .105, side * .12], [leg + .08, .13, .1, side * .12]],
    options.pants ? paintedFabric(mat(options.pants)) : skin, 9);
    loft(person,"shaped walking shoe with rounded toe",
      [[.018,.08,.105,side*.125,.065],
        [.055,.11,.15,side*.125,.055],
        [.13,.095,.115,side*.125,.015],
        [.165,.058,.065,side*.125,-.02]],
      options.shoe ? mat(options.shoe) : M.ink,11);
    curve(person,"fold across walking shoe",
      [[side*.18,.083,.15],[side*.125,.095,.18],
        [side*.07,.083,.15]],.006,M.cream,9);
    if(childFigure) for(const dz of [.035,.105]) curve(person,
      "stitched fastening strap crossing the child's shaped shoe",
      [[side*.125-.077,.13,dz],[side*.125,.151,dz+.018],
        [side*.125+.077,.13,dz]],.009,
      zephrine?M.pink:M.cream,10);
  }
  const torsoRings = childFigure ?
    [[leg, .18, .145], [leg + .07, .205, .16],
      [height - .39, .175, .125]] :
    [[leg, .23, .17], [leg + .12, .265, .18],
      [height - .52, .245, .15], [height - .39, .195, .13]];
  loft(person, "tailored clothing with a solid body", torsoRings, outfit, 13, true);
  if (options.dress) {
    // The reference garments fall in separate pleats, with their legs and
    // knees still legible. A three-ring oval made both children look like toy
    // figures. Shape the actual cloth surface and sew its folds into it.
    const skirtPoint=(t,a,extra=0)=>{
      const fall=1-t;
      const pleat=1+.07*Math.sin(a*12+.2)*fall+.025*Math.cos(a*3-.5)*fall;
      const rx=(.335*fall+.215*t)*pleat+extra;
      const rz=(.255*fall+.165*t)*pleat+extra;
      const hem=(.013*Math.sin(a*12+.2)+.007*Math.cos(a*3-.5))*fall*fall;
      return [Math.cos(a)*rx,leg-.145+.345*t+hem,Math.sin(a)*rz];
    };
    const vertices=[],uv=[],colors=[],indices=[],rows=12,sides=48;
    for(let row=0;row<=rows;row++) for(let side=0;side<sides;side++) {
      const t=row/rows,a=side*Math.PI*2/sides;
      vertices.push(...skirtPoint(t,a));
      uv.push(side/sides,t);
      const fold=.91+.09*Math.cos(a*12+.2);
      colors.push(fold,fold*.997,fold*.99);
      if(row<rows) {
        const n=row*sides+side,b=row*sides+(side+1)%sides;
        indices.push(n,b,n+sides,b,b+sides,n+sides);
      }
    }
    const clothGeometry=new THREE.BufferGeometry();
    clothGeometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    clothGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    clothGeometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    clothGeometry.setIndex(indices);clothGeometry.computeVertexNormals();
    const foldedSkirt=skirt.clone();foldedSkirt.vertexColors=true;
    const cloth=add(person,"draped three-dimensional dress with sewn folds",
      clothGeometry,foldedSkirt);
    cloth.userData.solidFootprint=true;
    const fold=mat(new THREE.Color(options.skirt || options.outfit)
      .offsetHSL(0,-.045,-.11));
    for(let pleat=0;pleat<12;pleat++) {
      const a=(pleat+.55)*Math.PI*2/12;
      curve(person,"fine crease nested into dress fabric",
        [skirtPoint(.04,a,.004),skirtPoint(.45,a,.005),
          skirtPoint(.96,a,.005)],.0038,fold,13);
    }
    if (options.stripes) {
      for(let stripe=0;stripe<12;stripe++) {
        const a=(stripe+.25)*Math.PI*2/12;
        const vertices=[],uv=[],indices=[];
        for(const [row,t] of [0,.34,.67,1].entries()) {
          for(const side of [-1,1]) {
            const angle=a+side*.13;
            vertices.push(...skirtPoint(t,angle,.007));
            uv.push(side<0?0:1,row/3);
          }
          if(row<3) {
            const n=row*2;
            indices.push(n,n+2,n+1,n+1,n+2,n+3);
          }
        }
        const stripeMesh=new THREE.BufferGeometry();
        stripeMesh.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
        stripeMesh.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
        stripeMesh.setIndex(indices);stripeMesh.computeVertexNormals();
        add(person,"broad navy cloth stripe following Charlize's pleated skirt",
          stripeMesh,M.blue);
      }
      for(const [name,y,radius,material] of [
        ["rose waistband stitched over Charlize's stripes",1,.009,M.pink],
        ["rose hem following the scalloped skirt",0,.007,M.pink],
      ]) curve(person,name,Array.from({length:33},(_,i)=>{
        const a=i*Math.PI*2/32;
        return skirtPoint(y,a,.003);
      }),radius,material,33);
      for(const [low,high,bandMat] of [
        [.055,.115,M.white],[.145,.235,M.blue],
      ]) {
        const bandVertices=[],bandUV=[],bandIndices=[];
        for(let row=0;row<2;row++) for(let side=0;side<48;side++) {
          const a=side*Math.PI*2/48;
          bandVertices.push(...skirtPoint(row?high:low,a,.01));
          bandUV.push(side/48,row);
          const n=side,b=(side+1)%48;
          if(row===0) bandIndices.push(n,b,n+48,b,b+48,n+48);
        }
        const bandGeometry=new THREE.BufferGeometry();
        bandGeometry.setAttribute("position",
          new THREE.Float32BufferAttribute(bandVertices,3));
        bandGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(bandUV,2));
        bandGeometry.setIndex(bandIndices);bandGeometry.computeVertexNormals();
        add(person,"woven horizontal cloth band on Charlize's photographed dress",
          bandGeometry,bandMat);
      }
    }
  }
  for (const side of [-1, 1]) {
    const shoulder = [side * .2, height - .44, 0];
    const hand = options.hands?.[side] || [side * .3, height - .91, .12];
    const elbow = [side * .3, (height - .64 + hand[1]) / 2, hand[2] * .6];
    sculptSleevedArm(add, person, { shoulder, elbow, hand,
      outfit:options.sleeveless?skin:outfit, skin,
      trim:options.sleeveless?skin:M.cream,
      size: Math.min(1, height / 1.7) });
  }
  const face = height - .035;
  loft(person, "carved cheeks and chin", [[face - .4, .06, .06],
    [face - .31, .14, .115], [face - .15, .165, .14],
    [face + .04, .14, .12], [face + .14, .02, .02]], skin, 15);
  if (jane) addJanePortrait(person, face,
    [[-.4, .06, .06], [-.31, .14, .115], [-.15, .165, .14],
      [.04, .14, .12], [.12, .07, .07]], skin);
  if (zephrine) addZephrinePortrait(person, face,
    [[-.4, .06, .06], [-.31, .14, .115], [-.15, .165, .14],
      [.04, .14, .12], [.12, .07, .07]], skin);
  if (charlize) addCharlizePortrait(person, face,
    [[-.4, .06, .06], [-.31, .14, .115], [-.15, .165, .14],
      [.04, .14, .12], [.12, .07, .07]], skin);
  for (const side of [-1, 1]) {
    if (!painted) add(person, "painted eye white", new THREE.SphereGeometry(.022, 7, 6), M.white,
      side * .067, face - .16, .143);
    if (!painted) add(person, "painted iris", new THREE.SphereGeometry(.012, 7, 5), M.ink,
      side * .067, face - .16, .164);
    if (!painted) curve(person, "fine eyebrow", [[side * .025, face - .105, .146],
      [side * .07, face - .093, .153], [side * .11, face - .107, .14]], .007, hair);
  }
  if (!painted) loft(person, "sculpted nose", [[face - .255, .015, .017, 0, .145],
    [face - .155, .025, .027, 0, .17], [face - .14, .008, .008, 0, .152]], skin, 8);
  if (!painted) curve(person, "gentle smile", [[-.045, face - .3, .112],
    [0, face - .317, .128], [.045, face - .3, .112]], .008, M.pink);
  if (options.bun) {
    loft(person,charlize?"Charlize's fitted crown behind the painted curls":
      "gathered hair flowing continuously into a high bun",
      charlize?[
      [face+.015,.095,.08,0,-.08],
      [face+.065,.152,.12,0,-.09],
      [face+.11,.132,.108,0,-.105],
      [face+.15,.102,.084,0,-.12],
      [face+.19,.075,.066,0,-.14],
      [face+.22,.038,.037,0,-.14],
      [face+.235,.009,.01,0,-.14],
    ]:[
      [face+.025,.095,.08,0,-.055],
      [face+.09,.16,.13,0,-.065],
      [face+.15,.14,.115,0,-.075],
      [face+.2,.105,.09,0,-.085],
      [face+.25,.09,.08,0,-.09],
      [face+.29,.054,.052,0,-.09],
      [face+.31,.009,.01,0,-.09],
    ],hair,24);
    if(charlize) for(let strand=0;strand<12;strand++) {
      const a=strand*Math.PI*2/12;
      curve(person,"interlaced curl rooted in Charlize's high bun",[
        [Math.cos(a)*.066,face+.14,-.14+Math.sin(a)*.066],
        [Math.cos(a+.42)*.072,face+.18,-.14+Math.sin(a+.42)*.07],
        [Math.cos(a+.85)*.035,face+.22,-.14+Math.sin(a+.85)*.037],
      ],.008,hair,12);
    }
  } else loft(person, "sculpted back hair supporting the painted curls", [[face + .005, .1, .085,0,-.08],
    [face + .055, .152, .116, 0, -.085], [face + .105, .119, .094, 0, -.09],
    [face + .135, .015, .018, 0, -.09]], hair, 20);
  if(zephrine) {
    const bow=new THREE.Group();
    bow.name="small sewn pale-blue bow held in Zephrine's curls";
    bow.position.set(-.163,face+.035,.055);
    bow.rotation.set(.12,-.5,.28);
    bow.scale.setScalar(.72);
    person.add(bow);
    const ribbon=mat(0x9ec5d2);
    const wing=new THREE.Shape();
    wing.moveTo(0,0);
    wing.bezierCurveTo(.025,.025,.08,.04,.105,.018);
    wing.bezierCurveTo(.13,-.008,.1,-.047,.06,-.039);
    wing.quadraticCurveTo(.017,-.021,0,0);
    for(const side of [-1,1]) {
      const loop=add(bow,"folded cloth wing of Zephrine's hair bow",
        new THREE.ExtrudeGeometry(wing,{depth:.014,bevelEnabled:true,
          bevelThickness:.004,bevelSize:.004,bevelSegments:2,
          curveSegments:8}),ribbon);
      loop.scale.x=side;
    }
    loft(bow,"tailored central knot of the hair bow",
      [[-.024,.017,.014],[0,.024,.02],[.024,.017,.014]],ribbon,9);
  }
  curve(person, "stitched neckline", [[-.13, height - .41, .12],
    [0, height - .48, .16], [.13, height - .41, .12]], .012, M.cream);
  if (options.dress && options.stripes) {
    for (let i = 0; i < 5; i++) {
      const y=height-.48-i*.058;
      curve(person,"navy woven band around Charlize's fitted dress top",
        [[-.16,y,.12],[-.08,y-.004,.163],[0,y,.177],
          [.08,y-.004,.163],[.16,y,.12]],.017,M.blue,16);
    }
  }
  return person;
}

// The held hands and mirrored head tilt quote the supplied photos without
// publishing them. The girls have distinct skin, hair and clothing shapes.
const zeph = figure("Zephrine", -.42, -1.8, 1.13, {
  skin: C.warmSkin, hair: C.hair, outfit: C.peach, skirt: C.blush,
  shoe: C.pink, dress: true, curls: true, yaw: -.13,
  hands: { "1": [.38, .63, .22], "-1": [-.3, .73, .1] },
});
zeph.rotation.z = -.045;
zeph.position.z = 4.0;
const charlize = figure("Charlize", .42, 4.0, 1.17, {
  skin: C.darkSkin, hair: C.darkHair, outfit: C.white, skirt: C.white,
  shoe: C.ink, dress: true, stripes: true, sleeveless:true,
  bun: true, yaw: .12,
  hands: { "-1": [-.38, .63, .22], "1": [.3, .73, .1] },
});
charlize.rotation.z = .045;

// Jane and Aibike become friends too. Aibike is a stylized parent figure;
// no unprovided face likeness or invented biographical details are claimed.
figure("Jane making time for friendship", -2.55, 1.45, 1.68, {
  skin: C.warmSkin, hair: C.hair, outfit: C.blue, pants: C.deep,
  bun: true, yaw: -.28,
  hands: { "1": [.46, 1.05, .35], "-1": [-.33, .84, .15] },
});
figure("Aibike, Charlize's mother", 2.55, 1.45, 1.66, {
  skin: C.darkSkin, hair: C.darkHair, outfit: C.lilac, pants: C.ink,
  bun: true, yaw: .28,
  hands: { "-1": [-.46, 1.05, .35], "1": [.33, .84, .15] },
});
// The trees and park architecture give the memory a real upper silhouette.
// Keep the center open to sky rather than hanging ungrounded leaves and lines.
for (const side of [-1, 1]) {
  curve(root, "garden border branch", [[side * 5.55, .16, 6.4],
    [side * 5.4, .28, 2.1], [side * 5.6, .26, -2.2],
    [side * 5.35, .17, -6.7]], .07, M.bark, 52);
  for (let i = 0; i < 18; i++) petal(root, "low leaves along room edge",
    side * (5.1 + random() * .42), .16 + random() * .23,
    -6.7 + i * .72, .22 + random() * .1, i % 4 ? M.leaf : M.blush,
    random() * 6.28);
}

async function authorRoom() {
  const parkTree = await loadAdaptedTree();
  parkTreePositions.forEach(([x, z], index) => plantAdaptedTree(root, parkTree, {
    x, z, scale: .43 + index % 2 * .025,
    rotation: index * 1.41,
    leafTint: index % 2 ? 0xc7d2b9 : 0xb9c9ad,
    name: "detailed shade tree in the friendship garden",
    colliderRadius: .2,
  }));
  // The garden continues beyond its reachable edge as a shaded neighborhood
  // park. Reuse complete modeled trees rather than stretching the playable
  // ground into a blank horizon or surrounding the children with a low roof.
  for(const [index,x,z,scale] of [
    [0,-12.1,-17.2,.84],[1,-8.5,-12.8,.8],[2,-4.0,-12.6,.74],
    [3,4.0,-12.5,.76],[4,8.3,-13.1,.81],[5,12.2,-17.0,.88],
  ]) plantAdaptedTree(root, parkTree, {
    x,z,scale,rotation:index*1.17,
    leafTint:index%3===0?0xb8c8aa:index%3===1?0x8fae97:0xa9baa7,
    name:"distant modeled park tree beyond the walkable friendship garden",
    collidable:false,
  });
  await finishOlegPortraits(root);
  replaceStoryFigures(root,'03');
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse(object => {
    if (!object.userData.batchPetal) return;
    const list = groups.get(object.material) || [];
    list.push(object); groups.set(object.material, list);
  });
  for (const [material, objects] of groups) {
    const geometry = mergeGeometries(objects.map(object =>
      object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
    if (!geometry) throw new Error("Could not merge leaves");
    for (const object of objects) object.parent.remove(object);
    add(root, "grouped dimensional leaves and petals", geometry, material);
  }
  finishStoryWorld(root,'03');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(C.sky);
  addRoomLighting(scene,'03');
  scene.add(root);
  const view = gallery.frames[2].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 120);
  camera.position.fromArray(view.position); camera.lookAt(...view.target);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735, Math.round(735 * FRAME_HEIGHT / FRAME_WIDTH));
  document.body.append(renderer.domElement);
  renderer.render(scene, camera);
  const preview = renderer.domElement.toDataURL("image/webp", .86);
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, { binary: true, maxTextureSize: 1024 });
  renderer.dispose();
  const glbData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); reader.onerror = reject;
    reader.readAsDataURL(new Blob([glb], { type: "model/gltf-binary" }));
  });
  return { preview, glb: glbData, objects: root.children.length };
}
window.__authorRoom = authorRoom;
