import * as THREE from "three";
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
  new THREE.Color(C.sand), Math.exp(-Math.pow((x-.28*Math.sin(z*.4))/1.8,2))*.85));

// Painted skyline sits beyond the Play Garden, but the world itself is grass,
// blue rubber waves, children, trees and unreasonably generous open air.
for (let i=0;i<13;i++) {
  const x=-7.1+i*1.19, h=1.6+(i*11%7)*.37;
  box(root,"far soft Chicago skyline",x,h/2,-9.28,
    .96,h,.1,i%3?M.paleBlue:M.blueDark);
}
for (const side of [-1,1]) curve(root,"curving garden promenade edge",
  [[side*1.45,.05,8.8],[side*1.6,.05,4],
    [side*1.3,.05,-1],[side*1.7,.05,-5.3],
    [side*1.4,.05,-8.8]],.025,M.ochre,54);

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
  box(root,"lighthouse blue slide",x+.72,1.07,z+.45,.74,.11,2.8,M.blue,true)
    .rotation.x=.42;
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
  const sail=add(root,"small curved ship sail",new THREE.PlaneGeometry(.85,1.35),
    M.white,x+.4,2.1,z); sail.rotation.y=.22;
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
    for(let k=0;k<7;k++) petal(root,"leaf in play garden canopy",
      x+dx*(.6+random()),3.1+(random()-.5)*.65,
      z+dz*(.6+random()),.27+random()*.15,k%3?M.leaf:M.darkLeaf,a);
  }
}
for(let i=0;i<45;i++) {
  const x=(random()-.5)*14.5,z=(random()-.5)*17.5;
  if(Math.abs(x)<1.4&&z>0) continue;
  petal(root,"garden flower or fallen leaf",x,.065,z,
    .1+random()*.12,i%3?M.ochre:M.rose,random()*6.28);
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
// Shared play is represented by curved parallel tracks at child scale.
for(const side of [-1,1]) curve(root,"shared play ribbon sweeping among three children",
  [[side*.92,.07,2.45],[side*1.25,.07,1.35],
    [side*.97,.07,.17],[side*1.5,.07,-1.9]],.05,
  side<0?M.gold:M.paleBlue,32);

window.__authorRoom=()=>exportRoom({key:0xffd7a6,fill:0x9fc9d7,
  ambient:1.72,keyPower:2.1});
