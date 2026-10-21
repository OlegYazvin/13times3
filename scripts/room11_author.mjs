import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";
import reefBackdropURL from "./assets/room11/reef-backdrop.webp";
import riverBackdropURL from "./assets/room11/river-backdrop.webp";

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
  width:18.4,height:8.2,depth:26.8,colors:C,seed:111111});
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

// The visitor stands between actual inhabited saltwater and freshwater
// habitats, with a third reef across the end. Fish and plants live behind the
// glass, not over the open floor. The glazing is almost invisible except for
// its reflections, thick seals, and sightline-dependent edge glints.
const glass = new THREE.MeshPhysicalMaterial({color:0xa3d9df,transparent:true,
  opacity:.09,roughness:.08,metalness:0,depthWrite:false,side:THREE.DoubleSide});
const reefWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
const riverWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
for(const side of [-1,1]) {
  box(root,"continuous solid sculpted tank wall",side*9.12,3.23,-.4,
    .15,6.45,25.35,M.deep,true);
  for(let bay=0;bay<5;bay++) {
    const z=-9.85+bay*5.12;
    box(root,side===1?"painted saltwater reef habitat":"painted freshwater river habitat",
      side*9.01,3.25,z,.05,5.45,4.66,
      side===1?reefWall:riverWall);
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
  side*4.45,3.25,-13.18,8.9,6.3,.016,reefWall);
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
// A quiet habitat behind the portal makes its reverse side part of this world.
box(root,"solid aquarium boundary beyond portal",0,3.2,13.34,
  18.0,6.4,.1,M.deep,true);
for(const side of [-1,1]) box(root,"painted habitat behind freestanding portal",
  side*4.45,3.2,13.24,8.9,6.2,.016,side===1?reefWall:riverWall);
for(const side of [-1,1]) {
  add(root,"rear aquarium glazing beyond portal",
    new THREE.PlaneGeometry(7.2,5.25),glass,side*5.25,3.2,12.9);
  curve(root,"rear habitat frame",[[side*1.72,.62,12.86],
    [side*1.72,5.8,12.86],[side*8.9,5.8,12.86]],.064,M.pearl);
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
function fish(x,y,z,scale,mat,phase,yaw=0) {
  const group=new THREE.Group();group.name="drifting sculpted aquarium fish";
  group.position.set(x,y,z);group.scale.setScalar(scale);group.rotation.y=yaw;
  group.userData.driftPhase=phase;
  group.userData.driftAmplitude=.045+random()*.04;
  root.add(group);
  add(group,"volumetric tapered fish body",fishBody,mat);
  for(const fork of [-1,1]) {
    const tail=petal(group,"forked sculpted fish tail lobe",
      -.51,fork*.11,-.02,.33,mat,fork*.18);
    tail.rotation.z=fork*.72;
  }
  for(let ridge=0;ridge<2;ridge++) {
    const fin=petal(group,"ribbed raised dorsal fin",-.15+ridge*.18,
      .135,-.01,.26-ridge*.055,M.pearl,.22);
    fin.rotation.z=-.62;
  }
  const ventral=petal(group,"small swept belly fin",-.07,-.15,0,.22,mat,.1);
  ventral.rotation.z=Math.PI*.7;
  for(const side of [-1,1]) {
    add(group,"bright fish iris in carved eye socket",
      new THREE.SphereGeometry(.019,9,7),M.ink,.365,.052,side*.116);
    add(group,"small eye highlight",new THREE.SphereGeometry(.006,6,5),
      M.white,.371,.058,side*.131);
    const p=petal(group,"swept volumetric side fin",-.08,-.045,
      side*.14,.22,M.gold,side*.47);
    p.rotation.x=side*.8;
    curve(group,"incised gill cover",[[.22,-.085,side*.102],
      [.235,.025,side*.145],[.21,.12,side*.1]],.008,M.ink,9);
    for(let stripe=0;stripe<3;stripe++) curve(group,
      "pigmented fish flank marking",[[-.25+stripe*.14,-.105,side*.112],
        [-.21+stripe*.14,.012,side*.148],[-.25+stripe*.14,.12,side*.11]],
      .008,stripe%2?M.pearl:M.gold,8);
  }
}
// Several different schools stay inside the side and end habitats. The
// contrast in size, orientation, and color makes the water feel inhabited.
for(const side of [-1,1]) for(let i=0;i<10;i++) {
  const z=-10.7+random()*23.2;
  fish(side*(8.05+random()*.38),1.18+random()*4.4,z,
    .48+random()*.38,i%5===0?M.coral:i%3?M.gold:M.turquoise,
    i*.88+side,side*Math.PI/2);
}
for(let i=0;i<8;i++) fish(-6.8+random()*13.6,
  1.12+random()*4.7,-12.0-random()*.75,
  .47+random()*.46,i%3===0?M.coral:i%3===1?M.gold:M.turquoise,
  i*.71,Math.PI*(i%2));
for(let i=0;i<5;i++) fish(-7+random()*14,
  1.15+random()*4.35,13.03,.37+random()*.28,
  i%3?M.turquoise:M.gold,33+i*.64,Math.PI*(i%2));

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
for(const side of [-1,1]) for(let patch=0;patch<5;patch++)
  coralGarden(side*8.53,-10.6+patch*5.35,side===1);
for(let patch=0;patch<5;patch++)
  coralGarden(-6.75+patch*3.35,-12.8,true);
for(let patch=0;patch<3;patch++)
  coralGarden(-6.5+patch*5.5,13.05,patch%2===0);
for(const side of [-1,1]) for(let i=0;i<8;i++) {
  const z=-9.5+i*2.75;
  curve(root,"dappled underwater light across viewing glass",
    [[side*7.52,1.0,z-.38],[side*7.52,2.9,z+.08],
      [side*7.52,5.35,z+.47]],.012,i%2?M.glass:M.pearl,15);
}

// Clusters of cut-paper kelp and coral rest behind the family and at edges.
for(const side of [-1,1]) for(let patch=0;patch<8;patch++) {
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
const zeph=person("Zephrine pointing at the fish in wonder",.15,6.85,1.08,{
  skin:M.skin,hair:M.hair,outfit:M.rose,skirt:M.cream,dress:true,curls:true,
  hands:{"1":[.67,.93,.05],"-1":[-.22,.67,.22]},yaw:.72});
zeph.userData.solidFootprint=true;
const g=person("G sharing wonder with Zephrine",1.13,6.48,1.67,{
  skin:M.skin,hair:M.gHair,outfit:M.cream,pants:M.deep,
  longHair:true,
  hands:{"-1":[-.48,.89,.14],"1":[.5,1.15,.08]},yaw:.45});
for(const side of [-1,1]) curve(g,"G's chin-length dark brown bob",
  [[side*.15,1.72,-.03],[side*.24,1.49,.01],
    [side*.23,1.25,.04]],.033,M.gHair,13);
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
}
curve(root,"freestanding arched return doorway",
  [[-1.95,4.11,doorZ],[-1.15,4.36,doorZ],
    [0,4.47,doorZ],[1.15,4.36,doorZ],[1.95,4.11,doorZ]],
  .1,M.gold,30);
for(const side of [-1,1]) curve(root,"open floor loop around return doorway",
  [[side*1.95,.065,8.75],[side*2.72,.065,10.15],
    [side*2.74,.065,12.1]],.027,M.turquoise,19);
for(const side of [-1,1]) for(let i=0;i<6;i++) {
  const x=side*(2.5+i*.92);
  curve(root,"shell-inlaid tide curling behind portal",
    [[x-.3,.07,11.35],[x,.07,11.7],[x+.27,.07,11.35]],
    .018,i%2?M.gold:M.turquoise,12);
}

window.__authorRoom=async()=>{
  const loader=new THREE.TextureLoader();
  const [reef,river]=await Promise.all([
    loader.loadAsync(reefBackdropURL),loader.loadAsync(riverBackdropURL)]);
  for(const [material,texture] of [[reefWall,reef],[riverWall,river]]) {
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.userData.mimeType="image/webp";
    material.map=texture;
    material.needsUpdate=true;
  }
  return exportRoom({key:0xe8f6ef,fill:0x6ab4c7,
    ambient:1.85,keyPower:2.2,batchStatic:true});
};
