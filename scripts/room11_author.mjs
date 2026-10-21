import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";
import reefBackdropURL from "./assets/room11/reef-backdrop.webp";
import riverBackdropURL from "./assets/room11/river-backdrop.webp";
import reefVariantURL from "./assets/room11/reef-variant.webp";
import riverVariantURL from "./assets/room11/river-variant.webp";

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
  return new THREE.Color(0xb8d1c6).lerp(new THREE.Color(0x779e9b),
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
    ctx.strokeStyle=layer===0?"rgba(43,127,139,.055)":
      layer===1?"rgba(183,219,214,.20)":"rgba(255,250,223,.48)";
    ctx.lineWidth=layer===0?4+random()*5:2+random()*3;
    ctx.beginPath();
    ctx.moveTo(x-radius,y);
    ctx.bezierCurveTo(x-radius*.44,y-radius*.5,
      x+radius*.5,y+radius*.45,x+radius,y+radius*.08);
    ctx.stroke();
  }
  const caustics=new THREE.CanvasTexture(canvas);
  caustics.colorSpace=THREE.SRGBColorSpace;
  floor.material.map=caustics;
  floor.material.needsUpdate=true;
}

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
// A continuous paneled canopy gives the rotunda an actual luminous roof,
// rather than leaving ribs hanging over a flat dark ceiling.
{
  const positions=[],colors=[],indices=[],rings=9,slices=48;
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
      if(ring<rings&&slice<slices) {
        const i=ring*(slices+1)+slice;
        indices.push(i,i+slices+1,i+1,i+1,i+slices+1,i+slices+2);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  add(root,"continuous aquamarine glass canopy between shell ribs",geometry,
    new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true,
      side:THREE.DoubleSide}));
}
// Marble columns and a glass dome evoke the historic Shedd building as a
// dream rather than a literal or dated exhibit replica.
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

// The visitor stands between actual inhabited saltwater and freshwater
// habitats, with a third reef across the end. Fish and plants live behind the
// glass, not over the open floor. The glazing is almost invisible except for
// its reflections, thick seals, and sightline-dependent edge glints.
const glass = new THREE.MeshPhysicalMaterial({color:0xa3d9df,transparent:true,
  opacity:.09,roughness:.08,metalness:0,depthWrite:false,side:THREE.DoubleSide});
const reefWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
const riverWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
const reefVariantWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
const riverVariantWall = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
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
box(root,"solid rear aquarium sill beneath deep glass",0,.36,16.93,
  17.9,.72,.35,M.marble,true);
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
  side*4.45,3.2,20.55,8.9,6.2,.016,side===1?reefVariantWall:riverVariantWall);
for(const side of [-1,1]) {
  add(root,"rear aquarium glazing beyond portal",
    new THREE.PlaneGeometry(7.2,5.25),glass,side*5.25,3.2,16.82);
  curve(root,"rear habitat frame",[[side*1.72,.62,16.8],
    [side*1.72,5.8,16.8],[side*8.9,5.8,16.8]],.064,M.pearl);
}
for(const z of [11.4,14.45,16.6]) {
  curve(root,"vaulted wave rib over the aquarium behind its portal",
    [[-8.3,5.75,z],[-5.7,7.15,z-.17],[0,7.72,z-.32],
      [5.7,7.15,z-.17],[8.3,5.75,z]],.085,M.pearl,31);
  curve(root,"fine inlaid waterline beneath the rear vault",
    [[-7.5,.065,z],[-3.9,.07,z-.13],[0,.068,z-.2],
      [3.9,.07,z-.13],[7.5,.065,z]],.024,M.gold,25);
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
  loft(root,"irregular reef rock inside round habitat",
    [[.42,.76,.64,x,z],[.72,.91,.79,x-.12,z],
      [1.1,.58,.51,x+.13,z-.12],[1.38,.15,.15,x+.24,z-.14]],
    M.deep,15);
  coralGarden(x,z,true);
  for(let plant=0;plant<9;plant++) {
    const a=plant*Math.PI*2/9;
    const sx=x+Math.cos(a)*.7,sz=z+Math.sin(a)*.62;
    const h=1.5+(plant%3)*.47;
    curve(root,"tapered kelp spiraling inside glass",
      [[sx,.55,sz],[sx+.12*Math.sin(a),h*.55,sz+.14],
        [sx-.17*Math.cos(a),h,sz-.1]],.025,
      plant%2?M.kelp:M.leaf,19);
    for(let leaf=0;leaf<3;leaf++) {
      const p=petal(root,"ribbed kelp blade inside central tank",
        sx+.09*Math.sin(a),.9+leaf*.42,sz+.06,
        .24+leaf*.025,plant%2?M.kelp:M.turquoise,a);
      p.rotation.x=.45;
    }
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
const zeph=person("Zephrine pointing at the fish in wonder",.15,6.85,1.08,{
  skin:M.skin,hair:M.hair,outfit:M.rose,skirt:M.cream,dress:true,curls:true,
  hands:{"1":[.67,.93,.05],"-1":[-.22,.67,.22]},yaw:.72});
zeph.userData.solidFootprint=true;
const g=person("G sharing wonder with Zephrine",1.13,6.48,1.67,{
  skin:M.skin,hair:M.gHair,outfit:M.cream,pants:M.deep,
  hands:{"-1":[-.48,.89,.14],"1":[.5,1.15,.08]},yaw:.45});
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
  const [reef,river,reefVariant,riverVariant]=await Promise.all([
    loader.loadAsync(reefBackdropURL),loader.loadAsync(riverBackdropURL),
    loader.loadAsync(reefVariantURL),loader.loadAsync(riverVariantURL)]);
  for(const [material,texture] of [[reefWall,reef],[riverWall,river],
    [reefVariantWall,reefVariant],[riverVariantWall,riverVariant]]) {
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.userData.mimeType="image/webp";
    material.map=texture;
    material.needsUpdate=true;
  }
  return exportRoom({key:0xe8f6ef,fill:0x6ab4c7,
    ambient:1.85,keyPower:2.2,batchStatic:true});
};
