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
// Tall side panes hold a diffuse wash of the world beyond the workspace.
// It is deliberately unlocatable: the remembered conflict is Jane's, while
// the glass supplies depth, daylight, and a warmer direction of escape.
const windowCanvas=document.createElement("canvas");
windowCanvas.width=256;windowCanvas.height=512;
const windowContext=windowCanvas.getContext("2d");
const daylight=windowContext.createLinearGradient(0,0,0,512);
daylight.addColorStop(0,"#556878");
daylight.addColorStop(.43,"#8ca8a8");
daylight.addColorStop(.76,"#c7c9b0");
daylight.addColorStop(1,"#e3c7a0");
windowContext.fillStyle=daylight;windowContext.fillRect(0,0,256,512);
for(let i=0;i<23;i++) {
  const x=random()*256,y=random()*480;
  const glow=windowContext.createRadialGradient(x,y,0,x,y,27+random()*72);
  glow.addColorStop(0,i%3?"rgba(241,225,194,.12)":"rgba(96,139,150,.16)");
  glow.addColorStop(1,"rgba(255,255,255,0)");
  windowContext.fillStyle=glow;
  windowContext.fillRect(0,0,256,512);
}
for(const [x,width] of [[33,4],[82,8],[143,5],[208,7]]) {
  windowContext.fillStyle="rgba(55,82,91,.15)";
  windowContext.fillRect(x,0,width,512);
}
const windowWash=new THREE.CanvasTexture(windowCanvas);
windowWash.colorSpace=THREE.SRGBColorSpace;
const coolGlass=new THREE.MeshStandardMaterial({color:0xc8d4cb,map:windowWash,
  emissive:0x4e6a6b,emissiveIntensity:.22,roughness:.47,
  side:THREE.DoubleSide});
const warmGlass=new THREE.MeshStandardMaterial({color:0xf0d4ae,
  emissive:0xd3a56e,emissiveIntensity:.35,roughness:.66,
  side:THREE.DoubleSide});
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
      3.1, z + 1.48, .045, 3.83, 2.44, coolGlass);
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
    i < 0 ? coolGlass : warmGlass, x, 1.18, -8.62);
  curve(root, "masonry arch around daylight window",
    [[x - .62, 1.18, -8.54], [x - .62, 1.18 + tall - .45, -8.54],
      [x, 1.18 + tall, -8.54], [x + .62, 1.18 + tall - .45, -8.54],
      [x + .62, 1.18, -8.54]], .043, M.mortar, 24);
  beam(root, "slender transom within window",
    [x - .58, 2.88, -8.53], [x + .58, 2.88, -8.53],
    .021, .021, M.brass, 6);
}

// A few actual suspended lamps give the large office an inhabited scale.
// Their turned metal shells, inner glass, and attached supports replace the
// feeling of unexplained thin lines hanging from the plaster vault.
const lampGlow=new THREE.MeshStandardMaterial({color:0xf5dcc0,
  emissive:0xe3aa73,emissiveIntensity:.68,roughness:.62,
  side:THREE.DoubleSide});
const shadeProfile=[
  [.11,.53],[.18,.48],[.24,.43],[.32,.35],
  [.4,.23],[.46,.12],[.47,.04],[.45,0],
].map(([r,y])=>new THREE.Vector2(r,y));
const shadeGeometry=new THREE.LatheGeometry(shadeProfile,28);
for(const [index,x,z] of [
  [0,-2.9,4.15],[1,2.85,.65],[2,-2.6,-2.85],[3,2.9,-6.3],
]) {
  const light=new THREE.Group();
  light.name="suspended fluted office pendant with an inset glass diffuser";
  light.position.set(x,0,z);root.add(light);
  beam(light,"fixed pendant cable from the plaster vault",
    [0,4.55,0],[0,6.25,0],.014,.012,M.ink,10);
  add(light,"small turned ceiling rose joining the lamp cable",
    new THREE.CylinderGeometry(.095,.075,.07,18),M.brass,0,6.27,0);
  add(light,"continuous spun-metal lamp shade",shadeGeometry,M.ink,
    0,4.08,0);
  add(light,"warm recessed diffuser under the metal shade",
    new THREE.CircleGeometry(.432,30),lampGlow,0,4.085,0)
    .rotation.x=-Math.PI/2;
  add(light,"rolled brass lower rim of the pendant",
    new THREE.TorusGeometry(.452,.021,8,32),M.brass,0,4.11,0)
    .rotation.x=Math.PI/2;
  for(let flute=0;flute<12;flute++) {
    const angle=flute*Math.PI*2/12+index*.07;
    curve(light,"fine radial flute pressed into the metal shade",[
      [Math.cos(angle)*.2,4.52,Math.sin(angle)*.2],
      [Math.cos(angle)*.33,4.42,Math.sin(angle)*.33],
      [Math.cos(angle)*.45,4.17,Math.sin(angle)*.45],
    ],.0045,M.brass,12);
  }
}

// A single, hand-shaped oculus suggests a world beyond the office pressure.
// The glass is seated inside plaster and has real curved muntins; it reads
// overhead on a portrait phone without claiming this was a literal skylight.
const skylightCanvas=document.createElement("canvas");
skylightCanvas.width=skylightCanvas.height=256;
const skylightPaint=skylightCanvas.getContext("2d");
const skyWash=skylightPaint.createLinearGradient(0,0,256,256);
skyWash.addColorStop(0,"#98b2b6");
skyWash.addColorStop(.42,"#b9c9bc");
skyWash.addColorStop(.77,"#e3d5b2");
skyWash.addColorStop(1,"#f4d7aa");
skylightPaint.fillStyle=skyWash;
skylightPaint.fillRect(0,0,256,256);
for(let i=0;i<16;i++) {
  const x=random()*256,y=random()*256;
  const bloom=skylightPaint.createRadialGradient(x,y,0,x,y,17+random()*39);
  bloom.addColorStop(0,"rgba(255,246,217,.24)");
  bloom.addColorStop(1,"rgba(255,246,217,0)");
  skylightPaint.fillStyle=bloom;
  skylightPaint.fillRect(0,0,256,256);
}
const skyGlassTexture=new THREE.CanvasTexture(skylightCanvas);
skyGlassTexture.colorSpace=THREE.SRGBColorSpace;
const skyGlass=new THREE.MeshBasicMaterial({map:skyGlassTexture,
  color:0xffffff,side:THREE.DoubleSide});
function oculusShape(radiusX,radiusY) {
  const shape=new THREE.Shape();
  shape.moveTo(-radiusX,0);
  shape.bezierCurveTo(-radiusX,-radiusY*.6,-radiusX*.54,-radiusY,0,-radiusY);
  shape.bezierCurveTo(radiusX*.66,-radiusY,radiusX*.96,-radiusY*.42,radiusX,0);
  shape.bezierCurveTo(radiusX*.93,radiusY*.6,radiusX*.48,radiusY,0,radiusY);
  shape.bezierCurveTo(-radiusX*.53,radiusY,-radiusX*.92,radiusY*.55,-radiusX,0);
  return shape;
}
const oculus=new THREE.Group();
oculus.name="joined plaster oculus holding painted daylight over Jane";
oculus.position.set(0,6.22,-1.15);
oculus.rotation.x=-Math.PI/2;root.add(oculus);
add(oculus,"broad shaped plaster recess beneath the office vault",
  new THREE.ShapeGeometry(oculusShape(2.18,2.28),32),M.mortar);
const glassGeometry=new THREE.ShapeGeometry(oculusShape(1.91,2.02),32);
const uv=glassGeometry.attributes.uv;
for(let i=0;i<uv.count;i++)
  uv.setXY(i,(uv.getX(i)+1.91)/3.82,(uv.getY(i)+2.02)/4.04);
add(oculus,"painted cool-to-warm glazing seated inside carved plaster",
  glassGeometry,skyGlass,0,0,-.026);
const boundary=oculusShape(1.92,2.03).getPoints(42)
  .map(point=>[point.x,point.y,-.06]);
boundary.push(boundary[0]);
curve(oculus,"continuous raised inner glazing bead",boundary,.033,M.brass,66);
curve(oculus,"long central rib joined to both ends of the glazing",[
  [0,-1.98,-.065],[.035,-.96,-.077],
  [0,0,-.083],[-.035,.96,-.077],[0,1.98,-.065]],
  .022,M.brass,36);
for(const y of [-.72,.76]) curve(oculus,
  "shallow bowed transom seated in the oculus frame",[
    [-1.58,y,-.065],[-.77,y+.08,-.075],
    [0,y+.12,-.082],[.78,y+.08,-.075],
    [1.58,y,-.065]],.015,M.brass,32);

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
    [[-spread + .2, 5.23, z], [-spread * .58, 5.55 + row * .07, z - .1],
      [0, 5.78 + row * .08, z - .2],
      [spread * .58, 5.55 + row * .07, z - .1],
      [spread - .2, 5.23, z]], .06,
    row < 2 ? M.ink : M.brass, 38);
}

// A continuous terrazzo inlay widens from the compressed entry to the warm
// far windows. It is a physical floor surface, with hand-laid irregular edges,
// not a set of straight luminous seams or a digital-looking tile grid.
{
  const positions=[],colors=[],uvs=[],indices=[],rows=52,across=12;
  const near=new THREE.Color(0x78666c),far=new THREE.Color(0xe0c39e);
  const edgePaths=[[],[]];
  for(let row=0;row<=rows;row++) {
    const t=row/rows,z=8.62-t*16.86;
    const center=.16*Math.sin(t*Math.PI*2.25)-.08*Math.sin(t*6.4);
    const width=.78+2.44*Math.pow(t,1.28);
    for(let column=0;column<=across;column++) {
      const u=column/across*2-1;
      const seam=.055*Math.sin(t*23+u*4.7)+.031*Math.sin(t*41-u*8.2);
      const x=center+u*(width+seam*Math.pow(Math.abs(u),3));
      positions.push(x,.046+.002*Math.sin(t*19+u*3),z);
      uvs.push(column/across,t*4);
      const grain=.035*Math.sin(t*31+u*17)+.018*Math.sin(t*73-u*11);
      const pigment=near.clone().lerp(far,Math.pow(t,.79))
        .multiplyScalar(1-.075*Math.pow(Math.abs(u),5)+grain);
      colors.push(pigment.r,pigment.g,pigment.b);
      if(row<rows&&column<across) {
        const a=row*(across+1)+column,b=a+across+1;
        indices.push(a,b,a+1,a+1,b,b+1);
      }
      if(column===0) edgePaths[0].push([x,.052,z]);
      if(column===across) edgePaths[1].push([x,.052,z]);
    }
  }
  const inlay=new THREE.BufferGeometry();
  inlay.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  inlay.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  inlay.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  inlay.setIndex(indices);inlay.computeVertexNormals();
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,256,256);
  let grainSeed=505052;
  const grain=()=>((grainSeed=(grainSeed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<640;i++) {
    const x=grain()*256,y=grain()*256,r=.3+grain()*1.6;
    ctx.fillStyle=i%5===0?"rgba(106,79,73,.18)":
      i%3===0?"rgba(159,121,106,.15)":"rgba(97,91,91,.11)";
    ctx.beginPath();ctx.ellipse(x,y,r,r*(.42+grain()*.58),
      grain()*6.28,0,6.28);ctx.fill();
  }
  for(let i=0;i<18;i++) {
    const x=grain()*256,y=grain()*256,r=7+grain()*21;
    const wash=ctx.createRadialGradient(x,y,0,x,y,r);
    wash.addColorStop(0,i%2?"rgba(153,116,107,.065)":
      "rgba(101,97,112,.06)");
    wash.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=wash;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const terrazzo=new THREE.CanvasTexture(canvas);
  terrazzo.colorSpace=THREE.SRGBColorSpace;
  terrazzo.wrapS=terrazzo.wrapT=THREE.RepeatWrapping;
  add(root,"widening hand-laid terrazzo path through the office",
    inlay,new THREE.MeshStandardMaterial({vertexColors:true,
      map:terrazzo,roughness:.97,side:THREE.DoubleSide}));
  for(const path of edgePaths)
    curve(root,"quiet uneven stone edge seated in terrazzo",
      path,.014,M.mortar,52);
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
// A small, usable moving trolley and packed files give the relocation a
// physical scale. Its handle and wheels are connected, unlike loose boxes
// scattered for decoration.
const trolley = new THREE.Group(); trolley.name = "office moving trolley and packed files";
trolley.position.set(-4.15, 0, 2.15); root.add(trolley);
const cartShape = new THREE.Shape();
cartShape.moveTo(-.58,-.43); cartShape.lineTo(.58,-.43);
cartShape.quadraticCurveTo(.7,-.43,.7,-.3); cartShape.lineTo(.7,.33);
cartShape.quadraticCurveTo(.7,.45,.57,.45); cartShape.lineTo(-.57,.45);
cartShape.quadraticCurveTo(-.7,.45,-.7,.33); cartShape.lineTo(-.7,-.3);
cartShape.quadraticCurveTo(-.7,-.43,-.58,-.43);
const cartDeck = new THREE.ExtrudeGeometry(cartShape,{depth:.11,
  bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2});
cartDeck.rotateX(-Math.PI/2);
const deck=add(trolley,"solid shaped timber moving trolley deck",cartDeck,
  M.brick,0,.22,0);
deck.userData.solidFootprint=true;
for(const side of [-1,1]) for(const z of [-.3,.31]) {
  const caster=add(trolley,"rubber caster attached beneath the cart",
    new THREE.CylinderGeometry(.12,.12,.085,12),M.ink,side*.48,.13,z);
  caster.rotation.z=Math.PI/2;
  add(trolley,"brass caster hub",new THREE.CylinderGeometry(.042,.042,.09,10),
    M.brass,side*.49,.13,z).rotation.z=Math.PI/2;
}
for(const side of [-1,1]) beam(trolley,"continuous bent trolley push rail",
  [side*.55,.29,-.34],[side*.55,1.08,-.55],.023,.02,M.ink,9);
beam(trolley,"joined upper trolley grip",[-.55,1.08,-.55],
  [.55,1.08,-.55],.026,.026,M.ink,9);
for(const [x,z,y,w,h,d] of [[-.25,.02,.64,.53,.58,.5],
  [.27,.09,.56,.37,.42,.4],[-.18,-.14,1.13,.34,.32,.3]]) {
  box(trolley,"solid taped carton packed on the moving trolley",
    x,y,z,w,h,d,M.paper,true);
  box(trolley,"folded carton flaps and lid",x,y+h/2+.018,z,
    w+.015,.035,d+.015,M.mortar);
  curve(trolley,"tape fixed across a carton lid",[
    [x,y+h/2+.043,z-d*.4],[x,y+h/2+.043,z],
    [x,y+h/2+.043,z+d*.4]],.008,M.brass,10);
}
// The former solid cuboid looked like a placeholder. This table has an actual
// undercroft, joined legs, a rounded top and a shallow drawer. Its top remains
// a solid collision footprint so visitors cannot pass through the furniture.
const workTable=new THREE.Group();
workTable.name="vacated shared work table with shaped joinery and filed papers";
workTable.position.set(4.7,0,-3.65);root.add(workTable);
const tabletopShape=new THREE.Shape();
tabletopShape.moveTo(-.78,-.49);tabletopShape.lineTo(.78,-.49);
tabletopShape.quadraticCurveTo(.95,-.49,.95,-.32);
tabletopShape.lineTo(.95,.32);
tabletopShape.quadraticCurveTo(.95,.49,.78,.49);
tabletopShape.lineTo(-.78,.49);
tabletopShape.quadraticCurveTo(-.95,.49,-.95,.32);
tabletopShape.lineTo(-.95,-.32);
tabletopShape.quadraticCurveTo(-.95,-.49,-.78,-.49);
const tabletopGeometry=new THREE.ExtrudeGeometry(tabletopShape,{
  depth:.105,bevelEnabled:true,bevelSize:.023,
  bevelThickness:.018,bevelSegments:2,curveSegments:9});
tabletopGeometry.rotateX(-Math.PI/2);
const tabletop=add(workTable,"solid chamfered communal worktop",
  tabletopGeometry,M.paper,0,1.39,0);
tabletop.userData.solidFootprint=true;
for(const side of [-1,1]) for(const end of [-1,1])
  loft(workTable,"tapered timber table leg joined beneath the worktop",
    [[.04,.073,.07,side*.73,end*.3],
      [.23,.07,.068,side*.73,end*.3],
      [1.29,.055,.06,side*.73,end*.3],
      [1.42,.069,.067,side*.73,end*.3]],M.ink,10);
for(const end of [-1,1]) box(workTable,
  "continuous shaped table apron between the leg pairs",
  0,1.25,end*.37,1.52,.16,.07,M.ink);
box(workTable,"recessed drawer face beneath the near table edge",
  0,1.24,.414,.59,.13,.027,M.brick);
curve(workTable,"shaped brass drawer pull",
  [[-.08,1.25,.437],[0,1.22,.463],[.08,1.25,.437]],.009,M.brass,10);
for(const [x,z,w] of [[-.38,-.12,.38],[.22,.13,.32]]) {
  box(workTable,"bound stack of blank moving documents",
    x,1.524,z,w,.05,.28,M.paper);
  curve(workTable,"stitched folder spine around blank records",
    [[x-w*.5,1.558,z-.13],[x-w*.5,1.558,z],
      [x-w*.5,1.558,z+.13]],.008,M.brick,9);
}

// Acoustic work pods are hollow, inward-facing pieces of furniture rather
// than black cuboids. Their curved roofs, felt interiors and partly open glass
// leaves make their scale understandable from the central walk.
for(const side of [-1,1]) {
  const pod=new THREE.Group();
  pod.name="quiet office work pod with felt lining and an open glazed leaf";
  pod.position.set(side*5,0,-6.4);
  pod.rotation.y=-side*Math.PI/2;
  root.add(pod);
  const base=box(pod,"solid chamfered threshold beneath work pod",
    0,.075,0,1.38,.15,1.35,M.brick,true);
  base.userData.solidFootprint=true;
  box(pod,"deep acoustic back wall of the work pod",
    0,1.32,-.56,1.23,2.48,.085,M.ink);
  box(pod,"warm inset felt lining inside the work pod",
    0,1.35,-.507,1.04,2.32,.02,M.rose);
  for(const edge of [-1,1]) {
    box(pod,"formed side wall of the work pod",
      edge*.64,1.3,0,.09,2.46,1.28,M.ink);
    box(pod,"felt inset on the work pod side wall",
      edge*.584,1.31,-.1,.018,2.2,.96,M.brickLight);
    beam(pod,"front joinery stile around the pod opening",
      [edge*.66,.15,.65],[edge*.66,2.52,.65],.045,.045,M.mortar,10);
  }
  const canopyShape=new THREE.Shape();
  canopyShape.moveTo(-.7,2.34);
  canopyShape.bezierCurveTo(-.58,2.68,-.27,2.79,0,2.8);
  canopyShape.bezierCurveTo(.27,2.79,.58,2.68,.7,2.34);
  canopyShape.lineTo(.56,2.34);
  canopyShape.bezierCurveTo(.38,2.58,.18,2.65,0,2.65);
  canopyShape.bezierCurveTo(-.18,2.65,-.38,2.58,-.56,2.34);
  canopyShape.closePath();
  add(pod,"continuous curved acoustic canopy over the work pod",
    new THREE.ExtrudeGeometry(canopyShape,{
      depth:1.35,bevelEnabled:true,bevelSize:.014,
      bevelThickness:.012,bevelSegments:2,curveSegments:12}),
    M.ink,0,0,-.68);
  box(pod,"small built-in writing shelf inside the pod",
    0,1.03,-.34,.9,.07,.34,M.paper);
  box(pod,"soft task light housed under the pod canopy",
    0,2.57,-.25,.34,.035,.14,M.amber);
  const door=new THREE.Group();
  door.name="partly open glass leaf on brass hinges";
  door.position.set(-.6,0,.665);door.rotation.y=-.24;
  pod.add(door);
  box(door,"slender glazed office pod door",.27,1.32,0,
    .55,2.28,.035,M.glass);
  for(const edge of [0,.55]) beam(door,"tall door frame stile",
    [edge,.18,.027],[edge,2.48,.027],.018,.018,M.mortar,9);
  beam(door,"door head rail",[0,2.48,.028],[.55,2.48,.028],
    .018,.018,M.mortar,7);
  curve(door,"brass pull fixed to the glazed door",
    [[.47,1.15,.055],[.51,1.23,.07],[.47,1.31,.055]],
    .013,M.brass,10);
}

// Living plants soften the hard office perimeter. Each leaf has a midrib,
// camber and changing outline, so these read as grown forms rather than a
// pile of green spheres. Pots are solid at floor level; leaves can overhang.
const leafGreen=new THREE.MeshStandardMaterial({color:0x87957d,
  roughness:.92,side:THREE.DoubleSide});
const leafDark=new THREE.MeshStandardMaterial({color:0x5d756c,
  roughness:.95,side:THREE.DoubleSide});
function addLeaf(parent,start,end,width,material) {
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end);
  const axis=b.clone().sub(a);
  const across=new THREE.Vector3(-axis.z,0,axis.x).normalize();
  const positions=[],uvs=[],indices=[];
  for(let row=0;row<=8;row++) {
    const t=row/8;
    const mid=a.clone().addScaledVector(axis,t);
    mid.y+=.035*Math.sin(Math.PI*t);
    const half=width*Math.pow(Math.sin(Math.PI*t),.72);
    for(let col=-1;col<=1;col++) {
      const point=mid.clone().addScaledVector(across,col*half);
      point.y-=Math.abs(col)*half*.17;
      positions.push(point.x,point.y,point.z);
      uvs.push((col+1)/2,t);
    }
  }
  for(let row=0;row<8;row++) for(let col=0;col<2;col++) {
    const i=row*3+col;
    indices.push(i,i+3,i+1,i+1,i+3,i+4);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  add(parent,"arched living leaf with a cupped surface",geo,material);
  curve(parent,"vein joining the leaf to its stem",[
    start,[a.x+axis.x*.35,a.y+axis.y*.35+.03,a.z+axis.z*.35],
    [a.x+axis.x*.72,a.y+axis.y*.72+.03,a.z+axis.z*.72],end],
  .0045,M.olive,12);
}
for(const [index,x,z] of [
  [0,-4.45,-1.35],[1,3.0,2.7],[2,-4.8,-5.5],
  [3,4.5,-5.12],[4,-4.35,6.7],
]) {
  const plant=new THREE.Group();
  plant.name="potted living office foliage with sculpted leaves";
  plant.position.set(x,0,z);root.add(plant);
  const potProfile=[[0,.23],[.04,.24],[.06,.25],[.12,.225],
    [.4,.19],[.47,.23],[.49,.23],[.5,.185]]
    .map(([y,r])=>new THREE.Vector2(r,y));
  const pot=add(plant,"solid tapered ceramic planter with turned lip",
    new THREE.LatheGeometry(potProfile,24),
    index%2?M.brickLight:M.mortar);
  pot.userData.solidFootprint=true;
  add(plant,"dark recessed soil inside the planter",
    new THREE.CircleGeometry(.185,24),M.ink,0,.486,0)
    .rotation.x=-Math.PI/2;
  for(let branch=0;branch<7;branch++) {
    const angle=(branch*2.39996+index*.53);
    const reach=.37+(branch%3)*.115;
    const height=.96+(branch%4)*.19;
    const bend=[Math.cos(angle)*reach*.68,height*.73,
      Math.sin(angle)*reach*.68];
    const tip=[Math.cos(angle)*reach,height,
      Math.sin(angle)*reach];
    curve(plant,"continuous tapering foliage stem",[
      [0,.47,0],[bend[0]*.54,.62,bend[2]*.54],bend,tip],
      .009,leafDark,15);
    addLeaf(plant,bend,tip,.115+(branch%2)*.028,
      branch%3===0?leafDark:leafGreen);
    if(branch%2===0) {
      const a=angle+.66;
      addLeaf(plant,[bend[0]*.66,height*.6,bend[2]*.66],
        [Math.cos(a)*reach*.77,height-.06,
          Math.sin(a)*reach*.77],.075,leafGreen);
    }
  }
}

// Jane is the visual answer to the room's pressure. Oleg and Zephrine remain
// nearby as a family, while Jane's open palms and stance own the moment.
const jane = person("Jane standing up for her family", 0, 5.05, 1.75, {
  skin: M.skin, hair: M.hair, outfit: M.fabric, pants: M.navy,
  bun: true, hands: { "-1": [-.43, 1.03, .34], "1": [.28, 1.51, .48] },
  yaw: 0,
});
person("Oleg beside Jane during the move", -2.05, 2.66, 1.73, {
  skin: M.skin, hair: M.hair, outfit: 0xe5d8c4, pants: M.ink,
  glasses: true, beard: true, longHair: true,
  hands: { "1": [.28, .9, .42] }, yaw: .22,
});
person("Zephrine kept close to her parents", -1.27, 2.97, 1.05, {
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
  const y = 5.98 + .47 * (1 - (x / 6.2) ** 2)
    + .025 * Math.sin(z * 1.6 + x * .3);
  ceilingPositions.push(x, y, z);
  const plasterGrain = .025 * Math.sin(x * 1.8 + z * 2.6)
    + .014 * Math.sin(x * 4.2 - z * 1.3);
  const pigment = shade.clone().lerp(light,
    .17 + .49 * THREE.MathUtils.smoothstep(-z, -6.0, 7.0)
      + plasterGrain);
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

window.__authorRoom = () => exportRoom();
