import {portalPreviewCamera} from './portal_preview_camera.mjs';
import {replaceStoryFigures} from './storybook_figures.mjs';
import {finishStoryWorld} from './storyworld_finish.mjs';
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { addRoomLighting } from "../client/explore/room-lighting.mjs";
import { addJanePortrait, addZephrinePortrait,
  finishOlegPortraits } from "./oleg_portrait.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";
import { paintedFabric } from "./painted_fabric.mjs";

// Frame 01 is authored once as a scene. Its GLB and painting use this same root
// and the camera stored in gallery.json.
const C = {
  cream: 0xf3dfbd, wall: 0x794e68, rose: 0xc98491, plum: 0x3c314d,
  gold: 0xe7b862, blue: 0x8eb6b5, stage: 0x6b3e54, paper: 0xfff1d7,
};
const root = new THREE.Group();
root.name = "Zephrine's first stage — a frozen paper theater";
function addSculpt(parent, name, geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; parent.add(mesh); return mesh;
}
function paperGrain() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  const image = context.createImageData(256, 256);
  let seed = 81931;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const tone = 229 + (seed % 27);
    image.data[i] = tone; image.data[i + 1] = tone - 1;
    image.data[i + 2] = tone - 3; image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function stonePigment() {
  const canvas=document.createElement("canvas");canvas.width=canvas.height=512;
  const context=canvas.getContext("2d"),image=context.createImageData(512,512);
  let seed=327412;
  for(let y=0;y<512;y++) for(let x=0;x<512;x++) {
    seed=(seed*1664525+1013904223)>>>0;
    const grain=(seed%29)-14;
    const strata=Math.sin(y*.064+Math.sin(x*.025)*1.7)*12;
    const tide=Math.sin(x*.024+y*.013+Math.sin(y*.017)*2.1)*10;
    const broad=Math.sin(x*.008-y*.011)*7;
    const tone=Math.max(158,Math.min(252,220+strata+tide+broad+grain*.55));
    const index=(y*512+x)*4;
    image.data[index]=tone;image.data[index+1]=tone-2;
    image.data[index+2]=tone-3;image.data[index+3]=255;
  }
  context.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  return texture;
}
const grain = paperGrain();
const stoneGrain = stonePigment();
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, map: grain, roughness: .94, metalness: 0, side: THREE.DoubleSide, ...extra });
const paper = mat(C.paper);
const timber = mat(0x755047);
const gold = mat(C.gold, { emissive: 0x3e2108, emissiveIntensity: .16 });

function box(name, x, y, z, w, h, d, material, parent = root) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function shapedHorizontal(name, shape, bottom, height, material, bevel = .015) {
  // Draw in x/-z so an extruded shape becomes a horizontal, walkable object.
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: bevel > 0, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 2, curveSegments: 12, steps: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = bottom;
  root.add(mesh);
  return mesh;
}
function carvedDesk() {
  const edge = new THREE.Shape();
  edge.moveTo(-2.09, -.32);
  edge.lineTo(-.69, -.32);
  edge.quadraticCurveTo(-.57, -.33, -.58, -.45);
  edge.lineTo(-.58, -.94);
  edge.quadraticCurveTo(-.60, -1.035, -.74, -1.045);
  edge.quadraticCurveTo(-1.35, -1.12, -2.02, -1.045);
  edge.quadraticCurveTo(-2.17, -1.02, -2.17, -.92);
  edge.lineTo(-2.17, -.43);
  edge.quadraticCurveTo(-2.17, -.33, -2.09, -.32);
  const top = shapedHorizontal("shaped walnut signup desk top", edge, .85, .06, mat(0x9d684f), .018);
  top.userData.solidFootprint = true;
  const apron = new THREE.Shape();
  apron.moveTo(-2.075, .835); apron.lineTo(-.67, .835);
  apron.lineTo(-.67, .69);
  for (let i = 0; i < 6; i++) {
    const x = -.67 - (i + 1) * 1.405 / 6;
    apron.quadraticCurveTo(x + .11, .62 + (i % 2) * .065, x, .69);
  }
  apron.closePath();
  const fascia = new THREE.Mesh(new THREE.ExtrudeGeometry(apron, {
    depth: .045, bevelEnabled: true, bevelThickness: .008,
    bevelSize: .008, bevelSegments: 2, curveSegments: 10,
  }), mat(0x805344));
  fascia.name = "six scallop desk apron"; fascia.position.z = .91; root.add(fascia);
  for (const x of [-2.025, -.72]) for (const z of [.38, .92]) {
    const leg = new THREE.Mesh(new THREE.LatheGeometry([
      new THREE.Vector2(.055, 0), new THREE.Vector2(.068, .04),
      new THREE.Vector2(.046, .10), new THREE.Vector2(.036, .31),
      new THREE.Vector2(.058, .39), new THREE.Vector2(.042, .44),
      new THREE.Vector2(.047, .73), new THREE.Vector2(.07, .84),
    ], 16), timber);
    leg.name = "turned walnut desk leg"; leg.position.set(x, .02, z); root.add(leg);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.052, .009, 5, 12), gold);
    collar.name = "brass desk leg collar"; collar.rotation.x = Math.PI / 2;
    collar.position.set(x, .42, z); root.add(collar);
  }
  stoneRib("inlaid curved front edge of the desk", Array.from({length: 15}, (_, i) => {
    const x = -2.055 + i * 1.355 / 14;
    return [x, .88, 1.045 + .06 * Math.sin(Math.PI * i / 14)];
  }), .009, gold);
}
function carvedStage() {
  const outline = new THREE.Shape();
  outline.moveTo(-.35, 2.29); outline.lineTo(2.13, 2.29);
  outline.quadraticCurveTo(2.24, 2.27, 2.23, 2.15);
  outline.lineTo(2.23, .83);
  outline.quadraticCurveTo(1.71, .59, .9, .66);
  outline.quadraticCurveTo(.09, .59, -.45, .83);
  outline.lineTo(-.45, 2.15);
  outline.quadraticCurveTo(-.46, 2.28, -.35, 2.29);
  shapedHorizontal("carved scalloped stage plinth", outline, .035, .32, mat(C.stage), .025).userData.solidFootprint = true;
  const deck = outline.clone();
  const top = shapedHorizontal("inlaid dance stage deck", deck, .385, .012, mat(0x9b8b80), .003);
  top.userData.solidFootprint = false;
  stoneRib("continuous brass stage lip", Array.from({length: 17}, (_, i) => {
    const x = -.43 + i * 2.65 / 16;
    return [x, .405, -.72 - .09 * Math.sin(Math.PI * i / 16)];
  }), .025, gold);
  for (let i = 0; i < 8; i++) {
    const x = -.29 + i * 2.34 / 7;
    const z = -.783 - .09 * Math.sin(Math.PI * i / 7);
    shellFan("carved shell medallion in stage front", x, .20, z, .13, i % 2 ? parchment : gold);
  }
}
function sphere(name, x, y, z, r, material, parent = root) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), material);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
function line(name, points, radius, material) {
  for (let i = 1; i < points.length; i++) {
    const a = new THREE.Vector3(...points[i-1]), b = new THREE.Vector3(...points[i]);
    const delta = b.clone().sub(a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 8), material);
    mesh.name = name; mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
    root.add(mesh);
  }
}
function ovalLine(name, center, radiusX, radiusZ, height, material, start = 0, end = Math.PI * 2) {
  const points = [];
  for (let i = 0; i <= 30; i++) {
    const angle = start + (end - start) * i / 30;
    points.push([center[0] + Math.cos(angle) * radiusX, height, center[1] + Math.sin(angle) * radiusZ]);
  }
  line(name, points, .012, material);
}
function cardTexture(title, small = "", ink = "#523d52", background = "#fff1d9") {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background; ctx.fillRect(0,0,512,256);
  ctx.strokeStyle = "#bd8f65"; ctx.lineWidth = 9; ctx.strokeRect(13,13,486,230);
  ctx.fillStyle = ink; ctx.textAlign = "center";
  ctx.font = `bold ${title.length > 7 ? 50 : 72}px Georgia`; ctx.fillText(title,256,121);
  if (small) { ctx.font = "27px Georgia"; ctx.fillText(small,256,179); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function sign(name, title, small, x, y, z, w, h, rotationY=0) {
  const holder = new THREE.Group(); holder.name = name;
  holder.position.set(x,y,z); holder.rotation.y=rotationY; root.add(holder);
  box(`${name} timber rim`,0,0,-.035,w+.08,h+.08,.07,timber,holder);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:cardTexture(title,small),side:THREE.DoubleSide}));
  face.name = name; face.position.z=.012; holder.add(face);
}
// The figures are native 3D meshes with no image planes. This small sculpting
// vocabulary keeps their visual language close to the paper-theater room.
const skinJane = mat(0xe9a883);
const skinZephrine = mat(0xe7ad88);
const navy = mat(0x343653);
const rust = mat(0xb6784a);
const hairJane = mat(0x352b31);
const hairZephrine = mat(0x694232);
const hairHighlight = mat(0x8e5b3d);
const eyeWhite = mat(0xf7e6d2);
const eyeDark = mat(0x3b3b43);
const eyeBlue = mat(0x728fa0);
const rose = mat(0xb86868);
const aqua = mat(0x76b7b6);
const paleRose = mat(0xd69a91);
const parchment = mat(0xf0d3a9);
const deepInk = mat(0x493b50);
const deepSea = mat(0x284c63);
const tide = mat(0x4c9295);
const seaFoam = mat(0xb8d9ca);
const coral = mat(0xd98983);
const pearl = mat(0xf4dfc5,{emissive:0x5c5449,emissiveIntensity:.12});
const bubbleGlass = mat(0x9bd9d1,{transparent:true,opacity:.5,depthWrite:false});

function oval(name, x, y, z, sx, sy, sz, material, parent) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
  mesh.name = name; mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); parent.add(mesh); return mesh;
}
function limb(name, a, b, startRadius, endRadius, material, parent) {
  const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(endRadius,startRadius,direction.length(),12),material);
  mesh.name=name; mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  parent.add(mesh);
  return mesh;
}
function shellFan(name,x,y,z,scale,material=pearl) {
  const shell = new THREE.Group();shell.name=name;shell.position.set(x,y,z);shell.scale.setScalar(scale);root.add(shell);
  oval(`${name} scalloped bowl`,0,.18,0,.38,.3,.095,material,shell);
  oval(`${name} hinge`,0,-.055,.07,.12,.09,.11,gold,shell);
  for(let rib=-3;rib<=3;rib++) {
    const tipX=rib*.105;
    limb(`${name} raised rib`,[0,-.03,.105],[tipX,.38-Math.abs(rib)*.035,.083],.017,.01,gold,shell);
    oval(`${name} rim pearl`,tipX,.38-Math.abs(rib)*.035,.095,.025,.024,.026,pearl,shell);
  }
  return shell;
}
function coralFan(name,x,y,z,scale,material=coral) {
  const group=new THREE.Group();group.name=name;group.position.set(x,y,z);group.scale.setScalar(scale);root.add(group);
  const branches=[[[0,0,0],[0,.35,0],[.08,.68,0]],[[0,.22,0],[-.2,.47,.02],[-.29,.65,.03]],
    [[0,.37,0],[.23,.57,.02],[.33,.82,.03]],[[-.18,.45,.02],[-.28,.48,.07],[-.38,.57,.08]]];
  for(const points of branches) {
    for(let i=1;i<points.length;i++) limb(`${name} sculpted branch`,points[i-1],points[i],.06-i*.014,.04-i*.008,material,group);
    const tip=points.at(-1);oval(`${name} soft coral tip`,...tip,.045,.045,.045,material,group);
  }
  return group;
}
function storybookFish(name,x,y,z,scale,material,faceRight=true) {
  const fish=new THREE.Group();fish.name=name;fish.position.set(x,y,z);
  fish.scale.setScalar(scale);fish.rotation.y=faceRight?0:Math.PI;root.add(fish);
  oval(`${name} rounded body`,0,0,0,.18,.085,.048,material,fish);
  const tail=new THREE.Mesh(new THREE.ConeGeometry(.09,.19,12),material);
  tail.name=`${name} folded tail`;tail.rotation.z=Math.PI/2;tail.position.set(-.235,0,0);fish.add(tail);
  oval(`${name} raised top fin`,-.02,.077,0,.065,.06,.017,material,fish);
  oval(`${name} pearl eye`,.115,.018,.047,.014,.014,.01,pearl,fish);
  oval(`${name} dark pupil`,.119,.018,.057,.006,.006,.005,deepInk,fish);
  for(const cx of [-.06,.015,.08]) oval(`${name} gilt scale`,cx,-.023,.049,.018,.012,.006,gold,fish);
  return fish;
}
function drapedValance(name,x,y,z,width,material) {
  const positions=[],indices=[],sections=54;
  for(let i=0;i<=sections;i++) {
    const t=i/sections,px=x-width/2+width*t;
    const fold=Math.cos(t*9*Math.PI*2);
    const bottom=y-.21-.075*(1-fold)/2;
    for(const depth of [0,.045]) {
      positions.push(px,y,z+depth+.028*fold);
      positions.push(px,bottom,z+depth+.028*fold);
    }
  }
  for(let i=0;i<sections;i++) {
    const a=i*4,b=a+4;
    indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2);
    indices.push(a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;root.add(mesh);
}
function stageFrond(name,x,y,z,height,width,material) {
  const positions=[],indices=[],rows=13;
  for(let i=0;i<=rows;i++) {
    const t=i/rows,bend=.11*Math.sin(t*3.8+x)*t;
    const half=width*Math.sin(Math.PI*t)*(.8+.2*Math.sin(t*7));
    for(const depth of [0,.018]) for(const sign of [-1,1]) {
      positions.push(x+bend+sign*half,y+height*t,z+depth+.025*Math.sin(t*7));
    }
  }
  for(let i=0;i<rows;i++) {
    const a=i*4,b=a+4;
    indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2);
    indices.push(a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;root.add(mesh);
  stoneRib(`${name} curved vein`,Array.from({length:7},(_,i)=>{
    const t=i/6;return [x+.11*Math.sin(t*3.8+x)*t,y+height*t,z+.024+.025*Math.sin(t*7)];
  }),.009,seaFoam);
}
function footprintStamp(name,x,y,z,scale,angle,material) {
  const outline=new THREE.Shape();
  outline.moveTo(-.035,-.14);
  outline.bezierCurveTo(-.08,-.13,-.095,-.08,-.07,-.015);
  outline.bezierCurveTo(-.05,.055,-.1,.1,-.11,.17);
  outline.bezierCurveTo(-.07,.23,.025,.24,.095,.19);
  outline.bezierCurveTo(.12,.14,.075,.09,.055,.035);
  outline.bezierCurveTo(.045,-.02,.075,-.08,.045,-.13);
  outline.quadraticCurveTo(.005,-.16,-.035,-.14);
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{
    depth:.008,bevelEnabled:true,bevelSize:.004,bevelThickness:.002,bevelSegments:1,curveSegments:8,
  }),material);
  mesh.name=name;mesh.rotation.x=-Math.PI/2;mesh.rotation.z=angle;mesh.scale.setScalar(scale);
  mesh.position.set(x,y,z);root.add(mesh);
}
function suspendedBubble(name,x,y,z,radius) {
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.007,5,20),
    new THREE.MeshBasicMaterial({color:0xd5f5e5,transparent:true,opacity:.75,side:THREE.DoubleSide}));
  ring.name=name;ring.position.set(x,y,z);ring.rotation.y=.32+x*.12;ring.rotation.x=.16;
  root.add(ring);
  const gleam=new THREE.Mesh(new THREE.TorusGeometry(radius*.73,.004,4,9,Math.PI*.48),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.82}));
  gleam.name=`${name} curved glint`;gleam.position.set(x,y,z+.01);gleam.rotation.z=.7;root.add(gleam);
}
function waveLine(name,y,z,color,phase=0) {
  const points=[];
  for(let i=0;i<=16;i++) {
    const x=-.31+i*.153;
    points.push([x,y+Math.sin(i*.68+phase)*.085,z]);
  }
  line(name,points,.021,color);
}
// The cave is a continuous hand-shaped surface, with color and depth carried
// by its vertices. The stage and figures remain legible inside its opening.
const caveStone = new THREE.MeshStandardMaterial({
  map: stoneGrain, vertexColors: true, roughness: 1, side: THREE.DoubleSide,
});
const caveIndigo = new THREE.Color(0x376577);
const caveRose = new THREE.Color(0x93a09a);
function caveHeight(x,z) {
  return 3.53 - .22*Math.pow(Math.abs(x)/2.7,1.6) - .07*Math.pow(Math.abs(z)/2.7,2)
    + .045*Math.sin(x*2.9+z*.8)*Math.cos(z*1.7);
}
function caveSurface(name,columns,rows,point,offset=0,palette=[caveIndigo,caveRose]) {
  const positions=[], colors=[], uvs=[], indices=[];
  for(let row=0;row<=rows;row++) for(let column=0;column<=columns;column++) {
    const u=column/columns,v=row/rows;
    const [x,y,z]=point(u,v);
    positions.push(x,y,z); uvs.push(u*2,v*2);
    const vein=.52+.24*Math.sin(x*2.7+y*3.9+z*1.4+offset)
      +.13*Math.sin(x*7.1-y*5.2+z*4.1);
    const color=palette[0].clone().lerp(palette[1],Math.max(.08,Math.min(.92,vein)));
    colors.push(color.r,color.g,color.b);
  }
  for(let row=0;row<rows;row++) for(let column=0;column<columns;column++) {
    const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,caveStone);mesh.name=name;root.add(mesh);return mesh;
}
function caveShell() {
  caveSurface("uneven vaulted sea cavern ceiling",22,22,(u,v)=>{
    const x=-2.7+5.4*u,z=-2.7+5.4*v;
    return [x,caveHeight(x,z),z];
  },.8);
  for(const sign of [-1,1]) caveSurface(`${sign<0?"left":"right"} tide-carved cavern wall`,22,14,(u,v)=>{
    const z=-2.7+5.4*u,y=3.42*v;
    const swell=.045*Math.sin(z*2.3+y*2.8+sign)+.02*Math.sin(z*6.2-y*5.1);
    return [sign*(2.56-swell),y,z];
  },sign);
  caveSurface("broad back wall of the grotto",22,14,(u,v)=>{
    const x=-2.7+5.4*u,y=3.42*v;
    return [x,y,-2.57+.035*Math.sin(x*2.5+y*2.1)+.02*Math.sin(x*6.4-y*4.7)];
  },2.2);
  for(const [from,to] of [[-2.7,-1.675],[1.675,2.7]]) caveSurface("carved rock beside the return arch",8,13,(u,v)=>{
    const x=from+(to-from)*u,y=3.42*v;
    return [x,y,2.58-.025*Math.sin(x*4+y*2.8)];
  },1.5);
  caveSurface("stone above the open return doorway",10,3,(u,v)=>{
    const x=-1.675+3.35*u,y=3.35+.08*v;
    return [x,y,2.58-.025*Math.sin(x*4+y*2.8)];
  },1.5);
}
function stoneRib(name,points,radius,material) {
  const curve=new THREE.CatmullRomCurve3(points.map((point)=>new THREE.Vector3(...point)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(20,points.length*5),radius,6,false),material);
  mesh.name=name;root.add(mesh);return mesh;
}
function stalactite(name,x,z,length,material) {
  const rings=7,sides=9,positions=[],indices=[];
  const top=caveHeight(x,z)-.035;
  for(let row=0;row<=rings;row++) {
    const t=row/rings,radius=.12*Math.pow(1-t,1.25)+.004;
    for(let side=0;side<sides;side++) {
      const angle=side*Math.PI*2/sides;
      const wobble=1+.16*Math.sin(side*2.4+row*1.9+x*5);
      positions.push(x+Math.cos(angle)*radius*wobble+.045*t*t,
        top-length*t+.018*Math.sin(t*11+side),
        z+Math.sin(angle)*radius*wobble-.025*t);
    }
  }
  for(let row=0;row<rings;row++) for(let side=0;side<sides;side++) {
    const a=row*sides+side,b=row*sides+(side+1)%sides,c=a+sides,d=b+sides;
    indices.push(a,c,b,b,c,d);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;root.add(mesh);
}
function kelpBlade(name,side,z,height,material) {
  const vertices=[],indices=[],segments=14,baseX=side*2.51;
  for(let i=0;i<=segments;i++) {
    const t=i/segments,y=.16+height*t;
    const width=.105*Math.sin(Math.PI*t)*(.65+.35*Math.sin(t*7+z));
    const offset=.14*Math.sin(t*5+z*2)*t;
    for(const thickness of [0,.018]) for(const edge of [-1,1]) {
      vertices.push(baseX-side*(.015+.025*Math.sin(t*8)+thickness),y,z+offset+edge*width);
    }
  }
  for(let i=0;i<segments;i++) {
    const a=i*4,b=a+4;
    indices.push(a,b,a+1,a+1,b,b+1,a+2,a+3,b+2,a+3,b+3,b+2);
    indices.push(a,a+2,b,a+2,b+2,b,a+1,b+1,a+3,a+3,b+1,b+3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;root.add(mesh);
  stoneRib(`${name} raised central vein`,Array.from({length:8},(_,i)=>{
    const t=i/7;return [baseX-side*.038,.16+height*t,z+.14*Math.sin(t*5+z*2)*t];
  }),.012,seaFoam);
}
function seaStar(name,side,y,z,size,material) {
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++) {
    const angle=-Math.PI/2+i*Math.PI/5,r=i%2?size*.43:size;
    const px=Math.cos(angle)*r,py=Math.sin(angle)*r;
    if(i===0) shape.moveTo(px,py);else shape.lineTo(px,py);
  }
  shape.closePath();
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.013,bevelThickness:.013}),material);
  mesh.name=name;mesh.position.set(side*2.49,y,z);mesh.rotation.y=side<0?Math.PI/2:-Math.PI/2;
  mesh.rotation.z=z*.17;root.add(mesh);
}
function coralRelief(name,x,z,scale,material) {
  const stem=(suffix,points,radius)=>stoneRib(`${name} ${suffix}`,
    points.map(([px,py,pz])=>[x+px*scale,py*scale,z+pz*scale]),radius*scale,material);
  stem("bending trunk",[[0,.12,0],[-.07,.54,.08],[.04,1.01,.13],[.14,1.5,.08]],.07);
  stem("left branch",[[-.03,.58,.07],[-.26,.9,.16],[-.43,1.18,.12],[-.53,1.42,.1]],.046);
  stem("right branch",[[.04,.96,.13],[.31,1.1,.2],[.43,1.39,.17],[.48,1.65,.11]],.042);
  stem("low outer branch",[[-.15,.83,.1],[-.38,.74,.18],[-.63,.91,.14]],.035);
  for(const [px,py] of [[-.53,1.42],[.48,1.65],[-.63,.91],[.14,1.5]]) {
    const shape=new THREE.Shape();shape.moveTo(0,0);
    shape.quadraticCurveTo(-.11,.18,-.02,.29);
    shape.quadraticCurveTo(.09,.18,0,0);
    const leaf=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
      depth:.024,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:1,
    }),material);
    leaf.name=`${name} carved branching tip`;
    leaf.position.set(x+px*scale,py*scale,z+.11*scale);
    leaf.rotation.z=px*.43;root.add(leaf);
  }
}
function spiralFossil(name,x,y,z,radius,material) {
  const points=[];
  for(let i=0;i<=64;i++) {
    const t=i/64,angle=t*Math.PI*4.2+.4,r=.028+radius*t;
    points.push([x+Math.cos(angle)*r,y+Math.sin(angle)*r,z+.02*Math.sin(t*7)]);
  }
  stoneRib(name,points,.028,material);
  for(let i=0;i<9;i++) {
    const t=.34+i*.07,angle=t*Math.PI*4.2+.4,r=.028+radius*t;
    stoneRib(`${name} short shell rib`,[[x+Math.cos(angle)*r,y+Math.sin(angle)*r,z+.022],
      [x+Math.cos(angle+.08)*(r+.11),y+Math.sin(angle+.08)*(r+.11),z+.008]],.012,gold);
  }
}
function face(name, head, skin, iris, options={}) {
  oval(`${name} softly sculpted face`,0,0,0,.18,.215,.16,skin,head);
  const painted = name === "Jane" || name === "Zephrine";
  if (painted) {
    const profile = [[-.215,.025,.025],[-.17,.105,.105],[-.05,.167,.16],
      [.07,.175,.15],[.17,.102,.075],[.215,.025,.02]];
    (name === "Jane" ? addJanePortrait : addZephrinePortrait)(head, 0, profile, skin);
  } else oval(`${name} small nose`,0,-.022,.165,.033,.048,.044,skin,head);
  for (const sign of [-1,1]) {
    oval(`${name} ear`,sign*.174,-.015,-.01,.045,.07,.033,skin,head);
    if (!painted) {
      oval(`${name} eye white`,sign*.078,.034,.145,.046,.032,.018,eyeWhite,head);
      oval(`${name} iris`,sign*.078,.033,.164,.023,.025,.012,iris,head);
      oval(`${name} pupil`,sign*.078,.033,.175,.010,.015,.008,eyeDark,head);
      oval(`${name} eyebrow`,sign*.078,.091,.153,.052,.010,.011,options.hair || hairZephrine,head);
    }
  }
  if (!painted) oval(`${name} quiet smile`,0,-.111,.153,.062,.010,.012,rose,head);
}
function sculptZephrine() {
  const rustCloth = paintedFabric(rust);
  const child = new THREE.Group(); child.name="Zephrine — sculpted in the middle of a dance";
  child.userData.solidFootprint = true;
  child.position.set(1.1,.40,-1.53); child.rotation.y=-.13; root.add(child);
  // Rounded toddler proportions and the rust outfit recall the supplied photos.
  oval("Zephrine rust sweater",0,.72,0,.23,.30,.17,rustCloth,child);
  oval("Zephrine round collar",0,.96,.045,.115,.046,.13,skinZephrine,child);
  oval("Zephrine pants hips",0,.51,0,.22,.15,.17,rustCloth,child);
  limb("Zephrine supporting leg",[-.11,.48,0],[-.14,.12,.01],.105,.078,rustCloth,child);
  limb("Zephrine lifted dancing leg",[.10,.48,0],[.28,.22,.13],.105,.076,rustCloth,child);
  oval("Zephrine left aqua shoe",-.15,.073,.12,.115,.055,.17,aqua,child);
  oval("Zephrine lifted aqua shoe",.29,.18,.24,.12,.052,.16,aqua,child);
  for(const [x,y,z] of [[-.15,.076,.24],[.29,.18,.37]]) {
    box("aqua sandal strap",x,y,z,.15,.025,.025,mat(0xa2d8cf),child);
  }
  sculptSleevedArm(addSculpt,child,{shoulder:[-.2,.91,0],
    elbow:[-.36,1.085,.025],hand:[-.49,1.255,.06],
    outfit:rustCloth,skin:skinZephrine,trim:parchment,size:.68});
  sculptSleevedArm(addSculpt,child,{shoulder:[.2,.91,0],
    elbow:[.34,.83,.08],hand:[.50,.775,.17],
    outfit:rustCloth,skin:skinZephrine,trim:parchment,size:.68});
  for(let i=0;i<3;i++) box("sweater button",0,.84-i*.065,.171,.025,.025,.014,mat(0xe0b687),child);

  const head = new THREE.Group(); head.name="Zephrine's blue-eyed face and curly bob";
  head.position.set(0,1.13,.01); head.rotation.z=-.07; child.add(head);
  face("Zephrine",head,skinZephrine,eyeBlue,{hair:hairZephrine});
  oval("Zephrine hair crown",0,.15,-.055,.207,.185,.17,hairZephrine,head);
  const curls=[[-.205,.11,.03],[-.23,.02,.025],[-.23,-.07,.02],[-.18,-.15,-.025],
    [.205,.11,.03],[.23,.02,.025],[.23,-.07,.02],[.18,-.15,-.025],
    [-.14,.22,.08],[-.055,.23,.095],[.04,.235,.085],[.135,.21,.085]];
  curls.forEach(([x,y,z],index)=>oval(`Zephrine curl ${index+1}`,x,y,z,.064,.07,.067,index%3?hairZephrine:hairHighlight,head));
  oval("Zephrine hair clip",-.11,.23,.137,.055,.022,.018,parchment,head);
  oval("Zephrine sea-glass hair jewel",-.11,.23,.152,.028,.023,.018,seaFoam,head);
  oval("Zephrine aqua ribbon knot",-.45,1.2,.10,.065,.04,.04,tide,child);
  for(let i=0;i<3;i++) {
    const ribbon=oval("Zephrine flowing dance ribbon",-.51-i*.095,1.15-i*.035,.11+i*.055,.11,.026,.034,i%2?seaFoam:tide,child);
    ribbon.rotation.z=-.24-i*.17;
  }
  for(const x of [-.1,.1]) box("Zephrine shirt hem stitch",x,.49,.142,.11,.014,.012,parchment,child);
  return child;
}
function sculptJane() {
  const navyCloth = paintedFabric(navy);
  const jane = new THREE.Group(); jane.name="Jane — sculpted at the signup desk";
  jane.userData.solidFootprint = true;
  jane.position.set(-1.57,0,.28); jane.rotation.y=.09; root.add(jane);
  // A gently tapered dress gives Jane the subtly slimmer silhouette requested.
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.19,.31,.62,18),navyCloth);
  skirt.name="Jane's navy dress skirt"; skirt.position.set(0,.59,0); jane.add(skirt);
  oval("Jane navy bodice",0,1.03,0,.215,.29,.16,navyCloth,jane);
  oval("Jane neckline",0,1.25,.055,.113,.048,.115,skinJane,jane);
  limb("Jane left leg",[-.11,.39,0],[-.12,.08,.035],.072,.054,skinJane,jane);
  limb("Jane right leg",[.11,.39,0],[.13,.08,.04],.072,.054,skinJane,jane);
  oval("Jane left navy shoe",-.12,.055,.13,.105,.055,.16,navy,jane);
  oval("Jane right navy shoe",.13,.055,.14,.105,.055,.16,navy,jane);
  // Her hand and pen are physically over the signup paper, frozen mid-sentence.
  sculptSleevedArm(addSculpt,jane,{shoulder:[.17,1.18,.02],
    elbow:[.23,1.01,.20],hand:[.30,.954,.39],
    outfit:skinJane,skin:skinJane,trim:skinJane});
  sculptSleevedArm(addSculpt,jane,{shoulder:[-.17,1.18,.02],
    elbow:[-.27,1.02,.22],hand:[-.06,.949,.38],
    outfit:skinJane,skin:skinJane,trim:skinJane});
  limb("Jane pen",[.315,.965,.43],[.35,1.075,.45],.009,.007,eyeDark,jane);

  const head = new THREE.Group(); head.name="Jane's dark high bun and freckled face";
  head.position.set(0,1.48,.015); head.rotation.y=.23; head.rotation.z=-.04; jane.add(head);
  face("Jane",head,skinJane,eyeDark,{hair:hairJane});
  oval("Jane swept back hair",0,.115,-.075,.195,.18,.145,hairJane,head);
  oval("Jane high bun",.02,.28,-.09,.115,.115,.105,hairJane,head);
  oval("Jane loose bun strand",-.08,.30,-.06,.055,.07,.06,hairJane,head);
  for(const sign of [-1,1]) {
    oval("Jane pearl stud",sign*.19,-.025,.02,.019,.019,.019,eyeWhite,head);
  }
  oval("Jane navy dress brooch",-.11,1.21,.145,.033,.033,.018,gold,jane);
  oval("Jane pearly brooch center",-.11,1.21,.16,.017,.017,.012,pearl,jane);
  for(let i=0;i<5;i++) oval("Jane small pearl necklace",-.095+i*.047,1.235+Math.abs(i-2)*.009,.135,.013,.013,.012,pearl,jane);
  for(const x of [-.13,-.07,-.01]) oval("Jane hair wisps",x,.17,.135,.018,.062,.014,hairJane,head);
  return jane;
}

export async function authorRoom() {

  // Architecture: 5.4 m square, with an opening matching the gallery frame.
  box("sandstone under the grotto floor",0,-.08,0,5.4,.16,5.4,mat(0x9a766f));
  caveSurface("softly undulating sandy cave floor",24,24,(u,v)=>{
    const x=-2.7+5.4*u,z=-2.7+5.4*v;
    return [x,.035+.012*Math.sin(x*2.8+z*1.9)+.008*Math.sin(x*6.1-z*3.7),z];
  },1.7,[new THREE.Color(0xa37f79),new THREE.Color(0xe0b991)]);
  caveShell();
  box("back wall",0,1.8,-2.7,5.4,3.6,.14,mat(C.wall));
  box("left wall",-2.7,1.8,0,.14,3.6,5.4,mat(0x916177));
  box("right wall",2.7,1.8,0,.14,3.6,5.4,mat(0x916177));
  box("front wall left",-2.1875,1.8,2.7,1.025,3.6,.14,mat(C.wall));
  box("front wall right",2.1875,1.8,2.7,1.025,3.6,.14,mat(C.wall));
  box("front lintel",0,3.475,2.7,3.35,.25,.14,mat(C.wall));
  box("return doorway threshold",0,.025,2.56,3.35,.05,.28,gold);
  box("doorway left gilded edge",-1.675,1.675,2.59,.055,3.35,.2,gold);
  box("doorway right gilded edge",1.675,1.675,2.59,.055,3.35,.2,gold);
  box("doorway gold header",0,3.35,2.59,3.45,.055,.2,gold);
  sign("gallery direction on inner lintel","GALLERY","walk through to return",0,3.45,2.52,1.44,.2,Math.PI);
  const paleStone=mat(0x8da6a2);
  const duskStone=mat(0x806e82);
  for(const z of [-2.1,-.88,.37,1.68]) {
    stoneRib("sweeping mineral rib across the vaulted cave roof",Array.from({length:12},(_,i)=>{
      const x=-2.6+i*5.2/11;
      return [x,caveHeight(x,z)-.035,z+.045*Math.sin(i*.9+z)];
    }),.045,z<0?paleStone:duskStone);
  }
  for(const side of [-1,1]) {
    for(const y of [.43,1.19,2.54]) stoneRib("worn tidal stratum along the cave wall",
      Array.from({length:13},(_,i)=>{
        const z=-2.5+i*5/12;
        return [side*(2.50-.02*Math.sin(i*1.8+y)),y+.09*Math.sin(z*2.1+side+y),z];
      }),y===1.19?.045:.065,y===2.54?paleStone:duskStone);
    for(const [z,height,lean] of [[-2.12,1.65,.1],[.95,1.96,.16],[1.83,1.35,.2]]) {
      kelpBlade("broad sculpted kelp growing up the grotto wall",side,z,height,side<0?seaFoam:tide);
      kelpBlade("smaller layered kelp leaf",side,z+side*.16,height*.74,side<0?tide:seaFoam);
      stoneRib("branching kelp stem",[[side*2.49,.14,z],[side*2.47,.52,z+lean],[side*2.46,.9,z+lean*.5]],.018,gold);
    }
    for(const [z,y,size] of [[-1.86,2.4,.14],[.62,2.76,.18],[1.63,2.18,.13]]) {
      seaStar("carved five-armed sea star in the cave wall",side,y,z,size,side<0?coral:pearl);
    }
    for(const [z,y,scale] of [[-2.18,1.62,.37],[1.72,2.48,.48]]) {
      const fossil=shellFan("raised scallop fossil in cave stone",side*2.46,y,z,scale,pearl);
      fossil.rotation.y=side<0?Math.PI/2:-Math.PI/2;
    }
  }
  for(const [x,z,length] of [[-2.16,-1.55,.42],[2.11,-.64,.36],[-2.23,1.62,.53],[2.25,1.44,.43],[-1.47,-2.02,.27],[1.61,-2.17,.31]]) {
    stalactite("uneven limestone dripstone suspended from the cavern roof",x,z,length,
      x<0?paleStone:duskStone);
  }
  for(const [radius,y,z] of [[1.38,.071,1.61],[.95,.072,1.1]]) {
    stoneRib("winding tide mark inset into the sand",Array.from({length:15},(_,i)=>{
      const angle=.38+i*Math.PI*1.32/14;
      return [Math.cos(angle)*radius,y, z+Math.sin(angle)*radius*.47];
    }),.015,parchment);
  }
  coralRelief("branching coral grown into the left grotto wall",-2.29,-2.47,.91,mat(0xb88991));
  coralRelief("pale coral around the acting stage",-.78,-2.45,.84,paleStone);
  spiralFossil("large pearly nautilus fossil in the cave",-1.02,1.36,-2.39,.37,parchment);
  spiralFossil("small spiral fossil near the floor",-2.25,.56,-2.42,.19,seaFoam);

  // Small raised stage and theater drapery, right and back.
  carvedStage();
  for(const [height,depth,material,phase] of [[.76,-2.47,tide,0],[1.08,-2.42,seaFoam,1.5],[1.36,-2.39,mat(0x9b759b),2.8]]) {
    waveLine("layered underwater storybook wave",height,depth,material,phase);
  }
  shellFan("large mermaid-story shell behind the stage",.9,1.32,-2.35,1.18,mat(0x85b3ac));
  coralFan("left coral stage sculpture",-.16,.41,-2.31,.7,coral);
  coralFan("right coral stage sculpture",2.0,.41,-2.30,.79,mat(0xa971a3));
  for(const x of [-.19,2.08]) {
    for(let i=0;i<3;i++) {
      const y=.62+i*.31;
      stageFrond("hand-shaped sea grass beside the stage",x+(i%2?-.09:.08),y,-2.25,
        .32+i*.05,.07,i%2?tide:seaFoam);
    }
  }
  for (const [side,base] of [[-1,-.36],[1,2.14]]) {
    for(let fold=0;fold<3;fold++) {
      const x=base+side*fold*.09;
      const curtain=box("layered velvet stage curtain",x,1.75,-2.39+fold*.035,.105,2.64,.14,mat(fold%2?0x8e4c65:0xa75c70));
      curtain.rotation.z=side*.028;
    }
    box("curtain gold tieback",base+side*.12,1.57,-2.23,.28,.045,.08,gold);
    sphere("curtain tassel",base+side*.24,1.49,-2.19,.045,gold);
  }
  box("proscenium top",.88,3.04,-2.42,3.1,.21,.25,gold);
  drapedValance("single pleated velvet valance across the stage",.88,2.99,-2.28,3.02,mat(0x99516a));
  for(let i=0;i<7;i++) sphere("gold proscenium jewel",-.35+i*.39,3.16,-2.25,.035,gold);
  for(const x of [-.42,2.18]) shellFan("carved seashell on stage arch",x,3.02,-2.18,.38,parchment);
  stoneRib("branching cave stem holding the stage glow",[[.9,3.47,-1.67],[.89,3.3,-1.65],[.9,3.16,-1.61]],.014,gold);
  shellFan("pearly scallop stage light",.9,3.00,-1.62,.49,
    mat(0xffe3b7,{emissive:0xf7c887,emissiveIntensity:.85}));
  for(let i=0;i<7;i++) {
    const x=-.18+i*.36;
    box("recessed stage footlight socket",x,.43,-.73,.11,.045,.1,timber);
    sphere("stage footlight",x,.47,-.73,.031,mat(0xffd89c,{emissive:0xf5ae5a,emissiveIntensity:.5}));
  }
  oval("soft dance-floor shadow",1.06,.418,-1.53,.43,.006,.2,mat(0x604052,{transparent:true,opacity:.28,depthWrite:false}),root);
  ovalLine("dance circle painted onto stage",[.95,-1.57],.75,.42,.408,parchment,.18,Math.PI*1.7);
  for(const [x,z,turn] of [[.33,-1.64,-.18],[.57,-1.34,.22],[1.72,-1.91,.42]]) {
    footprintStamp("irregular carved dance step on the stage",x,.414,z,.62,turn,parchment);
  }
  sculptZephrine();
  for(const [x,y,z,r] of [[.23,1.73,-1.34,.085],[.44,2.04,-1.98,.057],[1.82,1.96,-1.1,.072],[1.73,2.39,-1.81,.042],[-.08,2.01,-1.76,.047]]) {
    suspendedBubble("rim of a suspended bubble before the stage",x,y,z,r);
  }
  for(const [name,x,y,z,size,color,right] of [
    ["small sea-glass fish behind the dancer",.35,1.91,-2.28,.62,seaFoam,true],
    ["coral fish in the upper water",1.86,2.16,-2.31,.48,coral,false],
    ["pearl fish in the middle depth",1.73,1.52,-2.05,.44,pearl,false],
    ["gold fish before the curtain",-.13,2.14,-1.67,.36,gold,true],
  ]) storybookFish(name,x,y,z,size,color,right);

  // The foreground signup desk and Jane's paused pen.
  sculptJane();
  oval("Jane's soft floor shadow",-.47,.064,.28,.32,.006,.17,mat(0x604052,{transparent:true,opacity:.22,depthWrite:false}),root);
  const signupPropsStart=root.children.length;
  carvedDesk();
  box("desk paper",-1.3,.94,.62,.56,.012,.38,paper);
  for(let i=0;i<4;i++) box("paper rule",-1.36,.951,.48+i*.07,.39,.002,.009,mat(0xbba08e));
  box("script booklet cover",-.78,.965,.52,.2,.035,.32,mat(0x8a6e8d));
  for(let page=0;page<3;page++) box("script booklet layered pages",-.78,.986+page*.006,.49,.18,.004,.25,paper);
  shellFan("tiny shell paperweight on the desk",-1.95,.96,.48,.18,pearl);
  for(const x of [-1.0,-.9,-.8]) sphere("sea-glass beads by the script",x,.964,.84,.025,bubbleGlass);
  sign("little mermaid storybook","MERMAID","a favorite story",-2.42,2.15,-.65,.54,.42,Math.PI/2);
  oval("red wax seal on signup",-1.52,.954,.77,.035,.006,.035,rose,root);
  sign("signup card","ZEPHRINE","dance + acting",-1.35,.77,.997,.5,.18);

  // Keep the whole signup action inside a portrait doorway view. The wall
  // storybook remains mounted in the cave; the desk and its held props move
  // together with Jane rather than breaking pen/paper contact.
  for(const o of root.children.slice(signupPropsStart))if(o.name!=="little mermaid storybook")o.position.x+=1.10;

  // A trail of little steps connects the signed page to the stage.
  for (let i=0;i<4;i++) {
    const x=-.52+i*.34, z=1.36-i*.5;
    footprintStamp("sculpted golden dance footprint",x,.075,z,.82,i%2?.3:-.3,i%2?gold:parchment);
  }
  for(const [x,z,length] of [[-.42,-.5,.36],[.31,-.63,.52],[.96,-.42,.29]]) {
    const roof=caveHeight(x,z)-.05;
    stoneRib("curved mineral stem suspending a little shell",[[x,roof,z],[x+.035,roof-length*.48,z+.025],
      [x+.02,roof-length,z+.04]],.012,paleStone);
    const hanging=shellFan("small shell hanging in the sea cave",x+.02,roof-length-.1,z+.04,.22,pearl);
    hanging.rotation.y=.18+x*.14;
  }
  for(const [x,y,z,r] of [[.22,2.62,1.45,.075],[1.21,2.37,1.06,.045],[1.8,2.84,.72,.064],[-.58,2.9,.55,.035]]) {
    suspendedBubble("fine bubble ring hanging between Jane and the stage",x,y,z,r);
  }
  for(const y of [2.19,2.48,2.77]) {
    line("undersea wall relief",[[-2.44,y,1.66],[-2.44,y+.07,1.28],[-2.44,y-.04,.91],[-2.44,y+.05,.54]],.013,y===2.48?seaFoam:gold);
  }

  await finishOlegPortraits(root);
  replaceStoryFigures(root,'01');
  finishStoryWorld(root,'01');
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xc6ad99);
  addRoomLighting(scene,'01');
  scene.add(root);
  const camera = portalPreviewCamera(gallery.frames[0].room);
  const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735,Math.round(735*FRAME_HEIGHT/FRAME_WIDTH));
  document.body.append(renderer.domElement);
  renderer.render(scene,camera);
  const preview = renderer.domElement.toDataURL("image/webp",.88);
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root,{binary:true,maxTextureSize:1024});
  renderer.dispose();
  const glbData = await new Promise((resolve,reject)=>{
    const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject;
    reader.readAsDataURL(new Blob([glb],{type:"model/gltf-binary"}));
  });
  return { preview, glb: glbData, objects:root.children.length };
}

window.__authorRoom = authorRoom;
