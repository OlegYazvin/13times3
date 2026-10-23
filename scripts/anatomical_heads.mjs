import * as THREE from 'three';
import sources from './assets/figures/story-heads.json' with {type:'json'};
import {sculptSurface} from './sculpt_surface.mjs';
const sculptures=new Map();

// CC0 MakeHuman base and actual age morphs, fitted as sculpture. Private
// photographs guide proportions; no photographic pixels enter these assets.
export function anatomicalHead(identity,config,h){
 const key=JSON.stringify([identity,config.child,h,config.skin,config.hair,config.beard,config.expression,config.anatomySource]);
 if(sculptures.has(key))return sculptures.get(key);
 const child=config.child,source=sources[config.anatomySource||(child?(identity==='Zephrine'?'toddler':'child'):identity==='G'?'older':identity==='Oleg'||identity==='Matt'?'sam':'maya')];
 const scale=h/source.top,width=identity==='Oleg'?1.04:identity==='Jane'?1.035:identity==='G'?1.12:1;
 const mouthT=source.mouth[1]/source.top,eyeT=source.eye[0][1]/source.top;
 const eyeX=Math.abs(source.eye[0][0])*scale*width,eyeZ=source.eye[0][2]*scale;
 const skin=new THREE.Color(config.skin),hair=new THREE.Color(config.hair),positions=[],colors=[];
 for(let i=0;i<source.positions.length;i+=3){
   let x=source.positions[i]*scale*width,y=source.positions[i+1]*scale,z=source.positions[i+2]*scale;
   // Seat the native lower neck inside the body. Extending it down preserves
   // a smooth, connected surface; compressing the flare in place folds it.
   const lowerNeck=1-THREE.MathUtils.smoothstep(y/h,-.15,-.075);
   x*=1-lowerNeck*.30;z*=1-lowerNeck*.12;y-=lowerNeck*.025;
   const t=y/h,forward=THREE.MathUtils.smoothstep(z,.025,.085);
   if(config.expression==='tender'){
     const upperLid=Math.exp(-(((Math.abs(x)-eyeX)/.024)**4+((y-eyeT*h-.005)/.006)**4))*forward;
     y-=upperLid*(child?.0011:.0015);
   }
   if(config.expression==='joy'){
     const cheek=Math.exp(-(((Math.abs(x)-eyeX)/.027)**2+((y-eyeT*h+.024)/.021)**2))*forward;
     y+=cheek*.003;z+=cheek*.0015;
   }
   if(config.expression==='wonder'){
     const lid=Math.exp(-(((Math.abs(x)-eyeX)/.025)**4+((y-eyeT*h)/.012)**4))*forward;
     y+=(y-eyeT*h)*.10*lid;
   }
   if(identity==='Oleg'){
     x*=1+.08*(1-THREE.MathUtils.smoothstep(t,.16,.48));
     x*=1-.12*Math.exp(-((x/.045)**4+((t-.31)/.14)**2))*forward;
     const cheek=Math.exp(-(((Math.abs(x)-.055)/.033)**2+((t-.33)/.17)**2))*forward;z+=cheek*.005;
     const lip=Math.exp(-((x/.037)**4+((t-mouthT)/.065)**4))*forward;
     y=THREE.MathUtils.lerp(y,mouthT*h+(y-mouthT*h)*.57,lip);
     const eye=Math.exp(-(((Math.abs(x)-eyeX)/.026)**4+((t-eyeT)/.085)**4))*forward;
     y+=(y-eyeT*h)*.24*eye;
   }
   if(identity==='Jane')x*=1+.07*(1-THREE.MathUtils.smoothstep(t,.13,.36));
   const mouth=Math.exp(-(((t-mouthT)/.065)**2))*forward;
   const smile=config.expression==='tender'?.0038:config.expression==='joy'?.010:config.expression==='proud'?.008:child?.005:.004;
   y+=smile*mouth*THREE.MathUtils.smoothstep(Math.abs(x),.010,.032);
   positions.push(x,y,z);
   const c=skin.clone(),cheek=Math.exp(-(((Math.abs(x)-(child?.065:.055))/.033)**2+((t-.30)/.15)**2))*forward;
   c.lerp(new THREE.Color(0xd58279),cheek*(child?.15:.09));
   c.lerp(new THREE.Color(0xa96f65),mouth*Math.exp(-((x/(child?.027:.032))**4))*.24);
   if(config.beard){
     const chin=THREE.MathUtils.smoothstep(.19-t,0,.095),jaw=THREE.MathUtils.smoothstep(Math.abs(x),.043,.082)*THREE.MathUtils.smoothstep(.43-t,0,.16);
     const moustache=Math.exp(-(((t-mouthT-.05)/.022)**2))*Math.exp(-((x/.032)**4));
     c.lerp(hair.clone().multiplyScalar(.65),Math.max(chin,jaw,moustache*.85)*forward*THREE.MathUtils.smoothstep(t,.015,.065)*.87);
   }
   colors.push(c.r,c.g,c.b);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(source.indices);geometry.computeVertexNormals();
 const probe=sculptSurface(geometry);
 const frontSamples=new Map(),radialSamples=new Map();
 const front=(x,t)=>{const k=`${x}:${t}`;if(frontSamples.has(k))return frontSamples.get(k);const z=probe(new THREE.Vector3(x,t*h,.8),new THREE.Vector3(0,0,-1))?.z??.06;frontSamples.set(k,z);return z;};
 const radius=(a,t)=>{const k=`${a}:${t}`;if(radialSamples.has(k))return radialSamples.get(k);const direction=new THREE.Vector3(Math.cos(a),0,Math.sin(a));const p=probe(direction.clone().multiplyScalar(.5).setY(t*h),direction.clone().negate()),r=p?Math.hypot(p.x,p.z):.002;radialSamples.set(k,r);return r;};
 const result={geometry,front,radius,eyeT,eyeX,eyeZ,eyeRadii:[source.eyeRadius*scale,source.eyeRadius*scale,source.eyeRadius*scale],mouthT};sculptures.set(key,result);return result;
}
