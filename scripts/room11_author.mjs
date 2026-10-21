import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

// A dream of Shedd's aquatic dome, not a literal or dated exhibit replica.
// G and Zephrine share the still moment; only the little fish gently breathe.
const C = {
  sky:0x7199a4,ground:0xc5c5b5,marble:0xe7e1ce,
  white:0xf5ecd9,shadow:0x506f7b,deep:0x164a60,
  sea:0x377489,turquoise:0x68aab1,glass:0xa5d0d0,
  coral:0xca8d85,gold:0xd4b780,pearl:0xe3d6b9,
  kelp:0x568879,leaf:0x84ab94,ink:0x3d4b54,
  skin:0xd4a082,hair:0x523f3e,gHair:0x5d4c45,
  fabric:0x68859a,cream:0xf4e6d3,rose:0xc88991,
  paper:0xf6ead8,blue:0x6198b4,
};
const art=createRoomArt({index:10,title:"G and Zephrine wonder at the fish",
  width:18.4,height:8.2,depth:20.8,colors:C,seed:111111});
const {root,M,random,add,box,beam,curve,loft,petal,
  wrapSky,ground,person,exportRoom}=art;
wrapSky(C.deep);
ground(C.ground,(x,z)=>{
  const r=Math.hypot(x*.72,z*.67);
  return new THREE.Color(C.marble).lerp(new THREE.Color(C.ground),
    Math.min(.72,r/13));
});

// An octagonal radial mosaic makes the whole room read as one vast rotunda.
for(const radius of [2.2,4.3,6.55,8.3]) {
  const points=[];
  for(let i=0;i<=64;i++) {
    const a=i*Math.PI*2/64;
    points.push([Math.cos(a)*radius,.055,Math.sin(a)*radius*.78]);
  }
  curve(root,"concentric shell-inlaid terrazzo line",points,.021,
    radius===4.3?M.turquoise:M.gold,64);
}
for(let i=0;i<16;i++) {
  const a=i*Math.PI*2/16;
  beam(root,"fine radiating floor seam",[Math.cos(a)*2.3,.057,Math.sin(a)*1.8],
    [Math.cos(a)*8.1,.057,Math.sin(a)*6.4],.012,.012,M.pearl,5);
}
// Marble columns and a faceted aquatic glass dome evoke the historic Shedd
// building. All visible walls are textured water and arches, not a box.
for(let i=0;i<8;i++) {
  const a=i*Math.PI*2/8+.13;
  const x=Math.cos(a)*8.1,z=Math.sin(a)*8.0;
  if (z > 7) continue; // leave the entrance sightline open
  const column=loft(root,"solid fluted marble rotunda column",
    [[.12,.28,.28,x,z],[.42,.31,.31,x,z],
      [4.7,.23,.23,x,z],[5.1,.34,.34,x,z]],M.marble,12,true);
  column.userData.solidFootprint=true;
  for(let f=0;f<5;f++) {
    const fa=f*Math.PI*2/5;
    curve(root,"carved vertical marble flute",
      [[x+Math.cos(fa)*.255,.43,z+Math.sin(fa)*.255],
        [x+Math.cos(fa)*.23,4.73,z+Math.sin(fa)*.23]],.009,M.pearl,12);
  }
  curve(root,"high dome rib like a rising wave",
    [[x,5.1,z],[x*.7,6.35,z*.7],[x*.36,7.27,z*.36],
      [0,7.65,0]],.067,M.gold,28);
}
for(let ring=0;ring<3;ring++) {
  const r=7.2-ring*2.35,y=5.65+ring*.75,points=[];
  for(let i=0;i<=48;i++) {
    const a=i*Math.PI*2/48;
    points.push([Math.cos(a)*r,y,Math.sin(a)*r*.96]);
  }
  curve(root,"concentric dome brass tracery",points,.035,M.gold,49);
}
add(root,"pearl center of aquatic dome",new THREE.OctahedronGeometry(.37,1),
  M.white,0,7.67,0);
for(let i=0;i<56;i++) {
  const a=random()*Math.PI*2,r=2+random()*6.2;
  const p=petal(root,"dome glass scale catching blue light",
    Math.cos(a)*r,5.5+(8-r)*.23+random()*.5,
    Math.sin(a)*r*.9,.17+random()*.12,
    i%4?M.glass:M.pearl,a);
  p.rotation.x=.5;
}

// Tall living water panes curve around the far and side perimeter. Their
// inner fish are actual meshes in the walkable space, with gentle motion.
for(const side of [-1,1]) {
  for(let i=0;i<3;i++) {
    const z=-7.5+i*4.6;
    const pane=box(root,"tall blue habitat pane",side*8.81,3.02,z,
      .09,4.95,3.7,M.deep,true);
    pane.userData.solidFootprint=true;
    box(root,"thick pale habitat glass shine",side*8.74,3.03,z,
      .016,4.63,3.4,M.sea);
    for(let j=0;j<3;j++) curve(root,"habitat stone relief border",
      [[side*8.71,.6+j*1.65,z-1.7],
        [side*8.68,.83+j*1.65,z],[side*8.71,.6+j*1.65,z+1.7]],
      .022,M.turquoise);
  }
}
box(root,"vast curved-water backdrop",0,3.15,-10.26,17.5,6.15,.09,M.deep,true);
for(let i=0;i<6;i++) {
  const x=-7.5+i*3.0;
  curve(root,"carved wave rippling across distant water",
    [[x-1.3,1.1+i%2*.3,-10.16],[x,1.45+i%2*.3,-10.14],
      [x+1.2,1.15+i%2*.3,-10.16]],.035,M.turquoise);
}
function fishGeometry() {
  const rings=[[-.46,.02,.02],[-.32,.13,.11],[.03,.19,.15],
    [.3,.145,.12],[.52,.035,.04]];
  const vertices=[],uv=[],indices=[],sides=10;
  for(let row=0;row<rings.length;row++) for(let s=0;s<sides;s++) {
    const [x,ry,rz]=rings[row],a=s*Math.PI*2/sides;
    vertices.push(x,Math.cos(a)*ry,Math.sin(a)*rz);
    uv.push(row/(rings.length-1),s/sides);
  }
  for(let row=0;row<rings.length-1;row++) for(let s=0;s<sides;s++) {
    const a=row*sides+s,b=row*sides+(s+1)%sides;
    indices.push(a,b,a+sides,b,b+sides,a+sides);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
const fishBody=fishGeometry();
function fish(x,y,z,scale,mat,phase) {
  const group=new THREE.Group();group.name="drifting sculpted aquarium fish";
  group.position.set(x,y,z);group.scale.setScalar(scale);
  group.userData.driftPhase=phase;
  group.userData.driftAmplitude=.045+random()*.04;
  root.add(group);
  add(group,"volumetric tapered fish body",fishBody,mat);
  const tail=petal(group,"forked three-dimensional fish tail",
    -.51,-.15,-.04,.43,mat,-.28);
  tail.rotation.z=-.85;
  const fin=petal(group,"raised dorsal fin",-.04,.11,-.01,.29,M.pearl,.22);
  fin.rotation.z=-.58;
  for(const side of [-1,1]) {
    add(group,"small dark fish eye",new THREE.SphereGeometry(.018,7,6),
      M.ink,.36,.055,side*.119);
    const p=petal(group,"swept volumetric side fin",-.08,-.045,
      side*.14,.22,M.gold,side*.47);
    p.rotation.x=side*.8;
  }
  for(let i=0;i<4;i++) curve(group,"fine etched fish scale",
    [[-.24+i*.12,-.1,.127],[-.18+i*.12,.01,.151],
      [-.23+i*.12,.11,.12]],.006,M.pearl,8);
}
for(let i=0;i<23;i++) {
  const side=i%2?-1:1;
  fish(side*(2.4+random()*4.7),1.55+random()*3.45,
    -2.3-random()*6.7,.68+random()*.66,
    i%3===0?M.coral:i%3===1?M.gold:M.turquoise,i*.88);
}
for(let i=0;i<7;i++) fish(-3.4+i*.78,3.7+Math.sin(i*.8)*.4,-8.9,
  .62,i%2?M.turquoise:M.gold,i*.71);

// Clusters of cut-paper kelp and coral rest behind the family and at edges.
for(const side of [-1,1]) for(let patch=0;patch<4;patch++) {
  const x=side*(4.9+patch*.72),z=-7.5+patch*3.2;
  for(let strand=0;strand<5;strand++) {
    const dx=(random()-.5)*.6;
    curve(root,"sea plant lifted in glassy water",
      [[x+dx,.15,z],[x+dx+side*.16,1.25,z+.2],
        [x+dx-side*.16,2.25+random()*.8,z+.05]],
      .035,strand%2?M.kelp:M.leaf,19);
    for(let leafIndex=0;leafIndex<4;leafIndex++) {
      petal(root,"sea leaf with pointed edge",x+dx+side*.15,
        .45+leafIndex*.45,z+.2,.25+random()*.1,
        strand%2?M.kelp:M.turquoise,side*.45);
    }
  }
}
for(let i=0;i<15;i++) {
  const x=(random()-.5)*14,z=-8+random()*11;
  if(Math.abs(x)<2.2&&z>2) continue;
  add(root,"inlaid pearly shell",new THREE.TorusGeometry(.11+random()*.11,.022,5,12),
    i%3?M.pearl:M.coral,x,.085,z).rotation.x=-Math.PI/2;
}

// G is unmistakably the older woman with the brown bob and glasses; Jane's
// bun marks her separately. Zephrine reaches toward the swimming fish.
const zeph=person("Zephrine pointing at the fish in wonder",.15,1.6,1.08,{
  skin:M.skin,hair:M.hair,outfit:M.rose,skirt:M.cream,dress:true,curls:true,
  hands:{"1":[.67,.93,.05],"-1":[-.22,.67,.22]},yaw:.72});
zeph.userData.solidFootprint=true;
const g=person("G sharing wonder with Zephrine",1.13,1.22,1.67,{
  skin:M.skin,hair:M.gHair,outfit:M.cream,pants:M.deep,
  glasses:true,longHair:true,
  hands:{"-1":[-.48,.89,.14],"1":[.5,1.15,.08]},yaw:.45});
for(const side of [-1,1]) curve(g,"G's chin-length dark brown bob",
  [[side*.15,1.72,-.03],[side*.24,1.49,.01],
    [side*.23,1.25,.04]],.033,M.gHair,13);
g.userData.solidFootprint=true;
person("Jane near her family",-3.8,-.35,1.68,{
  skin:M.skin,hair:M.hair,outfit:M.fabric,pants:M.ink,bun:true,yaw:.24});
person("Oleg near his mother and daughter",-5.0,-.25,1.78,{
  skin:M.skin,hair:M.hair,outfit:M.blue,pants:M.ink,
  glasses:true,beard:true,longHair:true,yaw:.17});

// A separate island-like threshold floats in the front of the rotunda. There
// is a walkable loop behind its posts before the physical hall opening.
const doorZ=8.55;
for(const side of [-1,1]) {
  const column=loft(root,"solid freestanding return-door marble post",
    [[.08,.15,.15,side*2.5,doorZ],
      [3.36,.13,.13,side*2.5,doorZ],
      [3.55,.19,.19,side*2.5,doorZ]],M.marble,10,true);
  column.userData.solidFootprint=true;
  curve(root,"doorway side shell engraving",
    [[side*2.5,.42,doorZ+.16],[side*2.47,1.7,doorZ+.16],
      [side*2.5,3.1,doorZ+.16]],.018,M.gold);
}
curve(root,"freestanding arched return doorway",
  [[-2.5,3.44,doorZ],[-1.25,3.8,doorZ],
    [0,3.95,doorZ],[1.25,3.8,doorZ],[2.5,3.44,doorZ]],
  .09,M.gold,30);
for(const side of [-1,1]) curve(root,"open floor loop around return doorway",
  [[side*2.5,.065,7.3],[side*3.05,.065,8.2],
    [side*2.85,.065,9.45]],.027,M.turquoise,19);
// Behind the walk-around arch, living-water panoramas cover the neighboring
// gallery plaster. The center stays physically open to the actual hallway.
for(const side of [-1,1]) {
  const centerX=side*5.48;
  add(root,"deep-water panorama flanking the freestanding exit",
    new THREE.PlaneGeometry(7.44,8.04),
    new THREE.MeshBasicMaterial({color:C.deep,side:THREE.DoubleSide,fog:false}),
    centerX,4.12,10.12);
  for(let i=0;i<7;i++) {
    const x=side*(2.25+i*.9);
    curve(root,"habitat current behind the return arch",
      [[x-.32,.7+i*.48,10.06],[x,1.02+i*.48,10.05],
        [x+.3,.78+i*.48,10.06]],.019,i%2?M.turquoise:M.glass,12);
    fish(x,1.65+((i%3)-1)*.13,9.94,.19+(i%3)*.04,
      i%4?M.gold:M.coral,15+i*1.7);
  }
  for(let i=0;i<5;i++) {
    const x=side*(2.55+i*1.35);
    for(let arm=0;arm<4;arm++) curve(root,
      "branching sea fan beyond the return arch",
      [[x,.2,10.0],[x+side*(arm-1.5)*.17,1.08,9.99],
        [x+side*(arm-1.5)*.28,1.65+arm*.08,9.98]],
      .012,arm%2?M.turquoise:M.coral,12);
  }
  for(let i=0;i<5;i++) {
    const x=side*(2.2+i*1.42);
    curve(root,"kelp rising through the water beside the exit",
      [[x,.16,9.95],[x+side*.19,.75,9.95],
        [x-side*.14,1.65+random()*.5,9.95]],.03,M.kelp,16);
    petal(root,"leaf in the water beside the exit",x+side*.1,
      .85,9.95,.34,M.leaf,side*.37);
  }
}

window.__authorRoom=()=>exportRoom({key:0xe8f6ef,fill:0x6ab4c7,
  ambient:1.85,keyPower:2.2});
