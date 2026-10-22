import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createRoomArt } from "./room_art.mjs";
import reefBackdropURL from "./assets/room11/reef-backdrop.webp";
import riverBackdropURL from "./assets/room11/river-backdrop.webp";
import reefVariantURL from "./assets/room11/reef-variant.webp";
import riverVariantURL from "./assets/room11/river-variant.webp";
import canopyWatercolorURL from "./assets/room11/canopy-watercolor.webp";
import paintedBarramundiURL from "./assets/room11/barramundi-painted.glb";

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
  width:18.4,height:8.2,depth:34.8,colors:C,seed:111111});
const {root,M,random,add,box,beam,curve,loft,petal,
  wrapSky,ground,person,exportRoom}=art;
wrapSky(C.deep);
const floor=ground(C.ground,(x,z)=>{
  const r=Math.hypot(x*.72,z*.57);
  return new THREE.Color(0xaacbbd).lerp(new THREE.Color(0x628f8d),
    Math.min(.84,r/13));
});
{
  const canvas=document.createElement("canvas");
  canvas.width=canvas.height=640;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,640,640);
  // Layered, irregular water reflections soften the broad marble floor.
  // They are part of its material, with all story figures still fully 3D.
  for(let layer=0;layer<3;layer++) for(let i=0;i<110;i++) {
    const x=random()*720-40,y=random()*720-40;
    const radius=10+random()*46;
    ctx.strokeStyle=layer===0?"rgba(35,105,118,.055)":
      layer===1?"rgba(183,219,214,.25)":"rgba(255,250,223,.50)";
    ctx.lineWidth=layer===0?4+random()*5:2+random()*3;
    ctx.beginPath();
    ctx.moveTo(x-radius,y);
    ctx.bezierCurveTo(x-radius*.44,y-radius*.5,
      x+radius*.5,y+radius*.45,x+radius,y+radius*.08);
    ctx.stroke();
  }
  // Tiny mineral flecks sit below the larger water reflections. This texture
  // belongs to the stone, so the open walking surface gains detail without
  // scattering loose flat symbols across it.
  for(let i=0;i<3200;i++) {
    const x=random()*640,y=random()*640,r=.3+random()*1.7;
    ctx.fillStyle=i%5===0?"rgba(233,216,179,.28)":
      "rgba(49,114,119,.17)";
    ctx.beginPath();ctx.ellipse(x,y,r,r*.45,random()*6.28,0,6.28);ctx.fill();
  }
  const caustics=new THREE.CanvasTexture(canvas);
  caustics.colorSpace=THREE.SRGBColorSpace;
  floor.material.map=caustics;
  floor.material.needsUpdate=true;
}

// A restrained pair of broad stone inlays locates the rotunda without
// drawing a digital target across the walking floor. The watercolor mineral
// wash and inhabited glass carry the rest of the room's rhythm.
for(const radius of [2.45,7.15]) {
  const points=[];
  for(let i=0;i<=64;i++) {
    const a=i*Math.PI*2/64;
    const wave=1+.008*Math.sin(a*6+.2)+.006*Math.sin(a*11);
    points.push([Math.cos(a)*radius*wave,.055,
      Math.sin(a)*radius*.78*wave]);
  }
  curve(root,"hand-laid tidal border in aquamarine terrazzo",points,
    radius<3?.021:.013,radius<3?M.gold:M.marble,64);
}
// A continuous paneled canopy gives the rotunda an actual luminous roof,
// rather than leaving ribs hanging over a flat dark ceiling.
let canopyMaterial;
{
  const positions=[],colors=[],uv=[],indices=[],rings=9,slices=48;
  const shallow=new THREE.Color(0xa6cdd0),deep=new THREE.Color(0x6a9bab);
  for(let ring=0;ring<=rings;ring++) {
    const r=.08+ring*8.12/rings;
    const y=7.75-2.65*Math.pow(r/8.2,2);
    for(let slice=0;slice<=slices;slice++) {
      const a=slice*Math.PI*2/slices;
      const wash=.05*Math.sin(a*7+ring*1.2)+.04*Math.cos(a*11-ring*.8);
      const c=shallow.clone().lerp(deep,.18+.48*r/8.2+wash);
      positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
      colors.push(c.r,c.g,c.b);
      uv.push(.5+Math.cos(a)*r/16.4,.5+Math.sin(a)*r/16.4);
      if(ring<rings&&slice<slices) {
        const i=ring*(slices+1)+slice;
        indices.push(i,i+slices+1,i+1,i+1,i+slices+1,i+slices+2);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  canopyMaterial=new THREE.MeshBasicMaterial({color:0xffffff,
    side:THREE.DoubleSide});
  add(root,"continuous aquamarine glass canopy between shell ribs",geometry,
    canopyMaterial);
}
// Continuous fluted stone, with carved shell crowns, carries the water vault.
// The custom shaft silhouette avoids a stack of cylinders and leaves a single
// simple footprint for walking collision.
function carvedRotundaColumn(x,z) {
  const profile=[
    [.08,.34],[.20,.42],[.34,.38],[.48,.29],
    [.75,.265],[1.6,.25],[3.55,.235],[4.58,.25],
    [4.78,.30],[4.93,.385],[5.08,.43],[5.18,.38],
  ];
  const sides=48,points=[],colors=[],uv=[],indices=[];
  const pale=new THREE.Color(0xe7e1ce),shade=new THREE.Color(0xb9c9bf);
  for(let row=0;row<profile.length;row++) {
    const [y,base]=profile[row];
    for(let side=0;side<sides;side++) {
      const a=side*Math.PI*2/sides;
      const fluting=y>.45&&y<4.8 ?
        .016*Math.cos(12*a)+.004*Math.cos(24*a) :
        .004*Math.cos(12*a);
      const radius=base+fluting;
      points.push(x+Math.cos(a)*radius,y,z+Math.sin(a)*radius);
      uv.push(side/sides,row/(profile.length-1));
      const c=pale.clone().lerp(shade,
        .15+.14*(.5+.5*Math.cos(12*a))+.09*y/5.2);
      colors.push(c.r,c.g,c.b);
      if(row<profile.length-1) {
        const n=row*sides+side,b=row*sides+(side+1)%sides;
        indices.push(n,b,n+sides,b,b+sides,n+sides);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const shaft=add(root,"fluted carved limestone column with joined capital",
    geometry,new THREE.MeshStandardMaterial({color:0xffffff,
      vertexColors:true,roughness:.94,side:THREE.DoubleSide}));
  shaft.userData.solidFootprint=true;
  const shell=new THREE.Shape();
  shell.moveTo(-.11,-.12);
  shell.bezierCurveTo(-.15,-.02,-.12,.13,-.085,.18);
  shell.quadraticCurveTo(-.045,.12,0,.22);
  shell.quadraticCurveTo(.045,.12,.085,.18);
  shell.bezierCurveTo(.12,.13,.15,-.02,.11,-.12);
  shell.closePath();
  const leafGeometry=new THREE.ExtrudeGeometry(shell,{depth:.022,
    bevelEnabled:true,bevelSize:.008,bevelThickness:.008,
    bevelSegments:2,curveSegments:7});
  for(let i=0;i<12;i++) {
    const a=i*Math.PI*2/12;
    const leaf=add(root,"carved shell fan supporting the marble crown",
      leafGeometry,i%3===0?M.pearl:M.marble,
      x+Math.cos(a)*.34,4.91,z+Math.sin(a)*.34);
    leaf.rotation.y=Math.PI/2-a;
    curve(root,"incised shell vein in the column capital",
      [[x+Math.cos(a)*.355,4.83,z+Math.sin(a)*.355],
        [x+Math.cos(a)*.405,5.03,z+Math.sin(a)*.405]],
      .005,M.gold,8);
  }
  curve(root,"gold waterline around the column base",
    Array.from({length:33},(_,i)=>{
      const a=i*Math.PI*2/32;
      return [x+Math.cos(a)*.41,.22,z+Math.sin(a)*.41];
    }),.009,M.gold,33);
}
// The column rhythm evokes Shedd's historic rotunda as a dream, rather than
// claiming this scene reproduces a particular visit or exhibit.
for(let i=0;i<8;i++) {
  const a=i*Math.PI*2/8+.13;
  const x=Math.cos(a)*8.1,z=Math.sin(a)*8.0;
  if (z > 7) continue; // leave the entrance sightline open
  carvedRotundaColumn(x,z);
  curve(root,"high dome rib like a rising wave",
    [[x,5.1,z],[x*.7,6.35,z*.7],[x*.36,7.27,z*.36],
      [0,7.65,0]],.067,M.gold,28);
}
{
  const r=7.2,y=5.65,points=[];
  for(let i=0;i<=64;i++) {
    const a=i*Math.PI*2/64;
    points.push([Math.cos(a)*r,y,Math.sin(a)*r*.96]);
  }
  curve(root,"continuous shell-carved rim joining the dome ribs",
    points,.05,M.marble,65);
}

// The visitor stands between actual inhabited saltwater and freshwater
// habitats, with a third reef across the end. Fish and plants live behind the
// glass, not over the open floor. The glazing is almost invisible except for
// its reflections, thick seals, and sightline-dependent edge glints.
const glass = new THREE.MeshPhysicalMaterial({color:0xa3d9df,transparent:true,
  opacity:.09,roughness:.08,metalness:0,depthWrite:false,side:THREE.DoubleSide});
// The vistas are the distant water. Keep them a quieter value than the
// sculptures in front of the glass so a bay reads as a habitat, not wallpaper.
const reefWall = new THREE.MeshBasicMaterial({color:0x91b3bb,side:THREE.DoubleSide});
const riverWall = new THREE.MeshBasicMaterial({color:0x9dbab0,side:THREE.DoubleSide});
const reefVariantWall = new THREE.MeshBasicMaterial({color:0x93aeb7,side:THREE.DoubleSide});
const riverVariantWall = new THREE.MeshBasicMaterial({color:0x9ebbb2,side:THREE.DoubleSide});
for(const side of [-1,1]) {
  box(root,"continuous solid sculpted tank wall",side*9.12,3.23,1.6,
    .15,6.45,30.95,M.deep,true);
  for(let bay=0;bay<6;bay++) {
    const z=-9.85+bay*5.12;
    const habitatPaint=side===1?
      (bay%2?reefVariantWall:reefWall):
      (bay%2?riverVariantWall:riverWall);
    const habitat=box(root,side===1?"painted saltwater reef habitat":"painted freshwater river habitat",
      side*9.01,3.25,z,.05,5.45,4.66,habitatPaint);
    if(bay>=2) {
      const uv=habitat.geometry.attributes.uv;
      for(let vertex=0;vertex<uv.count;vertex++) {
        const u=uv.getX(vertex);
        uv.setX(vertex,bay===4?.08+u*.84:1-u);
      }
      uv.needsUpdate=true;
    }
    const pane=add(root,"continuous thick aquarium viewing glass",
      new THREE.PlaneGeometry(4.62,5.52),glass,side*7.56,3.34,z);
    pane.rotation.y=Math.PI/2;
    // Both the glass and its bottom sill stop the player before the fish.
    const sill=box(root,"solid wave-cut stone aquarium sill",side*7.48,.33,z,
      .38,.66,4.75,M.marble,true);
    curve(root,"polished brass sill lip",[[side*7.23,.68,z-2.32],
      [side*7.22,.69,z],[side*7.23,.68,z+2.32]],.025,M.gold);
    for(const edge of [-1,1]) {
      const ez=z+edge*2.34;
      const pier=loft(root,"solid arched aquarium mullion",
        [[.4,.22,.18,side*7.44,ez],[2.6,.16,.14,side*7.44,ez],
          [5.95,.25,.19,side*7.44,ez],[6.3,.34,.28,side*7.44,ez]],
        M.marble,10,true);
      pier.userData.solidFootprint=true;
      curve(root,"gilt rippled mullion carving",[[side*7.18,1.1,ez],
        [side*7.16,2.75,ez+.08],[side*7.18,4.3,ez-.07],
        [side*7.18,5.75,ez]],.018,M.gold,22);
    }
    curve(root,"high shell-shaped tank arch",[[side*7.42,5.9,z-2.36],
      [side*7.42,6.25,z-1.2],[side*7.42,6.42,z],
      [side*7.42,6.25,z+1.2],[side*7.42,5.9,z+2.36]],.066,M.pearl,28);
    for(let glint=0;glint<2;glint++) curve(root,"soft vertical glass glint",
      [[side*7.535,1.15,z-1.75+glint*1.15],
        [side*7.535,3.25,z-1.68+glint*1.15],
        [side*7.535,5.1,z-1.72+glint*1.15]],.009,M.glass,15);
  }
}
box(root,"solid distant reef backdrop",0,3.25,-13.28,18.1,6.5,.12,M.deep,true);
for(const side of [-1,1]) box(root,"painted distant reef habitat",
  side*4.45,3.25,-13.18,8.9,6.3,.016,side<0?reefWall:reefVariantWall);
add(root,"distant reef aquarium viewing pane",new THREE.PlaneGeometry(15.8,5.52),
  glass,0,3.32,-11.35);
for(let x=-6.8;x<=6.8;x+=3.4) {
  const pier=loft(root,"solid carved pier between reef vistas",
    [[.35,.2,.2,x,-11.3],[3.2,.14,.16,x,-11.3],
      [5.92,.22,.2,x,-11.3]],M.marble,10,true);
  pier.userData.solidFootprint=true;
}
curve(root,"great pearled arch around the distant reef",
  [[-8,5.95,-11.32],[-4.5,6.6,-11.32],[0,6.9,-11.32],
    [4.5,6.6,-11.32],[8,5.95,-11.32]],.09,M.gold,42);
// The rear painting is several metres behind reachable glass. From behind
// the free-standing portal it gains parallax instead of becoming pixel-sized
// wallpaper when a visitor walks up to the exhibit.
// The rear habitat meets a shaped carved plinth instead of a single exposed
// rectangular slab. Its full-depth mesh retains the same collision boundary.
{
  const sections=36,profile=[
    [0,16.73],[.12,16.70],[.57,16.71],[.69,16.74],
    [.76,16.82],[.78,16.95],[.72,17.11],[0,17.11],
  ];
  const positions=[],uv=[],indices=[],edge=profile.length;
  for(let step=0;step<=sections;step++) {
    const x=-8.95+step*17.9/sections;
    const wave=.016*Math.sin(x*1.3)+.009*Math.sin(x*3.1);
    for(let p=0;p<edge;p++) {
      const [y,z]=profile[p];
      positions.push(x,y+(y>.55?wave:0),z);
      uv.push(step/sections,p/edge);
      if(step<sections) {
        const n=step*edge+p,next=step*edge+(p+1)%edge;
        indices.push(n,next,n+edge,next,next+edge,n+edge);
      }
    }
  }
  for(let p=1;p<edge-1;p++) {
    indices.push(0,p+1,p);
    const last=sections*edge;
    indices.push(last,last+p,last+p+1);
  }
  const stone=new THREE.BufferGeometry();
  stone.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  stone.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  stone.setIndex(indices);stone.computeVertexNormals();
  add(root,"solid carved wave plinth beneath deep rear glazing",
    stone,M.marble).userData.solidFootprint=true;
}
curve(root,"carved watercourse along the rear stone face",
  Array.from({length:25},(_,i)=>{
    const x=-8.7+i*17.4/24;
    return [x,.38+.035*Math.sin(x*1.15),16.683];
  }),.013,M.pearl,49);
curve(root,"lower gold inlay following the rear stone face",
  [[-8.85,.14,16.681],[-4.4,.14,16.681],[0,.14,16.681],
    [4.4,.14,16.681],[8.85,.14,16.681]],.011,M.gold,32);
for(const x of [-6.6,-3.3,0,3.3,6.6]) {
  curve(root,"shell fan carved into the rear aquarium plinth",
    [[x-.43,.31,16.679],[x-.28,.52,16.679],
      [x,.57,16.679],[x+.28,.52,16.679],
      [x+.43,.31,16.679]],.015,M.pearl,20);
  for(let rib=-2;rib<=2;rib++) curve(root,"radiating shell flute in stone",
    [[x,.24,16.677],[x+rib*.075,.38,16.677],
      [x+rib*.15,.51-Math.abs(rib)*.014,16.677]],
    .007,M.pearl,12);
}
const rearBed=add(root,"modeled seabed continues behind rear glazing",
  new THREE.PlaneGeometry(18,4.5,18,8),M.shadow,0,.045,18.85);
rearBed.rotation.x=-Math.PI/2;
curve(root,"continuous polished edge of the rear glazing",
  [[-8.82,.77,16.82],[-4.4,.77,16.82],
    [0,.77,16.82],[4.4,.77,16.82],[8.82,.77,16.82]],
  .038,M.gold,29);
for(let rock=0;rock<13;rock++) {
  const x=-8.1+rock*1.34+(random()-.5)*.37;
  const z=18.1+(rock%3)*.7;
  const width=.34+random()*.47;
  loft(root,"layered sandstone reef emerging from the seabed",
    [[.03,width,.31,x,z],[.12,width*1.14,.4,x-.07,z],
      [.26,width*.82,.3,x+.06,z-.04],
      [.39,width*.36,.12,x+.11,z-.07]],
    rock%3===0?M.kelp:rock%3===1?M.deep:M.turquoise,10);
}
for(const side of [-1,1]) box(root,"painted habitat behind freestanding portal",
  side*4.45,4.05,20.55,8.9,8.0,.016,side===1?reefVariantWall:riverVariantWall);
for(const side of [-1,1]) {
  add(root,"rear aquarium glazing beyond portal",
    new THREE.PlaneGeometry(7.2,5.25),glass,side*5.25,3.2,16.82);
  curve(root,"carved upright on the inhabited rear glass",
    [[side*1.72,.62,16.8],[side*1.72,3.2,16.8],
      [side*1.72,5.85,16.8]],.064,M.pearl,22);
}
curve(root,"great carved shell arch above the rear water habitat",
  [[-8.88,5.85,16.76],[-6.7,6.28,16.73],
    [-4.05,6.82,16.7],[0,7.13,16.68],
    [4.05,6.82,16.7],[6.7,6.28,16.73],
    [8.88,5.85,16.76]],.12,M.marble,48);
curve(root,"thin gilded wave inside the rear shell arch",
  [[-8.78,5.71,16.72],[-6.5,6.13,16.69],
    [-4,6.64,16.66],[0,6.96,16.64],
    [4,6.64,16.66],[6.5,6.13,16.69],
    [8.78,5.71,16.72]],.026,M.gold,48);
{
  // The path behind the freestanding doorway belongs to the same enchanted
  // aquarium. Continue the inhabited vault there instead of exposing a flat
  // rectangular sky ceiling once the visitor rounds a post.
  const positions=[],uv=[],indices=[],across=28,along=14;
  for(let row=0;row<=along;row++) {
    const z=10.08+row*7.18/along;
    for(let col=0;col<=across;col++) {
      const x=-8.3+col*16.6/across,u=x/8.3;
      positions.push(x,7.77-1.92*u*u+.035*Math.sin(z*1.8+u*5),z);
      uv.push(col/across,row/along);
      if(row<along&&col<across) {
        const n=row*(across+1)+col;
        indices.push(n,n+across+1,n+1,n+1,n+across+1,n+across+2);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  add(root,"painted vaulted water ceiling beyond the freestanding portal",
    geometry,canopyMaterial);
}
for(const z of [11.4,14.45,16.6]) {
  curve(root,"vaulted wave rib over the aquarium behind its portal",
    [[-8.3,5.75,z],[-5.7,7.15,z-.17],[0,7.72,z-.32],
      [5.7,7.15,z-.17],[8.3,5.75,z]],.085,M.pearl,31);
  curve(root,"fine inlaid waterline beneath the rear vault",
    [[-7.5,.065,z],[-3.9,.07,z-.13],[0,.068,z-.2],
      [3.9,.07,z-.13],[7.5,.065,z]],.024,M.gold,25);
}
function fishGeometry(rings,species) {
  const vertices=[],uv=[],colors=[],indices=[],sides=22;
  const profile=new THREE.CatmullRomCurve3(rings.map(
    ([x,ry,rz])=>new THREE.Vector3(x,ry,rz)),false,"centripetal");
  const rows=24;
  for(let row=0;row<=rows;row++) for(let s=0;s<sides;s++) {
    const point=profile.getPoint(row/rows);
    const x=point.x,ry=Math.max(.008,point.y),rz=Math.max(.008,point.z);
    const a=s*Math.PI*2/sides;
    vertices.push(x,Math.cos(a)*ry,Math.sin(a)*rz);
    uv.push(row/rows,s/sides);
    const upper=(Math.cos(a)+1)/2;
    const band=species===0
      ? Math.pow(Math.max(0,Math.sin(row*.78+Math.sin(a)*.36)),5)
      : species===1
        ? Math.pow(Math.max(0,Math.cos(row*.58+Math.sin(a)*.6)),7)
        : ((row+Math.floor(s/3))%6===0?.34:0);
    const pigment=1-band*(species===2?.3:.38);
    colors.push((1-.23*upper)*pigment,
      (1-.12*upper)*pigment,(1-.07*upper)*pigment);
  }
  for(let row=0;row<rows;row++) for(let s=0;s<sides;s++) {
    const a=row*sides+s,b=row*sides+(s+1)%sides;
    indices.push(a,b,a+sides,b,b+sides,a+sides);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
}
const fishBodies=[
  fishGeometry([[-.46,.02,.02],[-.32,.13,.11],[.03,.19,.15],
    [.3,.145,.12],[.52,.035,.04]],0),
  fishGeometry([[-.43,.02,.02],[-.29,.17,.095],[.02,.28,.13],
    [.25,.23,.11],[.45,.03,.025]],1),
  fishGeometry([[-.56,.015,.015],[-.37,.083,.075],[.03,.115,.1],
    [.34,.09,.075],[.61,.022,.02]],2),
];
function finGeometry(shape) {
  return new THREE.ExtrudeGeometry(shape,{depth:.038,bevelEnabled:true,
    bevelThickness:.009,bevelSize:.009,bevelSegments:2,curveSegments:10});
}
const tailShape=new THREE.Shape();
tailShape.moveTo(-.39,0);
tailShape.bezierCurveTo(-.55,.04,-.69,.15,-.82,.25);
tailShape.bezierCurveTo(-.76,.12,-.72,.035,-.69,0);
tailShape.bezierCurveTo(-.72,-.035,-.76,-.12,-.82,-.25);
tailShape.bezierCurveTo(-.69,-.15,-.55,-.04,-.39,0);
const fishTailGeometry=finGeometry(tailShape);
const fishDorsalGeometries=[.16,.255,.105].map((base)=>{
  const shape=new THREE.Shape();
  shape.moveTo(-.35,base*.7);
  shape.bezierCurveTo(-.2,base*1.12,-.12,base*1.43,-.09,base*1.5);
  shape.bezierCurveTo(.015,base*1.38,.18,base*1.08,.31,base*.72);
  shape.quadraticCurveTo(-.03,base*.94,-.35,base*.7);
  return finGeometry(shape);
});
const bellyShape=new THREE.Shape();
bellyShape.moveTo(-.17,-.1);
bellyShape.bezierCurveTo(-.23,-.19,-.32,-.24,-.38,-.25);
bellyShape.bezierCurveTo(-.29,-.18,-.05,-.13,.09,-.1);
bellyShape.closePath();
const fishBellyGeometry=finGeometry(bellyShape);
const sideFinShape=new THREE.Shape();
sideFinShape.moveTo(.05,-.025);
sideFinShape.bezierCurveTo(-.06,-.07,-.22,-.14,-.32,-.15);
sideFinShape.bezierCurveTo(-.23,-.045,-.1,.015,.05,-.025);
const fishSideFinGeometry=finGeometry(sideFinShape);
const fishBodyMaterials=new Map();
function fish(x,y,z,scale,mat,phase,yaw=0) {
  const group=new THREE.Group();group.name="drifting sculpted aquarium fish";
  group.position.set(x,y,z);group.scale.setScalar(scale);group.rotation.y=yaw;
  group.userData.driftPhase=phase;
  group.userData.driftAmplitude=.045+random()*.04;
  root.add(group);
  const species=Math.abs(Math.floor(phase*2.3))%fishBodies.length;
  group.userData.bodyType=["streamlined","deep reef","slender"][species];
  if(!fishBodyMaterials.has(mat)) {
    const shaded=mat.clone();shaded.vertexColors=true;
    fishBodyMaterials.set(mat,shaded);
  }
  add(group,["volumetric tapered fish body",
    "deep-bodied reef fish with continuous cheek and belly",
    "slender darting fish with modeled tapered flanks"][species],
  fishBodies[species],fishBodyMaterials.get(mat));
  const tail=add(group,"single forked tail with a continuous fin membrane",
    fishTailGeometry,mat,species===2?-.07:0,0,-.02);
  tail.scale.y=species===1?1.12:species===2?.77:1;
  add(group,"arched dorsal fin joined to the fish's back",
    fishDorsalGeometries[species],M.pearl,0,0,-.018);
  add(group,"swept lower fin joined to the belly",
    fishBellyGeometry,mat,0,0,-.018);
  for(const rayY of [-.17,-.07,.07,.17])
    curve(group,"fine structural ray inside the forked tail",
      [[-.46,0,.023],[-.61,rayY*.45,.024],[-.79,rayY,.023]],
      .004,M.pearl,11);
  for(const side of [-1,1]) {
    add(group,"bright fish iris in carved eye socket",
      new THREE.SphereGeometry(.019,9,7),M.ink,.365,.052,side*.116);
    add(group,"small eye highlight",new THREE.SphereGeometry(.006,6,5),
      M.white,.371,.058,side*.131);
    const p=add(group,"carved pectoral fin emerging from the flank",
      fishSideFinGeometry,M.gold,0,0,side*.13);
    p.rotation.y=side*.22;
    p.scale.y=species===1?1.12:.85;
    for(let ray=0;ray<3;ray++) curve(group,
      "fine pectoral fin ray from the shoulder",
      [[.01,-.035,side*.145],[-.16,-.08-ray*.025,side*.164],
        [-.32,-.16-ray*.01,side*.18]],.003,M.pearl,8);
    curve(group,"incised gill cover",[[.22,-.085,side*.102],
      [.235,.025,side*.145],[.21,.12,side*.1]],.008,M.ink,9);
    for(let stripe=0;stripe<3;stripe++) curve(group,
      "pigmented fish flank marking",[[-.25+stripe*.14,-.105,side*.112],
        [-.21+stripe*.14,.012,side*.148],[-.25+stripe*.14,.12,side*.11]],
      .008,stripe%2?M.pearl:M.gold,8);
  }
}
function jellyfish(x,y,z,scale,phase) {
  const group=new THREE.Group();
  group.name="translucent three-dimensional jellyfish suspended inside saltwater glass";
  group.position.set(x,y,z);group.scale.setScalar(scale);
  group.userData.driftPhase=phase;
  group.userData.driftAmplitude=.035;
  group.userData.preserveMaterials=true;
  root.add(group);
  const cap=new THREE.MeshPhysicalMaterial({color:0xd9d3dd,
    emissive:0x324b5a,emissiveIntensity:.16,
    transparent:true,opacity:.55,roughness:.28,metalness:0,
    depthWrite:false,side:THREE.DoubleSide});
  const membrane=new THREE.MeshPhysicalMaterial({color:0xf0d9cc,
    transparent:true,opacity:.56,roughness:.42,metalness:0,
    depthWrite:false,side:THREE.DoubleSide});
  const vertices=[],indices=[],rows=9,sides=28;
  for(let row=0;row<=rows;row++) {
    const t=row/rows;
    const radius=.08+.64*Math.sin(t*Math.PI*.61);
    const yy=.48-.52*t+.10*Math.sin(Math.PI*t);
    for(let side=0;side<sides;side++) {
      const a=side*Math.PI*2/sides;
      const scallop=.035*Math.sin(a*8)*Math.pow(t,3);
      vertices.push(Math.cos(a)*(radius+scallop),
        yy+.018*Math.cos(a*8)*Math.pow(t,3),
        Math.sin(a)*(radius+scallop));
      if(row<rows) {
        const n=row*sides+side,b=row*sides+(side+1)%sides;
        indices.push(n,n+sides,b,b,n+sides,n+sides+(side+1)%sides);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  add(group,"scalloped translucent jelly bell with real volume",geometry,cap);
  for(let rib=0;rib<8;rib++) {
    const a=rib*Math.PI*2/8;
    const radial=[];
    for(let step=0;step<=6;step++) {
      const t=step/6,r=.08+.64*Math.sin(t*Math.PI*.61);
      radial.push([Math.cos(a)*r,.49-.52*t+.1*Math.sin(Math.PI*t),
        Math.sin(a)*r]);
    }
    curve(group,"fine structural ridge following the jelly bell",
      radial,.009,M.pearl,17);
    const base=[Math.cos(a)*.69,-.05,Math.sin(a)*.69];
    curve(group,"trailing filament with a gentle underwater curl",
      [base,[base[0]*.75,-.48,base[2]*.8],
        [base[0]*.56+.12*Math.sin(a*3),-.97,base[2]*.55],
        [base[0]*.42,-1.5-(rib%3)*.12,base[2]*.42]],
      .012,membrane,23);
  }
  for(let arm=0;arm<4;arm++) {
    const a=arm*Math.PI/2+.27;
    curve(group,"folded central oral arm, distinct from the tentacles",
      [[Math.cos(a)*.13,-.035,Math.sin(a)*.13],
        [Math.cos(a)*.2,-.48,Math.sin(a)*.2],
        [Math.cos(a)*.1+.09,-1.01,Math.sin(a)*.11],
        [Math.cos(a)*.12-.06,-1.32,Math.sin(a)*.13]],
      .037,membrane,21);
  }
  return group;
}
// Several different schools stay inside the side and end habitats. The
// contrast in size, orientation, and color makes the water feel inhabited.
for(const side of [-1,1]) for(let i=0;i<11;i++) {
  const z=-10.7+random()*27.1;
  fish(side*(8.05+random()*.38),1.18+random()*4.4,z,
    .48+random()*.38,i%5===0?M.coral:i%3?M.gold:M.turquoise,
    i*.88+side,side*Math.PI/2);
}
// A few larger fish stay near the glass. Their full bodies, eyes, fins and
// moving silhouettes remain legible at ordinary walking distance, while the
// smaller schools supply depth farther back in each habitat.
for(const side of [-1,1]) for(let i=0;i<3;i++) {
  const z=5.1-i*5.4;
  fish(side*7.78,2.05+i*.77,z,.94-i*.09,
    i===1?M.coral:i===2?M.turquoise:M.gold,
    70+i+side*.31,side*Math.PI/2);
}
for(let i=0;i<6;i++) fish(-6.8+random()*13.6,
  1.12+random()*4.7,-12.0-random()*.75,
  .47+random()*.46,i%3===0?M.coral:i%3===1?M.gold:M.turquoise,
  i*.71,Math.PI*(i%2));
for(let i=0;i<8;i++) fish(-7+random()*14,
  1.15+random()*4.35,18.45,.4+random()*.38,
  i%3?M.turquoise:M.gold,33+i*.64,Math.PI*(i%2));
// The walk-behind route needs an inhabited focal plane at ordinary eye
// height. Place a small, varied school in front of the painted deep water,
// visible through the rear glass even when the visitor stands centrally.
for(const [x,y,z,scale,material,phase,yaw] of [
  [-3.0,1.55,18.82,.99,M.gold,301,.12],
  [3.85,1.31,18.94,.79,M.coral,305,.18],
]) fish(x,y,z,scale,material,phase,yaw);
jellyfish(8.04,3.35,4.05,.82,111);

// A ray travels in the end habitat. Its swept wings and tail occupy volume
// and remain clearly recognizable from the doorway and the inner path.
function ray(x,y,z,scale,yaw=0) {
  const group=new THREE.Group();
  group.name="large sculpted ray behind end-habitat glass";
  group.position.set(x,y,z);group.rotation.y=yaw;group.scale.setScalar(scale);
  root.add(group);
  const top=[],bottom=[],uv=[],indices=[],rows=10,columns=24;
  for(let layer=0;layer<2;layer++) for(let row=0;row<=rows;row++) {
    const t=row/rows,zz=.58-t*1.08;
    const width=.15+1.25*Math.pow(Math.sin(Math.PI*t),.9);
    for(let column=0;column<=columns;column++) {
      const u=column/columns*2-1,edge=Math.abs(u);
      const wing=.12*Math.sin(t*Math.PI*2)+.16*Math.pow(edge,2);
      const thickness=(1-edge*.78)*Math.sin(Math.PI*t)*.115;
      const target=layer===0?top:bottom;
      target.push(u*width,wing+(layer===0?thickness:-thickness),zz);
      uv.push(column/columns,t);
      if(row<rows&&column<columns) {
        const a=row*(columns+1)+column;
        if(layer===0) indices.push(a,a+columns+1,a+1,
          a+1,a+columns+1,a+columns+2);
        else {
          const n=(rows+1)*(columns+1);
          indices.push(n+a,n+a+1,n+a+columns+1,
            n+a+1,n+a+columns+2,n+a+columns+1);
        }
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute([...top,...bottom],3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  add(group,"thick rippling ray body and wing membrane",geo,M.turquoise);
  curve(group,"long tapering ray tail",[[0,.02,-.48],[0,.01,-.92],
    [.03,-.02,-1.65]],.028,M.deep,23);
  for(const side of [-1,1]) {
    add(group,"ray eye set into the broad head",
      new THREE.SphereGeometry(.025,10,8),M.ink,side*.15,.14,.37);
    for(let spot=0;spot<5;spot++) {
      const sx=side*(.2+spot*.17),sz=.12-(spot%2)*.2;
      add(group,"painted silver spot on ray's back",
        new THREE.SphereGeometry(.021,7,5),M.pearl,sx,.095,sz);
    }
  }
  return group;
}
ray(-2.15,3.85,-12.35,.92,.14);
ray(4.3,2.9,-12.45,.62,-.26);

// A suspended, shallow water lens makes the visitor feel surrounded by
// inhabited glass, not simply flanked by wall paintings. The fish and ray
// occupy the water volume ABOVE its curved lower pane. This is a storybook
// aquarium canopy rather than a literal reconstruction of a Shedd gallery.
{
  const cx=-.65, cz=3.9, rx=4.65, rz=3.35;
  const underside=new THREE.MeshPhysicalMaterial({color:0x70b7c2,
    transparent:true,opacity:.27,roughness:.08,metalness:0,
    depthWrite:false,side:THREE.DoubleSide});
  const vertices=[],indices=[],rings=12,sides=64;
  for(let ring=0;ring<=rings;ring++) {
    const r=ring/rings;
    for(let side=0;side<=sides;side++) {
      const a=side*Math.PI*2/sides;
      const ripple=.035*Math.sin(a*8+r*9)*r*r;
      vertices.push(cx+Math.cos(a)*rx*r,
        4.72+.34*(1-r*r)+ripple,
        cz+Math.sin(a)*rz*r);
      if(ring<rings&&side<sides) {
        const n=ring*(sides+1)+side;
        indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  add(root,"curved walk-under glass beneath a living water lens",
    geometry,underside);
  const sidePoints=[],sideIndices=[];
  for(let level=0;level<2;level++) for(let i=0;i<=64;i++) {
    const a=i*Math.PI*2/64;
    sidePoints.push(cx+Math.cos(a)*rx,
      level?5.95:4.74+.025*Math.sin(8*a),
      cz+Math.sin(a)*rz);
    if(level===0&&i<64) {
      sideIndices.push(i,i+65,i+1,i+1,i+65,i+66);
    }
  }
  const sideGeometry=new THREE.BufferGeometry();
  sideGeometry.setAttribute("position",
    new THREE.Float32BufferAttribute(sidePoints,3));
  sideGeometry.setIndex(sideIndices);sideGeometry.computeVertexNormals();
  add(root,"continuous blue glass edge enclosing overhead fish habitat",
    sideGeometry,new THREE.MeshPhysicalMaterial({color:0x72b5c0,
      transparent:true,opacity:.34,roughness:.1,metalness:0,
      depthWrite:false,side:THREE.DoubleSide}));
  for(const y of [4.74,5.95]) {
    const rim=[];
    for(let i=0;i<=64;i++) {
      const a=i*Math.PI*2/64;
      rim.push([cx+Math.cos(a)*rx,y+.025*Math.sin(8*a),
        cz+Math.sin(a)*rz]);
    }
    curve(root,"scalloped shell rim around the overhead aquarium",
      rim,y<5?.058:.035,y<5?M.pearl:M.gold,65);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI*2/8+.18;
    const px=cx+Math.cos(a)*rx,pz=cz+Math.sin(a)*rz;
    curve(root,"swept pearl support joining water lens to dome",
      [[px,4.74,pz],
        [px*1.03,5.82,pz+.09],
        [px*.93,6.7,pz-.08]],.035,M.pearl,18);
  }
  const overheadPigment=[
    new THREE.MeshStandardMaterial({color:0xb9d7c2,
      emissive:0x6b8e83,emissiveIntensity:1.1,roughness:.88,
      side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0xe6c595,
      emissive:0x8e7750,emissiveIntensity:1.1,roughness:.88,
      side:THREE.DoubleSide}),
    new THREE.MeshStandardMaterial({color:0xcf9da1,
      emissive:0x84566c,emissiveIntensity:1.1,roughness:.88,
      side:THREE.DoubleSide}),
  ];
  for(let i=0;i<9;i++) {
    const a=i*2.399,rad=.22+.62*Math.sqrt((i+.5)/9);
    const x=cx+Math.cos(a)*rx*rad,
      z=cz+Math.sin(a)*rz*rad;
    fish(x,5.18+(i%3)*.11,z,
      .47+(i%3)*.07,overheadPigment[i%3],
      171+i*.57,a+Math.PI/2);
  }
}

// A turtle and the upright seahorses give the glazed bays their own species
// silhouettes. Their bodies are continuous shaped surfaces; the small eye
// beads are details, never the structure of the animals.
function sculptedTurtle(x,y,z,scale,yaw=0) {
  const animal=new THREE.Group();
  animal.name="slow sea turtle behind the inhabited glass";
  animal.position.set(x,y,z);
  animal.rotation.y=yaw;
  animal.scale.setScalar(scale);
  animal.userData.driftPhase=147+x;
  animal.userData.driftAmplitude=.025;
  animal.userData.preserveMaterials=true;
  root.add(animal);
  const vertices=[],uv=[],indices=[],rings=9,sides=32;
  for(let ring=0;ring<=rings;ring++) {
    const t=ring/rings,r=.045+.955*t;
    for(let side=0;side<sides;side++) {
      const a=side*Math.PI*2/sides;
      const scallop=1+.022*Math.cos(a*10);
      vertices.push(Math.cos(a)*.74*r*scallop,
        .05+.34*(1-t*t)+.012*Math.cos(a*10)*t,
        Math.sin(a)*.98*r*scallop);
      uv.push(side/sides,t);
      if(ring<rings) {
        const n=ring*sides+side,b=ring*sides+(side+1)%sides;
        indices.push(n,n+sides,b,b,n+sides,n+sides+(side+1)%sides);
      }
    }
  }
  const shell=new THREE.BufferGeometry();
  shell.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  shell.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  shell.setIndex(indices);shell.computeVertexNormals();
  add(animal,"domed continuous turtle shell",shell,M.kelp);
  for(let seam=0;seam<10;seam++) {
    const a=seam*Math.PI*2/10,points=[];
    for(let step=0;step<=7;step++) {
      const r=.18+step*.114;
      points.push([Math.cos(a)*.74*r,
        .05+.34*(1-r*r)+.014,
        Math.sin(a)*.98*r]);
    }
    curve(animal,"carved shell scute seam",points,.009,M.gold,15);
  }
  for(const r of [.41,.73,.98]) {
    const points=[];
    for(let i=0;i<=40;i++) {
      const a=i*Math.PI*2/40;
      points.push([Math.cos(a)*.74*r,.05+.34*(1-r*r)+.016,
        Math.sin(a)*.98*r]);
    }
    curve(animal,"irregular concentric shell growth",points,.012,M.pearl,41);
  }
  // The tapered beak and long paddle fins are made as closed sculpted forms.
  {
    const rings=[[-.83,.16,.11,.03],[-1.02,.2,.16,.05],
      [-1.29,.23,.18,.1],[-1.5,.15,.13,.1],[-1.68,.065,.065,.075]];
    const positions=[],uv=[],faces=[],sections=16;
    for(let row=0;row<rings.length;row++) {
      const [zz,rx,ry,cy]=rings[row];
      for(let j=0;j<sections;j++) {
        const a=j*Math.PI*2/sections;
        positions.push(Math.cos(a)*rx,cy+Math.sin(a)*ry,zz);
        uv.push(j/sections,row/(rings.length-1));
        if(row<rings.length-1) {
          const n=row*sections+j,b=row*sections+(j+1)%sections;
          faces.push(n,b,n+sections,b,b+sections,n+sections);
        }
      }
    }
    const head=new THREE.BufferGeometry();
    head.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    head.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    head.setIndex(faces);head.computeVertexNormals();
    add(animal,"long neck tapering into a turtle beak",head,M.leaf);
  }
  for(const side of [-1,1]) {
    const finShape=new THREE.Shape();
    finShape.moveTo(side*.35,-.34);
    finShape.bezierCurveTo(side*.77,-.46,side*1.53,-.86,side*1.64,-1.46);
    finShape.bezierCurveTo(side*1.82,-1.79,side*1.71,-1.88,side*1.47,-1.71);
    finShape.bezierCurveTo(side*.9,-1.44,side*.62,-.88,side*.35,-.34);
    const fin=add(animal,"broad carved swimming paddle",
      new THREE.ExtrudeGeometry(finShape,{depth:.065,bevelEnabled:true,
        bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:8}),
      M.turquoise,0,.035,0);
    fin.rotation.x=-Math.PI/2;
    for(let rib=0;rib<3;rib++)
      curve(animal,"paddle bone beneath mottled skin",
        [[side*.43,.03,-.49],[side*(.74+rib*.08),.018,-.78-rib*.12],
          [side*(1.33+rib*.09),-.015,-1.28-rib*.14]],
        .011,M.pearl,11);
    add(animal,"small dark turtle eye in the sculpted head",
      new THREE.SphereGeometry(.025,10,8),M.ink,side*.17,.22,-1.43);
  }
  return animal;
}
function sculptedSeahorse(x,y,z,scale,yaw=0) {
  const animal=new THREE.Group();
  animal.name="upright seahorse with a coiled prehensile tail";
  animal.position.set(x,y,z);animal.rotation.y=yaw;
  animal.scale.setScalar(scale);
  animal.userData.driftPhase=201+x+z;
  animal.userData.driftAmplitude=.022;
  animal.userData.preserveMaterials=true;
  root.add(animal);
  loft(animal,"continuous curved seahorse neck and belly",
    [[.23,.055,.06,-.17,0],[.42,.13,.1,-.11,0],
      [.7,.18,.14,.07,0],[.97,.15,.13,.14,0],
      [1.22,.1,.09,.035,0],[1.37,.08,.08,-.075,0]],M.gold,17);
  loft(animal,"long blunt seahorse muzzle",
    [[1.17,.1,.08,-.04,0],[1.21,.095,.085,-.18,0],
      [1.24,.075,.075,-.37,0],[1.26,.065,.065,-.48,0]],M.gold,13);
  curve(animal,"spiraling tapered tail",[[-.17,.25,0],[-.26,.12,0],
    [-.15,.015,.02],[.02,.08,.05],[.05,.23,.045],
    [-.055,.3,.03]],.048,M.gold,26);
  for(let rib=0;rib<6;rib++) {
    const yy=.48+rib*.105,xx=.04+Math.sin(rib*.54)*.09;
    curve(animal,"small ridged plates along seahorse body",
      [[xx-.1,yy,-.08],[xx,yy+.025,-.125],[xx+.11,yy,-.08]],
      .009,M.pearl,9);
  }
  for(let spine=0;spine<5;spine++)
    curve(animal,"seahorse crown and back fin",
      [[-.08-spine*.024,1.23-spine*.12,0],
        [-.16-spine*.028,1.31-spine*.12,.015],
        [-.2-spine*.027,1.32-spine*.12,.01]],.012,M.coral,8);
  const fin=petal(animal,"ribbed seahorse dorsal fin",
    -.14,.79,0,.38,M.coral,-.12);
  fin.rotation.z=-.92;
  for(const side of [-1,1]) add(animal,"inset seahorse eye",
    new THREE.SphereGeometry(.019,9,7),M.ink,-.19,1.31,side*.079);
  return animal;
}
sculptedTurtle(8.08,3.53,6.75,.77,Math.PI*.48);
sculptedTurtle(-8.12,3.04,-.55,.66,-Math.PI*.55);
sculptedTurtle(-3.35,2.7,19.15,.72,-.32);
sculptedTurtle(2.37,2.78,3.83,.49,-.32);
for(const [x,y,z,s,yaw] of [
  [8.08,2.37,1.4,.91,Math.PI*.47],
  [-8.08,2.45,6.4,.96,-Math.PI*.52],
  [8.1,1.86,-6.4,.7,Math.PI*.55],
  [-3.55,2.1,-12.25,.88,0],
  [3.62,2.3,18.47,.8,Math.PI]
]) sculptedSeahorse(x,y,z,s,yaw);

// Every habitat has an organic floor and species-specific shelter. The
// branches are curved solids with fine offshoots, not freestanding polygons.
function coralGarden(x,z,marine) {
  const color=marine?M.coral:M.leaf;
  const accent=marine?M.pearl:M.turquoise;
  for(let b=0;b<4;b++) {
    const bx=x+(random()-.5)*.72,bz=z+(random()-.5)*.82;
    const height=.76+random()*1.55;
    const lean=(random()-.5)*.7;
    curve(root,"branched living coral or freshwater reed",
      [[bx,.16,bz],[bx+lean*.24,height*.42,bz+.13],
        [bx+lean,height,bz+.28]],.035+random()*.018,color,18);
    for(const split of [-1,1]) {
      const topX=bx+lean+split*(.15+random()*.25);
      curve(root,"fine branching habitat growth",
        [[bx+lean*.45,height*.55,bz+.12],
          [topX,height*.83,bz+.16],
          [topX+split*.11,height*1.02,bz+.22]],.016,accent,12);
      if(!marine) petal(root,"pointed river-plant frond",topX,
        height*.82,bz+.16,.28+random()*.13,M.leaf,split*.5);
    }
  }
  if(marine) for(let n=0;n<6;n++) {
    const a=n*Math.PI*2/6;
    curve(root,"soft radial anemone arm",
      [[x,.2,z],[x+Math.cos(a)*.26,.48,z+Math.sin(a)*.26],
        [x+Math.cos(a)*.4,.72,z+Math.sin(a)*.36]],
      .031,n%2?M.coral:M.gold,12);
  }
}
function plateCoral(x,z,height,material,phase=0) {
  // Each plate is a thick, uneven living shelf on a bent branching stem.
  // The earlier open cones looked like flowerpots from the visitor path.
  curve(root,"bent trunk of layered living coral",
    [[x,.15,z],[x-.1,.36,z+.05],[x+.12,height*.65,z-.09],
      [x-.06,height,z-.05]],.052,material,20);
  for(let tier=0;tier<3;tier++) {
    const cx=x+(tier===1?.22:tier===2?-.16:.02);
    const cz=z+(tier===1?-.13:tier===2?.12:0);
    const yy=.48+height*(tier+1)/3;
    const radius=.33+tier*.13;
    curve(root,"fork supporting a coral shelf",
      [[x+.02,.36,z],[x+.1,yy-.25,z-.03],[cx,yy-.055,cz]],
      .025,material,13);
    const vertices=[],uv=[],indices=[],rings=4,sides=24;
    for(let surface=0;surface<2;surface++)
      for(let ring=0;ring<=rings;ring++) {
        const r=ring/rings;
        for(let side=0;side<sides;side++) {
          const a=side*Math.PI*2/sides;
          const scallop=1+.13*Math.sin(a*7+phase+tier)*r;
          vertices.push(cx+Math.cos(a)*radius*r*scallop,
            yy+.05*r*r+.022*Math.sin(a*7+phase+tier)*r-
              (surface===1?.055:0),
            cz+Math.sin(a)*radius*.78*r*scallop);
          uv.push(side/sides,r);
          if(ring<rings) {
            const n=(surface*(rings+1)+ring)*sides+side;
            const b=(surface*(rings+1)+ring)*sides+(side+1)%sides;
            if(surface===0) indices.push(n,n+sides,b,b,n+sides,b+sides);
            else indices.push(n,b,n+sides,b,b+sides,n+sides);
          }
        }
      }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    geo.setIndex(indices);geo.computeVertexNormals();
    add(root,"thick scalloped plate coral with carved surface",geo,material);
    const rim=[];
    for(let i=0;i<=24;i++) {
      const a=i*Math.PI*2/24;
      const edge=radius*(1+.13*Math.sin(a*7+phase+tier));
      rim.push([cx+Math.cos(a)*edge,
        yy+.05+.022*Math.sin(a*7+phase+tier),
        cz+Math.sin(a)*edge*.78]);
    }
    curve(root,"raised wavy lip of the coral shelf",rim,.018,M.pearl,25);
    for(let vein=0;vein<5;vein++) {
      const a=vein*Math.PI*2/5+phase;
      curve(root,"subtle branching grain across living coral",
        [[cx,yy+.008,cz],
          [cx+Math.cos(a)*radius*.44,yy+.03,
            cz+Math.sin(a)*radius*.34],
          [cx+Math.cos(a)*radius*.85,yy+.056,
            cz+Math.sin(a)*radius*.66]],.006,M.pearl,9);
    }
  }
}
function fanCoral(x,z,span,height,material,sideways=false) {
  const group=new THREE.Group();
  group.name="branching three-dimensional sea fan inside the aquarium";
  group.position.set(x,.42,z);root.add(group);
  const point=(u,v,depth)=>sideways?[depth,v,u]:[u,v,depth];
  function branch(u,v,a,length,level,depth) {
    const nextU=u+Math.cos(a)*length;
    const nextV=v+Math.sin(a)*length;
    const bend=depth+.035*Math.sin(nextU*5+nextV*3);
    curve(group,"tapering sea-fan branch with spatial bend",
      [point(u,v,depth),
        point((u+nextU)*.5+.035*Math.sin(level*2+a),
          (v+nextV)*.5,bend),
        point(nextU,nextV,bend)],
      .009+level*.008,material,9);
    if(level<=0)return;
    branch(nextU,nextV,a-.31-.07*Math.sin(level*2.3),
      length*.76,level-1,bend-.045);
    branch(nextU,nextV,a+.34+.06*Math.cos(level*1.8),
      length*.73,level-1,bend+.045);
  }
  group.scale.set(span,height,span);
  branch(0,0,Math.PI/2,.24,5,0);
  return group;
}
for(const side of [-1,1]) for(let patch=0;patch<6;patch++)
  coralGarden(side*8.53,-10.6+patch*5.35,side===1);
for(const side of [-1,1]) for(let bay=0;bay<6;bay++) {
  const z=-9.85+bay*5.12;
  plateCoral(side*8.12,z-1.08,1.02+(bay%3)*.17,
    side===1?M.coral:M.leaf,bay*.48);
  plateCoral(side*8.32,z+1.12,.66+(bay%2)*.22,
    side===1?M.gold:M.turquoise,bay*.7);
}
fanCoral(-3.15,-12.65,1.2,2.65,M.coral);
fanCoral(3.7,-12.68,1.12,2.48,M.gold);
fanCoral(8.12,4.0,1.1,2.22,M.coral,true);
for(const side of [-1,1]) for(let shelf=0;shelf<4;shelf++) {
  const x=side*8.35,z=5.5-shelf*5.35;
  loft(root,"layered reef ledge behind aquarium glass",
    [[.12,.7,.57,x,z],[.25,.81,.63,x-.11,z+.08],
      [.45,.62,.48,x+.08,z-.06],[.64,.32,.23,x+.14,z-.08],
      [.68,.08,.07,x+.16,z-.09]],shelf%2?M.shadow:M.deep,14);
  for(let frond=0;frond<5;frond++) {
    const bx=x+(frond-2)*.2;
    curve(root,"fine growth over layered reef shelf",
      [[bx,.4,z],[bx+.06,.69,z+.11],[bx-.04,.9+frond*.055,z+.18]],
      .018,side===1?M.coral:M.kelp,11);
  }
}
for(let patch=0;patch<5;patch++)
  coralGarden(-6.75+patch*3.35,-12.8,true);
for(let patch=0;patch<5;patch++)
  coralGarden(-6.5+patch*3.25,19.43,patch%2===0);
for(let patch=0;patch<7;patch++)
  plateCoral(-6.9+patch*2.24,18.0+(patch%2)*.9,
    .86+(patch%3)*.28,patch%2?M.coral:M.gold,patch*.43);
fanCoral(-.52,18.75,1.22,3.12,M.coral);
fanCoral(1.05,19.12,.93,2.72,M.gold);
for(const side of [-1,1]) {
  fanCoral(side*4.7,19.37,1.05,2.5,
    side<0?M.kelp:M.coral);
  fish(side*4.45,2.5,18.2,1.15,
    side<0?M.gold:M.turquoise,71+side,Math.PI*(side+1)/2);
}

// A free-standing tide-pool lantern gives Zephrine something close enough to
// study from several angles. The curved glazing holds its own fish, stone,
// kelp and branch coral; its base is a real collision obstacle.
{
  const x=2.35,z=3.8;
  loft(root,"solid shell-carved base of the tide-pool lantern",
    [[.04,1.35,1.25,x,z],[.14,1.48,1.38,x,z],
      [.39,1.39,1.31,x,z],[.49,1.31,1.22,x,z]],M.marble,28,true);
  const shellPlaque=new THREE.Shape();
  shellPlaque.moveTo(-.15,-.075);
  shellPlaque.bezierCurveTo(-.18,-.01,-.15,.075,-.095,.085);
  shellPlaque.quadraticCurveTo(-.052,.13,0,.09);
  shellPlaque.quadraticCurveTo(.052,.13,.095,.085);
  shellPlaque.bezierCurveTo(.15,.075,.18,-.01,.15,-.075);
  shellPlaque.quadraticCurveTo(0,-.11,-.15,-.075);
  const shellPlaqueGeometry=new THREE.ExtrudeGeometry(shellPlaque,{
    depth:.026,bevelEnabled:true,bevelSize:.011,
    bevelThickness:.009,bevelSegments:2,curveSegments:10});
  for(let fan=0;fan<12;fan++) {
    const a=fan*Math.PI*2/12;
    const relief=add(root,"carved scallop relief seated in the lantern plinth",
      shellPlaqueGeometry,fan%3?M.pearl:M.white,
      x+Math.cos(a)*1.43,.275,z+Math.sin(a)*1.34);
    relief.rotation.y=Math.PI/2-a;
  }
  const lanternGlass=new THREE.MeshPhysicalMaterial({color:0x7dc3cb,
    transparent:true,opacity:.29,roughness:.09,metalness:0,
    depthWrite:false,side:THREE.DoubleSide});
  const wall=loft(root,"solid curved glass habitat one can walk around",
    [[.47,1.3,1.2,x,z],[1.55,1.34,1.24,x,z],
      [3.05,1.31,1.21,x,z],[4.3,1.22,1.13,x,z],
      [4.57,1.12,1.04,x,z]],lanternGlass,32,true);
  wall.userData.solidFootprint=true;
  for(const y of [.48,4.56]) {
    const points=[];
    for(let i=0;i<=36;i++) {
      const a=i*Math.PI*2/36;
      points.push([x+Math.cos(a)*(y<1?1.31:1.13),y,
        z+Math.sin(a)*(y<1?1.22:1.05)]);
    }
    curve(root,"continuous engraved brass lip of round tank",points,
      .045,M.gold,36);
  }
  for(const a of [-.85,-.28,.35,.92,1.46,1.98]) {
    curve(root,"fine vertical brass seam following curved tank glazing",
      [[x+Math.cos(a)*1.29,.48,z+Math.sin(a)*1.19],
        [x+Math.cos(a)*1.32,2.2,z+Math.sin(a)*1.22],
        [x+Math.cos(a)*1.13,4.56,z+Math.sin(a)*1.04]],
      .012,M.gold,18);
  }
  // The former smooth mound read as an egg and hid the fish. Offset rocky
  // ledges rise only to a low shelf, with a broken rim and varied top height.
  {
    const positions=[],colors=[],indices=[],sides=40;
    const lower=new THREE.Color(0x39716e),upper=new THREE.Color(0x8fb5a6);
    const layers=[
      [.43,.72,.66,0,0], [.54,.87,.73,-.06,.015],
      [.78,.79,.65,.035,-.04], [1.02,.57,.45,.11,-.08],
      [1.17,.43,.31,.12,-.09], [1.22,.10,.07,.14,-.1],
    ];
    for(let row=0;row<layers.length;row++) {
      const [h,rx,rz,cx,cz]=layers[row];
      for(let side=0;side<sides;side++) {
        const a=side*Math.PI*2/sides;
        const edge=1+.085*Math.sin(a*5+.4)+.048*Math.sin(a*9+row*.3);
        positions.push(x+cx+Math.cos(a)*rx*edge,
          h+.035*Math.sin(a*7+row*.7),
          z+cz+Math.sin(a)*rz*edge);
        const color=lower.clone().lerp(upper,row/(layers.length-1)*.72+
          .09*Math.sin(a*4+row));
        colors.push(color.r,color.g,color.b);
        if(row<layers.length-1) {
          const n=row*sides+side,b=row*sides+(side+1)%sides;
          indices.push(n,b,n+sides,b,b+sides,n+sides);
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    add(root,"layered, broken-edged sculpted reef shelf in round habitat",
      geometry,new THREE.MeshStandardMaterial({color:0xffffff,
        vertexColors:true,roughness:.98,side:THREE.DoubleSide}));
    for(let ledge=0;ledge<3;ledge++) {
      const a=ledge*2.15+.5;
      curve(root,"pale mineral vein following a reef ledge",[
        [x+Math.cos(a)*.72,.57,z+Math.sin(a)*.63],
        [x+Math.cos(a+.18)*.59,.82,z+Math.sin(a+.18)*.51],
        [x+Math.cos(a+.38)*.38,1.05,z+Math.sin(a+.38)*.29]],
      .012,M.pearl,17);
    }
  }
  coralGarden(x,z,true);
  fanCoral(x-.34,z-.22,.46,1.16,M.coral,true);
  fanCoral(x+.38,z-.28,.42,1.03,M.gold,false);
  plateCoral(x-.37,z+.04,.42,M.pearl,.36);
  plateCoral(x+.35,z-.02,.37,M.turquoise,-.26);
  for(let plant=0;plant<7;plant++) {
    // Cluster on the far half so leaves frame the close fish without hiding
    // them from Zephrine's side of the glazing.
    const a=Math.PI+plant*Math.PI/6,reach=.42+(plant%3)*.06;
    const sx=x+Math.cos(a)*reach,sz=z+Math.sin(a)*reach*.86;
    const height=1.1+(plant%3)*.32;
    const positions=[],colors=[],indices=[],rows=12,across=5;
    const foot=new THREE.Color(0x3b746a),tip=new THREE.Color(0x9ebaaa);
    for(let row=0;row<=rows;row++) {
      const t=row/rows;
      const width=(.035+.07*Math.sin(t*Math.PI))*(1-t*.7);
      const sway=.14*Math.sin(t*Math.PI*1.3+plant*.7)*t;
      const cx=sx+Math.cos(a)*(.12*t+sway);
      const cz=sz+Math.sin(a)*(.11*t+sway)+.08*Math.sin(t*4+plant)*t;
      for(let column=0;column<=across;column++) {
        const u=column/across*2-1;
        positions.push(cx+Math.cos(a+Math.PI/2)*width*u,
          .52+height*t+.018*Math.sin(u*Math.PI),
          cz+Math.sin(a+Math.PI/2)*width*u+.035*Math.sin(t*8+plant)*u);
        const shade=foot.clone().lerp(tip,.16+.68*t+.09*u);
        colors.push(shade.r,shade.g,shade.b);
        if(row<rows&&column<across) {
          const n=row*(across+1)+column;
          indices.push(n,n+1,n+across+1,n+1,n+across+2,n+across+1);
        }
      }
    }
    const blade=new THREE.BufferGeometry();
    blade.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    blade.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    blade.setIndex(indices);blade.computeVertexNormals();
    add(root,"broad curved seagrass ribbon rooted in the reef shelf",
      blade,new THREE.MeshStandardMaterial({color:0xffffff,
        vertexColors:true,roughness:.94,side:THREE.DoubleSide}));
  }
  for(let i=0;i<7;i++) {
    const a=i*Math.PI*2/7;
    fish(x+Math.cos(a)*.54,1.35+(i%4)*.65,
      z+Math.sin(a)*.48,.32+(i%3)*.06,
      i%3?M.gold:M.coral,50+i*.53,a);
  }
  fish(x-.36,2.58,z+.65,.72,M.gold,81,.22);
  fish(x+.42,3.33,z+.53,.63,M.coral,83,-.36);
  fish(x+.17,1.82,z-.51,.68,M.turquoise,85,Math.PI+.24);
  jellyfish(x-.19,3.43,z+.32,.72,113);
}
for(const side of [-1,1]) for(let i=0;i<10;i++) {
  const z=-9.5+i*2.75;
  curve(root,"dappled underwater light across viewing glass",
    [[side*7.52,1.0,z-.38],[side*7.52,2.9,z+.08],
      [side*7.52,5.35,z+.47]],.012,i%2?M.glass:M.pearl,15);
}

// Clusters of cut-paper kelp and coral rest behind the family and at edges.
for(const side of [-1,1]) for(let patch=0;patch<10;patch++) {
  const x=side*(8.3+random()*.42),z=-10.9+patch*3.16;
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
  const x=(random()-.5)*14,z=-9+random()*19;
  if(Math.abs(x)<2.2&&z>2) continue;
  add(root,"inlaid pearly shell",new THREE.TorusGeometry(.11+random()*.11,.022,5,12),
    i%3?M.pearl:M.coral,x,.085,z).rotation.x=-Math.PI/2;
}

// G has the older woman's brown bob and painted face from her private photo; Jane's
// bun marks her separately. Zephrine reaches toward the swimming fish.
const zeph=person("Zephrine pointing at the fish in wonder",.15,7.62,1.08,{
  skin:M.skin,hair:M.hair,outfit:M.rose,skirt:M.cream,dress:true,curls:true,
  hands:{"1":[.67,.93,.05],"-1":[-.22,.67,.22]},yaw:.72});
zeph.userData.solidFootprint=true;
const g=person("G sharing wonder with Zephrine",1.13,7.25,1.67,{
  skin:M.skin,hair:M.gHair,outfit:M.cream,pants:M.deep,
  hands:{"-1":[-.72,1.13,.22],"1":[.35,1.05,-.23]},yaw:.45});
g.userData.solidFootprint=true;
person("Jane near her family",-3.8,5.65,1.68,{
  skin:M.skin,hair:M.hair,outfit:M.fabric,pants:M.ink,bun:true,yaw:.24});
person("Oleg near his mother and daughter",-5.0,5.75,1.78,{
  skin:M.skin,hair:M.hair,outfit:M.blue,pants:M.ink,
  glasses:true,beard:true,longHair:true,yaw:.17});

// This is the real hallway aperture, placed inside the aquarium world.
// Its posts can be walked around: the aquarium continues behind the portal.
const doorZ=10.4;
for(const side of [-1,1]) {
  const column=loft(root,"solid freestanding return-door marble post",
    [[.08,.27,.25,side*1.95,doorZ],
      [1.2,.22,.22,side*1.95,doorZ],
      [3.55,.19,.19,side*1.95,doorZ],
      [4.23,.28,.26,side*1.95,doorZ]],M.marble,14,true);
  column.userData.solidFootprint=true;
  curve(root,"doorway side shell engraving",
    [[side*1.95,.42,doorZ+.24],[side*1.91,1.7,doorZ+.24],
      [side*1.97,3.58,doorZ+.24]],.018,M.gold);
  loft(root,"joined carved limestone collar beneath the return portal crown",
    [[3.91,.205,.205,side*1.95,doorZ],
      [4.02,.31,.28,side*1.95,doorZ],
      [4.2,.28,.255,side*1.95,doorZ]],M.marble,20);
}
// A real stone band joins the two posts. Its open underside stays well above
// the walking aperture, while the carved front and rear make this read as an
// architectural object that can be rounded rather than a line in the air.
const returnCrown=new THREE.Shape();
returnCrown.moveTo(-2.23,3.98);
returnCrown.bezierCurveTo(-1.92,4.56,-1.05,4.86,0,4.9);
returnCrown.bezierCurveTo(1.05,4.86,1.92,4.56,2.23,3.98);
returnCrown.lineTo(1.95,4.1);
returnCrown.bezierCurveTo(1.55,4.36,.77,4.49,0,4.5);
returnCrown.bezierCurveTo(-.77,4.49,-1.55,4.36,-1.95,4.1);
returnCrown.closePath();
const crownStone=M.marble.clone();
crownStone.emissive=new THREE.Color(0x807b70);
crownStone.emissiveIntensity=.14;
add(root,"continuous carved stone crown of the walk-behind hallway portal",
  new THREE.ExtrudeGeometry(returnCrown,{depth:.24,bevelEnabled:true,
    bevelSize:.025,bevelThickness:.022,bevelSegments:2,curveSegments:18}),
  crownStone,0,0,doorZ-.12);
curve(root,"freestanding arched return doorway",
  [[-1.95,4.11,doorZ],[-1.15,4.36,doorZ],
    [0,4.47,doorZ],[1.15,4.36,doorZ],[1.95,4.11,doorZ]],
  .1,M.gold,30);
for(const side of [-1,1]) curve(root,"open floor loop around return doorway",
  [[side*1.95,.065,8.75],[side*2.72,.065,10.15],
    [side*2.74,.065,12.1]],.027,M.turquoise,19);
// An inhabited tide globe rewards the path behind the freestanding arch.
// Its footprint stays outside the return route around the right post.
{
  const x=5.05,z=10.64;
  loft(root,"solid carved pedestal for rear tide globe",
    [[.04,1.12,1.04,x,z],[.15,1.18,1.1,x,z],
      [.39,1.1,1.03,x,z],[.48,1.02,.95,x,z]],M.marble,24,true);
  const waterGlass=new THREE.MeshPhysicalMaterial({color:0x87c6cb,
    transparent:true,opacity:.27,roughness:.1,metalness:0,
    depthWrite:false,side:THREE.DoubleSide});
  loft(root,"solid curved rear tide globe with visible glass boundary",
    [[.47,1.02,.94,x,z],[1.18,1.06,.98,x,z],
      [2.16,1.0,.93,x,z],[2.62,.87,.81,x,z]],waterGlass,26,true);
  for(const y of [.48,2.63]) {
    const ring=[];
    for(let i=0;i<=28;i++) {
      const a=i*Math.PI*2/28;
      ring.push([x+Math.cos(a)*(y<1?1.03:.87),y,
        z+Math.sin(a)*(y<1?.95:.81)]);
    }
    curve(root,"continuous shell-metal rim of rear tide globe",
      ring,.035,M.gold,29);
  }
  loft(root,"irregular living rock within the rear glass",
    [[.47,.6,.52,x,z],[.64,.73,.61,x-.08,z],
      [.97,.47,.4,x+.06,z-.05],[1.12,.13,.11,x+.11,z-.08]],
    M.deep,12);
  for(let strand=0;strand<6;strand++) {
    const a=strand*Math.PI*2/6;
    const sx=x+Math.cos(a)*.48,sz=z+Math.sin(a)*.43;
    curve(root,"rooted plant inside rear fish exhibit",
      [[sx,.55,sz],[sx+.07,1.15,sz-.05],
        [sx-.08,1.84+(strand%2)*.18,sz+.04]],
      .022,strand%2?M.kelp:M.leaf,15);
    for(let leaf=0;leaf<3;leaf++) petal(root,
      "pointed kelp blade attached to rear plant",
      sx+.04,.83+leaf*.36,sz+.06,.19,
      strand%2?M.kelp:M.turquoise,a);
  }
  fish(x-.33,1.58,z+.38,.56,M.gold,126,.2);
  fish(x+.3,2.02,z-.24,.51,M.coral,128,Math.PI+.3);
}

window.__authorRoom=async()=>{
  const loader=new THREE.TextureLoader();
  const [reef,river,reefVariant,riverVariant,canopy,barramundi]=await Promise.all([
    loader.loadAsync(reefBackdropURL),loader.loadAsync(riverBackdropURL),
    loader.loadAsync(reefVariantURL),loader.loadAsync(riverVariantURL),
    loader.loadAsync(canopyWatercolorURL),
    new GLTFLoader().loadAsync(paintedBarramundiURL)]);
  // One CC0 sculpt carries real gills, lips, tapering fins and scales. Its
  // repaint matches the rest of the gouache aquarium; copies share the mesh
  // and texture and move only in a restrained breathing loop.
  for(const [x,y,z,scale,yaw,roll,phase] of [
    [-1.55,2.18,18.88,1.65,Math.PI/2,0,306],
    [2.25,2.35,18.75,1.53,-Math.PI/2,0,307],
    [-2.25,5.33,3.25,1.58,.26,.86,308],
    [1.9,5.41,4.62,1.52,-.4,-.94,309],
    [.15,5.38,2.28,1.45,.3,1.08,310],
    // Two close, richly modeled fish give the round habitat readable life
    // where G and Zephrine actually stand, not only in the distant glass.
    [2.12,2.46,4.22,1.04,Math.PI/2,0,311],
    [2.78,3.43,3.48,.92,-Math.PI/2,.11,312],
    // One fully sculpted swimmer at eye height in each flanking habitat.
    [-7.95,2.4,5.5,1.22,0,0,313],
    [7.95,2.65,4.0,1.18,Math.PI,0,314],
  ]) {
    const swimmer=new THREE.Group();
    swimmer.name="painted sculpted barramundi behind aquarium glass";
    swimmer.position.set(x,y,z);swimmer.rotation.set(0,yaw,roll,"YXZ");
    swimmer.scale.setScalar(scale);
    swimmer.userData.driftPhase=phase;
    swimmer.userData.driftAmplitude=.018;
    swimmer.userData.preserveMaterials=true;
    swimmer.add(barramundi.scene.clone(true));
    root.add(swimmer);
  }
  for(const [material,texture] of [[reefWall,reef],[riverWall,river],
    [reefVariantWall,reefVariant],[riverVariantWall,riverVariant]]) {
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.userData.mimeType="image/webp";
    material.map=texture;
    material.needsUpdate=true;
  }
  canopy.colorSpace=THREE.SRGBColorSpace;
  canopy.userData.mimeType="image/webp";
  canopyMaterial.map=canopy;
  canopyMaterial.needsUpdate=true;
  return exportRoom({batchStatic:true});
};
