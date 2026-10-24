import * as THREE from 'three';
import {museumFixtureSites} from './museum-layout.mjs';

// Original modeled fixtures informed by the user's five reference photos.
// Glass is a thin modeled shell; avoiding screen-space transmission preserves
// the portal stencil and keeps this shared architecture inexpensive on phones.
function materials(){
 const brass=new THREE.MeshStandardMaterial({color:0x9b7745,metalness:.72,roughness:.31});
 const copper=new THREE.MeshStandardMaterial({color:0x98705b,metalness:.65,roughness:.35});
 const iron=new THREE.MeshStandardMaterial({color:0x242c29,metalness:.62,roughness:.35});
 const cord=new THREE.MeshStandardMaterial({color:0x337c79,roughness:.86});
 const opal=new THREE.MeshStandardMaterial({color:0xf0f1d1,emissive:0xe9efc9,emissiveIntensity:.65,roughness:.47});
 const filament=new THREE.MeshBasicMaterial({color:0xffdf9a});
 const candle=new THREE.MeshBasicMaterial({color:0xffedbc});
 const glass=new THREE.MeshStandardMaterial({color:0xe9cfa1,roughness:.13,metalness:.08,transparent:true,opacity:.19,depthWrite:false});
 const rim=new THREE.MeshStandardMaterial({color:0xe6d6ba,roughness:.13,metalness:.22,transparent:true,opacity:.50,depthWrite:false});
 const crystal=new THREE.MeshStandardMaterial({color:0xf1e6d2,roughness:.13,metalness:.18,transparent:true,opacity:.58,depthWrite:false,flatShading:true});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#f0deb9';c.fillRect(0,0,256,256);
 let seed=9482;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<180;i++){const x=random()*256,y=random()*256,r=10+random()*42,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%3?'rgba(139,95,47,.10)':'rgba(255,252,228,.38)');g.addColorStop(1,'rgba(205,175,118,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 // An internally illuminated diffuser should not acquire a clipped crescent
 // from its own external proxy light. The cloudy stone carries a soft baked
 // gradient; its paired point source supplies real light to the room.
 const alabaster=new THREE.MeshBasicMaterial({color:0xffedcd,map,vertexColors:true});
 return {brass,copper,iron,cord,opal,filament,candle,glass,rim,crystal,alabaster};
}
function mesh(parent,name,geometry,material,position=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.fromArray(position);parent.add(m);return m;}
function rod(parent,name,points,radius,material,segments=16){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,name,new THREE.TubeGeometry(curve,segments,radius,8,false),material);}
function lathe(parent,name,profile,material,position=[0,0,0],segments=32){return mesh(parent,name,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments),material,position);}
function hoop(parent,name,radius,tube,material,position,rotation=[Math.PI/2,0,0]){const m=mesh(parent,name,new THREE.TorusGeometry(radius,tube,8,radius>.3?80:radius>.07?40:20),material,position);m.rotation.set(...rotation);return m;}
function canopy(parent,m){
 lathe(parent,'ceiling-mounted canopy with fitted lower collar',[[0,6.49],[.15,6.49],[.17,6.46],[.17,6.42],[.13,6.39],[.055,6.37],[.042,6.32],[0,6.32]],m.brass);
}
function bulb(parent,position,m,scale=1){
 const g=new THREE.Group();g.position.fromArray(position);g.scale.setScalar(scale);parent.add(g);
 lathe(g,'formed pear glass Edison bulb',[[0,-.245],[.028,-.241],[.055,-.211],[.068,-.166],[.066,-.124],[.049,-.082],[.026,-.042],[.023,0],[0,0]],m.glass);
 lathe(g,'Edison socket and threaded brass ferrule',[[0,.055],[.030,.055],[.034,.044],[.034,.005],[.027,-.008],[.026,-.041],[0,-.041]],m.iron);
 for(let i=0;i<4;i++)hoop(g,'machined socket thread',.026,.0018,m.brass,[0,-.012-i*.006,0]);
 for(const sign of[-1,1])rod(g,'lead seated inside the bulb',[[sign*.009,-.028,0],[sign*.016,-.132,0]],.0018,m.iron,4);
 rod(g,'warm glowing folded tungsten filament',[[-.016,-.125,0],[-.023,-.190,0],[-.012,-.209,0],[0,-.146,0],[.012,-.209,0],[.023,-.190,0],[.016,-.125,0]],.0034,m.filament,22);
 const emitter=new THREE.Object3D();emitter.position.set(0,-.165,0);emitter.userData.fixtureEmitter=true;g.add(emitter);
 return g;
}
function leafGeometry(){
 const p=[],indices=[],rows=18,sides=12;
 for(let row=0;row<=rows;row++){const t=row/rows,w=.048*Math.sin(Math.PI*t)**.80;for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;p.push(Math.cos(a)*w,t*.235,Math.sin(a)*w*.39+Math.sin(Math.PI*t)*.021);if(row<rows&&j<sides){const n=row*(sides+1)+j;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function botanical(parent,m){
 const y=5.40,r=1.42,leaf=leafGeometry();
 hoop(parent,'copper botanical chandelier ring',r,.016,m.copper,[0,y,0]);
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2;rod(parent,'taut suspension wire attached to copper ring',[[0,6.37,0],[Math.cos(a)*r,y,Math.sin(a)*r]],.005,m.copper);}
 for(let i=0;i<18;i++){
  const a=i/18*Math.PI*2,node=[Math.cos(a)*r,y,Math.sin(a)*r],drop=.28+(Math.sin(i*2.4)+1)*.19;
  const fork=[Math.cos(a)*(r-.10),y-drop,Math.sin(a)*(r-.10)];
  rod(parent,'copper stem hanging from the botanical ring',[node,[(node[0]+fork[0])/2,y-drop*.60,(node[2]+fork[2])/2],fork],.006,m.copper);
  for(let j=0;j<(i%3===0?3:2);j++){
   const turn=a+(j-.6)*.38,reach=j%2?.33:-.23,start=[fork[0]+Math.cos(turn)*reach,fork[1]-.08-j*.075,fork[2]+Math.sin(turn)*reach];
   rod(parent,'fine branch meeting the opal leaf socket',[fork,start],.0045,m.copper,8);
   const direction=new THREE.Vector3(Math.cos(turn)*.46,-.84,Math.sin(turn)*.42).normalize();
   const pod=mesh(parent,'luminous sculpted opal leaf',leaf,m.opal,start);pod.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
   const socket=lathe(parent,'tiny brass socket at the leaf stem',[[.009,-.016],[.014,0],[.012,.026],[0,.026]],m.copper,start,12);socket.quaternion.copy(pod.quaternion);
  }
 }
}
function alabaster(parent,m){
 rod(parent,'vertical spine carrying alabaster mobile',[[0,6.37,0],[0,4.25,0]],.018,m.iron);
 const globes=[[-1.05,5.76,.12,.34],[.67,5.97,-.27,.27],[.10,5.27,.74,.41],[1.12,5.07,-.20,.33],[-.66,4.78,-.57,.29],[-.12,4.27,.16,.23],[.86,4.39,.50,.17],[-1.26,5.22,.55,.16],[-.47,6.06,-.62,.18]];
 for(const [x,y,z,r]of globes){
  const d=new THREE.Vector3(x,0,z).normalize(),neck=[x-d.x*r*.90,y,z-d.z*r*.90];
  rod(parent,'articulated bronze arm supporting an alabaster globe',[[0,y+.08,0],[d.x*.14,y+.08,d.z*.14],neck],.012,m.brass);
  const geometry=new THREE.SphereGeometry(r,32,24),colors=[];for(let i=0;i<geometry.attributes.position.count;i++){const y=geometry.attributes.position.getY(i)/r,s=.82+.18*(y+1)/2;colors.push(s,s,s);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const ball=mesh(parent,'warm veined alabaster globe',geometry,m.alabaster,[x,y,z]);ball.rotation.y=x;
  const collar=lathe(parent,'brass collar meeting alabaster diffuser',[[.029,-.024],[.038,-.018],[.038,.016],[.029,.022]],m.brass,neck,20);collar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);
 }
}
function glassCluster(parent,m){
 rod(parent,'dark central stem of glass cluster',[[0,6.37,0],[0,5.65,0]],.019,m.iron);
 for(const [x,y,z,r]of[[-.65,5.55,-.10,.30],[.65,5.12,.10,.32],[-.15,4.55,.28,.34],[.32,5.75,-.38,.25],[-.52,4.92,-.55,.22]]){
  const top=y+r*.96;
  rod(parent,'curved metal branch ending in the glass pendant socket',[[0,5.86,0],[x*.55,top+.17,z*.55],[x,top+.12,z],[x,top,z]],.013,m.iron);
  const profile=[],inner=[];
  for(let i=0;i<=28;i++){const a=.14+i/28*(Math.PI*.80-.14);profile.push([Math.sin(a)*r,Math.cos(a)*r]);inner.unshift([Math.max(.002,Math.sin(a)*r-.005),Math.cos(a)*r]);}
  lathe(parent,'open-bottom handblown amber glass globe',[...profile,...inner,profile[0]],m.glass,[x,y,z],40);
  const a=Math.PI*.80;hoop(parent,'rolled lip around the open glass mouth',Math.sin(a)*r,.004,m.rim,[x,y+Math.cos(a)*r,z]);
  lathe(parent,'glass globe neck seated in its metal fitting',[[.019,0],[.030,0],[.030,.075],[.023,.087]],m.brass,[x,top-.025,z],20);
  bulb(parent,[x,y+.12,z],m,.95);
 }
}
function edison(parent,m){
 const railY=5.65;
 rod(parent,'brushed brass rail carrying the wrapped cords',[[-1.83,railY,0],[1.83,railY,0]],.025,m.brass);
 for(const sign of[-1,1]){
  lathe(parent,'rail ceiling rose',[[0,6.49],[.085,6.49],[.085,6.42],[.025,6.40]],m.brass,[sign*1.65,0,0]);
  rod(parent,'rigid suspension joining ceiling to pendant rail',[[sign*1.65,6.42,0],[sign*1.65,railY,0]],.012,m.iron);
 }
 const coil=[];for(let i=0;i<=650;i++){const t=i/650,a=t*Math.PI*2*34;coil.push([-1.76+t*3.52,railY+Math.cos(a)*.044,Math.sin(a)*.044]);}
 rod(parent,'continuous teal cable coiled around brass rail',coil,.007,m.cord,650);
 for(let i=0;i<9;i++){
  const x=-1.56+i*.39,y=4.38+Math.sin(i*1.7)*.32;
  rod(parent,'teal fabric drop cord connected to the wrapped rail',[[x,railY,.040],[x,railY-.08,.045],[x,y+.05,.045]],.006,m.cord,10);
  bulb(parent,[x,y,.045],m,1.05);
 }
 for(const x of[-.15,0,.15])rod(parent,'teal feed from canopy to rail bundle',[[x*.28,6.37,0],[x,6.05,.04],[x,railY,.04]],.007,m.cord,12);
}
function crystalDrop(parent,position,m,scale=1){
 const profile=[[0,.10],[.018,.07],[.040,.01],[.035,-.055],[0,-.13]];
 const g=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(p[0]*scale,p[1]*scale)),10);g.computeVertexNormals();
 mesh(parent,'faceted crystal teardrop attached to its chain',g,m.crystal,position);
}
function crystal(parent,m){
 const centerY=5.20;
 rod(parent,'central chandelier suspension and candle spine',[[0,6.37,0],[0,4.85,0]],.025,m.iron);
 for(let ring=0;ring<3;ring++){
  const points=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,y=centerY+Math.cos(a)*1.04,r=Math.sin(a)*1.12,t=ring/3*Math.PI;points.push([Math.cos(t)*r,y,Math.sin(t)*r]);}
  rod(parent,'forged iron meridian of the crystal chandelier',points,.014,m.iron,96);
 }
 hoop(parent,'equator joining the chandelier cage',1.12,.012,m.iron,[0,centerY,0]);
 for(let i=0;i<6;i++){
  const a=i/6*Math.PI*2,x=Math.cos(a)*.66,z=Math.sin(a)*.66,y=5.14;
  rod(parent,'swept candelabra arm seated in the central hub',[[0,4.88,0],[x*.7,4.84,z*.7],[x,4.98,z],[x,y,z]],.018,m.brass,24);
  lathe(parent,'cut glass bobeche on the candle arm',[[0,0],[.055,0],[.12,.024],[.12,.035],[.06,.043],[.033,.055],[0,.055]],m.crystal,[x,y,z],24);
  lathe(parent,'ivory candle sleeve and shaped flame bulb',[[0,0],[.026,0],[.026,.16],[.022,.175],[.029,.22],[.022,.28],[0,.32]],m.candle,[x,y+.045,z],24);
  for(let j=0;j<2;j++){
   const t=a+(j?-.26:.26),px=x+Math.cos(t)*.09,pz=z+Math.sin(t)*.09,drop=.22+(i%3)*.045;
   rod(parent,'short chain carrying a cut crystal drop',[[px,y+.025,pz],[px,y-drop+.08,pz]],.0025,m.brass,4);
   crystalDrop(parent,[px,y-drop,pz],m,.90);
  }
  const festoon=[];for(let j=0;j<=14;j++){const t=j/14,angle=a+t*Math.PI/3;festoon.push([Math.cos(angle)*.64,5.03-Math.sin(t*Math.PI)*.22,Math.sin(angle)*.64]);}
  rod(parent,'joined crystal swag between adjacent candle arms',festoon,.004,m.brass,20);
  for(let j=1;j<7;j++){const p=festoon[j*2];mesh(parent,'small crystal bead seated on the swag',new THREE.OctahedronGeometry(.024,0),m.crystal,p);}
 }
 crystalDrop(parent,[0,4.70,0],m,1.35);
 rod(parent,'central drop suspension',[[0,4.90,0],[0,4.82,0]],.003,m.brass,4);
}

export function addMuseumFixtures(root,layout){
 const m=materials(),fixtures=[],lights=[],emitters=[];
 for(const site of museumFixtureSites(layout)){
  const group=new THREE.Group();group.name=site.kind+' reference-inspired museum fixture';group.position.set(site.x,0,site.z);group.rotation.y=-site.yaw;root.add(group);canopy(group,m);
  ({botanical,alabaster,glass:glassCluster,edison,crystal}[site.kind])(group,m);
  group.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(group);
  group.traverse(o=>{if(o.userData.fixtureEmitter)emitters.push(...o.getWorldPosition(new THREE.Vector3()).toArray());});
  const intensity=site.kind==='crystal'?12:site.kind==='alabaster'?18:16,y=site.kind==='crystal'?5.20:site.kind==='botanical'?4.85:site.kind==='glass'?4.65:4.90;
  const light=new THREE.PointLight(site.kind==='botanical'?0xffe6b6:0xffd39a,intensity,9.8,2);light.name='steady '+site.kind+' pendant light';light.position.set(site.x,y,site.z);lights.push(light);
  fixtures.push({...site,min:bounds.min.toArray(),max:bounds.max.toArray()});
 }
 // One depth-tested point batch provides subtle photographic filament bloom,
 // with no full-screen postprocessing and no sprites per tiny botanical leaf.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,63);
 for(const [p,color]of[[0,'rgba(255,251,226,1)'],[.08,'rgba(255,243,198,1)'],[.20,'rgba(255,204,116,.70)'],[.45,'rgba(255,171,67,.14)'],[1,'rgba(255,161,60,0)']])g.addColorStop(p,color);c.fillStyle=g;c.fillRect(0,0,128,128);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(emitters,3));
 const bloom=new THREE.Points(geometry,new THREE.PointsMaterial({map,color:0xffffff,size:.38,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));bloom.name='subtle glow at the actual Edison filaments';bloom.renderOrder=1;root.add(bloom);
 return {fixtures,lights};
}
