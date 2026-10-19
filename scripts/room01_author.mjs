import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import gallery from "../src/_data/gallery.json";

// Frame 01 is authored once as a scene. Its GLB and painting use this same root
// and the camera stored in gallery.json.
const C = {
  cream: 0xf3dfbd, wall: 0x794e68, rose: 0xc98491, plum: 0x3c314d,
  gold: 0xe7b862, blue: 0x8eb6b5, stage: 0x6b3e54, paper: 0xfff1d7,
};
const root = new THREE.Group();
root.name = "Zephrine's first stage — a frozen paper theater";
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .91, metalness: 0, side: THREE.DoubleSide, ...extra });
const paper = mat(C.paper);
const timber = mat(0x755047);
const gold = mat(C.gold, { emissive: 0x3e2108, emissiveIntensity: .16 });

function box(name, x, y, z, w, h, d, material, parent = root) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
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
function cardTexture(title, small = "", ink = "#523d52", background = "#fff1d9") {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = background; ctx.fillRect(0,0,512,256);
  ctx.strokeStyle = "#bd8f65"; ctx.lineWidth = 9; ctx.strokeRect(13,13,486,230);
  ctx.fillStyle = ink; ctx.textAlign = "center";
  ctx.font = "bold 54px Georgia"; ctx.fillText(title,256,121);
  if (small) { ctx.font = "29px Georgia"; ctx.fillText(small,256,179); }
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
function figure(name, image, x, z, height, width, backingColor, lift=0) {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  const aspect = texture.image.width/texture.image.height;
  const w = width || height*aspect;
  // Wood thickness, painted side and a slight offset of the portrait make the
  // people read as sculpted paper figures when viewed from an angle.
  const body = new THREE.Group(); body.name=name; body.position.set(x,lift,z); root.add(body);
  const reverse = new THREE.Mesh(new THREE.PlaneGeometry(w,height),new THREE.MeshBasicMaterial({map:texture,color:backingColor,transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:true}));
  reverse.name=`${name} painted paper back`; reverse.position.set(0,height/2,-.045); reverse.rotation.y=.06; body.add(reverse);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.08,side:THREE.DoubleSide,depthWrite:true}));
  plane.name=`${name} painted likeness`; plane.position.set(0,height/2,.02); body.add(plane);
  box(`${name} small paper stand`,0,.06,-.1,.3,.12,.24,mat(backingColor),body);
  return body;
}

export async function authorRoom() {
  const zephrineImage = await new Promise((resolve,reject) => { const image=new Image(); image.onload=()=>resolve(image); image.onerror=reject; image.src="/room01/zephrine.png"; });
  const janeImage = await new Promise((resolve,reject) => { const image=new Image(); image.onload=()=>resolve(image); image.onerror=reject; image.src="/room01/jane.png"; });
  // TextureLoader.load above is asynchronous, so preload both images first.
  void zephrineImage; void janeImage;

  // Architecture: 5.4 m square, tall walls, open central doorway at +Z.
  box("plank floor",0,-.08,0,5.4,.16,5.4,mat(0xc49278));
  box("ceiling",0,3.6,0,5.4,.12,5.4,mat(0x443449));
  box("back wall",0,1.8,-2.7,5.4,3.6,.14,mat(C.wall));
  box("left wall",-2.7,1.8,0,.14,3.6,5.4,mat(0x916177));
  box("right wall",2.7,1.8,0,.14,3.6,5.4,mat(0x916177));
  box("front wall left",-1.79,1.8,2.7,1.82,3.6,.14,mat(C.wall));
  box("front wall right",1.79,1.8,2.7,1.82,3.6,.14,mat(C.wall));
  box("front lintel",0,3.24,2.7,1.76,.72,.14,mat(C.wall));
  box("return doorway threshold",0,.025,2.56,1.75,.05,.28,gold);
  box("doorway left gilded edge",-.9,1.45,2.59,.055,2.9,.2,gold);
  box("doorway right gilded edge",.9,1.45,2.59,.055,2.9,.2,gold);
  box("doorway gold header",0,2.93,2.59,1.86,.055,.2,gold);
  sign("way back to the gallery","GALLERY","walk through to return",0,2.96,2.52,1.44,.35,Math.PI);
  for(let i=0;i<9;i++) box("floorboard seam",0,.002,-2.35+i*.58,5.3,.006,.017,mat(0x976f65));
  for(let i=0;i<5;i++) box("floorboard grain",-2.1+i*1.05,.008,0,.018,.006,5.3,mat(0xb58570));
  for(let i=0;i<8;i++) {
    const x=-2.28+i*.65;
    sphere("ceiling star",x,3.45,-1.5-(i%2)*.38,.045,gold);
  }

  // Small raised stage and theater drapery, right and back.
  box("stage base",.9,.19,-1.58,2.65,.38,1.5,mat(C.stage));
  box("stage gold lip",.9,.4,-.79,2.72,.055,.09,gold);
  box("stage patterned floor",.9,.395,-1.58,2.54,.02,1.38,mat(0xbb866c));
  box("stage rear panel",.9,1.7,-2.57,2.75,2.6,.09,mat(0x453651));
  for (const x of [-.43,.08,1.73,2.18]) {
    const curtain=box("folded stage curtain",x,1.72,-2.41,.18,2.75,.19,mat(x<0?0x9c5164:0xa95a6f));
    curtain.rotation.z=(x<0?.04:-.04);
  }
  box("proscenium top",.88,3.04,-2.42,3.1,.21,.25,gold);
  box("stage spotlight glow",.9,3.31,-1.6,.62,.05,.62,mat(0xf7d9a0,{emissive:0xf7b861,emissiveIntensity:.5}));
  sphere("paper spotlight",.9,3.23,-1.62,.18,mat(0xffd889,{emissive:0xffba65,emissiveIntensity:.85}));
  figure("Zephrine", zephrineImage,1.12,-1.55,1.38,undefined,0xb8774b,.40);
  sign("dance card","DANCE","a little first step",-.08,1.63,-2.35,.69,.45);
  sign("acting card","ACTING","a story to tell",2.0,1.63,-2.35,.69,.45);

  // The foreground signup desk and Jane's paused pen.
  figure("Jane", janeImage,-1.58,.30,1.72,undefined,0x2b315a);
  box("signup desk top",-1.37,.88,.66,1.54,.095,.72,mat(0x9d684f));
  box("desk fascia",-1.37,.53,.93,1.54,.63,.075,mat(0x805344));
  for(const x of [-2.04,-.7]) for(const z of [.36,.94]) box("desk carved leg",x,.43,z,.09,.86,.09,timber);
  box("desk paper",-1.3,.94,.62,.56,.012,.38,paper);
  for(let i=0;i<4;i++) box("paper rule",-1.36,.951,.48+i*.07,.39,.002,.009,mat(0xbba08e));
  box("script booklet cover",-.78,.965,.52,.2,.035,.32,mat(0x8a6e8d));
  sign("signup card","ZEPHRINE","dance + acting",-1.35,.58,.985,.48,.21);
  sign("script placard","SCRIPT","a story begins",-2.3,1.57,-.28,.52,.38,Math.PI/2);

  // Traces Jane can inspect: masks, footsteps, cards and framed scraps.
  for (const [name,x] of [["comedy",-2.14],["tragedy",-1.45]]) {
    sphere(`${name} theater mask`,x,2.43,-2.57,.24,mat(0xe9ca9a));
    sphere(`${name} left eye`,x-.08,2.47,-2.34,.018,mat(C.plum));
    sphere(`${name} right eye`,x+.08,2.47,-2.34,.018,mat(C.plum));
    line(`${name} expression`,[[x-.1,2.35,-2.34],[x,2.31+(name==="comedy"?-.025:.025),-2.32],[x+.1,2.35,-2.34]],.011,mat(C.plum));
  }
  for (let i=0;i<4;i++) {
    const x=-.52+i*.34, z=1.36-i*.5;
    const foot=box("tiny painted footstep",x,.015,z,.13,.01,.27,mat(i%2?0xe5b169:0xe7c389));
    foot.rotation.y=(i%2?.3:-.3);
  }
  sign("left wall class card","DANCE","move with joy",-2.58,1.7,-1.25,.66,.44,Math.PI/2);
  sign("right wall class card","ACTING","tell a story",2.58,1.7,.3,.66,.44,-Math.PI/2);
  for(let i=0;i<3;i++) {
    box("paper light banner",-.35+i*.5,2.88,-.15-i*.48,.28,.035,.4,mat(i===1?C.blue:C.gold));
  }

  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x211a30);
  scene.add(new THREE.AmbientLight(0xffffff,1.65));
  const key = new THREE.DirectionalLight(0xffdfab,2.1); key.position.set(1.6,3.2,1.8); scene.add(key);
  const fill = new THREE.DirectionalLight(0xb7c7ff,.7); fill.position.set(-2,2,-1); scene.add(fill);
  scene.add(root);
  const view = gallery.frames[0].room.previewCamera;
  const camera = new THREE.PerspectiveCamera(view.fov,2.45/3.12,.05,30);
  camera.position.fromArray(view.position); camera.lookAt(...view.target);
  const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1); renderer.setSize(735,936);
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
