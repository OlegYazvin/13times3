import * as THREE from "three";
import { foliageLobe } from "./sculpted_foliage.mjs";
import { createRoomArt } from "./room_art.mjs";

// Shared play is the remembered event. The park's ship, lighthouse, whale,
// gardens and rolling ground are scenic echoes, not claims about exact play.
const C = {
  sky: 0xc6dce4, ground: 0x9ec5a4, grass: 0x78aa86,
  deepGrass: 0x528c79, sand: 0xe4d0ad, blue: 0x5e96b0,
  blueDark: 0x427388, paleBlue: 0xa0c8cf, red: 0xbd746c,
  white: 0xf2e6d6, timber: 0xb58d6c, ochre: 0xe4c483,
  violet: 0x9f9db8, leaf: 0x83a981, darkLeaf: 0x668b70,
  skin: 0xd4a284, hair: 0x463c3d, ink: 0x3c4a55,
  cream: 0xf1e2d0, rose: 0xc97b91, fabric: 0x6c8495,
  gold: 0xd8b867, paper: 0xf4e9d8,
};
const art = createRoomArt({ index: 9,
  title: "Shared play at Maggie Daley Park", width: 15.2,
  height: 16.0, depth: 18.8, colors: C, seed: 101010 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky(C.sky, true);
ground(C.ground, (x,z) => new THREE.Color(C.grass).lerp(
  new THREE.Color(C.sand), Math.exp(-Math.pow((x-.34*Math.sin(z*.4))/2.2,2))*.45),
  { width: 52, depth: 52 });

// A modeled, muted skyline stands beyond the Play Garden. Setbacks, roof
// contours, masonry ribs and arched windows let each distant building read
// as architecture instead of a row of rectangular placeholder blocks.
const skylineGlass=M.blueDark;
const windowShape=new THREE.Shape();
windowShape.moveTo(-.067,-.095);windowShape.lineTo(.067,-.095);
windowShape.lineTo(.067,.053);
windowShape.quadraticCurveTo(.067,.101,0,.103);
windowShape.quadraticCurveTo(-.067,.101,-.067,.053);
windowShape.closePath();
const windowGeometry=new THREE.ExtrudeGeometry(windowShape,
  {depth:.012,bevelEnabled:false,curveSegments:6});
for(let i=0;i<13;i++) {
  const x=-7.1+i*1.19, h=1.6+(i*11%7)*.37, w=.98;
  const facade=new THREE.Shape();
  facade.moveTo(-w/2,0);facade.lineTo(w/2,0);
  if(i%4===0) {
    facade.lineTo(w/2,h-.3);facade.lineTo(w*.31,h-.3);
    facade.lineTo(w*.31,h);facade.lineTo(-w*.31,h);
    facade.lineTo(-w*.31,h-.3);facade.lineTo(-w/2,h-.3);
  } else if(i%4===1) {
    facade.lineTo(w/2,h-.16);facade.lineTo(0,h);
    facade.lineTo(-w/2,h-.16);
  } else if(i%4===2) {
    facade.lineTo(w/2,h-.22);
    facade.quadraticCurveTo(0,h+.13,-w/2,h-.22);
  } else {
    facade.lineTo(w/2,h);facade.lineTo(-w/2,h);
  }
  facade.closePath();
  const body=add(root,"shaped distant Chicago facade with an authored roofline",
    new THREE.ExtrudeGeometry(facade,{depth:.27,bevelEnabled:false,
      curveSegments:8}),
    i%4===0?M.blueDark:i%3===0?M.blue:M.paleBlue,x,0,-9.29);
  body.userData.solidFootprint=true;
  const top=h-(i%4===1?.18:.08);
  curve(root,"masonry cornice below the skyline roof",
    [[x-w*.47,top,-8.985],[x,top+.015,-8.985],
      [x+w*.47,top,-8.985]],.017,i%2?M.white:M.ochre,12);
  for(const side of [-1,1]) curve(root,"thin vertical skyline pilaster",
    [[x+side*w*.43,.12,-8.988],
      [x+side*w*.43,h*.5,-8.988],
      [x+side*w*.43,top,-8.988]],.012,M.white,10);
  const rows=Math.max(2,Math.floor((h-.35)/.37));
  for(let row=0;row<rows;row++) for(const col of [-1,1]) {
    const yy=.25+row*.37;
    if(yy>top-.13) continue;
    const wx=x+col*.22;
    add(root,"arched recessed window in the distant city",
      windowGeometry,skylineGlass,wx,yy,-8.996);
    box(root,"fine projecting stone sill beneath an arched window",
      wx,yy-.108,-8.974,.17,.018,.045,M.white);
  }
}
for (const side of [-1,1]) curve(root,"curving garden promenade edge",
  [[side*1.45,.05,8.8],[side*1.6,.05,4],
    [side*1.3,.05,-1],[side*1.7,.05,-5.3],
    [side*1.4,.05,-8.8]],.025,M.ochre,54);
// Gently uneven inlaid seams make the approach read as a made garden path,
// not an untextured beige plane. They stay low enough to remain non-solid.
for(let row=0;row<20;row++) {
  const z=8.05-row*.79;
  const width=1.42+.17*Math.sin(z*.42);
  curve(root,"hand-laid winding garden path seam",
    [[-width,.057,z-.035],[-width*.53,.057,z+.045],
      [0,.057,z-.025],[width*.48,.057,z+.065],
      [width,.057,z-.035]],.008,
    row%4===0?M.white:M.ochre,18);
}

function wave(x,z,length,scale=1) {
  const shape=new THREE.Shape();
  shape.moveTo(-length/2,0);
  for(let i=0;i<=24;i++) {
    const xx=-length/2+i*length/24;
    const rise=.12+.36*Math.pow(Math.sin(i*Math.PI/24),2)
      +.07*Math.sin(i*Math.PI/6);
    shape.lineTo(xx,rise);
  }
  shape.lineTo(length/2,0);shape.closePath();
  const mesh=add(root,"solid sculpted blue play-wave",
    new THREE.ExtrudeGeometry(shape,{depth:.65*scale,bevelEnabled:false}),
    M.blue,x,.03,z);
  mesh.userData.solidFootprint=true;
  curve(root,"pale wave crest",[[x-length*.47,.18,z+.68*scale],
    [x,.55,z+.68*scale],[x+length*.47,.18,z+.68*scale]],
    .025,M.paleBlue);
}
wave(-4.2,4.9,3.3);wave(4.15,1.6,3.4,1.3);

// A storybook lighthouse and a small play ship make the garden recognizable.
{
  const x=4.55,z=-4.35;
  loft(root,"solid tapered striped lighthouse",[[.12,.52,.52,x,z],
    [.8,.5,.5,x,z],[1.35,.45,.45,x,z],[1.9,.4,.4,x,z],
    [2.6,.34,.34,x,z],[3.1,.31,.31,x,z]],M.white,12,true);
  for(let i=0;i<3;i++) add(root,"lighthouse red play stripe",
    new THREE.CylinderGeometry(.48-i*.055,.5-i*.055,.3,12,1,true),
    M.red,x,.58+i*.79,z);
  add(root,"lighthouse lantern roof",new THREE.ConeGeometry(.65,.38,12),
    M.red,x,3.37,z);
  const slidePositions=[],slideColors=[],slideIndices=[],slideRows=24,slideSides=8;
  const slidePoint=(t,lateral)=>{
    const channel=Math.pow(Math.abs(lateral),3)*.072;
    return [x+.73+lateral*.38,
      1.71-1.42*t+.075*Math.sin(Math.PI*t)+channel,
      z+.48+2.76*t];
  };
  for(let row=0;row<=slideRows;row++) for(let side=0;side<=slideSides;side++) {
    const t=row/slideRows,lateral=side/slideSides*2-1;
    slidePositions.push(...slidePoint(t,lateral));
    const tone=.87+.13*(1-Math.abs(lateral));
    slideColors.push(tone,tone,tone);
    if(row<slideRows&&side<slideSides) {
      const n=row*(slideSides+1)+side;
      slideIndices.push(n,n+slideSides+1,n+1,
        n+1,n+slideSides+1,n+slideSides+2);
    }
  }
  const slideGeometry=new THREE.BufferGeometry();
  slideGeometry.setAttribute("position",
    new THREE.Float32BufferAttribute(slidePositions,3));
  slideGeometry.setAttribute("color",
    new THREE.Float32BufferAttribute(slideColors,3));
  slideGeometry.setIndex(slideIndices);slideGeometry.computeVertexNormals();
  const slideMaterial=M.blue.clone();slideMaterial.vertexColors=true;
  const slide=add(root,"solid molded channel of the lighthouse play slide",
    slideGeometry,slideMaterial);
  slide.userData.solidFootprint=true;
  for(const side of [-1,1]) curve(root,
    "continuous raised safety rim joined to the curved slide",
    Array.from({length:21},(_,i)=>{
      const [sx,sy,sz]=slidePoint(i/20,side);
      return [sx,sy+.095,sz];
    }),.032,M.paleBlue,38);
  curve(root,"rounded landing lip at the foot of the play slide",
    [slidePoint(1,-1),slidePoint(1,0),slidePoint(1,1)],
    .028,M.paleBlue,17);
  // The tower is a play structure rather than an empty striped cone: a low
  // arched entrance, raised lookout and climb ropes are visible from the path.
  const door=new THREE.Shape();
  door.moveTo(-.26,0);door.lineTo(.26,0);door.lineTo(.26,.55);
  door.quadraticCurveTo(.26,.85,0,.86);
  door.quadraticCurveTo(-.26,.85,-.26,.55);door.closePath();
  add(root,"recessed arched play-tower entrance",
    new THREE.ExtrudeGeometry(door,{depth:.018,bevelEnabled:false,
      curveSegments:8}),M.blueDark,x,.08,z+.503);
  curve(root,"carved doorway arch in lighthouse",
    [[x-.3,.59,z+.525],[x-.23,.83,z+.525],[x,.93,z+.525],
      [x+.23,.83,z+.525],[x+.3,.59,z+.525]],.025,M.ochre,18);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const px=x+Math.sin(a)*.39,pz=z+Math.cos(a)*.39;
    beam(root,"lighthouse lookout baluster",
      [px,2.72,pz],[px,3.03,pz],.018,.016,M.timber);
  }
  for(const yy of [2.74,3.03]) {
    const rail=[];
    for(let i=0;i<=24;i++) {
      const a=i*Math.PI/12;
      rail.push([x+Math.sin(a)*.41,yy,z+Math.cos(a)*.41]);
    }
    curve(root,"continuous timber lookout rail",rail,.023,M.timber,32);
  }
  for(let i=0;i<5;i++) {
    const yy=.55+i*.33;
    beam(root,"lighthouse climbing rung",
      [x-.28,yy,z-.525],[x+.28,yy,z-.525],.019,.018,M.ochre);
  }
  for(const xx of [-.29,.29]) beam(root,"lighthouse climbing rail",
    [x+xx,.5,z-.52],[x+xx,2.12,z-.52],.023,.021,M.timber);
  for(let i=0;i<9;i++) {
    const a=i*Math.PI*2/9;
    add(root,"dotted lighthouse porthole",new THREE.TorusGeometry(.06,.015,5,12),
      M.gold,x+Math.cos(a)*.38,2.67,z+Math.sin(a)*.38).rotation.y=a;
  }
}
{
  const x=-4.15,z=-2.45;
  loft(root,"solid blue play-ship hull",[[.22,1.55,.47,x,z],
    [.51,1.75,.73,x,z],[.77,1.56,.62,x,z]],M.blueDark,15,true);
  box(root,"ship raised deck",x,.78,z,2.68,.12,.85,M.timber,true);
  beam(root,"ship mast",[x,.83,z],[x,2.85,z],.065,.05,M.timber);
  const sailShape=new THREE.Shape();
  sailShape.moveTo(0,0);sailShape.lineTo(.85,.18);
  sailShape.quadraticCurveTo(.96,.57,.84,1.08);
  sailShape.lineTo(.04,1.34);sailShape.closePath();
  const sail=add(root,"thick billowing ship sail with curved edge",
    new THREE.ExtrudeGeometry(sailShape,{depth:.055,bevelEnabled:true,
      bevelSize:.012,bevelThickness:.012,bevelSegments:2,
      curveSegments:8}),M.white,x+.06,1.24,z);
  sail.rotation.y=.22;
  for(const sx of [-1.06,-.53,0,.53,1.06])
    box(root,"individual warm timber deck board",x+sx,.85,z,
      .5,.021,.83,sx===0?M.ochre:M.timber);
  for(const side of [-1,1]) {
    for(let j=0;j<5;j++) {
      const rx=x-1.13+j*.56,rz=z+side*.48;
      beam(root,"ship play-deck upright",[rx,.8,rz],[rx,1.2,rz],
        .025,.022,M.timber);
    }
    curve(root,"ship continuous side rail",
      [[x-1.14,1.2,z+side*.48],[x,1.23,z+side*.48],
        [x+1.14,1.2,z+side*.48]],.028,M.ochre,24);
    for(const dx of [-.78,0,.78]) {
      add(root,"round recessed ship porthole",
        new THREE.TorusGeometry(.082,.018,6,16),M.ochre,
        x+dx,.48,z+side*.69).rotation.y=side>0?0:Math.PI;
    }
  }
  const wheel=new THREE.Group();wheel.name="ship steering wheel with spokes";
  root.add(wheel);wheel.position.set(x+.64,1.36,z+.04);
  add(wheel,"ship steering wheel rim",new THREE.TorusGeometry(.16,.022,6,18),
    M.ochre,0,0,0);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    beam(wheel,"steering wheel spoke",[0,0,0],
      [Math.cos(a)*.2,Math.sin(a)*.2,0],.015,.012,M.timber);
  }
  for(const dx of [-1.2,1.2]) curve(root,"ship curved prow detail",
    [[x+dx,.25,z+.47],[x+dx*1.15,.63,z+.5],
      [x+dx*.87,.82,z+.47]],.045,M.ochre);
}
// A whale is a smoothly formed park sculpture, with flukes and carved lines.
{
  const x=-4.85,z=-6.15;
  loft(root,"solid friendly blue whale body",[[.18,.62,.33,x,z],
    [.41,.98,.46,x,z],[.83,1.06,.48,x,z],
    [1.23,.62,.32,x-.13,z],[1.46,.04,.05,x-.3,z]],M.blue,16,true);
  for(const side of [-1,1]) {
    const fin=petal(root,"long swept whale flipper",x+side*.72,.72,z+.18,
      .96,M.blueDark,side*.77); fin.rotation.z=side*.78;
    petal(root,"whale tail fluke",x+side*.32,1.37,z-.22,.74,M.blueDark,
      side*.5).rotation.z=side*.3;
  }
  add(root,"small whale eye",new THREE.SphereGeometry(.037,7,6),M.ink,
    x-.48,1.03,z+.37);
  curve(root,"curved whale smile",[[x-.58,.76,z+.43],
    [x-.32,.68,z+.45],[x-.08,.75,z+.43]],.018,M.white);
}

// A few distinct connected garden spaces border the large central play area.
for(const [x,z] of [[-6,5.7],[6.25,.2],[-6.3,-.9],[6,-6.4]]) {
  const trunk=loft(root,"solid branching garden tree",[[0,.19,.17,x,z],
    [2.15,.15,.14,x,z],[3.2,.08,.09,x,z]],M.timber,9,true);
  trunk.userData.solidFootprint=true;
  for(let j=0;j<5;j++) {
    const a=j*1.256+z*.1,dx=Math.cos(a),dz=Math.sin(a);
    curve(root,"bent leafy garden bough",[[x,2.5,z],
      [x+dx*.65,3.1,z+dz*.65],[x+dx*1.45,3.35,z+dz*1.45]],
      .047,M.timber,15);
    foliageLobe(root,"overlapping garden canopy around a branching bough",
      x+dx*1.08,3.34,z+dz*1.08,.62,.48,.54,
      j%2?C.leaf:C.darkLeaf,x+z+j);
    for(let k=0;k<7;k++) petal(root,"leaf in play garden canopy",
      x+dx*(.6+random()),3.1+(random()-.5)*.65,
      z+dz*(.6+random()),.27+random()*.15,k%3?M.leaf:M.darkLeaf,a);
  }
}
// Small planted islands give the long approach a garden scale. Every bloom
// grows from a stem and paired leaves; loose confetti would make the ground
// look unfinished and would not read as the park's planted landscape.
for(const side of [-1,1]) for(const z of [6.4,4.25,1.9,-1.55,-4.6,-7.1]) {
  const x=side*(2.45+.27*Math.sin(z*1.4));
  loft(root,"low sculpted garden mound supporting rooted flowers",
    [[.025,.46,.72,x,z],[.105,.52,.7,x,z],
      [.18,.36,.49,x,z],[.21,.035,.05,x,z]],M.deepGrass,16);
  for(let plant=0;plant<4;plant++) {
    const px=x+(plant-1.5)*.19,
      pz=z+.18*Math.sin(plant*2.3),
      h=.36+.12*((plant+z*3+12)%3);
    curve(root,"rooted flower stem in the Play Garden",
      [[px,.15,pz],[px+.035,h*.58,pz-.025],[px,h,pz]],
      .012,plant%2?M.darkLeaf:M.leaf,11);
    for(const leafSide of [-1,1]) {
      const leaf=petal(root,"veined leaf attached to a garden stem",
        px+leafSide*.085,.21+plant%2*.055,pz+.018,
        .18,plant%3?M.leaf:M.darkLeaf,leafSide*.5);
      leaf.rotation.z=leafSide*.66;
    }
    const flowerColor=plant%3===0?M.rose:plant%3===1?M.ochre:M.white;
    for(let petalIndex=0;petalIndex<5;petalIndex++) {
      const a=petalIndex*Math.PI*2/5;
      const bloom=petal(root,"five-petal garden blossom with real thickness",
        px+Math.cos(a)*.055,h+Math.sin(a)*.055,pz+.04,
        .13,flowerColor,a);
      bloom.rotation.z=a-Math.PI/2;
    }
    add(root,"small center of a modeled garden blossom",
      new THREE.IcosahedronGeometry(.026,0),M.gold,px,h,pz+.075);
  }
}
// The three children gather around a shared play ribbon. Jane, Oleg and the
// two friends form a supportive ring; likeness details use private photos.
const zeph=person("Zephrine in shared play",-.23,1.37,1.03,{
  skin:M.skin,hair:M.hair,outfit:M.cream,skirt:M.rose,
  dress:true,curls:true,hands:{"-1":[-.55,.72,.18],"1":[.52,.73,.15]},yaw:.06});
const childA=person("friend's first child in shared play",-1.35,.22,1.13,{
  skin:M.skin,hair:M.hair,outfit:M.violet,skirt:M.ochre,
  dress:true,hands:{"1":[.43,.79,.2]},yaw:.19});
const childB=person("friend's second child in shared play",1.09,.07,1.19,{
  skin:M.skin,hair:M.hair,outfit:M.blueDark,pants:M.ink,
  hands:{"-1":[-.43,.85,.2]},yaw:-.2});
for(const child of [zeph,childA,childB]) child.userData.solidFootprint=true;
person("Jane watching the shared play",-4.25,-1.05,1.7,{
  skin:M.skin,hair:M.hair,outfit:M.rose,pants:M.ink,bun:true,yaw:-.18});
person("Oleg watching the shared play",4.25,-1.05,1.79,{
  skin:M.skin,hair:M.hair,outfit:M.fabric,pants:M.ink,
  longHair:true,glasses:true,beard:true,yaw:.14});
const friendA=person("friend with short hair yellow glasses and rose jacket",
  -2.55,-1.55,1.7,{
    skin:M.skin,hair:M.hair,outfit:M.rose,pants:M.deepGrass,
    glasses:true,glassesColor:M.ochre,yaw:-.22});
friendA.userData.solidFootprint=true;
const friendB=person("friend with knit cap beard and round dark glasses",
  2.65,-1.55,1.78,{
    skin:M.skin,hair:M.hair,outfit:M.ink,pants:M.timber,
    glasses:true,beard:true,yaw:.2});
loft(friendB,"knit cap with ridged crown",[[1.78,.13,.12],
  [1.94,.18,.17],[2.05,.1,.1]],M.arch||M.fabric,12);
friendB.userData.solidFootprint=true;
// The shared-play moment sits on one formed surface, inspired by the park's
// rolling blue ground. The former pair of unconnected tubes read as hoses.
const playPositions=[],playColors=[],playIndices=[],playRows=36,playAcross=14;
const playSide=(z,side)=>side*(1.47+.09*Math.sin(z*.8));
for(let row=0;row<=playRows;row++) for(let col=0;col<=playAcross;col++) {
  const t=row/playRows,z=2.53-t*4.48,lateral=col/playAcross*2-1;
  const center=.16*Math.sin(z*.65);
  const x=center+playSide(z,lateral);
  const wave=.014*Math.sin(z*2.3+lateral*4)*(1-lateral*lateral);
  const y=.035+wave-.012*Math.pow(Math.abs(lateral),5);
  playPositions.push(x,y,z);
  const color=new THREE.Color(C.paleBlue).lerp(new THREE.Color(C.blue),
    .28+.19*Math.sin(z*1.35+lateral*3)+.14*Math.abs(lateral));
  playColors.push(color.r,color.g,color.b);
  if(row<playRows&&col<playAcross) {
    const n=row*(playAcross+1)+col;
    playIndices.push(n,n+playAcross+1,n+1,
      n+1,n+playAcross+1,n+playAcross+2);
  }
}
const playGeometry=new THREE.BufferGeometry();
playGeometry.setAttribute("position",
  new THREE.Float32BufferAttribute(playPositions,3));
playGeometry.setAttribute("color",
  new THREE.Float32BufferAttribute(playColors,3));
playGeometry.setIndex(playIndices);playGeometry.computeVertexNormals();
add(root,"continuous gently rolling blue play surface under the three children",
  playGeometry,new THREE.MeshStandardMaterial({vertexColors:true,
    roughness:.98,side:THREE.DoubleSide}));
for(const side of [-1,1]) curve(root,
  "low sewn edge fixed to the shared play surface",
  Array.from({length:37},(_,i)=>{
    const z=2.53-i*4.48/36;
    return [.16*Math.sin(z*.65)+playSide(z,side),.028,z];
  }),.012,side<0?M.gold:M.paleBlue,50);

window.__authorRoom=()=>exportRoom();
