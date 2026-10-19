import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";

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
function face(name, head, skin, iris, options={}) {
  oval(`${name} softly sculpted face`,0,0,0,.18,.215,.16,skin,head);
  oval(`${name} small nose`,0,-.022,.165,.033,.048,.044,skin,head);
  for (const sign of [-1,1]) {
    oval(`${name} ear`,sign*.174,-.015,-.01,.045,.07,.033,skin,head);
    oval(`${name} eye white`,sign*.078,.034,.145,.046,.032,.018,eyeWhite,head);
    oval(`${name} iris`,sign*.078,.033,.164,.023,.025,.012,iris,head);
    oval(`${name} pupil`,sign*.078,.033,.175,.010,.015,.008,eyeDark,head);
    oval(`${name} eyebrow`,sign*.078,.091,.153,.052,.010,.011,options.hair || hairZephrine,head);
  }
  oval(`${name} quiet smile`,0,-.111,.153,.062,.010,.012,rose,head);
}
function sculptZephrine() {
  const child = new THREE.Group(); child.name="Zephrine — sculpted in the middle of a dance";
  child.position.set(1.1,.40,-1.53); child.rotation.y=-.13; root.add(child);
  // Rounded toddler proportions and the rust outfit recall the supplied photos.
  oval("Zephrine rust sweater",0,.72,0,.23,.30,.17,rust,child);
  oval("Zephrine round collar",0,.96,.045,.115,.046,.13,skinZephrine,child);
  oval("Zephrine pants hips",0,.51,0,.22,.15,.17,rust,child);
  limb("Zephrine supporting leg",[-.11,.48,0],[-.14,.12,.01],.105,.078,rust,child);
  limb("Zephrine lifted dancing leg",[.10,.48,0],[.28,.22,.13],.105,.076,rust,child);
  oval("Zephrine left aqua shoe",-.15,.073,.12,.115,.055,.17,aqua,child);
  oval("Zephrine lifted aqua shoe",.29,.18,.24,.12,.052,.16,aqua,child);
  for(const [x,y,z] of [[-.15,.076,.24],[.29,.18,.37]]) {
    box("aqua sandal strap",x,y,z,.15,.025,.025,mat(0xa2d8cf),child);
  }
  limb("Zephrine raised arm",[-.2,.91,0],[-.47,1.23,.05],.083,.054,rust,child);
  limb("Zephrine open arm",[.2,.91,0],[.47,.78,.16],.083,.052,rust,child);
  oval("Zephrine raised hand",-.49,1.255,.06,.067,.072,.04,skinZephrine,child);
  oval("Zephrine open hand",.50,.775,.17,.072,.054,.035,skinZephrine,child);
  for(let i=0;i<3;i++) box("sweater button",0,.84-i*.065,.171,.025,.025,.014,mat(0xe0b687),child);

  const head = new THREE.Group(); head.name="Zephrine's blue-eyed face and curly bob";
  head.position.set(0,1.13,.01); head.rotation.z=-.07; child.add(head);
  face("Zephrine",head,skinZephrine,eyeBlue,{hair:hairZephrine});
  oval("Zephrine hair crown",0,.15,-.055,.207,.185,.17,hairZephrine,head);
  const curls=[[-.205,.11,.03],[-.23,.02,.025],[-.23,-.07,.02],[-.18,-.15,-.025],
    [.205,.11,.03],[.23,.02,.025],[.23,-.07,.02],[.18,-.15,-.025],
    [-.14,.22,.08],[-.055,.23,.095],[.04,.235,.085],[.135,.21,.085]];
  curls.forEach(([x,y,z],index)=>oval(`Zephrine curl ${index+1}`,x,y,z,.064,.07,.067,index%3?hairZephrine:hairHighlight,head));
  return child;
}
function sculptJane() {
  const jane = new THREE.Group(); jane.name="Jane — sculpted at the signup desk";
  jane.position.set(-1.57,0,.28); jane.rotation.y=.09; root.add(jane);
  // A gently tapered dress gives Jane the subtly slimmer silhouette requested.
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.19,.31,.62,18),navy);
  skirt.name="Jane's navy dress skirt"; skirt.position.set(0,.59,0); jane.add(skirt);
  oval("Jane navy bodice",0,1.03,0,.215,.29,.16,navy,jane);
  oval("Jane neckline",0,1.25,.055,.113,.048,.115,skinJane,jane);
  limb("Jane left leg",[-.11,.39,0],[-.12,.08,.035],.072,.054,skinJane,jane);
  limb("Jane right leg",[.11,.39,0],[.13,.08,.04],.072,.054,skinJane,jane);
  oval("Jane left navy shoe",-.12,.055,.13,.105,.055,.16,navy,jane);
  oval("Jane right navy shoe",.13,.055,.14,.105,.055,.16,navy,jane);
  // Her hand and pen are physically over the signup paper, frozen mid-sentence.
  limb("Jane writing upper arm",[.17,1.18,.02],[.23,1.01,.20],.075,.063,skinJane,jane);
  limb("Jane writing forearm",[.23,1.01,.20],[.29,.956,.38],.064,.045,skinJane,jane);
  oval("Jane writing hand",.30,.954,.39,.068,.035,.055,skinJane,jane);
  limb("Jane resting upper arm",[-.17,1.18,.02],[-.27,1.02,.22],.075,.061,skinJane,jane);
  limb("Jane resting forearm",[-.27,1.02,.22],[-.08,.95,.37],.061,.044,skinJane,jane);
  oval("Jane resting hand",-.06,.949,.38,.071,.036,.055,skinJane,jane);
  limb("Jane pen",[.315,.965,.43],[.35,1.075,.45],.009,.007,eyeDark,jane);

  const head = new THREE.Group(); head.name="Jane's dark high bun and freckled face";
  head.position.set(0,1.48,.015); head.rotation.y=.23; head.rotation.z=-.04; jane.add(head);
  face("Jane",head,skinJane,eyeDark,{hair:hairJane});
  oval("Jane swept back hair",0,.115,-.075,.195,.18,.145,hairJane,head);
  oval("Jane high bun",.02,.28,-.09,.115,.115,.105,hairJane,head);
  oval("Jane loose bun strand",-.08,.30,-.06,.055,.07,.06,hairJane,head);
  for(const sign of [-1,1]) {
    oval("Jane pearl stud",sign*.19,-.025,.02,.019,.019,.019,eyeWhite,head);
    for(let i=0;i<3;i++) oval("Jane freckle",sign*(.055+i*.025),-.052+(i%2)*.018,.153,.006,.006,.004,mat(0xc77b69),head);
  }
  return jane;
}

export async function authorRoom() {

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
  sculptZephrine();
  sign("dance card","DANCE","a little first step",-.08,1.63,-2.35,.69,.45);
  sign("acting card","ACTING","a story to tell",2.0,1.63,-2.35,.69,.45);

  // The foreground signup desk and Jane's paused pen.
  sculptJane();
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
  const camera = new THREE.PerspectiveCamera(view.fov,FRAME_WIDTH/FRAME_HEIGHT,.05,30);
  camera.position.fromArray(view.position); camera.lookAt(...view.target);
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
