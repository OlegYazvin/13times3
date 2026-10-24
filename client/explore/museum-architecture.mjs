import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {HALL_WIDTH,corridorOutline,portalOpening} from './layout.mjs';
import {museumExhibits,museumSconceSites,museumColliders} from './museum-layout.mjs';

const stone=new THREE.MeshStandardMaterial({color:0xe0d7c2,roughness:.84});
const edge=new THREE.MeshStandardMaterial({color:0xb9b29f,roughness:.81});
const bronze=new THREE.MeshStandardMaterial({color:0x887047,metalness:.66,roughness:.38});
const inlayBronze=bronze.clone();inlayBronze.polygonOffset=true;inlayBronze.polygonOffsetFactor=-1;inlayBronze.polygonOffsetUnits=-1;
const green=new THREE.MeshStandardMaterial({color:0x324b44,roughness:.78});
const blackStone=new THREE.MeshStandardMaterial({color:0x3e4945,roughness:.62});
const glow=new THREE.MeshBasicMaterial({color:0xffeed2});
function box(parent,name,pos,size,material=stone,r=.025){const m=new THREE.Mesh(new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(n=>n/3))),material);m.name=name;m.position.fromArray(pos);parent.add(m);return m;}
function tube(parent,name,points,radius,material=bronze){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(path,32,radius,10,false),material);m.name=name;parent.add(m);return m;}
function lathe(parent,name,profile,material=stone){const m=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),material);m.name=name;parent.add(m);return m;}
function textPanel(parent,text,pos,width,height,{color='#e7ddc5',background='#34463e',lines=[text],font='Georgia'}={}){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=Math.round(1536*height/width);const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';
 const size=Math.min(canvas.height/(lines.length+1)*1.15,132);c.font=`${size}px ${font}`;
 for(let i=0;i<lines.length;i++){let s=size;while(c.measureText(lines[i]).width>1400){s-=2;c.font=`${s}px ${font}`;}c.fillText(lines[i],768,canvas.height*(i+1)/(lines.length+1));c.font=`${size}px ${font}`;}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture}));panel.name=text;panel.position.fromArray(pos);parent.add(panel);return panel;
}
function arch(parent,width,rise,baseY,z,material=stone){
 const s=new THREE.Shape(),outer=width/2,inner=outer-.18;
 for(let i=0;i<=48;i++){const a=i/48*Math.PI,x=Math.cos(a)*outer,y=baseY+Math.sin(a)*rise;i?s.lineTo(x,y):s.moveTo(x,y);}
 for(let i=48;i>=0;i--){const a=i/48*Math.PI;s.lineTo(Math.cos(a)*inner,baseY+Math.sin(a)*(rise-.18));}s.closePath();
 const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.30,bevelEnabled:true,bevelSize:.022,bevelThickness:.022,bevelSegments:2,steps:1}),material);m.name='joined stone arch';m.position.z=z-.15;parent.add(m);return m;
}
function marbleCanvas(){
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#c9c4b5';x.fillRect(0,0,512,512);
 for(let i=0;i<1500;i++){const a=(Math.sin(i*78.13)*4587.7)%1,b=(Math.sin(i*12.29)*2345.3)%1;x.fillStyle=i%2?'rgba(255,255,240,.08)':'rgba(87,85,75,.04)';x.fillRect(Math.abs(a)*512,Math.abs(b)*512,1.4,1.4);}
 x.strokeStyle='rgba(97,95,81,.07)';x.lineWidth=1;for(let i=0;i<5;i++){x.beginPath();x.moveTo(i*130-100,0);x.bezierCurveTo(i*110+40,150,i*120-40,350,i*130+90,512);x.stroke();}
 x.strokeStyle='rgba(86,82,70,.13)';x.strokeRect(0,0,512,512);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(.34,.34);return texture;
}
export function museumFloorMaterial(){return new THREE.MeshStandardMaterial({map:marbleCanvas(),roughness:.72,side:THREE.DoubleSide});}

// Baking stationary architecture by material keeps the much richer museum
// inexpensive to draw. Animated flames, paintings and loaded sculpture stay separate.
export function batchMuseumStatics(root,filter=()=>true){
 root.updateWorldMatrix(true,true);const groups=new Map(),remove=[];
 root.traverse(o=>{if(!o.isMesh||o.userData.museumDynamic||!filter(o)||Array.isArray(o.material))return;const g=o.geometry.clone();for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.applyMatrix4(o.matrixWorld);const geometry=g.index?g.toNonIndexed():g;const list=groups.get(o.material)||[];list.push(geometry);groups.set(o.material,list);remove.push(o);});
 for(const o of remove)o.removeFromParent();
 for(const [material,geometries]of groups){const m=new THREE.Mesh(mergeGeometries(geometries),material);m.name='batched museum architecture';root.add(m);}
}

function addColumn(group,x,along){
 const column=new THREE.Group();column.position.set(x,0,-along);group.add(column);
 lathe(column,'turned limestone plinth and column foot',[[0,0],[.29,0],[.29,.13],[.25,.17],[.25,.25],[.19,.30],[.17,.40]],stone);
 const geo=new THREE.CylinderGeometry(.17,.18,5.48,40,1),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),f=1+.035*Math.cos(a*16);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);}geo.computeVertexNormals();const shaft=new THREE.Mesh(geo,stone);shaft.name='fluted limestone pilaster';shaft.position.y=3.12;column.add(shaft);
 const capital=lathe(column,'shaped stone column capital',[[.17,0],[.20,.06],[.23,.12],[.25,.17],[.28,.20],[.28,.27]],stone);capital.position.y=5.81;
}
function addBench(group,along){
 box(group,'museum bench upholstered seat',[0,.49,-along],[2.6,.18,.72],green,.08);
 box(group,'walnut bench apron',[0,.36,-along],[2.45,.10,.63],bronze,.025);
 for(const x of[-.96,.96])tube(group,'continuous bronze bench leg',[[x,0,-along-.23],[x,.36,-along-.23],[x,.36,-along+.23],[x,0,-along+.23]],.026);
}
function addAbstract(parent,kind){
 const m=kind==='spiral'?bronze:stone;
 const path=[];
 for(let i=0;i<=120;i++){
  const t=i/120,a=t*Math.PI*2;
  if(kind==='spiral')path.push([(.15+.35*Math.sin(Math.PI*t))*Math.cos(a*1.35),.10+t*1.65,(.15+.35*Math.sin(Math.PI*t))*Math.sin(a*1.35)]);
  else if(kind==='arches')path.push([Math.cos(a)*(.52+.11*Math.sin(a*2)),.94+Math.sin(a)*.85,Math.sin(a*2)*.24]);
  else if(kind==='embrace')path.push([Math.sin(a)*.55,.95+Math.cos(a)*.84,Math.sin(a*2)*.32]);
  else path.push([Math.sin(a)*(.53+.13*Math.cos(a*3)),.95+Math.cos(a)*.80,Math.sin(a*2)*.28]);
 }
 const curve=new THREE.CatmullRomCurve3(path.map(p=>new THREE.Vector3(...p))),rows=160,sides=16,frames=curve.computeFrenetFrames(rows,kind!=='spiral'),positions=[],indices=[];
 for(let r=0;r<=rows;r++){const t=r/rows,p=curve.getPoint(t);for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2,v=p.clone().addScaledVector(frames.normals[r],Math.cos(a)*(.13+.025*Math.sin(t*Math.PI*3))).addScaledVector(frames.binormals[r],Math.sin(a)*.065);positions.push(v.x,v.y,v.z);if(r<rows&&s<sides){const n=r*(sides+1)+s;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}}
 if(kind==='spiral'){for(const [r,reverse]of[[0,true],[rows,false]]){const center=positions.length/3;positions.push(...curve.getPoint(r/rows).toArray());for(let s=0;s<sides;s++){const a=r*(sides+1)+s;indices.push(...(reverse?[center,a+1,a]:[center,a,a+1]));}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.translate(0,-g.boundingBox.min.y,0);const sculpture=new THREE.Mesh(g,m);sculpture.name='continuous carved '+kind+' sculpture';parent.add(sculpture);
}
function fireGeometry(){
 const profile=[[0,0],[.035,.012],[.075,.065],[.069,.12],[.042,.19],[.020,.25],[0,.33]];
 const g=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),20),p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+y*y*.55);const c=new THREE.Color(0xffefb4).lerp(new THREE.Color(0xffa43f),THREE.MathUtils.smoothstep(y,.03,.33));colors.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function addSconce(group,site,flames,fireGeo,fireMaterial,washMaterial){
 const holder=new THREE.Group();holder.position.set(site.sign*site.mountX,2.44,-site.along);holder.rotation.y=site.sign<0?Math.PI/2:-Math.PI/2;group.add(holder);
 lathe(holder,'cast bronze sconce bowl',[[0,0],[.075,0],[.12,.035],[.17,.085],[.18,.12],[.16,.135],[.14,.105],[.06,.055],[0,.055]],bronze).position.set(0,.06,.43);
 box(holder,'beveled bronze sconce backplate',[0,.05,0],[.23,.64,.045],bronze,.08);
 tube(holder,'swept bronze sconce arm',[[0,-.13,.04],[0,-.18,.19],[0,-.10,.37],[0,.10,.43]],.027);
 for(let i=0;i<3;i++){const f=new THREE.Mesh(fireGeo,fireMaterial);f.name='living flame in the bronze sconce';f.position.set((i-1)*.063,.19,.43);f.scale.setScalar(i===1?1:.65);f.userData.museumDynamic=true;holder.add(f);flames.push({mesh:f,scale:i===1?1:.65,phase:site.along+i*1.7});}
 const wash=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.7),washMaterial);wash.position.set(0,.20,.035);holder.add(wash);
}

export function decorateMuseum(scene,layout,assetBase,assetVersion){
 const root=new THREE.Group();root.name='Jane’s Year Exhibit museum architecture';scene.add(root);
 const flames=[],sites=museumSconceSites(layout),fireGeo=fireGeometry();
 const fireMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.88,side:THREE.DoubleSide,depthWrite:false});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(48,48,0,48,48,47);gradient.addColorStop(0,'rgba(255,181,77,.34)');gradient.addColorStop(.4,'rgba(255,186,85,.11)');gradient.addColorStop(1,'rgba(255,190,90,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,96,96);
 const washMap=new THREE.CanvasTexture(canvas);washMap.colorSpace=THREE.SRGBColorSpace;const washMaterial=new THREE.MeshBasicMaterial({map:washMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const sections=[];
 for(const section of layout.sections){
  const group=new THREE.Group();group.position.set(section.start.x,0,section.start.z);group.rotation.y=-section.yaw;root.add(group);sections.push(group);
  for(const sign of[-1,1]){
   const wallSide=sign<0?layout.outline.left:layout.outline.right;
   const along=p=>(p.x-section.start.x)*section.forward.x+(p.z-section.start.z)*section.forward.z;
   const start=along(wallSide[section.index]),end=along(wallSide[section.index+1]);
   const frames=layout.frames.filter(f=>f.section===section.index&&f.sideSign===sign).sort((a,b)=>a.along-b.along);
   let runs=[[start,end]];
   for(const f of frames.filter(f=>f.room.modelUrl)){const w=portalOpening(f).width/2;runs=runs.flatMap(([a,b])=>[[a,Math.min(b,f.along-w)],[Math.max(a,f.along+w),b]].filter(([x,y])=>y>x));}
   for(const [a,b]of runs){
    box(group,'dark green museum dado',[sign*(HALL_WIDTH/2-.09),.40,-(a+b)/2],[.11,.8,b-a],green);
    box(group,'limestone skirting',[sign*(HALL_WIDTH/2-.13),.10,-(a+b)/2],[.18,.20,b-a],edge);
    box(group,'stepped stone dado cap',[sign*(HALL_WIDTH/2-.14),.83,-(a+b)/2],[.20,.10,b-a]);
   }
   box(group,'continuous deep museum cornice',[sign*(HALL_WIDTH/2-.18),6.27,-(start+end)/2],[.38,.28,end-start]);
   box(group,'bronze cornice shadow line',[sign*(HALL_WIDTH/2-.22),6.06,-(start+end)/2],[.04,.034,end-start],bronze);
   for(let i=1;i<frames.length;i++)addColumn(group,sign*(HALL_WIDTH/2-.18),(frames[i-1].along+frames[i].along)/2);
  }
  const ceilingStart=section.index===0?0:HALL_WIDTH/2,ceilingEnd=section.index===layout.sections.length-1?section.length:section.length-HALL_WIDTH/2;
  const bays=Math.ceil((ceilingEnd-ceilingStart)/4.6),bayLength=(ceilingEnd-ceilingStart)/bays;
  for(let b=0;b<=bays;b++){
   const a=ceilingStart+b*bayLength;box(group,'coffered ceiling transverse rib',[0,6.40,-a],[HALL_WIDTH,.20,.16]);
   if(b<bays)for(const sign of[-1,1])box(group,'recessed luminous ceiling panel',[sign*2.60,6.53,-a-bayLength/2],[4.55,.035,bayLength-.38],glow,.06);
  }
  box(group,'central coffered ceiling spine',[0,6.40,-(ceilingStart+ceilingEnd)/2],[.18,.20,ceilingEnd-ceilingStart]);
  if(section.index<layout.sections.length-1){
   const medallion=new THREE.Mesh(new THREE.CircleGeometry(2.85,64),glow);medallion.rotation.x=Math.PI/2;medallion.position.set(section.end.x,6.49,section.end.z);root.add(medallion);
   const molding=new THREE.Mesh(new THREE.TorusGeometry(2.92,.085,12,80),stone);molding.rotation.x=Math.PI/2;molding.position.set(section.end.x,6.46,section.end.z);root.add(molding);
   const next=layout.sections[section.index+1],right=next.forward.x*section.right.x+next.forward.z*section.right.z>0;
   box(group,'gallery wayfinding stone backing',[0,2.70,-section.length-HALL_WIDTH/2+.16],[3.8,1.05,.08],green,.035);
   textPanel(group,next.title,[0,2.70,-section.length-HALL_WIDTH/2+.211],3.55,.88,{lines:[`Gallery ${section.index+2} ${right?'→':'←'}`,next.title]});
  }
  for(const site of sites.filter(p=>p.section===section.index))addSconce(group,site,flames,fireGeo,fireMaterial,washMaterial);
 }
 const border=corridorOutline(layout.sections,HALL_WIDTH/2-.72);
 for(const side of[border.left,border.right])for(let i=1;i<side.length;i++){
  const a=side[i-1],b=side[i],dx=b.x-a.x,dz=b.z-a.z;
  const inlay=box(root,'continuous mitered brass floor border',[(a.x+b.x)/2,-.001,(a.z+b.z)/2],[Math.hypot(dx,dz),.004,.022],inlayBronze,.001);inlay.rotation.y=Math.atan2(-dz,dx);
 }
 for(const [section,along]of[[layout.sections[0],0],[layout.sections.at(-1),layout.sections.at(-1).length]]){
  const group=sections[section.index],z=-along+(along?.07:-.07);box(group,'museum end-wall dado',[0,.40,z],[HALL_WIDTH,.8,.11],green);box(group,'museum end-wall dado cap',[0,.83,z],[HALL_WIDTH,.10,.20]);box(group,'museum end-wall cornice',[0,6.27,z],[HALL_WIDTH,.28,.38]);
 }
 textPanel(sections.at(-1),'For Jane.',[0,2.8,-layout.sections.at(-1).length+.14],3.1,.72,{color:'#e8deca',background:'#34463e'});
 const entrance=sections[0];
 for(const sign of[-1,1]){
  const column=lathe(entrance,'exhibit entrance stone pier',[[0,0],[.31,0],[.31,.18],[.25,.27],[.24,3.65],[.29,3.72],[.31,3.86]],stone);column.position.set(sign*3.45,0,-4);
 }
 arch(entrance,6.9,1.5,3.80,-4);
 box(entrance,'suspended stone exhibit title backing',[0,3.36,-3.80],[4.05,.91,.16],green,.065);
 textPanel(entrance,"Jane's Year Exhibit",[0,3.36,-3.708],3.78,.80,{lines:["Jane's Year",'Exhibit']});
 const statueMount=new THREE.Group(),catMount=new THREE.Group();
 for(const [i,e]of museumExhibits(layout).entries()){
  const group=sections[e.section.index],plinth=new THREE.Group();plinth.position.z=-e.along;group.add(plinth);
  box(plinth,'stepped stone sculpture footing',[0,.075,0],[e.width,.15,e.depth],edge,.045);
  box(plinth,'green marble sculpture plinth',[0,.30,0],[e.width-.16,.34,e.depth-.16],blackStone,.045);
  box(plinth,'beveled limestone sculpture cap',[0,.51,0],[e.width-.06,.09,e.depth-.06],stone,.035);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.0,2.025,80),inlayBronze);ring.rotation.x=-Math.PI/2;ring.position.y=.001;plinth.add(ring);
  const title=i===0?'The Dishwasher Dilemma':e.id==='cat-whisperer'?'Cat Whisperer':`${e.id==='spiral'?'Bronze':'Stone'} Study ${['','I','II','III','IV'][i]}`;
  textPanel(plinth,title,[0,.31,e.depth/2-.066],i===0?2.75:1.95,.20,{color:'#e8deca',background:'#3e4945'});
  if(i===0){statueMount.position.set(0,.555,0);plinth.add(statueMount);}else if(e.id==='cat-whisperer'){catMount.position.set(0,.555,0);plinth.add(catMount);}else{const stand=new THREE.Group();stand.position.y=.555;plinth.add(stand);addAbstract(stand,e.id);}
  addBench(group,e.along+5.4);
 }
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const state={modelReady:false,catWhispererReady:false,artReady:0,modelError:false,catWhispererError:false};
 const url=path=>assetBase+path+(assetVersion?'?v='+assetVersion:'');
 loader.load(url('assets/explore/museum/dishwasher.glb'),g=>{statueMount.add(g.scene);state.modelReady=true;},undefined,e=>{state.modelError=true;console.warn('The gallery sculpture could not load',e);});
 loader.load(url('assets/explore/museum/cat-whisperer.glb'),g=>{catMount.add(g.scene);state.catWhispererReady=true;},undefined,e=>{state.catWhispererError=true;console.warn('Cat Whisperer could not load',e);});
 const textureLoader=new THREE.TextureLoader();
 for(const [i,{path,title}]of [{path:'a-fighter-in-me.webp',title:'A Fighter in Me'},{path:'shore.webp'}].entries()){
  const g=new THREE.Group();g.position.set((i?1:-1)*(HALL_WIDTH/2-.18),2.30,-1.65);g.rotation.y=i?-Math.PI/2:Math.PI/2;entrance.add(g);
  const w=i?2.35:1.85,h=i?1.57:1.85;
  box(g,'decorative oil painting gilded frame',[0,0,0],[w+.22,h+.22,.12],bronze,.02);
  box(g,'linen mount around the original oil painting',[0,0,.07],[w+.09,h+.09,.025],stone,.003);
  const texture=textureLoader.load(url('assets/explore/museum/'+path),()=>state.artReady++);texture.colorSpace=THREE.SRGBColorSpace;
  const art=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));art.name='original framed '+path;art.position.z=.088;g.add(art);
  if(title){box(g,'stone title plaque beneath the painting',[0,-h/2-.27,.025],[w,.27,.055],green,.012);textPanel(g,title,[0,-h/2-.27,.056],w-.08,.19,{color:'#eee2c8',background:'#324b44'});}
 }
 batchMuseumStatics(root);
 // Every fixture has a stationary, always-on light. Only sound proximity
 // follows the visitor; lighting never jumps between fixtures or switches on.
 const lights=sites.map(p=>{const l=new THREE.PointLight(0xffc578,2.3,5,2);l.name='steady sconce light';l.position.set(p.x,p.y+.15,p.z);scene.add(l);return l;});
 return {sites,lights,colliders:museumColliders(layout),state,animate(time,reduceMotion){
  for(const f of flames){const flicker=reduceMotion?1:1+.08*Math.sin(time*3.7+f.phase)+.035*Math.sin(time*7.3+f.phase);f.mesh.scale.set(f.scale*(2-flicker),f.scale*flicker,f.scale);}
 }};
}
