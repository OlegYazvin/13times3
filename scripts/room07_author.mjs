import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createRoomArt } from "./room_art.mjs";
import {shapedTube} from './storybook_figures.mjs';
import {addContactShadow} from './stage_shadows.mjs';

// Blueberries of Indiana, near La Porte, becomes an expansive summer field
// of adult-height or taller bushes and deep-blue fruit. G helps Zephrine pick; Zephrine rides
// on Oleg's shoulders. This is not frame 09's autumn apple orchard.
const C = {
  sky: 0xadcbd0, ground: 0xa6b7a0, grass: 0x7b9f7c,
  deepGrass: 0x4f7568, leaf: 0x668969, paleLeaf: 0xa3b995,
  bark: 0x665a58, berry: 0x334b85, berryLight: 0x5f74a8,
  berryDark: 0x292f5f, bloom: 0xb6c5d2, gold: 0xe2c58d,
  cream: 0xf2e5cd, paper: 0xf5eada, linen: 0xe8dbcc,
  ink: 0x39475b, skin: 0xd5a184, hair: 0x3f3536,
  gHair: 0x60494a, zephHair: 0x755448, fabric: 0x425f84,
  rose: 0xd48d8b, peach: 0xdab19d, warm: 0xbf9374,
};
const art = createRoomArt({ index: 6,
  title: "G shows Zephrine blueberries while Oleg carries her high",
  width: 12.8, height: 15.0, depth: 16.6, colors: C, seed: 707707 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
wrapSky(C.sky, true);
function fieldHeightAt(x,z){
  const far=THREE.MathUtils.smoothstep(Math.hypot(x,z),13,38);
  const gathering=1-THREE.MathUtils.smoothstep(Math.hypot(x*.7,z-5.3),3,5);
  return .012*Math.sin(x*2.8+z*1.9)*(1-gathering)+far*(.25+.22*Math.sin(x*.13+z*.055)+.15*Math.sin(z*.17-x*.05));
}
const field=ground(C.ground, (x, z) => {
  const distance=Math.hypot(x,z);
  const path = Math.exp(-Math.pow((x - .23 * Math.sin(z * .4)) / 1.45, 2))
    * (1-THREE.MathUtils.smoothstep(distance,18,40));
  const color=new THREE.Color(C.grass).lerp(new THREE.Color(C.linen),path*.68);
  return color.lerp(new THREE.Color(0xa9bca6),THREE.MathUtils.smoothstep(distance,14,66)*.8);
}, {width:144,depth:144});
{
  const p=field.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);p.setY(i,fieldHeightAt(x,z));
  }
  field.geometry.computeVertexNormals();
}

// The rows continue into this independent world beyond its walkable bounds.
// No invented farm building, date or cultivar is needed to establish summer.

const berryGeometry = new THREE.SphereGeometry(.010, 7, 5);
const leafGeometry = (() => {
  const positions = [], uv = [], indices = [];
  const rows = 4;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const half = .17 * Math.pow(Math.sin(Math.PI * t), .82)
      * (1 + .026 * Math.sin(t * 17));
    for (const side of [-1, 0, 1]) {
      positions.push(side * half, t,
        .06 * Math.sin(Math.PI * t) * (1 - Math.abs(side) * .65));
      uv.push((side + 1) / 2, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let side = 0; side < 2; side++) {
    const a = row * 3 + side, b = a + 3;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
})();
function blueberryLeaf(parent, start, tip, width, material) {
  const from = new THREE.Vector3(...start), to = new THREE.Vector3(...tip);
  const direction = to.clone().sub(from);
  const leaf = new THREE.Mesh(leafGeometry, material);
  leaf.name = "shaped blueberry leaf growing from a twig";
  leaf.position.copy(from);
  leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  leaf.scale.set(width / .17, direction.length(), width / .17);
  leaf.userData.batchPetal = true;
  parent.add(leaf);
}
function blueberry(parent, x, y, z, light = false) {
  const berry = add(parent, "small ripe blueberry with pale bloom",
    berryGeometry, light ? M.berryLight : M.berry, x, y, z);
  berry.userData.batchPetal = true;
  const calyx = petal(parent, "tiny pointed blueberry calyx", x - .003,
    y + .008, z + .004, .005, M.berryDark, .6);
  calyx.userData.batchPetal = true;
}
const leafMaterials = [0x426a42,0x527c48,0x6a8d50,0x789954,0x91a963].map(color =>
  new THREE.MeshStandardMaterial({color,roughness:.88,side:THREE.DoubleSide}));

function leafyShoot(group, points, richness = 1, fruit = true) {
  const path = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const stem = curve(group, "fine branching blueberry fruiting shoot", points, .0045, M.bark, 9);
  stem.userData.batchPetal = true;
  const leaves = Math.round(15 * richness);
  for(let i=0;i<leaves;i++) {
    const t=.12+i/(leaves-1)*.87,point=path.getPoint(t),tangent=path.getTangent(t);
    const side=i%2?-1:1,angle=Math.atan2(tangent.z,tangent.x)+side*(1.0+random()*.8);
    const length=.085+random()*.040,reach=Math.sqrt(length*length*.80);
    const tip=[point.x+Math.cos(angle)*reach,point.y+length*(.12+random()*.5),point.z+Math.sin(angle)*reach];
    blueberryLeaf(group,point.toArray(),tip,.020+random()*.006,leafMaterials[Math.floor(random()*leafMaterials.length)]);
  }
  if(fruit)for(const t of [.43,.75]) {
    const p=path.getPoint(t);
    for(let i=0;i<4;i++) {
      const angle=i*2.4,at=[p.x+Math.cos(angle)*.021,p.y-.025-(i%2)*.018,p.z+Math.sin(angle)*.021];
      const stalk=beam(group,"attached fine blueberry pedicel",p.toArray(),at,.002,.001,M.bark,4);
      stalk.userData.batchPetal=true;
      blueberry(group,...at,i%3===0);
    }
  }
}
function bush(x,z,height=2.12,{scenery=false,phase=0,lean=0}={}) {
  const group=new THREE.Group();group.name=scenery?'tall blueberry planting beyond the walkable row':'adult-height multi-cane blueberry bush';
  group.position.set(x,0,z);group.rotation.y=phase;root.add(group);
  group.userData.blueberryBushHeightM=height;
  // The connected woody center supplies a real collision footprint; foliage
  // stays outside the clear lane and the open family picking space.
  const crown=loft(group,"solid rooted blueberry crown",[[0,.16,.14],[.035,.14,.12],[.10,.08,.07]],M.bark,10,!scenery);
  for(let cane=0;cane<(scenery?4:6);cane++) {
    const a=cane*2.39996+phase,dx=Math.cos(a),dz=Math.sin(a),spread=.37+random()*.28;
    const top=height*(.86+random()*.14),base=[dx*.12,.04,dz*.12];
    const points=[base,[dx*spread*.40,.65,dz*spread*.40],[dx*spread*.85+lean,top*.78,dz*spread*.85],[dx*spread+lean,top,dz*spread]];
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const wood=curve(group,"upright arching woody blueberry cane",points,.009+random()*.004,M.bark,15);wood.userData.batchPetal=true;
    for(let shoot=0;shoot<(scenery?5:9);shoot++) {
      const t=.22+shoot*(scenery?.15:.085),p=path.getPoint(t),angle=a+(shoot%2?-.95:.95),length=.32+random()*.30;
      const end=[p.x+Math.cos(angle)*length,p.y+.10+random()*.17,p.z+Math.sin(angle)*length];
      leafyShoot(group,[p.toArray(),[(p.x+end[0])*.5,p.y+.12,(p.z+end[2])*.5],end],scenery?.45:1,!scenery&&shoot%4===1);
      // Short secondary growth fills the plant volume with attached blades,
      // rather than a closed green blob or a spray of bare radial wires.
      const fork=[p.x+(end[0]-p.x)*.64,p.y+.10,p.z+(end[2]-p.z)*.64];
      const turn=angle+(shoot%2?1.0:-1.0),tip=[fork[0]+Math.cos(turn)*.20,fork[1]+.10,fork[2]+Math.sin(turn)*.20];
      if(!scenery)leafyShoot(group,[fork,tip],.65,false);
    }
    leafyShoot(group,path.getPoints(4).slice(2).map(p=>p.toArray()),.9,!scenery);
  }
  // Pack each prototype once. Copies then share the same exported geometry,
  // including all attached leaves and fruit, instead of duplicating buffers
  // for every plant in the field.
  const byMaterial=new Map();
  for(const child of group.children.filter(o=>o.userData.batchPetal)) {
    const list=byMaterial.get(child.material)||[];list.push(child);byMaterial.set(child.material,list);
  }
  for(const [material,parts] of byMaterial) {
    const geometry=mergeGeometries(parts.map(part=>{part.updateMatrix();return part.geometry.clone().applyMatrix4(part.matrix);}),false);
    if(!geometry)throw Error('Blueberry prototype surface packing failed');
    for(const part of parts)group.remove(part);
    add(group,'connected blueberry canes leaves and ripe clusters',geometry,material);
  }
  return group;
}
const bushPrototypes=[2.08,2.24,2.12,2.21].map((height,i)=>{
  const group=bush(0,0,height,{phase:i*.72,lean:.1*Math.sin(i*2)});root.remove(group);return group;
});
const distantPrototypes=[2.08,2.22].map((height,i)=>{
  const group=bush(0,0,height,{scenery:true,phase:i*.9});root.remove(group);return group;
});
function plantCopy(x,z,variant,scenery=false,turn=0) {
  const prototypes=scenery?distantPrototypes:bushPrototypes;
  const group=prototypes[variant%prototypes.length].clone(true);
  group.name=scenery?'adult-height blueberry rows continuing into the distance':'adult-height multi-cane blueberry bush';
  group.position.set(x,fieldHeightAt(x,z),z);group.rotation.y=turn;
  if(scenery)group.traverse(o=>o.userData.solidFootprint=false);
  root.add(group);return group;
}
// Staggered, differently leaning plants make the rows legible without making
// the field a grid of identical little shrubs. Every near plant is taller
// than Oleg's 1.75 m standing figure; leaf and fruit sizes remain independent.
for(const side of [-1,1])for(const row of [0,1])for(let i=0;i<5;i++) {
  const z=-6.5+i*3.25+row*1.30+.25*Math.sin(i*2.8+side);
  const gatheringSpace=row===0?.60*Math.exp(-(((z-4)/2.6)**2)):0;
  const x=side*(3.05+row*2.25+.13*Math.sin(i*1.7)+gatheringSpace);
  plantCopy(x,z,i+row,false,i*.83+side);
}
plantCopy(2.6,-1.15,1,false,.7);
for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<5;i++) {
  plantCopy(side*(3.1+row*2.2),-10.8-i*3.5,i+row,true,i*.81+row);
}
// The family bush has its crown beyond G rather than inside her torso. Its
// fruiting arm bends into the shared picking space. Preserve the actual hand
// targets and leave air around the faces and carried child's legs.
const pickingBush=bush(2.25,2.10,2.19,{phase:1.1,lean:.08});pickingBush.userData.pickingArrangement=true;
{
  const reach=new THREE.Group();reach.name="fruiting blueberry bough beside Zephrine";reach.userData.pickingArrangement=true;root.add(reach);
  const points=[[2.25,.055,2.1],[2.22,.80,2.10],[1.58,2.02,2.26],[.92,1.88,2.51],[.55,1.715,2.78],[.12,1.77,2.91],[-.20,1.71,2.88]];
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  shapedTube(reach,"tapering arch of living blueberry cane to the picking fingers",points,[.017,.014,.011,.006,.0028],M.bark);
  for(let i=0;i<24;i++) {
    const t=.10+i*.035,p=path.getPoint(t),side=i%2?-1:1;
    blueberryLeaf(reach,p.toArray(),[p.x-.035,p.y+.035,p.z+side*.08],.022,leafMaterials[i%leafMaterials.length]);
  }
  for(let i=0;i<5;i++) {
    const point=path.getPoint(.19+i*.12),side=i%2?-1:1;
    leafyShoot(reach,[point.toArray(),[point.x-.13,point.y+.06,point.z+side*.16],[point.x-.21,point.y+.04,point.z+side*.24]],.7,true);
  }
  for(let cluster=0;cluster<2;cluster++) {
    const from=path.getPoint(.84+cluster*.075).toArray(),to=[from[0],from[1]-.027,from[2]+.013];
    curve(reach,"tiny blueberry fruiting pedicel",[from,to],.002,M.bark,5);
    for(let b=0;b<3;b++) blueberry(reach,to[0]+(b-1)*.018,to[1]-(b%2)*.013,to[2]+b*.009,b===1);
  }
  // The ripe berry meets the outer fingertip, beyond the palm volume.
  // A former center-of-hand target embedded half the fruit in her palm.
  const picked=[-.13825,1.67485,2.88899];
  curve(reach,"short fruiting stalk reaching the picked blueberry",[[-.20,1.71,2.88],[-.17,1.70,2.884],[picked[0],picked[1]+.010,picked[2]]],.002,M.bark,8);
  blueberry(reach,...picked,true);
}

// Jane shares the outing; Oleg, G and Zephrine are the central memory.
const oleg = person("Oleg with Zephrine on his shoulders", -.58, 3.12, 1.75, {
  skin: M.skin, hair: M.hair, outfit: M.fabric, pants: M.ink,
  glasses: true, beard: true, longHair: true,
  hands: { "-1": [-.2, 1.43, -.19], "1": [.2, 1.43, -.19] }, yaw: -.14,
});
const zeph = person("Zephrine picking her own blueberries up high",
  -.58, 2.86, 1.04, {
    skin: M.skin, hair: M.zephHair, outfit: M.rose, skirt: M.peach,
    pants: M.fabric, dress: true, curls: true,
    hands: { "1": [.66, .67, -.38], "-1": [-.29, .66, .15] }, yaw: -.1,
  });
zeph.position.y = 1.39; zeph.scale.setScalar(.72);
const g = person("G helping Zephrine discover blueberries", 2.0, 3.05, 1.62, {
  skin: M.skin, hair: M.gHair, outfit: M.cream, pants: M.ink,
  hands: { "-1": [-.66, 1.07, -.28], "1": [.3, .88, .24] }, yaw: .27,
});
person("Jane enjoying the blueberry outing", -2.54, 1.33, 1.68, {
  skin: M.skin, hair: M.hair, outfit: M.paleLeaf, pants: M.ink,
  bun: true, hands: { "1": [.4, .8, .36] }, yaw: -.28,
});

// One woven picking pail and bright fruit connect the family with the field.
const pail = new THREE.Group(); pail.name = "solid woven berry picking pail";
pail.userData.pickingArrangement=true;
pail.scale.setScalar(.55);
pail.position.set(2.4, 0, 3.84); root.add(pail);
const pailShadow=addContactShadow(pail,1,.85);pailShadow.position.y=.002/.55;
const basket = add(pail,"shaped wicker pail with a real inner floor and rounded lip",
  new THREE.LatheGeometry([[0,0],[.215,0],[.235,.014],[.252,.11],[.277,.32],[.291,.420],[.294,.437],[.287,.450],[.277,.443],[.270,.420],[.235,.075],[.218,.035],[0,.035]].map(p=>new THREE.Vector2(...p)),64),M.linen);
basket.scale.z=.88;
basket.userData.solidFootprint = true;
for(let row=0;row<17;row++){
  const y=.024+row*.024,r=.235+.055*y/.437;
  const points=Array.from({length:129},(_,k)=>{const a=k/128*Math.PI*2,wave=.003*Math.sin(a*32+(row%2)*Math.PI);return [Math.cos(a)*(r+wave),y,Math.sin(a)*(r+wave)*.88];});
  const strand=curve(pail,'interwoven horizontal willow course',points,.0052,row%3?M.gold:M.cream,96);strand.userData.batchPetal=true;
}
for(let warp=0;warp<32;warp++){
  const a=warp/32*Math.PI*2,points=Array.from({length:49},(_,k)=>{const t=k/48,y=.018+t*.405,r=.235+.055*y/.437+.0035*Math.cos(t*17*Math.PI*2+warp*Math.PI);return [Math.cos(a)*r,y,Math.sin(a)*r*.88];});
  const strand=curve(pail,'willow upright woven through the crossing courses',points,.0048,warp%3?M.gold:M.cream,40);strand.userData.batchPetal=true;
}
const handle=shapedTube(pail,'one joined curved wicker carrying strap',[[-.281,.42,0],[-.20,.72,.005],[0,.80,.012],[.20,.72,.005],[.281,.42,0]],[.016,.018,.018,.016],M.gold,.40);handle.userData.batchPetal=true;
const collected=new THREE.Group();collected.scale.setScalar(1/.55);pail.add(collected);
for (let i = 0; i < 10; i++) {
  const a = i * Math.PI * 2 / 10;
  blueberry(collected,Math.cos(a)*.19*.55,.035*.55+.010,
    Math.sin(a)*.18*.55,i%3===0);
}

// Adult-height planting is modeled in world units, with separate small leaves
// and fruit. Keep the sky open and the central family lane unobstructed.

window.__authorRoom = () => exportRoom();
