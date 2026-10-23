import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";
import { addJanePortrait } from "./oleg_portrait.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";

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
  for (let zi = 0; zi <= 128; zi++) for (let yi = 0; yi <= 24; yi++) {
    const z = -5.78 + zi * 11.56 / 128;
    const y = yi * 4.35 / 24;
    const x = side * (4.47 - .17 * Math.sin(z * 2.15 + y * .24)
      * Math.sin(Math.PI * yi / 24));
    wallPositions.push(x, y, z);
    wallUvs.push(zi / 128, yi / 24);
  }
  for (let zi = 0; zi < 128; zi++) for (let yi = 0; yi < 24; yi++) {
    const a = zi * 25 + yi, b = a + 1, c = a + 25, d = c + 1;
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

// A slightly irregular woven rug sits under the still moment. Its contours
// are sewn cloth, not a stack of perfectly circular digital targets.
const memoryZ=2.0;
const rugOutline=new THREE.Shape();
for(let i=0;i<=72;i++) {
  const a=i*Math.PI*2/72;
  const wave=1+.025*Math.sin(a*5+.4)+.012*Math.sin(a*11+1.2);
  const x=Math.cos(a)*2.45*wave,z=Math.sin(a)*1.72*wave;
  if(i===0) rugOutline.moveTo(x,z); else rugOutline.lineTo(x,z);
}
rugOutline.closePath();
const rugGeometry=new THREE.ExtrudeGeometry(rugOutline,{depth:.03,
  bevelEnabled:true,bevelSize:.015,bevelThickness:.009,
  bevelSegments:1,curveSegments:8});
rugGeometry.rotateX(Math.PI/2);
add(root,"thick woven rug with an uneven hand-finished edge",
  rugGeometry,M.cream,0,.065,.15+memoryZ);
for (let i = 0; i < 3; i++) {
  const radius=1.28+i*.42;
  curve(root,"irregular stitched thread circling the family",
    Array.from({length:65},(_,step)=>{
      const a=step*Math.PI*2/64;
      const wave=1+.025*Math.sin(a*5+i*.45)+.014*Math.sin(a*9-i);
      return [Math.cos(a)*radius*wave,.081,
        .15+memoryZ+Math.sin(a)*radius*.7*wave];
    }),.007,i%2?M.rose:M.gold,65);
}
for(let i=0;i<56;i++) {
  const a=i*Math.PI*2/56;
  const x=Math.cos(a)*2.45,z=Math.sin(a)*1.72+.15+memoryZ;
  curve(root,"short woven fringe at the rug edge",
    [[x,.054,z],[x+Math.cos(a)*.08,.038,
      z+Math.sin(a)*.065]],.003,i%3?M.cream:M.gold,5);
}
const table=new THREE.Group();
table.name="small turned side table beside the nursing chair";
table.position.set(2.48,0,-.72+memoryZ);root.add(table);
loft(table,"scalloped solid table top",[[.70,.35,.28],
  [.75,.46,.37],[.81,.43,.34],[.84,.3,.24]],M.wood,24,true);
loft(table,"turned tapered table pedestal",[[.05,.15,.13],
  [.20,.11,.1],[.4,.075,.07],[.68,.09,.08]],M.wood,18,true);
for(const side of [-1,1]) curve(table,"curved foot of the side table",
  [[0,.13,0],[side*.23,.085,.05],[side*.43,.06,.08]],.04,M.wood,13);
const blanket=new THREE.Shape();
blanket.moveTo(-.29,-.2);blanket.lineTo(.29,-.2);
blanket.quadraticCurveTo(.33,-.11,.3,.02);
blanket.lineTo(.23,.22);blanket.quadraticCurveTo(0,.18,-.28,.21);
blanket.closePath();
const folded=add(table,"folded layered cloth resting on the side table",
  new THREE.ExtrudeGeometry(blanket,{depth:.045,bevelEnabled:true,
    bevelThickness:.011,bevelSize:.011,bevelSegments:2,
    curveSegments:10}),M.paleBlue,0,.86,0);
folded.rotation.x=-Math.PI/2;
for(let i=0;i<4;i++) curve(table,"fine woven hem on the folded cloth",
  [[-.24+i*.15,.87,-.19],[-.22+i*.15,.88,.02],
    [-.2+i*.15,.87,.18]],.005,M.silver,12);

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
const backOutline = new THREE.Shape();
backOutline.moveTo(-.6,.55);
backOutline.bezierCurveTo(-.74,.75,-.8,1.16,-.73,1.5);
backOutline.bezierCurveTo(-.67,1.75,-.45,1.88,0,1.91);
backOutline.bezierCurveTo(.45,1.88,.67,1.75,.73,1.5);
backOutline.bezierCurveTo(.8,1.16,.74,.75,.6,.55);
backOutline.closePath();
const backGeometry=new THREE.ExtrudeGeometry(backOutline,{
  depth:.23,bevelEnabled:true,bevelSize:.045,bevelThickness:.04,
  bevelSegments:3,curveSegments:18});
const back=add(chair,"solid sculpted wingback upholstery with a shaped crest",
  backGeometry,M.blue,0,0,-.86);
back.userData.solidFootprint=true;
for(const side of [-1,1]) {
  loft(chair,"joined upholstered side wing of the nursing chair",[
    [.74,.12,.24,side*.65,-.48],
    [1.04,.17,.26,side*.7,-.51],
    [1.48,.14,.23,side*.71,-.59],
    [1.73,.055,.11,side*.58,-.66]],M.fabric,14,true);
  curve(chair,"piped edge following the shaped chair back",[
    [side*.59,.67,-.59],[side*.7,1.0,-.59],
    [side*.71,1.43,-.59],[side*.54,1.73,-.59],
    [side*.3,1.84,-.59]],.013,M.paleBlue,28);
  for(const y of [.99,1.31,1.57]) {
    curve(chair,"short stitched upholstery dart",[
      [side*.53,y-.07,-.586],
      [side*.48,y,-.58],
      [side*.42,y+.045,-.583]],.0045,M.silver,9);
  }
}
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
  [1.43, .22, .16, 0, -.04]], M.sweater, 24, true);
curve(jane, "closed sweater neckline", [[-.17, 1.39, .12],
  [0, 1.35, .19], [.17, 1.39, .12]], .017, M.silver);
// Each bent trouser leg is one continuous changing section. The knee projects
// over the seat, then the fabric falls toward a shaped house shoe.
for(const side of [-1,1]) {
  const rings=[
    [side*.19,.76,.02,.18,.18],
    [side*.19,.68,.22,.18,.17],
    [side*.2,.57,.43,.165,.15],
    [side*.2,.49,.51,.15,.14],
    [side*.2,.34,.57,.135,.13],
    [side*.2,.13,.62,.12,.12],
  ];
  const vertices=[],uv=[],indices=[],sides=20;
  for(let row=0;row<rings.length;row++) {
    const [x,y,z,rx,rz]=rings[row];
    for(let s=0;s<sides;s++) {
      const a=s*Math.PI*2/sides;
      vertices.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);
      uv.push(s/sides,row/(rings.length-1));
      if(row<rings.length-1) {
        const n=row*sides+s,b=row*sides+(s+1)%sides;
        indices.push(n,b,n+sides,b,b+sides,n+sides);
      }
    }
  }
  const trouser=new THREE.BufferGeometry();
  trouser.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  trouser.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  trouser.setIndex(indices);trouser.computeVertexNormals();
  add(jane,"continuous bent trouser leg with a formed knee",trouser,M.shadow);
  loft(jane,"soft house shoe with a raised rounded toe",
    [[.02,.1,.17,side*.2,.71],[.065,.14,.22,side*.2,.73],
      [.13,.13,.17,side*.2,.65],[.17,.08,.1,side*.2,.6]],
    M.wood,18);
  curve(jane,"stitched upper on the house shoe",
    [[side*.2-.1,.105,.76],[side*.2,.14,.88],
      [side*.2+.1,.105,.76]],.006,M.silver,12);
}
sculptSleevedArm(add,jane,{shoulder:[-.25,1.33,-.02],
  elbow:[-.24,1.04,.25],hand:[.14,.79,.57],
  outfit:M.sweater,skin:M.skin,trim:M.rose,size:.82});
sculptSleevedArm(add,jane,{shoulder:[.24,1.33,-.02],
  elbow:[.38,1.02,.27],hand:[.57,.8,.55],
  outfit:M.sweater,skin:M.skin,trim:M.rose,size:.82});
const head = new THREE.Group(); head.name = "Jane's quiet face looking toward Zephrine";
head.position.set(-.03, 0, -.06); head.rotation.z = -.07; jane.add(head);
loft(head, "carved face and jaw", [[1.41, .06, .06], [1.5, .145, .12],
  [1.68, .17, .145], [1.86, .15, .13], [1.98, .02, .02]], M.skin, 15);
addJanePortrait(head,1.84,[[-.43,.06,.06],[-.34,.145,.12],
  [-.16,.17,.145],[.02,.15,.13],[.14,.02,.02]],M.skin);
loft(head,"Jane's gathered hair rising into one high bun",[
  [1.83,.1,.085,0,-.025],[1.91,.157,.13,0,-.025],
  [1.98,.155,.127,0,-.04],[2.04,.106,.093,.01,-.058],
  [2.09,.088,.079,.018,-.07],[2.14,.098,.088,.025,-.08],
  [2.2,.069,.063,.028,-.083],[2.23,.008,.01,.03,-.084],
],M.hair,28);
for(let strand=0;strand<6;strand++) {
  const a=strand*Math.PI*2/6;
  curve(head,"soft combed strand entering Jane's bun",[
    [Math.cos(a)*.14,1.96,-.04+Math.sin(a)*.105],
    [Math.cos(a+.28)*.12,2.08,-.064+Math.sin(a+.28)*.085],
    [.02+Math.cos(a+.56)*.075,2.16,-.083+Math.sin(a+.56)*.065],
  ],.0045,strand%2?M.wood:M.hair,15);
}

// Zephrine remains fully clothed on Jane's lap. A purpose-built horizontal
// torso was tested but read as a long oval at phone distance, so retain the
// more recognizable sculpted child while a suitable posed model is sourced.
const child = person("Zephrine nestled at Jane's clothed chest", .5, .47+memoryZ, 1.07, {
  skin: M.skin, hair: M.zephHair, outfit: M.peach, skirt: M.rose,
  pants: M.blue, shoes: M.rose, dress: false, curls: false,
  hands: { "-1": [-.27, .72, .2], "1": [.31, .63, .17] },
});
child.position.y = .48;
child.rotation.z = .6;
child.scale.setScalar(.9);

window.__authorRoom = () => exportRoom();
