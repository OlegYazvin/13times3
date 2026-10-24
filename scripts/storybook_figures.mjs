import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addContactShadow } from './stage_shadows.mjs';
import {paintedFabric} from './painted_fabric.mjs';
import {sculptedShirt} from './sculpted_garments.mjs';
import {anatomicalHead} from './anatomical_heads.mjs';
import {anatomicalHand} from './anatomical_hands.mjs';
import {storyArmElbow} from './story_arm.mjs';
import {attachStoryHead} from './rig_story_head.mjs';
import shoeSources from './assets/figures/story-shoes.json' with {type:'json'};
import {BLUEBERRY_ACTORS} from './scene07_arrangement.mjs';
import {WEANING_ACTORS} from './scene06_arrangement.mjs';
import {friendshipGrip} from './scene03_arrangement.mjs';
import {BLUE_CAR_ACTORS} from './scene04_arrangement.mjs';
import {CARING_ACTORS,DESK_ADVICE_ACTORS} from './scene02_arrangement.mjs';
import {playgroundGrips} from './scene10_arrangement.mjs';
import {bittenApple} from './story_apple.mjs';
import {aquariumAttention} from './scene11_arrangement.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
import {SIGNUP_SEATED_HEIGHT,SIGNUP_PAPER_POINT,SIGNUP_REST_PLANE} from './scene01_arrangement.mjs';

// Original, geometry-first character sculpts. No photographs, portrait atlases,
// generated face paintings, or face-depth maps enter this module or its export.
const V = a => new THREE.Vector3(...a);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const materialCache = new Map();
const dimensionalSkinMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83});
const shoeGeometry=new Map();
function mat(color) {
  const key = color?.isColor ? color.getHex() : color;
  if (!materialCache.has(key)) materialCache.set(key,
    new THREE.MeshStandardMaterial({color:key,roughness:.86}));
  return materialCache.get(key);
}
function applePrintFabric(base){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(base.map?.image)ctx.drawImage(base.map.image,0,0,256,256);
  else {ctx.fillStyle='#dfc9ad';ctx.fillRect(0,0,256,256);}
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
    const x=22+col*50+(row%2)*12,y=22+row*50;
    ctx.fillStyle='#a86c59';ctx.beginPath();ctx.ellipse(x-1.6,y,3.4,4.2,-.12,0,Math.PI*2);ctx.ellipse(x+1.6,y,3.4,4.2,.12,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#665342';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+.6,y-6);ctx.stroke();
    ctx.fillStyle='#74865e';ctx.beginPath();ctx.ellipse(x+2,y-5,2.4,1.1,-.5,0,Math.PI*2);ctx.fill();
  }
  const result=base.clone(),map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  if(base.map){map.wrapS=base.map.wrapS;map.wrapT=base.map.wrapT;map.repeat.copy(base.map.repeat);}
  result.map=map;return result;
}
function mesh(parent,name,geometry,material,position=[0,0,0]) {
  const m=new THREE.Mesh(geometry,material);m.name=name;m.position.fromArray(position);parent.add(m);return m;
}
function soft(parent,name,position,size,material) {
  const g=new THREE.SphereGeometry(1,24,16);g.scale(...size);
  return mesh(parent,name,g,material,position);
}
function eyePigment(parent,name,x,y,radius,eye,material,lift){
  const p=[],indices=[],rows=5,sides=40;
  for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
    const a=side/sides*Math.PI*2,r=radius*row/rows,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
    const z=eye.z+eye.r*Math.sqrt(Math.max(0,1-((px-eye.x)/eye.r)**2-((py-eye.y)/eye.r)**2))+lift;p.push(px,py,z);
    if(row<rows&&side<sides){const n=row*(sides+1)+side;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
  return mesh(parent,name,g,material);
}
export function shapedTube(parent,name,points,radii,material,flatten=1) {
  const path=new THREE.CatmullRomCurve3(points.map(V));
  const rows=24,sides=16,frames=path.computeFrenetFrames(rows,false),p=[],uv=[],idx=[];
  for(let r=0;r<=rows;r++) {
    const t=r/rows,center=path.getPoint(t),band=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(band));
    const radius=lerp(radii[a],radii[a+1],band-a);
    for(let s=0;s<sides;s++) {
      const angle=s/sides*Math.PI*2;
      const v=center.clone().addScaledVector(frames.normals[r],Math.cos(angle)*radius)
        .addScaledVector(frames.binormals[r],Math.sin(angle)*radius*flatten);
      p.push(v.x,v.y,v.z);
      uv.push(s/sides,t);
      if(r<rows){const n=r*sides+s,b=r*sides+(s+1)%sides;idx.push(n,b,n+sides,b,b+sides,n+sides);}
    }
  }
  for(let s=1;s<sides-1;s++){idx.push(0,s+1,s);const b=rows*sides;idx.push(b,b+s,b+s+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  return mesh(parent,name,g,material);
}
function loft(parent,name,rings,material,sides=32) {
  // Explicit strictly increasing rings prevent the old child-torso foldback.
  if(rings.some((r,i)=>i&&r[0]<=rings[i-1][0]))throw Error(`Reversed sculpt contour: ${name}`);
  const profile=new THREE.CatmullRomCurve3(rings.map(r=>new THREE.Vector3(r[0],r[1],r[2])));
  const rows=32,p=[],uv=[],indices=[];
  for(let row=0;row<=rows;row++){
    const v=profile.getPoint(row/rows);
    for(let s=0;s<sides;s++){
      const a=s/sides*Math.PI*2;
      p.push(Math.cos(a)*Math.max(.001,v.y),v.x,Math.sin(a)*Math.max(.001,v.z));uv.push(s/sides,row/rows);
      if(row<rows){const n=row*sides+s,b=row*sides+(s+1)%sides;indices.push(n,n+sides,b,b,n+sides,b+sides);}
    }
  }
  for(let s=1;s<sides-1;s++){indices.push(0,s,s+1);const n=rows*sides;indices.push(n,n+s+1,n+s);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return mesh(parent,name,g,material);
}
const identities={
  Jane:{skin:0xd6a58d,hair:0x322b2c,iris:0x4c463c,bun:true,jaw:.74,brow:.003},
  Oleg:{skin:0xd8ad96,hair:0x544235,iris:0x617466,glasses:true,beard:true,jaw:1.08,brow:.0045},
  Zephrine:{skin:0xefc3a5,hair:0x80593e,iris:0x647f8b,child:true,curls:true,jaw:.83},
  Charlize:{skin:0x9a694c,hair:0x302826,iris:0x423225,child:true,bun:true,jaw:.83},
  G:{skin:0xd1a184,hair:0x6b4e3e,iris:0x637059,bob:true,glasses:true,jaw:.90},
  Aibike:{skin:0xac795c,hair:0x332c2b,iris:0x3e332c,bob:true,jaw:.83},
  Matt:{skin:0xd5a58b,hair:0x765b43,iris:0x61716d,glasses:true,beard:true,jaw:.95},
  Tanya:{skin:0xdcb698,hair:0x6b4936,iris:0x4f6250,bob:true,glasses:true,jaw:.86},
};
// Zephrine's private portrait and full-body references show abundant loose
// curls: a broad side/back silhouette down to the nape and a swept fringe.
// The continuous volume supplies density; a few broad attached locks describe
// the curl direction without building a cage of separate thin strands.
function fitHairSurface(geometry,anatomy,h,{full=false,outerCount=Infinity}={}){
  if(!anatomy)return;
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i)*(full?1.16:1),z=p.getZ(i)*(full?1.08:1);const y=p.getY(i),a=Math.atan2(z,x),r=Math.hypot(x,z);
    const skin=anatomy.radius(a,y/h),side=Math.abs(Math.cos(a));
    const depth=i>=outerCount?.003:full?.006+.023*side:.007;
    const crown=1-THREE.MathUtils.smoothstep(y,h*.78,h+.028);
    const relief=full&&i<outerCount?crown*(.0065*Math.sin(a*11+1.2*Math.sin(y*53+a*3))+.0055*Math.sin(y*91+.8*Math.sin(a*13))+.003*Math.sin(a*27+1.8*Math.sin(y*148+a*4))*Math.sin(y*132+.7*Math.sin(a*17))):0;
    const target=y>h?r:Math.max(r,skin+depth+Math.max(0,relief));
    if(r>.001){x*=target/r;z*=target/r;}p.setXYZ(i,x,y,z);
  }
  geometry.computeVertexNormals();
}
function zephrineCurlyHair(head,h,hair,anatomy=null){
  const rows=88,sides=192,p=[],colors=[],indices=[];
  const lowAt=a=>lerp(-.025+.009*Math.sin(a*11+.4)+.004*Math.sin(a*17),h*(anatomy?.77-.16*Math.cos(a):.75+.065*Math.cos(a+.55))+.004*Math.sin(a*9+.5),THREE.MathUtils.smoothstep(Math.sin(a),.19,.72));
  for(let r=0;r<=rows;r++)for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2,v=r/rows,low=lowAt(a),y=lerp(low,h+.028,v);
    const dome=Math.sqrt(Math.max(0,1-((Math.max(y,.025)-.114)/(h+.028-.114))**2));
    const crown=THREE.MathUtils.smoothstep(y,.17,h+.028),front=THREE.MathUtils.smoothstep(Math.sin(a),.1,.8);
    const clump=.008*Math.sin(a*11+1.2*Math.sin(y*53+a*3))+.006*Math.sin(y*91+.8*Math.sin(a*13));
    const curl=.0045*Math.sin(a*27+1.8*Math.sin(y*148+a*4))*Math.sin(y*132+.7*Math.sin(a*17));
    const fine=.0012*Math.sin(a*73+y*311);
    const relief=(clump+curl+fine)*(1-crown*.75)*(1-front*.32)*dome;
    const width=.137*dome,depth=.109*dome,sweep=-.008*crown;
    const x=sweep+Math.cos(a)*(width+relief),z=Math.sin(a)*(depth+relief)-.008;
    p.push(x,y,z);
    const light=.10+.06*Math.sin(a*11+y*79)+.03*Math.sin(a*29+y*137)+fine*9;
    const c=hair.clone().lerp(new THREE.Color(0xb78c61),light).multiplyScalar(.89+.09*crown+.03*Math.sin(a*17+y*122));colors.push(c.r,c.g,c.b);
    if(r<rows&&k<sides){const n=r*(sides+1)+k;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  }
  // A narrow rounded hairline/hem, rather than broad flat inserts beside
  // the cheeks. The inside of the dense curl surface remains textured too.
  for(let ring=1;ring<=6;ring++)for(let k=0;k<=sides;k++){
    const t=ring/6,ox=p[k*3],oy=p[k*3+1],oz=p[k*3+2];
    const radius=Math.hypot(ox,oz+.008),inset=.006*(1-Math.cos(t*Math.PI))*.5,ratio=(radius-inset)/radius;
    p.push(ox*ratio,oy+.004*t+.006*Math.sin(t*Math.PI),(oz+.008)*ratio-.008);
    const c=hair.clone().multiplyScalar(.94-.06*t);colors.push(c.r,c.g,c.b);
    if(k<sides){const prev=ring===1?0:(rows+1+ring-2)*(sides+1),next=(rows+1+ring-1)*(sides+1);indices.push(prev+k,prev+k+1,next+k,prev+k+1,next+k+1,next+k);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  fitHairSurface(g,anatomy,h,{full:true,outerCount:(rows+1)*(sides+1)});
  mesh(head,'Zephrine: full sculpted curls around crown sides and nape',g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,side:THREE.DoubleSide}));
  // A few small ends turn out of the dense connected body. These are short
  // curls with attached roots, not long separated tubes substituting for hair.
  // Dense curls sit in front of the ears as in the portrait, closing the
  // temple gap with rounded volume rather than flat side-head panels.
  for(const sign of (anatomy?[]:[-1,1])){
    const curl=new THREE.SphereGeometry(1,40,32),pos=curl.attributes.position,cols=[];
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),a=Math.atan2(z,x);
      const wave=1+.10*Math.sin(a*7+y*11)+.045*Math.sin(a*13-y*16);
      pos.setXYZ(i,x*.024*wave,y*.052,z*.028*wave);
      const c=hair.clone().lerp(new THREE.Color(0xb78c61),.08+.045*Math.sin(a*7+y*11));cols.push(c.r,c.g,c.b);
    }
    curl.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));curl.computeVertexNormals();
    mesh(head,'Zephrine: full soft temple curls covering the ear',curl,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91}),[sign*.108,.119,.014]);
  }
  const lockMaterial=mat(hair.clone().lerp(new THREE.Color(0xb78c61),.10));
  for(const sign of [-1,1])for(const [z,start,phase] of [[.032,.082,0],[-.028,.064,1.5]]){
    const points=Array.from({length:37},(_,i)=>{const t=i/36,a=phase+t*Math.PI*3.5,r=.010*(.65+.35*Math.sin(t*Math.PI));return [sign*(lerp(.119,.134,THREE.MathUtils.smoothstep(t,0,.25))+Math.cos(a)*r),start-.116*t,z+Math.sin(a)*r];});
    shapedTube(head,'Zephrine: short loose ringlet rooted in the full hair',points,[.0048,.0045,.003,.001],lockMaterial);
  }
}

function olegSweptHair(head,h,hair,anatomy=null){
  const rows=56,sides=128,p=[],colors=[],indices=[];
  for(let row=0;row<=rows;row++)for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2,front=THREE.MathUtils.smoothstep(Math.sin(a),.0,.85);
    const side=THREE.MathUtils.smoothstep(Math.abs(Math.cos(a)),.62,.98);
    const nape=-.012+.010*Math.sin(a*5+.7)+side*.095;
    const hairline=h*.81-.027*Math.cos(a)+.005*Math.sin(a*3+.8);
    const low=lerp(nape,hairline,front),v=row/rows,y=lerp(low,h+.024,v);
    const dome=Math.sqrt(Math.max(0,1-((Math.max(y,.060)-.145)/(h+.024-.145))**2));
    const part=.0055*Math.sin(a*8-y*22)+.0015*Math.sin(a*29-y*59+.7*Math.sin(a*3));
    const swept=.010*Math.sin(a+.8)*THREE.MathUtils.smoothstep(y,.16,.27);
    p.push(-.007*v+Math.cos(a)*(.116*dome+part*dome)+swept,y,Math.sin(a)*(.094*dome+part*dome)-.008);
    const c=hair.clone().lerp(new THREE.Color(0x9b7753),.08+.035*Math.sin(a*15-y*38));colors.push(c.r,c.g,c.b);
    if(row<rows&&k<sides){const n=row*(sides+1)+k;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  fitHairSurface(g,anatomy,h);
  mesh(head,'Oleg: swept medium hair with full temples and nape',g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,side:THREE.DoubleSide}));
}

function sculptedBob(head,h,hair,anatomy){
  const rows=56,sides=128,p=[],colors=[],indices=[];
  for(let r=0;r<=rows;r++)for(let s=0;s<=sides;s++){
    const a=s/sides*Math.PI*2,front=THREE.MathUtils.smoothstep(Math.sin(a),.32,.86);
    const low=lerp(-.055+.008*Math.cos(a*5+.4),h*(.79-.055*Math.cos(a)),front),y=lerp(low,h+.016,r/rows);
    const dome=Math.sqrt(Math.max(0,1-((Math.max(y,.07)-.125)/(h+.016-.125))**2));
    const roll=.0035*Math.sin(a*9-y*32)+.0012*Math.sin(a*23-y*71),radius=Math.max(anatomy.radius(a,y/h)+.008,(.121+roll)*dome);
    p.push(Math.cos(a)*radius,y,Math.sin(a)*radius);
    const c=hair.clone().lerp(new THREE.Color(0xa37c58),.07+.035*Math.sin(a*11-y*28));colors.push(c.r,c.g,c.b);
    if(r<rows&&s<sides){const n=r*(sides+1)+s;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  mesh(head,'formed bob with rounded sides and shoulder-length nape',g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,side:THREE.DoubleSide}));
}

function headSculpt(parent,identity,options={}) {
  const config={...(identities[identity]||identities.Tanya),...options};
  const root=new THREE.Group();root.name=`${identity}: dimensional face, cranium and fitted hair`;parent.add(root);
  const head=new THREE.Group();head.name=`${identity}: facial features and hairstyle`;root.add(head);
  const child=config.child,h=child?.245:.265,w=identity==='Oleg'?.105:identity==='G'?.102:child?.097:.095,jaw=config.jaw||.85;
  const skin=new THREE.Color(config.skin),hair=new THREE.Color(config.hair);
  const anatomy=options.anatomicalHead?anatomicalHead(identity,config,h):null;
  const rxAt=t=>Math.max(.002,w*(.52+.48*Math.sin(Math.PI*clamp(t*.86+.07,0,1)))*lerp(jaw,1,clamp(t*3,0,1))*(t>.82?Math.sqrt(Math.max(.0004,1-((t-.82)/.18)**2)):1));
  const rzAt=t=>Math.max(.002,.079*Math.pow(Math.sin(Math.PI*clamp(t*.89+.055,.01,.99)),.45)*(t>.85?Math.sqrt(Math.max(.0004,1-((t-.85)/.15)**2)):1));
  const bump=(x,t)=>{
    const gauss=(xx,yy,sx,sy)=>Math.exp(-(((x-xx)/sx)**2+((t-yy)/sy)**2));
    return (child?.72:identity==='Jane'?.91:1)*.028*gauss(0,.45,.020,.15)+.019*gauss(0,.35,.027,.045)
      +.008*(gauss(-.046,.39,.025,.11)+gauss(.046,.39,.025,.11))
      +.004*gauss(0,.25,.038,.045)-.003*(gauss(-.042,.56,.027,.06)+gauss(.042,.56,.027,.06));
  };
  const front=anatomy?.front||((x,t)=>Math.sqrt(Math.max(.02,1-(x/rxAt(t))**2))*rzAt(t)+bump(x,t));
  const rows=48,sides=64,p=[],colors=[],idx=[];
  for(let r=0;r<=rows;r++)for(let s=0;s<sides;s++){
    const t=r/rows,a=s/sides*Math.PI*2,forward=Math.sin(a),x=Math.cos(a)*rxAt(t);
    const cap=Math.pow(Math.sin(Math.PI*clamp(t,.002,.998)),.13);
    const z=forward*rzAt(t)+(forward>0?bump(x,t)*Math.pow(forward,8):0);
    p.push(x*cap,t*h,z*cap);
    const cheek=Math.exp(-(((Math.abs(x)-.052)/.03)**2+((t-.37)/.12)**2))*Math.max(0,forward);
    const c=skin.clone().lerp(new THREE.Color(0xd58279),cheek*.13);
    if(config.beard){
      const chin=THREE.MathUtils.smoothstep(.25-t,0,.10),jaw=THREE.MathUtils.smoothstep(Math.abs(x),.039,.078)*THREE.MathUtils.smoothstep(.49-t,0,.18);
      const moustache=Math.exp(-(((t-.305)/.025)**2))*Math.exp(-((x/.036)**4));
      const beard=Math.max(chin,jaw,moustache*.8)*Math.max(0,forward+.25);
      c.lerp(hair,Math.min(.54,beard*.61)*(.90+.10*Math.sin(a*34+t*93)));
    }
    colors.push(c.r,c.g,c.b);
    if(r<rows){const n=r*sides+s,b=r*sides+(s+1)%sides;idx.push(n,n+sides,b,b,n+sides,b+sides);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
  if(anatomy)attachStoryHead(root,head,anatomy.geometry,dimensionalSkinMaterial,options);
  else mesh(head,`${identity}: continuous modeled brow cheeks nose mouth jaw`,g,dimensionalSkinMaterial);
  for(const sign of [-1,1]) {
    if(!anatomy){soft(head,'formed ear with helix',[sign*w*.98,h*.45,-.009],[.017,.028,.018],mat(config.skin));
    soft(head,'recessed ear concha',[sign*w*1.10,h*.45,.002],[.005,.013,.006],mat(skin.clone().multiplyScalar(.8)));}
    // The eye is a curved almond patch, seated in a modeled socket, not a
    // projecting eyeball. Lid rims meet the skin along its entire contour.
    const ex=sign*(anatomy?.eyeX??.039),et=anatomy?.eyeT??.555,ew=anatomy?(child?.0185:.0175):(child?.021:.018),eh=config.expression==='tender'?.0045:.0065;
    if(anatomy)soft(head,'formed eyeball seated behind anatomical eyelids',[ex,et*h,anatomy.eyeZ],anatomy.eyeRadii,mat(0xe5dccc));
    else{
      const eyeP=[ex,et*h,front(ex,et)+.0025],ep=[...eyeP],ei=[];
      for(let k=0;k<=32;k++){
        const a=k/32*Math.PI*2,x=ex+Math.cos(a)*ew,y=et*h+Math.sin(a)*eh*Math.pow(Math.abs(Math.sin(a)),.3);
        ep.push(x,y,front(x,y/h)+.0025);if(k)ei.push(0,k,k+1);
      }
      const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(ep,3));eg.setIndex(ei);eg.computeVertexNormals();mesh(head,'almond eye seated beneath eyelids',eg,mat(0xe5dccc));
    }
    const gaze=clamp(config.gazeY||0,-eh+.002,eh-.002),eyeY=et*h+gaze,gazeX=clamp(config.gazeX||0,-.0045,.0045),irisX=ex+gazeX;
    const irisHeight=Math.min(.0063,eh-Math.abs(gaze)-.0004),eyeDepth=anatomy?anatomy.eyeZ+anatomy.eyeRadii[2]*Math.sqrt(Math.max(.1,1-(gaze/anatomy.eyeRadii[1])**2-(gazeX/anatomy.eyeRadii[0])**2))-.003:front(ex,eyeY/h);
    if(anatomy){
      const eye={x:ex,y:et*h,z:anatomy.eyeZ,r:anatomy.eyeRadii[0]};
      eyePigment(head,'curved iris seated on the eyeball',irisX,eyeY,child?.0070:.0056,eye,mat(config.iris),.00012);
      eyePigment(head,'curved pupil seated within the iris',irisX,eyeY,child?.0033:.0031,eye,mat(0x262a28),.00023);
    }else{
      soft(head,'iris with quiet gaze',[irisX,eyeY,eyeDepth+.004],[.0068,irisHeight,.0018],mat(config.iris));
      soft(head,'small pupil',[irisX,eyeY,eyeDepth+.0055],[.0031,Math.min(.0042,irisHeight*.68),.001],mat(0x262a28));
    }
    soft(head,'eye catchlight',[irisX-.0016,eyeY+Math.min(.002,irisHeight*.5),eyeDepth+(anatomy?.004:.0063)],[.001,.001,anatomy?.0002:.0008],mat(0xfff6e2));
    const lid=[];for(let k=0;k<=12;k++){const a=k/12*Math.PI,x=ex+Math.cos(a)*ew,y=et*h+Math.sin(a)*eh;lid.push([x,y,front(x,y/h)+.003]);}
    if(!anatomy)shapedTube(head,'upper lid set into brow',lid,[.001,.0023,.001],mat(skin.clone().multiplyScalar(.78)));
    const brow=[];for(let k=0;k<=8;k++){const x=ex+(k/8-.5)*ew*2,y=et*h+.019+Math.sin(k/8*Math.PI)*.003+(config.expression==='tender'?.003*(1-Math.abs(x)/(Math.abs(ex)+ew)):0);brow.push([x,y,front(x,y/h)+.002]);}
    shapedTube(head,'sculpted expressive eyebrow',brow,[.0007,config.expression==='tender'?.002:config.brow||.0026,.0007],mat(hair.clone().lerp(skin,.16)));
  }
  const mouthWidth=identity==='Oleg'?.061:child?.046:.052;
  const lips=[];for(let k=0;k<=12;k++){const x=(k/12-.5)*mouthWidth,t=.255+(config.expression==='tender'?.003:config.expression==='proud'?.026:.018)*(Math.abs(x)/(mouthWidth/2))**2;lips.push([x,t*h,front(x,t)+.0018]);}
  if(!anatomy)shapedTube(head,'soft closed smile following modeled lips',lips,[.0008,.0018,.0008],mat(0x9f655e));
  // Hair is an open scalp surface conforming to the whole cranium. The face
  // stays clear; grooves vary the surface rather than adding floating ropes.
  if(identity==='Zephrine'){
    const hairRoot=new THREE.Group();head.add(hairRoot);
    zephrineCurlyHair(hairRoot,h,hair,anatomy);
  }
  else if(identity==='Oleg')olegSweptHair(head,h,hair,anatomy);
  else if(config.bob&&anatomy)sculptedBob(head,h,hair,anatomy);
  else {
  const hp=[],hc=[],hi=[],hr=28,hs=64;
  for(let r=0;r<=hr;r++)for(let s=0;s<=hs;s++){
    const a=s/hs*Math.PI*2,forward=Math.sin(a),side=Math.abs(Math.cos(a));
    const low=config.bob||config.curls?.13:config.bun?.46:.27;
    const hairline=lerp(low,.78+(!config.bun?.035*Math.cos(a):0),THREE.MathUtils.smoothstep(forward,-.25,.58));
    const t=lerp(hairline,1,r/hr),radial=1+.027*Math.sin(a*(config.curls?13:7)+t*8);
    const wave=(config.curls?.006:.002)*Math.sin(a*14+t*16);
    const radius=anatomy?.radius(a,t);
    hp.push(Math.cos(a)*((radius??rxAt(t))+.004+wave)*radial,(t*h)+.002,
      Math.sin(a)*((radius??rzAt(t))+.004+wave)-(anatomy?0:.004));
    const col=hair.clone().lerp(new THREE.Color(0xaa7952),.10+.07*Math.sin(a*9+t*5));hc.push(col.r,col.g,col.b);
    if(r<hr&&s<hs){const n=r*(hs+1)+s,b=n+1;hi.push(n,n+hs+1,b,b,n+hs+1,b+hs+1);}
  }
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));hg.setIndex(hi);hg.computeVertexNormals();
  mesh(head,'fitted continuous hair with carved strand relief',hg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide}));
  }
  if(config.bun){
    const bun=soft(head,'gathered sculpted bun',[.008,h+.030,-.025],[.045,.054,.040],mat(config.hair));bun.rotation.x=.25;
    const p=bun.geometry.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),wave=1+.07*Math.sin(a*5+y*84)+.025*Math.sin(a*13-y*109);p.setXYZ(i,x*wave,y,z*wave);}
    bun.geometry.computeVertexNormals();
  }
  if(config.beanie){loft(head,'rib-knit cap fitted to the scalp',[[h*.67,.100,.082],[h*.72,.103,.086],[h*.84,.100,.083],[h*1.01,.067,.057],[h*1.08,.004,.004]],paintedFabric(mat(0x62616b)));}
  if(config.glasses){
    const ink=mat(config.glassesColor||0x34312d);
    for(const sign of [-1,1]){
      const x=sign*(anatomy?.eyeX??.039),et=anatomy?.eyeT??.555,y=et*h,pts=[];
      for(let k=0;k<=40;k++){const a=k/40*Math.PI*2,xx=x+(identity==='Oleg'?.034:.029)*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.45),yy=y+(identity==='Oleg'?.025:.019)*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.45);pts.push([xx,yy,front(xx,yy/h)+.011]);}
      shapedTube(head,'fitted rounded rectangular spectacle rim',pts,[.0018,.0018],ink);
      shapedTube(head,'spectacle temple',[ [sign*.068,y,.064],[sign*.096,y,-.008],[sign*.095,y-.012,-.039] ],[.0018,.0018],ink);
    }
    const et=anatomy?.eyeT??.555;
    shapedTube(head,'spectacle bridge',[[-.011,et*h,front(-.011,et)+.011],[0,et*h+.003,front(0,et)+.011],[.011,et*h,front(.011,et)+.011]],[.0018,.0018],ink);
  }
  root.userData.storyHead=true;root.userData.identity=identity;
  return root;
}
function hand(parent,name,at,from,size,skin,grip=false,side=-1,style='normal',contact=null) {
  const group=new THREE.Group();group.name=name;group.position.fromArray(at);
  const axis=V(at).sub(V(from)).normalize();group.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  if(style==='cup')group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V([-1,0,0]),V([0,0,1]),V([0,1,0])));
  const inverse=group.quaternion.clone().invert();
  const toLocal=p=>V(p).sub(V(at)).applyQuaternion(inverse).toArray();
  const radiusAt=(t,values)=>{const q=t*(values.length-1),i=Math.min(values.length-2,Math.floor(q));return lerp(values[i],values[i+1],q-i)*size;};
  const belowFruit=(x,z,radius)=>{
    const [cx,cy,cz]=contact.center,[rx,ry,rz]=contact.radii;
    const yy=cy-ry*Math.sqrt(Math.max(.0001,1-((x-cx)/rx)**2-((z-cz)/rz)**2));
    const normal=V([(x-cx)/(rx*rx),(yy-cy)/(ry*ry),(z-cz)/(rz*rz)]).normalize();
    return yy-radius/Math.max(.1,Math.abs(normal.y))-.0008;
  };
  soft(group,'formed palm',[0,.014*size,0],[.029*size,.042*size,.015*size],skin);
  for(let i=0;i<4;i++){
    const x=(i-1.5)*.013*size,len=(i===0||i===3?.038:.045)*size;
    let points=[[x,.035*size,0],[x,len+.03*size,grip?.014*size:.004*size],[x,len+.032*size,grip?.032*size:.012*size]];
    if(style==='cup'&&contact){
      const fx=at[0]-x,startZ=at[2]+.035*size;
      const limit=contact.center[2]+contact.radii[2]*Math.sqrt(Math.max(.01,.88-((fx-contact.center[0])/contact.radii[0])**2));
      const endZ=Math.min(at[2]+len+.032*size,limit);
      points=Array.from({length:21},(_,step)=>{const t=step/20,z=lerp(startZ,endZ,t),surface=belowFruit(fx,z,radiusAt(t,[.006,.005,.0035]));return toLocal([fx,lerp(Math.min(at[1],surface),surface,t*t*(3-2*t)),z]);});
    }
    shapedTube(group,'curled modeled finger',points,[.006*size,.005*size,.0035*size],skin);
  }
  // Mirror anatomical thumbs in local coordinates; negative mesh scales would
  // invert winding after batching. Cupped hands keep the thumbs under the fruit.
  const mirror=side<0?1:-1;
  let thumb=[[-.024*size*mirror,.012*size,0],[-.039*size*mirror,.026*size,style==='cup'?0:.012*size],[-.028*size*mirror,.039*size,style==='cup'?0:.02*size]];
  if(style==='cup'&&contact){const curve=new THREE.CatmullRomCurve3(thumb.map(p=>V(p).applyQuaternion(group.quaternion).add(V(at))));thumb=Array.from({length:21},(_,step)=>{const t=step/20,p=curve.getPoint(t),surface=belowFruit(p.x,p.z,radiusAt(t,[.011,.009,.005]));return toLocal([p.x,lerp(Math.min(at[1],surface),surface,t),p.z]);});}
  shapedTube(group,'opposing thumb',thumb,[.011*size,.009*size,.005*size],skin);
  parent.add(group);return group;
}
export function makeStoryPerson(identity,options={}) {
  const config={...(identities[identity]||identities.Tanya),...options};
  const child=config.child??(identity==='Zephrine'||identity==='Charlize'||identity==='Companion'&&options.height<1.35),h=options.height||(child?1.03:1.7);
  const stature=options.stature??(options.seated?(child?1.04:identity==='Oleg'?1.76:identity==='G'?1.62:1.68):h),scale=stature/1.7;
  const person=new THREE.Group();person.name=`${identity}: coherent storybook sculpture`;
  person.userData.storyFigure=true;person.userData.identity=identity;
  const skin=mat(config.skin),clothBase=paintedFabric(mat(options.shirt||0x667e85)),cloth=options.applePrint?applePrintFabric(clothBase):clothBase,pants=paintedFabric(mat(options.pants||0x3c485b)),shoe=mat(options.shoes||0x695747);
  const hh=child?.245:.265,neckY=h-hh-.028,shoulder=neckY-.025;
  const hip=options.seated?(options.hipY??.58):h*(child?.43:.51);
  const leanZ=options.leanZ||0;
  const width=child?.13:identity==='Jane'||identity==='Tanya'||identity==='Aibike'?.175:identity==='G'?.205:.195;
  const torsoRings=options.refinedGarment?[
    [hip-.025,width*.87,.105*scale+.024],[hip+.055,width*.98,.12*scale+.025],
    [lerp(hip,shoulder,.30),width*(child?.95:identity==='G'?.98:.87),.113*scale+.022],
    [lerp(hip,shoulder,.68),width*.99,.12*scale+.025],
    [shoulder-.045,width*1.04,.113*scale+.025],
    [shoulder+.005,width*.70,.080*scale+.018],
    [shoulder+.022,width*.52,.070],
  ]:[
    [hip-.025,width*.85,.105*scale+.025],[hip+.065,width,.12*scale+.025],
    [lerp(hip,shoulder,.59),width*.97,.12*scale+.024],
    [shoulder-.045,width*1.12,.115*scale+.025],
    [shoulder+.005,width*.72,.080*scale+.018],
    [shoulder+.022,width*(options.anatomicalHead?.52:.38),options.anatomicalHead?.070:.047*scale+.010],
  ];
  const torso=loft(person,'continuous tailored torso — ordered waist to shoulder',torsoRings,cloth);torso.userData.solidFootprint=true;
  if(leanZ){const p=torso.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+leanZ*THREE.MathUtils.smoothstep(p.getY(i),hip,shoulder));torso.geometry.computeVertexNormals();}
  const hips=[[-width*(options.hipSpread??.45),hip,0],[width*(options.hipSpread??.45),hip,0]];
  for(let i=0;i<2;i++){
    const sign=i?1:-1,from=hips[i];
    const knee=options.knees?.[i]||(options.seated?[sign*width*.62,hip-.09,.34]:[sign*width*.6,hip*.53,.018]);
    const ankle=options.ankles?.[i]||(options.seated?[sign*width*.65,.10,.43]:[sign*width*.68,.10,(i?.025:0)]);
    const legRadii=child&&options.anatomicalHead?[width*.46,width*.40,width*.27]:[width*.54,width*.48,width*.32];
    const physicalAnkle=options.shoeAnkle?[ankle[0],ankle[1]-.10+.087*stature/1.76,ankle[2]+.005]:ankle;
    shapedTube(person,'continuous clothed thigh knee and shin',[from,knee,physicalAnkle],legRadii,pants,.88).userData.storyPart='trousers';
    if(options.anatomicalHead){
      if(!shoeGeometry.has(sign)){const source=shoeSources[sign],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(source.positions,3));g.setIndex(source.indices);g.computeVertexNormals();shoeGeometry.set(sign,g);}
      const foot=mesh(person,'fitted shoe with modeled toe heel collar and sole',shoeGeometry.get(sign),shoe,[ankle[0],ankle[1]-.10,ankle[2]]);foot.scale.setScalar(stature/1.76);foot.rotation.y=sign*.06;foot.userData.preserveSculptGeometry=true;foot.userData.storyPart='shoe';
      const top=ankle[1]-.10+.087*stature/1.76;
      shapedTube(person,'sewn trouser cuff entering the shoe collar',[[physicalAnkle[0],physicalAnkle[1]+.012,physicalAnkle[2]],[ankle[0],top-.005,ankle[2]+.005]],[width*.30,width*.24],pants,.88).userData.storyPart='trousers';
    }else{
      const foot=soft(person,'formed shoe with toe and fitted heel',[ankle[0],ankle[1]-.043,ankle[2]+.036],[child?.055:.063,.046,child?.093:.116],shoe);foot.rotation.y=sign*.06;
    }
  }
  if(options.dress){
    const bottom=options.seated?hip-.03:hip-.12,waist=hip+.12;
    let skirtMaterial=mat(options.skirt||options.shirt||0xc98f86);
    if(options.stripes){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#30435c';ctx.fillRect(0,0,128,128);ctx.fillStyle='#e6dfcb';for(let x=0;x<128;x+=16)ctx.fillRect(x,0,5,128);ctx.fillRect(0,101,128,5);ctx.fillRect(0,112,128,5);ctx.fillStyle='#bc8394';ctx.fillRect(0,0,128,9);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;skirtMaterial=new THREE.MeshStandardMaterial({map,roughness:.9});}
    const garment=loft(person,'draped cloth skirt attached to fitted waist',[[bottom,width*1.22,.15],[bottom+.035,width*1.2,.147],[waist-.04,width*.93,.123],[waist,width*.84,.115]],skirtMaterial);
    garment.userData.storyPart='skirt';
    const a=garment.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),t=clamp((waist-y)/(waist-bottom),0,1),angle=Math.atan2(a.getZ(i),a.getX(i));a.setX(i,a.getX(i)*(1+.024*t*Math.sin(angle*9)));a.setZ(i,a.getZ(i)*(1+.024*t*Math.sin(angle*9)));if(options.raisedHemSide){const gather=THREE.MathUtils.smoothstep(a.getX(i)*Math.sign(options.raisedHemSide),-.02,.10);a.setY(i,y+.10*gather*t*t);a.setZ(i,a.getZ(i)*(1+.12*gather*t));}}garment.geometry.computeVertexNormals();
  }
  if(!options.anatomicalHead)shapedTube(person,'neck seated into shoulder and jaw',[[0,shoulder,.0],[0,neckY+.018,-.002],[0,h-hh+.035,-.002]],[child?.037:.045,child?.033:.039,.034],skin);
  const head=headSculpt(person,identity,{...config,child});head.position.set(0,h-hh,leanZ);
  if(!head.userData.nativeHeadRig){head.rotation.order=options.headOrder||'XYZ';head.rotation.set(options.headPitch||0,options.headYaw||0,options.headTilt||0);}
  const hands=options.hands||{};
  const sleeves=[];
  for(const sign of [-1,1]){
    const shoulderOffset=options.shoulderOffsets?.[sign]||[0,0,0];
    const start=[sign*width*.62+shoulderOffset[0],shoulder-.065+shoulderOffset[1],leanZ+shoulderOffset[2]];
    const at=hands[sign]||[sign*(width+.07),hip-(options.anatomicalHands?(child?.05:.07):-.02),.045];
    let elbow=options.elbows?.[sign]||[lerp(start[0],at[0],.5)+sign*.035,lerp(start[1],at[1],.52)-.065,lerp(start[2],at[2],.5)+.045];
    const axis=V(at).sub(V(elbow)).normalize();let wrist=V(at).addScaledVector(axis,-.022).toArray();
    if(options.anatomicalHands){
      const hint=[...elbow],bone=[sign*width*.98+shoulderOffset[0],shoulder-.020+shoulderOffset[1],leanZ+shoulderOffset[2]],upper=stature*(child?.17:.175),lower=stature*.15;
      const descriptor={identity,child,height:stature,side:sign,at,material:skin,grip:options.handGrips?.[sign]??options.grip,curl:options.handCurls?.[sign]??options.handCurl??1,thumbTurn:options.thumbTurns?.[sign]??options.thumbTurn??.30,style:options.handStyles?.[sign]||options.handStyle,normal:options.handNormals?.[sign]||(!hands[sign]?[-sign,0,0]:null),direction:options.handAxes?.[sign],contact:options.handPoints?.[sign]};
      for(let pass=0;pass<3;pass++){
        const fitted=anatomicalHand(null,{...descriptor,elbow});
        try{elbow=storyArmElbow(bone,fitted.wrist,hint,upper,lower);}catch(error){throw Error(`${identity} hand ${sign}: ${error.message}`);}
      }
      const fitted=anatomicalHand(person,{...descriptor,elbow});wrist=fitted.wrist;
      if(fitted.pen){
        const tip=V(fitted.pen.tip),direction=V(fitted.pen.direction);
        const shoulder=tip.clone().addScaledVector(direction,-.010),end=tip.clone().addScaledVector(direction,-.11);
        const shaft=shapedTube(person,'pencil pinched between anatomical thumb and index',[shoulder.toArray(),end.toArray()],[fitted.pen.radius*.95,fitted.pen.radius*.95],mat(0x394b58));
        const wood=shapedTube(person,'sharpened pencil tip touching the signup paper',[tip.toArray(),shoulder.toArray()],[.0005,fitted.pen.radius*.95],mat(0xbca07b));
        for(const part of [shaft,wood]){part.userData.storyPart='writing-pen';part.userData.preserveSculptGeometry=true;}
      }
    }
    if(options.sculptedCloth)sleeves.push({start:[sign*width*.80+shoulderOffset[0],shoulder-(options.anatomicalHands?.050:.065)+shoulderOffset[1],leanZ+shoulderOffset[2]],elbow,wrist,radii:options.armRadii?.[sign]||[width*(options.refinedGarment?.31:.39),width*(options.refinedGarment?.24:.33),width*(options.anatomicalHands?.125:.23)]});
    else shapedTube(person,'shaped sleeve shoulder elbow and cuff',[start,[sign*width*1.03,shoulder-.065,.005],elbow,wrist],[width*.25,width*.45,width*.34,width*.23],cloth,.88);
    if(!options.anatomicalHands)hand(person,'palm and fingers meeting action',at,elbow,child?.67:.88,skin,options.grip,sign,options.handStyle,options.handContact);
  }
  if(options.sculptedCloth){
    person.add(sculptedShirt(torsoRings,sleeves,cloth,{leanZ,hip,shoulder,rounded:options.refinedGarment}));
    const mid=(torsoRings[0][0]+torsoRings.at(-1)[0])/2;
    torso.geometry.translate(0,-mid,0).scale(.94,.94,.94).translate(0,mid,0);
  }
  if(options.vest){
    const vest=loft(person,'fitted quilted vest following torso',torsoRings.map(([y,x,z])=>[y,x*1.07,z+.008]),paintedFabric(mat(options.vest)));vest.userData.storyPart='vest';
    const surface=sculptSurface(vest.geometry),zip=[];
    for(let i=0;i<=20;i++){const y=lerp(hip+.003,shoulder+.010,i/20),hit=surface(new THREE.Vector3(0,y,.5),new THREE.Vector3(0,0,-1));if(hit)zip.push([0,y,hit.z+.0012]);}
    shapedTube(person,'vest zipper stitched to garment',zip,[.0012,.0012],mat(0xc9bca0));
  }
  if(options.apron)loft(person,'tailored cloth apron',[[hip-.05,width*.8,.153],[hip+.06,width*.78,.154],[shoulder-.14,width*.55,.148]],mat(0xc7b59a));
  if(!options.carried)addContactShadow(person,h);
  // Static character meshes batch by material to keep mobile draw calls low.
  person.updateMatrixWorld(true);
  const batches=new Map();person.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh||m.userData.solidFootprint||m.userData.preserveSculptGeometry)return;const key=m.material.uuid;const list=batches.get(key)||[];list.push(m);batches.set(key,list);});
  for(const list of batches.values())if(list.length>1){const geometries=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const combined=mergeGeometries(geometries.map(g=>{const x=g.index?g.toNonIndexed():g;for(const key of Object.keys(x.attributes))if(!['position','normal','color','uv'].includes(key))x.deleteAttribute(key);if(!x.attributes.uv)x.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(x.attributes.position.count*2),2));if(!x.attributes.color){const c=new Float32Array(x.attributes.position.count*3).fill(1);x.setAttribute('color',new THREE.BufferAttribute(c,3));}return x;}));if(combined){for(const m of list)m.parent.remove(m);const material=list[0].material.clone();material.vertexColors=true;const packed=mesh(person,'batched dimensional sculpture detail',combined,material);const parts=[...new Set(list.map(m=>m.userData.storyPart).filter(Boolean))];if(parts.length===1)packed.userData.storyPart=parts[0];}}
  return person;
}

export function replaceStoryFigures(root,roomId) {
  const wrappers=[];
  root.traverse(o=>{if(!o.isGroup||o===root)return;
    if(/^(solid sculpted figure of |fully sculpted figure of |three-dimensional portrait of )/.test(o.name)||
      /^(Jane — sculpted|Zephrine — sculpted|Zephrine enthusiastically steering|fully clothed sculpted Jane nursing)/.test(o.name))wrappers.push(o);
  });
  for(const wrapper of wrappers){
    const name=wrapper.name;
    const id=/Zephrine/.test(name)?'Zephrine':/Charlize/.test(name)?'Charlize':/Aibike/.test(name)?'Aibike':/Jane/.test(name)&&!/^fully sculpted figure of Oleg/.test(name)?'Jane':/Oleg/.test(name)?'Oleg':/\bG (helping|sharing)/.test(name)?'G':/Matt/.test(name)?'Matt':/Tanya/.test(name)?'Tanya':'Companion';
    // Identity comes from the leading subject, not a partner named in the pose.
    const subject=name.replace(/^(solid sculpted figure of |fully sculpted figure of |three-dimensional portrait of |fully clothed sculpted )/,'');
    const identity=['Jane','Oleg','Zephrine','Charlize','Aibike','Matt','Tanya'].find(n=>subject.startsWith(n))||(subject.startsWith('G ')?'G':'Companion');
    const child=identity==='Zephrine'||identity==='Charlize'||/child/.test(subject);
    let opts={sculptedCloth:true,refinedGarment:true,anatomicalHead:true,anatomicalHands:true,height:child?1.04:identity==='Oleg'?1.76:identity==='G'?1.62:1.68,
      child,shirt:identity==='Jane'?0x576f7e:identity==='Oleg'?0xdccdb7:child?0xc78f86:0xb8a88c,
      pants:0x414b5b,dress:child&&identity!=='Companion',skirt:0xc98f91};
    if(identity==='Companion')opts={...opts,skin:/yellow glasses/.test(name)?0xb58667:0xb68e73,hair:0x49382e,glasses:/glasses/.test(name),glassesColor:/yellow/.test(name)?0xcda65a:0x34312d,beard:/beard/.test(name),bob:false};
    let pos=null,yaw=null;
    if(roomId==='01'){
      if(identity==='Jane'){opts={...opts,height:SIGNUP_SEATED_HEIGHT,seated:true,hipY:.53,knees:[[-.11,.53,.30],[.11,.53,.30]],ankles:[[-.11,.1355,.43],[.11,.1355,.43]],shirt:0x34485c,hands:{'-1':[-.18,.80,.45],'1':[.18,.845,.44]},handStyles:{'1':'write'},handNormals:{'-1':[0,-1,0],'1':[0,-1,0]},handPoints:{'-1':{plane:SIGNUP_REST_PLANE},'1':{paper:SIGNUP_PAPER_POINT}},headPitch:.45,gazeY:-.002};pos=[-.47,0,.05];}
      else{opts={...opts,height:1.02,shirt:0xb48049,pants:0xb48049,dress:false,knees:[[-.07,.25,.02],[.16,.29,-.10]],ankles:[[-.08,.10,.03],[.16,.15,-.06]],hands:{'-1':[-.36,.91,.04],'1':[.36,.83,.10]},headTilt:-.06,expression:'joy'};}
    }
    if(roomId==='02'){
      if(identity==='Oleg'&&/job-search desk/.test(name)){opts={...opts,hands:{'-1':[-.18,.98,.39],'1':[.18,1.0,.39]},handStyles:{'1':'write'},handNormals:{'-1':[0,-1,0],'1':[0,-1,0]},handPoints:{'-1':{plane:{point:[0,.954,0],normal:[0,1,0]}},'1':{paper:[.12,.954,.43]}},headPitch:.55,gazeY:-.002,...DESK_ADVICE_ACTORS.Oleg.options};pos=DESK_ADVICE_ACTORS.Oleg.position;yaw=DESK_ADVICE_ACTORS.Oleg.yaw;}
      if(/advising/.test(name)){const advice=DESK_ADVICE_ACTORS.Jane;opts={...opts,...advice.options};pos=advice.position;yaw=advice.yaw;}
      if(/household/.test(name)||/keeping the household/.test(name)){opts={...opts,apron:true,refinedGarment:true,hands:{'1':[.16,1.032,.452],'-1':[-.07,.991,.43]},handGrips:{'1':true,'-1':false},handCurls:{'1':.6},thumbTurns:{'1':-.3},handAxes:{'1':[0,0,1]},handNormals:{'1':[0,-1,0],'-1':[0,-1,0]},handPoints:{'-1':{plane:{point:[0,.966,0],normal:[0,1,0]}}},headPitch:.40};pos=[-4.16,0,-4.50];yaw=Math.PI;}
      if(/caring/.test(name)||child&&/with Jane/.test(name)){const a=CARING_ACTORS[identity];opts={...opts,...a.options};pos=a.position;yaw=a.yaw;}
      if(/holding Oleg/.test(name)){opts={...opts,refinedGarment:true,hands:{'-1':[-.23,.91,.06],'1':[.46,1.10,-.13]},handNormals:{'1':[0,0,-1]},handAxes:{'1':[1,0,0]},handPoints:{'1':{plane:{point:[0,0,-.1408],normal:[0,0,1]}}},elbows:{'1':[.27,1.09,.25]},headYaw:.90,headTilt:-.14,expression:'tender'};pos=[-.28,0,-5.65];yaw=0;}
      if(/embrace/.test(name)){opts={...opts,refinedGarment:true,hands:{'-1':[-.67,1.37,.24]},handNormals:{'-1':[1,0,0]},handAxes:{'-1':[0,-1,0]},handPoints:{'-1':{plane:{point:[-.6373,0,0],normal:[-1,0,0]}}},elbows:{'-1':[-.25,1.85,-.05]},headYaw:-1.15,headPitch:.10,headTilt:.10,expression:'tender'};pos=[.17,0,-5.93];yaw=0;}
      if(/contacts/.test(name)){opts={...opts,hands:{'1':[.37,1.1,.20]},handNormals:{'1':[0,1,0]},handAxes:{'1':[0,0,1]},headYaw:.40};yaw=1.15;}
      if(identity==='Companion'){
        const first=wrapper.position.z<2;opts={...opts,height:first?1.75:1.60,anatomySource:first?'sam':'maya',shirt:first?0xab806a:0x7f9ba7,beard:first,bob:!first,hands:first?{'-1':[-.25,1.17,.23]}:{'-1':[-.22,1.12,.22]},handNormals:{'-1':[0,1,0]},handAxes:{'-1':[0,0,1]},headYaw:first?-.12:-.30};yaw=first?-1.02:-1.65;
      }
    }
    if(roomId==='03'){
      if(child){const charlize=identity==='Charlize';opts={...opts,height:charlize?1.08:1.04,shirt:charlize?0x354761:0xd49a83,skirt:charlize?0x354761:0xc98e9b,stripes:charlize,headTilt:charlize?.07:-.07,headYaw:charlize?-1.15:1.15,headOrder:'YXZ',hands:charlize?{'-1':[-.40,.63,.15],'1':[.24,.53,.09]}:{'1':[.40,.63,.15],'-1':[-.24,.53,.09]},ankles:charlize?[[-.09,.10,.08],[.09,.10,-.08]]:[[-.09,.10,-.08],[.09,.10,.08]],grip:true};const hold=friendshipGrip(identity);opts={...opts,...hold.options,hands:{...opts.hands,[charlize?-1:1]:hold.point}};yaw=charlize?-.15:.15;}
      else {opts={...opts,headYaw:identity==='Jane'?.65:-.65,hands:identity==='Jane'?{'1':[.33,1.04,.24]}:{'-1':[-.32,1.06,.23]}};pos=[identity==='Jane'?-1.1:1.1,0,identity==='Jane'?2.45:2.30];yaw=identity==='Jane'?.65:-.65;}
    }
    if(roomId==='04'){const arrangement=BLUE_CAR_ACTORS[identity];opts={...opts,...arrangement.options};pos=arrangement.position;yaw=arrangement.yaw;}
    if(roomId==='05'){
      if(identity==='Jane')opts={...opts,shirt:0x4e7d7a,hands:{'-1':[-.29,.93,.12],'1':[.42,1.18,.15]},handGrips:{'-1':true,'1':false},handCurls:{'-1':.4},thumbTurns:{'-1':0},handNormals:{'-1':[-1,0,0]},handAxes:{'-1':[0,-1,0]},headPitch:-.06,headYaw:.12,expression:'proud',ankles:[[-.13,.10,.14],[.14,.10,-.06]]};
      if(child){pos=[-.54,0,4.91];yaw=0;opts={...opts,hands:{'1':[.215,.875,.272]},handGrips:{'1':true,'-1':false},handCurls:{'1':.6},thumbTurns:{'1':0},handNormals:{'1':[1,0,0]},handAxes:{'1':[0,1,0]},headYaw:1.1,headPitch:-.45,gazeY:.003};}
      if(identity==='Oleg'){pos=[-1.08,0,4.35];yaw=.25;opts={...opts,hands:{'1':[.32,1.05,.18]},handNormals:{'1':[0,1,0]},handAxes:{'1':[0,0,1]},headYaw:.70,headPitch:.15,expression:'proud'};}
    }
    if(roomId==='06'){
      const arrangement=WEANING_ACTORS[identity];opts={...opts,...arrangement.options};pos=arrangement.position;yaw=arrangement.yaw;
    }
    if(roomId==='07'){
      const arrangement=BLUEBERRY_ACTORS[identity];
      opts={...opts,...arrangement.options,sculptedCloth:true,anatomicalHead:true,anatomicalHands:true};
      pos=arrangement.position;yaw=arrangement.yaw;
    }
    if(roomId==='08'){const jane=identity==='Jane';pos=jane?[-.15,0,8.0]:[.65,0,7.1];yaw=jane?-1.14:-1.0;opts={...opts,shirt:jane?0xa97970:0x657d88,headYaw:jane?-.72:-.60,headPitch:jane?-.42:-.22,headOrder:'YXZ',expression:'proud',ankles:jane?[[-.11,.10,.13],[.11,.10,-.10]]:[[-.12,.10,-.09],[.12,.10,.12]]};}
    if(roomId==='09'){
      if(identity==='Zephrine')opts={...opts,height:1.04,shirt:0xe1cbb0,pants:0xc6b798,applePrint:true,dress:false,vest:0x4a8181,hands:{'-1':[-.035,.598,.29],'1':[.035,.598,.29]},elbows:{'-1':[-.16,.55,.10],'1':[.16,.55,.10]},handStyle:'cup',handNormals:{'-1':[0,1,0],'1':[0,1,0]},grip:true,headPitch:.65,gazeY:-.0028};
      else {opts={...opts,shirt:identity==='Jane'?0x617c81:identity==='Matt'?0xae7773:identity==='Oleg'?0x455b72:0xb8a88d,headYaw:wrapper.position.x>0?-.55:.55};if(identity==='Jane'){pos=[-.50,0,2.80];opts={...opts,height:1.54,stature:1.68,leanZ:.035,knees:[[-.105,.39,.16],[.105,.39,.16]],hands:{'1':[.43,.70,.136]},handNormals:{'1':[0,0,1]},handAxes:{'1':[.15,-.988,0]},handPoints:{'1':{plane:{point:[0,0,.14487],normal:[0,0,-1]}}},elbows:{'1':[.32,.99,.05]},headYaw:1.05,headPitch:.55,headOrder:'YXZ',gazeY:-.0028};}if(identity==='Oleg'){pos=[.92,0,2.40];opts={...opts,hands:{'-1':[-.40,1.0,.26]},handNormals:{'-1':[0,1,0]},handAxes:{'-1':[0,0,1]},headYaw:-.95,headPitch:.30,headOrder:'YXZ',gazeY:-.0022};}if(identity==='Matt'){pos=[-2.4,0,.8];opts.hands={'1':[.35,.95,.25]};}if(identity==='Tanya')pos=[2.3,0,.85];if(identity==='Companion'&&child)pos=[wrapper.position.x<0?-1.86:1.8,0,wrapper.position.x<0?1.5:1.4];yaw=0;}
    }
    if(roomId==='10'){
      if(child){opts={...opts,height:identity==='Zephrine'?1.04:wrapper.position.x<0?1.13:1.19,dress:identity==='Zephrine'||wrapper.position.x<0,skirt:identity==='Zephrine'?0xc98f91:0xbe9b62,shirt:identity==='Zephrine'?0xe1cbb2:wrapper.position.x<0?0xa185a4:0x5d8091,hands:identity==='Zephrine'?{'-1':[-.42,.64,-.16],'1':[.42,.64,-.18]}:wrapper.position.x<0?{'1':[.40,.64,.20],'-1':[-.26,.66,.06]}:{'-1':[-.35,.64,.24],'1':[.26,.68,.08]},headYaw:identity==='Zephrine'?0:wrapper.position.x>0?-.85:.85,headPitch:identity==='Zephrine'?.40:.18,headOrder:'YXZ',grip:true};pos=identity==='Zephrine'?[-.23,.0585,4.37]:wrapper.position.x<0?[-1.05,.0585,4.0]:[.50,.0585,4.01];yaw=0;if(identity!=='Zephrine')opts.handGrips=wrapper.position.x<0?{'-1':false,'1':true}:{'-1':true,'1':false};if(identity==='Zephrine'){opts.raisedHemSide=1;opts.knees=[[-.08,.24,.018],[.13,.36,-.10]];opts.ankles=[[-.09,.10,.01],[.14,.25,-.06]];}}
      else {opts={...opts,headPitch:.16,headOrder:'YXZ'};if(identity==='Jane'){pos=[-2.65,0,2.9];yaw=.7;opts.headYaw=.45;}if(identity==='Oleg'){pos=[2.65,0,3.0];yaw=-.8;opts.headYaw=-.4;}if(/yellow glasses/.test(name)){opts={...opts,shirt:0xaa7885,pants:0x4e6e60,headYaw:.35};pos=[-1.65,0,2.25];yaw=.25;}if(/knit cap/.test(name)){opts={...opts,shirt:0x4d5d6b,pants:0x354752,beanie:true,headYaw:-.38};pos=[1.65,0,2.05];yaw=-.3;}}
      if(child){opts.expression='joy';const grips=playgroundGrips(identity==='Zephrine'?'Zephrine':wrapper.position.x<0?'left':'right',pos);opts={...opts,...grips,hands:{...opts.hands,...grips.hands}};}
    }
    if(roomId==='11'){
      if(identity==='G'){opts={...opts,shirt:0xc5b99e,hands:{'-1':[-.31,.91,.17],'1':[.30,1.35,.15]},headYaw:.65,headPitch:-.35};yaw=.90;}
      if(child){opts={...opts,shirt:0xb88798,skirt:0xd7c6aa,hands:{'1':[.37,.89,.18],'-1':[-.17,.63,.16]},headYaw:.70,headPitch:-.50};yaw=.90;}
      if(identity==='Jane'||identity==='Oleg')opts={...opts,headYaw:.4};
      if(identity==='G'||child){const attention=aquariumAttention(identity);opts={...opts,...attention.options};yaw=attention.yaw;pos=attention.position;}
    }
    const props=roomId==='02'?wrapper.children.filter(o=>/satchel|blanket/.test(o.name)):[];
    wrapper.clear();wrapper.scale.setScalar(1);wrapper.rotation.z=roomId==='06'?(WEANING_ACTORS[identity].roll||0):0;
    if(pos)wrapper.position.fromArray(pos);if(yaw!==null)wrapper.rotation.y=yaw;
    let model;try{model=makeStoryPerson(identity,opts);}catch(error){throw Error(`Room ${roomId}, ${name}: ${error.message}`);}wrapper.add(model);for(const prop of props)wrapper.add(prop);
    wrapper.userData.storyIdentity=identity;
    // The fitted body and actual joined sleeves carry collision bounds.
    // Visitors cannot pass between two bodies through their linked arms.
    wrapper.userData.solidFootprint=false;
    if(roomId==='04'&&identity==='Zephrine'){
      shapedTube(wrapper,'fastened seat belt across the occupied molded seat',[[-.12,.245,-.01],[-.12,.36,.045],[0,.355,.105],[.12,.36,.045],[.12,.245,-.01]],[.010,.010],mat(0x39495a),.35);
    }
    if(roomId==='09'&&identity==='Zephrine'){
      const apple=bittenApple();apple.position.set(0,.65,.275);wrapper.add(apple);
      shapedTube(wrapper,'short apple stem rooted in its crown',[[-.005,.702,.268],[-.004,.712,.266],[-.002,.716,.269]],[.002,.0014],mat(0x715c3c));
    }
  }
  return wrappers.length;
}
