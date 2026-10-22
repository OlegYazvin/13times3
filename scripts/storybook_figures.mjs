import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addContactShadow } from './stage_shadows.mjs';
import {paintedFabric} from './painted_fabric.mjs';

// Original, geometry-first character sculpts. No photographs, portrait atlases,
// generated face paintings, or face-depth maps enter this module or its export.
const V = a => new THREE.Vector3(...a);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const materialCache = new Map();
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
export function shapedTube(parent,name,points,radii,material,flatten=1) {
  const path=new THREE.CatmullRomCurve3(points.map(V));
  const rows=24,sides=16,frames=path.computeFrenetFrames(rows,false),p=[],idx=[];
  for(let r=0;r<=rows;r++) {
    const t=r/rows,center=path.getPoint(t),band=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(band));
    const radius=lerp(radii[a],radii[a+1],band-a);
    for(let s=0;s<sides;s++) {
      const angle=s/sides*Math.PI*2;
      const v=center.clone().addScaledVector(frames.normals[r],Math.cos(angle)*radius)
        .addScaledVector(frames.binormals[r],Math.sin(angle)*radius*flatten);
      p.push(v.x,v.y,v.z);
      if(r<rows){const n=r*sides+s,b=r*sides+(s+1)%sides;idx.push(n,b,n+sides,b,b+sides,n+sides);}
    }
  }
  for(let s=1;s<sides-1;s++){idx.push(0,s+1,s);const b=rows*sides;idx.push(b,b+s,b+s+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
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
  Jane:{skin:0xd6a58d,hair:0x322b2c,iris:0x4c463c,bun:true,jaw:.74,brow:.006},
  Oleg:{skin:0xd8ad96,hair:0x544235,iris:0x617466,glasses:true,beard:true,jaw:.97,brow:.0045},
  Zephrine:{skin:0xefc3a5,hair:0x80593e,iris:0x647f8b,child:true,curls:true,jaw:.83},
  Charlize:{skin:0x9a694c,hair:0x302826,iris:0x423225,child:true,bun:true,jaw:.83},
  G:{skin:0xd1a184,hair:0x6b4e3e,iris:0x637059,bob:true,jaw:.90},
  Aibike:{skin:0xac795c,hair:0x332c2b,iris:0x3e332c,bob:true,jaw:.83},
  Matt:{skin:0xd5a58b,hair:0x765b43,iris:0x61716d,glasses:true,beard:true,jaw:.95},
  Tanya:{skin:0xdcb698,hair:0x6b4936,iris:0x4f6250,bob:true,glasses:true,jaw:.86},
};
// Zephrine's private portrait and full-body references show abundant loose
// curls: a broad side/back silhouette down to the nape and a swept fringe.
// The continuous volume supplies density; a few broad attached locks describe
// the curl direction without building a cage of separate thin strands.
function zephrineCurlyHair(head,h,hair){
  const rows=88,sides=192,p=[],colors=[],indices=[];
  const lowAt=a=>lerp(-.025+.009*Math.sin(a*11+.4)+.004*Math.sin(a*17),h*(.75+.035*Math.sin(a*2+.7))+.004*Math.sin(a*9),THREE.MathUtils.smoothstep(Math.sin(a),.19,.72));
  for(let r=0;r<=rows;r++)for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2,v=r/rows,low=lowAt(a),y=lerp(low,h+.019,v);
    const dome=Math.sqrt(Math.max(0,1-((Math.max(y,.025)-.114)/(h+.019-.114))**2));
    const crown=THREE.MathUtils.smoothstep(y,.17,h+.019),front=THREE.MathUtils.smoothstep(Math.sin(a),.1,.8);
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
    p.push(ox*(1-.13*t),oy+.013*t+.004*Math.sin(t*Math.PI),(oz+.008)*(1-.13*t)-.008);
    const c=hair.clone().multiplyScalar(.94-.06*t);colors.push(c.r,c.g,c.b);
    if(k<sides){const prev=ring===1?0:(rows+1+ring-2)*(sides+1),next=(rows+1+ring-1)*(sides+1);indices.push(prev+k,prev+k+1,next+k,prev+k+1,next+k+1,next+k);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  mesh(head,'Zephrine: full sculpted curls around crown sides and nape',g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,side:THREE.DoubleSide}));
  // A few small ends turn out of the dense connected body. These are short
  // curls with attached roots, not long separated tubes substituting for hair.
  // Dense curls sit in front of the ears as in the portrait, closing the
  // temple gap with rounded volume rather than flat side-head panels.
  for(const sign of [-1,1]){
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

function headSculpt(parent,identity,options={}) {
  const config={...(identities[identity]||identities.Tanya),...options};
  const head=new THREE.Group();head.name=`${identity}: dimensional face, cranium and fitted hair`;parent.add(head);
  const child=config.child,h=child?.245:.265,w=identity==='Oleg'?.105:identity==='G'?.102:child?.097:.095,jaw=config.jaw||.85;
  const skin=new THREE.Color(config.skin),hair=new THREE.Color(config.hair);
  const rxAt=t=>Math.max(.002,w*(.52+.48*Math.sin(Math.PI*clamp(t*.86+.07,0,1)))*lerp(jaw,1,clamp(t*3,0,1))*(t>.82?Math.sqrt(Math.max(.0004,1-((t-.82)/.18)**2)):1));
  const rzAt=t=>Math.max(.002,.079*Math.pow(Math.sin(Math.PI*clamp(t*.89+.055,.01,.99)),.45)*(t>.85?Math.sqrt(Math.max(.0004,1-((t-.85)/.15)**2)):1));
  const bump=(x,t)=>{
    const gauss=(xx,yy,sx,sy)=>Math.exp(-(((x-xx)/sx)**2+((t-yy)/sy)**2));
    return (child?.72:identity==='Jane'?.91:1)*.028*gauss(0,.45,.020,.15)+.019*gauss(0,.35,.027,.045)
      +.008*(gauss(-.046,.39,.025,.11)+gauss(.046,.39,.025,.11))
      +.004*gauss(0,.25,.038,.045)-.003*(gauss(-.042,.56,.027,.06)+gauss(.042,.56,.027,.06));
  };
  const front=(x,t)=>Math.sqrt(Math.max(.02,1-(x/rxAt(t))**2))*rzAt(t)+bump(x,t);
  const rows=48,sides=64,p=[],colors=[],idx=[];
  for(let r=0;r<=rows;r++)for(let s=0;s<sides;s++){
    const t=r/rows,a=s/sides*Math.PI*2,forward=Math.sin(a),x=Math.cos(a)*rxAt(t);
    const cap=Math.pow(Math.sin(Math.PI*clamp(t,.002,.998)),.13);
    const z=forward*rzAt(t)+(forward>0?bump(x,t)*Math.pow(forward,8):0);
    p.push(x*cap,t*h,z*cap);
    const cheek=Math.exp(-(((Math.abs(x)-.052)/.03)**2+((t-.37)/.12)**2))*Math.max(0,forward);
    const c=skin.clone().lerp(new THREE.Color(0xd58279),cheek*.13);
    if(config.beard){const beard=THREE.MathUtils.smoothstep(.38-t,0,.12)*Math.max(0,forward+.25);c.lerp(hair,Math.min(.53,beard)*( .86+.14*Math.sin(a*34+t*93)));}
    colors.push(c.r,c.g,c.b);
    if(r<rows){const n=r*sides+s,b=r*sides+(s+1)%sides;idx.push(n,n+sides,b,b,n+sides,b+sides);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
  mesh(head,`${identity}: continuous modeled brow cheeks nose mouth jaw`,g,
    new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83}));
  for(const sign of [-1,1]) {
    soft(head,'formed ear with helix',[sign*w*.98,h*.45,-.009],[.017,.028,.018],mat(config.skin));
    soft(head,'recessed ear concha',[sign*w*1.10,h*.45,.002],[.005,.013,.006],mat(skin.clone().multiplyScalar(.8)));
    // The eye is a curved almond patch, seated in a modeled socket, not a
    // projecting eyeball. Lid rims meet the skin along its entire contour.
    const ex=sign*.039,et=.555,ew=child?.022:.020,eh=config.expression==='tender'?.0045:.0065;
    const eyeP=[ex,et*h,front(ex,et)+.0025],ep=[...eyeP],ei=[];
    for(let k=0;k<=32;k++){
      const a=k/32*Math.PI*2,x=ex+Math.cos(a)*ew,y=et*h+Math.sin(a)*eh*Math.pow(Math.abs(Math.sin(a)),.3);
      ep.push(x,y,front(x,y/h)+.0025);if(k)ei.push(0,k,k+1);
    }
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(ep,3));eg.setIndex(ei);eg.computeVertexNormals();mesh(head,'almond eye seated beneath eyelids',eg,mat(0xe5dccc));
    const gaze=clamp(config.gazeY||0,-eh+.002,eh-.002),eyeY=et*h+gaze;
    const irisHeight=Math.min(.0063,eh-Math.abs(gaze)-.0004),eyeDepth=front(ex,eyeY/h);
    soft(head,'iris with quiet gaze',[ex,eyeY,eyeDepth+.004],[.0068,irisHeight,.0018],mat(config.iris));
    soft(head,'small pupil',[ex,eyeY,eyeDepth+.0055],[.0033,Math.min(.0042,irisHeight*.68),.001],mat(0x262a28));
    soft(head,'eye catchlight',[ex-.002,eyeY+Math.min(.002,irisHeight*.5),eyeDepth+.0063],[.0013,.0013,.0008],mat(0xfff6e2));
    const lid=[];for(let k=0;k<=12;k++){const a=k/12*Math.PI,x=ex+Math.cos(a)*ew,y=et*h+Math.sin(a)*eh;lid.push([x,y,front(x,y/h)+.003]);}
    shapedTube(head,'upper lid set into brow',lid,[.001,.0023,.001],mat(skin.clone().multiplyScalar(.78)));
    const brow=[];for(let k=0;k<=8;k++){const x=ex+(k/8-.5)*ew*2,y=et*h+.019+Math.sin(k/8*Math.PI)*.003;brow.push([x,y,front(x,y/h)+.002]);}
    shapedTube(head,'sculpted expressive eyebrow',brow,[.0008,config.brow||.003,.001],mat(config.hair));
  }
  const lips=[];for(let k=0;k<=12;k++){const x=(k/12-.5)*.043,t=.255+(config.expression==='tender'?.003:config.expression==='proud'?.026:.018)*(Math.abs(x)/.022)**2;lips.push([x,t*h,front(x,t)+.0018]);}
  shapedTube(head,'soft closed smile following modeled lips',lips,[.0008,.0018,.0008],mat(0x9f655e));
  // Hair is an open scalp surface conforming to the whole cranium. The face
  // stays clear; grooves vary the surface rather than adding floating ropes.
  if(identity==='Zephrine')zephrineCurlyHair(head,h,hair);
  else {
  const hp=[],hc=[],hi=[],hr=28,hs=64;
  for(let r=0;r<=hr;r++)for(let s=0;s<=hs;s++){
    const a=s/hs*Math.PI*2,forward=Math.sin(a),side=Math.abs(Math.cos(a));
    const low=config.bob||config.curls?.13:config.bun?.46:.27;
    const hairline=lerp(low,.78+(!config.bun?.035*Math.cos(a):0),THREE.MathUtils.smoothstep(forward,-.25,.58));
    const t=lerp(hairline,1,r/hr),radial=1+.027*Math.sin(a*(config.curls?13:7)+t*8);
    const wave=(config.curls?.006:.002)*Math.sin(a*14+t*16);
    hp.push(Math.cos(a)*(rxAt(t)+.004+wave)*radial,(t*h)+.002,
      Math.sin(a)*(rzAt(t)+.004+wave)-.004);
    const col=hair.clone().lerp(new THREE.Color(0xaa7952),.10+.07*Math.sin(a*9+t*5));hc.push(col.r,col.g,col.b);
    if(r<hr&&s<hs){const n=r*(hs+1)+s,b=n+1;hi.push(n,n+hs+1,b,b,n+hs+1,b+hs+2);}
  }
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));hg.setIndex(hi);hg.computeVertexNormals();
  mesh(head,'fitted continuous hair with carved strand relief',hg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide}));
  }
  if(config.bun){const bun=soft(head,'gathered sculpted bun',[0,h+.018,-.035],[.037,.038,.034],mat(config.hair));bun.rotation.x=.25;}
  if(config.beanie){loft(head,'rib-knit cap fitted to the scalp',[[h*.67,.100,.082],[h*.72,.103,.086],[h*.84,.100,.083],[h*1.01,.067,.057],[h*1.08,.004,.004]],paintedFabric(mat(0x62616b)));}
  if(config.glasses){
    const ink=mat(config.glassesColor||0x34312d);
    for(const sign of [-1,1]){
      const x=sign*.039,y=.555*h,pts=[];
      for(let k=0;k<=40;k++){const a=k/40*Math.PI*2,xx=x+.029*Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.45),yy=y+.019*Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.45);pts.push([xx,yy,front(xx,yy/h)+.011]);}
      shapedTube(head,'fitted rounded rectangular spectacle rim',pts,[.0018,.0018],ink);
      shapedTube(head,'spectacle temple',[ [sign*.068,y,.064],[sign*.096,y,-.008],[sign*.095,y-.012,-.039] ],[.0018,.0018],ink);
    }
    shapedTube(head,'spectacle bridge',[[-.011,.555*h,.091],[0,.555*h+.003,.098],[.011,.555*h,.091]],[.0018,.0018],ink);
  }
  head.userData.storyHead=true;head.userData.identity=identity;
  return head;
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
  const child=config.child||options.height<1.35,h=options.height||(child?1.03:1.7),scale=h/1.7;
  const person=new THREE.Group();person.name=`${identity}: coherent storybook sculpture`;
  person.userData.storyFigure=true;person.userData.identity=identity;
  const skin=mat(config.skin),clothBase=paintedFabric(mat(options.shirt||0x667e85)),cloth=options.applePrint?applePrintFabric(clothBase):clothBase,pants=paintedFabric(mat(options.pants||0x3c485b)),shoe=mat(options.shoes||0x695747);
  const hh=child?.245:.265,neckY=h-hh-.028,shoulder=neckY-.025;
  const hip=options.seated?(options.hipY??.58):h*(child?.43:.51);
  const width=child?.13:identity==='Jane'||identity==='Tanya'||identity==='Aibike'?.175:identity==='G'?.205:.195;
  const torso=loft(person,'continuous tailored torso — ordered waist to shoulder',[
    [hip-.025,width*.85,.105*scale+.025],[hip+.065,width,.12*scale+.025],
    [lerp(hip,shoulder,.59),width*.97,.12*scale+.024],
    [shoulder-.045,width*1.12,.115*scale+.025],
    [shoulder+.022,width*.73,.080*scale+.018],
  ],cloth);torso.userData.solidFootprint=true;
  const hips=[[-width*.45,hip,0],[width*.45,hip,0]];
  for(let i=0;i<2;i++){
    const sign=i?1:-1,from=hips[i];
    const knee=options.knees?.[i]||(options.seated?[sign*width*.62,hip-.09,.34]:[sign*width*.6,hip*.53,.018]);
    const ankle=options.ankles?.[i]||(options.seated?[sign*width*.65,.10,.43]:[sign*width*.68,.10,(i?.025:0)]);
    shapedTube(person,'continuous clothed thigh knee and shin',[from,knee,ankle],[width*.54,width*.48,width*.32],pants,.88);
    const foot=soft(person,'formed shoe with toe and fitted heel',[ankle[0],ankle[1]-.043,ankle[2]+.036],[child?.055:.063,.046,child?.093:.116],shoe);
    foot.rotation.y=sign*.06;
  }
  if(options.dress){
    const bottom=options.seated?hip-.03:hip-.12,waist=hip+.12;
    let skirtMaterial=mat(options.skirt||options.shirt||0xc98f86);
    if(options.stripes){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#30435c';ctx.fillRect(0,0,128,128);ctx.fillStyle='#e6dfcb';for(let x=0;x<128;x+=16)ctx.fillRect(x,0,5,128);ctx.fillRect(0,101,128,5);ctx.fillRect(0,112,128,5);ctx.fillStyle='#bc8394';ctx.fillRect(0,0,128,9);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;skirtMaterial=new THREE.MeshStandardMaterial({map,roughness:.9});}
    const garment=loft(person,'draped cloth skirt attached to fitted waist',[[bottom,width*1.22,.15],[bottom+.035,width*1.2,.147],[waist-.04,width*.93,.123],[waist,width*.84,.115]],skirtMaterial);
    const a=garment.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i),t=clamp((waist-y)/(waist-bottom),0,1),angle=Math.atan2(a.getZ(i),a.getX(i));a.setX(i,a.getX(i)*(1+.024*t*Math.sin(angle*9)));a.setZ(i,a.getZ(i)*(1+.024*t*Math.sin(angle*9)));if(options.raisedHemSide){const gather=THREE.MathUtils.smoothstep(a.getX(i)*Math.sign(options.raisedHemSide),-.02,.10);a.setY(i,y+.10*gather*t*t);a.setZ(i,a.getZ(i)*(1+.12*gather*t));}}garment.geometry.computeVertexNormals();
  }
  shapedTube(person,'neck seated into shoulder and jaw',[[0,shoulder,.0],[0,neckY+.018,-.002],[0,h-hh+.035,-.002]],[child?.037:.045,child?.033:.039,.034],skin);
  const head=headSculpt(person,identity,{...config,child});head.position.set(0,h-hh,0);head.rotation.order=options.headOrder||'XYZ';head.rotation.set(options.headPitch||0,options.headYaw||0,options.headTilt||0);
  const hands=options.hands||{};
  for(const sign of [-1,1]){
    const start=[sign*width*.62,shoulder-.065,0];
    const at=hands[sign]||[sign*(width+.07),hip+.02,.045];
    const elbow=options.elbows?.[sign]||[lerp(start[0],at[0],.5)+sign*.035,lerp(start[1],at[1],.52)-.065,lerp(start[2],at[2],.5)+.045];
    const axis=V(at).sub(V(elbow)).normalize(),wrist=V(at).addScaledVector(axis,-.022).toArray();
    shapedTube(person,'shaped sleeve shoulder elbow and cuff',[start,[sign*width*1.03,shoulder-.065,.005],elbow,wrist],[width*.25,width*.45,width*.34,width*.23],cloth,.88);
    hand(person,'palm and fingers meeting action',at,elbow,child?.67:.88,skin,options.grip,sign,options.handStyle,options.handContact);
  }
  if(options.vest){
    const vest=torso.clone();vest.geometry=torso.geometry.clone();vest.material=mat(options.vest);vest.geometry.scale(1.035,1,1.035);vest.name='fitted quilted vest following torso';person.add(vest);
    shapedTube(person,'vest zipper stitched to garment',[[0,hip+.02,.155],[0,lerp(hip,shoulder,.5),.15],[0,shoulder-.015,.13]],[.0018,.0018],mat(0xc9bca0));
  }
  if(options.apron)loft(person,'tailored cloth apron',[[hip-.05,width*.8,.153],[hip+.06,width*.78,.154],[shoulder-.14,width*.55,.148]],mat(0xc7b59a));
  if(!options.carried)addContactShadow(person,h);
  // Static character meshes batch by material to keep mobile draw calls low.
  person.updateMatrixWorld(true);
  const batches=new Map();person.traverse(m=>{if(!m.isMesh||m.userData.solidFootprint)return;const key=m.material.uuid;const list=batches.get(key)||[];list.push(m);batches.set(key,list);});
  for(const list of batches.values())if(list.length>1){const geometries=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const combined=mergeGeometries(geometries.map(g=>{const x=g.index?g.toNonIndexed():g;for(const key of Object.keys(x.attributes))if(!['position','normal','color','uv'].includes(key))x.deleteAttribute(key);if(!x.attributes.uv)x.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(x.attributes.position.count*2),2));if(!x.attributes.color){const c=new Float32Array(x.attributes.position.count*3).fill(1);x.setAttribute('color',new THREE.BufferAttribute(c,3));}return x;}));if(combined){for(const m of list)m.parent.remove(m);const material=list[0].material.clone();material.vertexColors=true;mesh(person,'batched dimensional sculpture detail',combined,material);}}
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
    let opts={height:child?1.04:identity==='Oleg'?1.76:identity==='G'?1.62:1.68,
      child,shirt:identity==='Jane'?0x576f7e:identity==='Oleg'?0xdccdb7:child?0xc78f86:0xb8a88c,
      pants:0x414b5b,dress:child&&identity!=='Companion',skirt:0xc98f91};
    if(identity==='Companion')opts={...opts,skin:/yellow glasses/.test(name)?0xb58667:0xb68e73,hair:0x49382e,glasses:/glasses/.test(name),glassesColor:/yellow/.test(name)?0xcda65a:0x34312d,beard:/beard/.test(name),bob:false};
    let pos=null,yaw=null;
    if(roomId==='01'){
      if(identity==='Jane'){opts={...opts,height:1.48,seated:true,hipY:.53,knees:[[-.11,.53,.30],[.11,.53,.30]],ankles:[[-.11,.10,.43],[.11,.10,.43]],shirt:0x34485c,hands:{'-1':[-.18,.968,.45],'1':[.18,.995,.44]},headPitch:.45,gazeY:-.002};pos=[-.47,0,.05];}
      else{opts={...opts,height:1.02,shirt:0xb48049,pants:0xb48049,dress:false,knees:[[-.07,.25,.02],[.16,.29,-.10]],ankles:[[-.08,.10,.03],[.16,.15,-.06]],hands:{'-1':[-.43,.92,.04],'1':[.43,.83,.10]},headTilt:-.06};}
    }
    if(roomId==='02'){
      if(identity==='Oleg'&&/job-search desk/.test(name)){opts={...opts,hands:{'-1':[-.25,.995,.55],'1':[.25,.995,.55]},headPitch:.55,gazeY:-.002};pos=[-1.7,0,4.65];yaw=Math.PI;}
      if(/advising/.test(name)){opts={...opts,hands:{'-1':[-.34,1.43,.505],'1':[.22,1.01,.24]},elbows:{'-1':[-.34,1.28,.25]},headYaw:-.50,headPitch:.10,headOrder:'YXZ'};pos=[-.95,0,4.9];yaw=-1.4;}
      if(/household/.test(name)||/keeping the household/.test(name))opts={...opts,apron:true,hands:{'1':[.38,1.02,.30]},headPitch:.08};
      if(/caring/.test(name))opts={...opts,hands:{'1':[.24,.78,.32],'-1':[-.24,.81,.30]},headPitch:.16,headYaw:-.2};
      if(/holding Oleg/.test(name)){opts={...opts,hands:{'-1':[-.24,.95,.10],'1':[.42,1.04,.13]},elbows:{'1':[.29,1.13,.32]},headYaw:.3,headTilt:-.14};pos=[-.35,0,-5.65];yaw=0;}
      if(/embrace/.test(name)){opts={...opts,hands:{'-1':[-.53,1.35,-.14],'1':[.25,.94,.10]},elbows:{'-1':[-.33,1.49,-.19]},headYaw:-.4,headTilt:.15};pos=[.18,0,-5.65];yaw=0;}
      if(/contacts/.test(name))opts={...opts,hands:{'1':[.45,1.1,.25]},headYaw:.45};
    }
    if(roomId==='03'){
      if(child){const charlize=identity==='Charlize';opts={...opts,height:charlize?1.08:1.04,shirt:charlize?0x354761:0xd49a83,skirt:charlize?0x354761:0xc98e9b,stripes:charlize,headTilt:charlize?.07:-.07,headYaw:charlize?-1.15:1.15,headOrder:'YXZ',hands:charlize?{'-1':[-.40,.63,.15],'1':[.24,.53,.09]}:{'1':[.40,.63,.15],'-1':[-.24,.53,.09]},ankles:charlize?[[-.09,.10,.08],[.09,.10,-.08]]:[[-.09,.10,-.08],[.09,.10,.08]],grip:true};yaw=charlize?-.15:.15;}
      else opts={...opts,headYaw:identity==='Jane'?.35:-.35,hands:identity==='Jane'?{'1':[.40,1.02,.22]}:{'-1':[-.40,1.02,.22]}};
    }
    if(roomId==='04'){
      if(child){opts={...opts,height:1.10,seated:true,hipY:.52,shirt:0xd79b95,dress:false,pants:0x706580,hands:{'-1':[-.102,.677,.3776],'1':[.102,.677,.3776]},knees:[[-.10,.36,.20],[.10,.36,.20]],ankles:[[-.10,.235,.31],[.10,.235,.31]],headPitch:.04,grip:true};pos=[0,.025,3.84];yaw=0;}
      else {opts={...opts,hands:identity==='Jane'?{'-1':[-.278,1.1544,.266],'1':[.17,.94,.21]}:{'1':[.278,1.1544,.266],'-1':[-.17,.94,.21]},grip:true};yaw=0;pos=[identity==='Jane'?.5:-.5,0,3.02];}
    }
    if(roomId==='05'){
      if(identity==='Jane')opts={...opts,shirt:0x4e7d7a,hands:{'-1':[-.29,.93,.12],'1':[.42,1.18,.15]},headPitch:-.06,headYaw:.12,expression:'proud',ankles:[[-.13,.10,.14],[.14,.10,-.06]]};
      if(child){pos=[-.54,0,4.86];opts={...opts,hands:{'1':[.25,.93,.31]},headYaw:.26};}
      if(identity==='Oleg'){pos=[-1.20,0,4.1];opts={...opts,hands:{'1':[.38,.98,.40]},headYaw:.28};}
    }
    if(roomId==='06'){
      if(identity==='Jane'){opts={...opts,height:1.43,seated:true,hipY:.59,shirt:0x9b737b,pants:0x656d80,knees:[[-.16,.55,.46],[.16,.55,.46]],ankles:[[-.17,.12,.58],[.17,.12,.58]],hands:{'-1':[-.14,.91,.40],'1':[.32,.82,.40]},elbows:{'-1':[-.32,1.03,.22],'1':[.37,.98,.20]},headPitch:.23,headYaw:-.23,expression:'tender'};pos=[0,0,2.15];yaw=0;}
      else{opts={...opts,height:.83,seated:true,hipY:.31,shirt:0x849caf,pants:0x8e7287,dress:false,knees:[[-.09,.18,.14],[.09,.18,.13]],ankles:[[-.09,.10,.23],[.09,.10,.22]],hands:{'-1':[-.12,.54,.13],'1':[.14,.51,.10]},carried:true,headPitch:.06,headYaw:2.2,headTilt:.03};pos=[.35,.61,2.43];yaw=-.35;}
    }
    if(roomId==='07'){
      // Targets sit on the front surface of the clothed ankles, not at their
      // bone centers; the curled fingers can then support rather than pierce.
      if(identity==='Oleg')opts={...opts,shirt:0x587384,hands:{'-1':[-.164,1.26,.054],'1':[.172,1.26,.006]},elbows:{'-1':[-.36,1.21,.11],'1':[.36,1.21,.11]},grip:true};
      if(child){opts={...opts,height:.85,seated:true,hipY:.30,knees:[[-.16,.24,.17],[.16,.24,.17]],ankles:[[-.17,.02,.24],[.17,.02,.24]],hands:{'-1':[-.24,.49,.16],'1':[.39,.42,.02]},shirt:0xc0918d,dress:false,pants:0x697f90,carried:true,headYaw:1.52,headPitch:.75,headOrder:'YXZ'};pos=[-.58,1.25,2.86];yaw=0;}
      if(identity==='G'){opts={...opts,shirt:0xc8bc9f,hands:{'-1':[-.613,1.68,-.004],'1':[.20,.98,.19]},headYaw:-1.3,headPitch:-.12,headOrder:'YXZ'};pos=[1.1,0,3.05];yaw=-.45;}
    }
    if(roomId==='08'){opts={...opts,shirt:identity==='Jane'?0xa97970:0x657d88,headYaw:identity==='Jane'?-.35:.35,hands:identity==='Jane'?{'-1':[-.33,1.01,.23]}:{'1':[.30,.99,.24]}};}
    if(roomId==='09'){
      if(identity==='Zephrine')opts={...opts,height:1.04,shirt:0xe1cbb0,pants:0xc6b798,applePrint:true,dress:false,vest:0x4a8181,hands:{'-1':[-.035,.592,.25],'1':[.035,.592,.25]},elbows:{'-1':[-.16,.55,.10],'1':[.16,.55,.10]},handStyle:'cup',handContact:{center:[0,.65,.275],radii:[.055,.056,.052]},grip:true,headPitch:.65,gazeY:-.0028};
      else {opts={...opts,shirt:identity==='Jane'?0x617c81:identity==='Matt'?0xae7773:identity==='Oleg'?0x455b72:0xb8a88d,headYaw:wrapper.position.x>0?-.55:.55};if(identity==='Jane'){pos=[-.50,0,2.80];opts={...opts,hands:{'1':[.355,.755,.26],'-1':[-.22,.95,.15]},elbows:{'1':[.27,1.0,.15]},headYaw:1.05,headPitch:.55,headOrder:'YXZ',gazeY:-.0028};}if(identity==='Oleg'){pos=[.92,0,2.40];opts={...opts,hands:{'-1':[-.40,1.0,.26]},headYaw:-.95,headPitch:.30,headOrder:'YXZ',gazeY:-.0022};}if(identity==='Matt'){pos=[-2.4,0,.8];opts.hands={'1':[.35,.95,.25]};}if(identity==='Tanya')pos=[2.3,0,.85];if(identity==='Companion'&&child)pos=[wrapper.position.x<0?-1.86:1.8,0,wrapper.position.x<0?1.5:1.4];yaw=0;}
    }
    if(roomId==='10'){
      if(child){opts={...opts,height:identity==='Zephrine'?1.04:wrapper.position.x<0?1.13:1.19,dress:identity==='Zephrine'||wrapper.position.x<0,skirt:identity==='Zephrine'?0xc98f91:0xbe9b62,shirt:identity==='Zephrine'?0xe1cbb2:wrapper.position.x<0?0xa185a4:0x5d8091,hands:identity==='Zephrine'?{'-1':[-.47,.64,-.16],'1':[.47,.64,-.18]}:wrapper.position.x<0?{'1':[.48,.64,.20]}:{'-1':[-.48,.64,.24]},headYaw:identity==='Zephrine'?0:wrapper.position.x>0?-.85:.85,headPitch:identity==='Zephrine'?.40:.18,headOrder:'YXZ',grip:true};pos=identity==='Zephrine'?[-.23,.05,4.37]:wrapper.position.x<0?[-1.18,.05,4.0]:[.72,.05,3.95];yaw=0;if(identity==='Zephrine'){opts.raisedHemSide=1;opts.knees=[[-.08,.24,.018],[.13,.36,-.10]];opts.ankles=[[-.09,.10,.01],[.14,.25,-.06]];}}
      else {opts={...opts,headPitch:.16,headOrder:'YXZ'};if(identity==='Jane'){pos=[-2.65,0,2.9];yaw=.7;opts.headYaw=.45;}if(identity==='Oleg'){pos=[2.65,0,3.0];yaw=-.8;opts.headYaw=-.4;}if(/yellow glasses/.test(name)){opts={...opts,shirt:0xaa7885,pants:0x4e6e60,headYaw:.35};pos=[-1.65,0,2.25];yaw=.25;}if(/knit cap/.test(name)){opts={...opts,shirt:0x4d5d6b,pants:0x354752,beanie:true,headYaw:-.38};pos=[1.65,0,2.05];yaw=-.3;}}
    }
    if(roomId==='11'){
      if(identity==='G'){opts={...opts,shirt:0xc5b99e,hands:{'-1':[-.31,.91,.17],'1':[.30,1.35,.15]},headYaw:.65,headPitch:-.35};yaw=.90;}
      if(child){opts={...opts,shirt:0xb88798,skirt:0xd7c6aa,hands:{'1':[.37,.89,.18],'-1':[-.17,.63,.16]},headYaw:.70,headPitch:-.50};yaw=.90;}
      if(identity==='Jane'||identity==='Oleg')opts={...opts,headYaw:.4};
    }
    const props=roomId==='02'?wrapper.children.filter(o=>/satchel|blanket/.test(o.name)):[];
    wrapper.clear();wrapper.scale.setScalar(1);wrapper.rotation.z=roomId==='06'&&child?.90:0;
    if(pos)wrapper.position.fromArray(pos);if(yaw!==null)wrapper.rotation.y=yaw;
    const model=makeStoryPerson(identity,opts);wrapper.add(model);for(const prop of props)wrapper.add(prop);
    wrapper.userData.storyIdentity=identity;
    // Actual collision bounds come from the new fitted torso, not a removed
    // portrait shell, a wide hand gesture, or an old oversized skirt.
    wrapper.userData.solidFootprint=false;
    if(roomId==='01'&&identity==='Jane')shapedTube(wrapper,'pen held over the enrollment notebook',[[.18,.997,.45],[.15,.948,.48]],[.003,.0015],mat(0x3c4149));
    if(roomId==='04'&&identity==='Zephrine'){
      shapedTube(wrapper,'fastened seat belt across the occupied molded seat',[[-.15,.63,.14],[0,.58,.19],[.15,.63,.14]],[.010,.010],mat(0x39495a),.35);
    }
    if(roomId==='09'&&identity==='Zephrine'){
      const apple=soft(wrapper,'first bitten apple held between both hands',[0,.65,.275],[.055,.056,.052],mat(0xa45c56));
      soft(wrapper,'pale bitten apple flesh',[.018,.69,.30],[.024,.014,.014],mat(0xe4cf9b));
    }
  }
  return wrappers.length;
}
