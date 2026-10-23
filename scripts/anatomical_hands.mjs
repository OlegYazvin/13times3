import * as THREE from 'three';
import sources from './assets/figures/story-hands.json' with {type:'json'};
import {sculptSurface} from './sculpt_surface.mjs';
import {fitWritingFingers} from './writing_fingers.mjs';

const posed=new Map(),V=p=>new THREE.Vector3(...p),Z=new THREE.Vector3(0,0,1);
const sourceFor=(identity,child)=>sources[child?(identity==='Zephrine'?'toddler':'child'):identity==='G'?'older':identity==='Oleg'||identity==='Matt'?'sam':'maya'];
function poseHand(source,style,grip,curl,thumbTurn){
 const key=source.positions,cacheKey=`${style}:${grip}:${curl}:${thumbTurn}`;let cache=posed.get(key);if(!cache){cache=new Map();posed.set(key,cache);}if(cache.has(cacheKey))return cache.get(cacheKey);
 const fingers=source.fingers.map(f=>f.map(V));
 const angles=fingers.map((f,i)=>(style==='touch'&&i===1?[0,.05,.05]:i===0&&(grip||style==='cup'||style==='touch')?[.15,.30,.20]:style==='cup'?[.13,.30,.15]:grip||style==='touch'?[.25,.55,.20]:[.03,.07,.04]).map(v=>v*(grip&&style==='normal'?curl:1)));
 function deform(p,finger){
   const joints=fingers[finger],original=p.clone(),q=p.clone();
   for(let k=2;k>=0;k--){
     const direction=joints[k+1].clone().sub(joints[k]).normalize(),axis=direction.clone().cross(Z).normalize();
     const influence=THREE.MathUtils.smoothstep(original.clone().sub(joints[k]).dot(direction),-.035,.045);
     q.sub(joints[k]).applyAxisAngle(axis,angles[finger][k]*influence).add(joints[k]);
   }
   if(finger===0&&(grip||style==='cup'||style==='touch'||style==='write'))q.sub(joints[0]).applyAxisAngle(new THREE.Vector3(0,1,0),joints[0].x<0?thumbTurn:-thumbTurn).add(joints[0]);
   return q;
 }
 const writing=style==='write'?fitWritingFingers(fingers,angles,deform,()=>thumbTurn,v=>{thumbTurn=v;}):null;
 const positions=[],tipCandidates=[],pinchCandidates=[[],[]];
 for(let i=0;i<source.positions.length;i+=3){
   const p=new THREE.Vector3(...source.positions.slice(i,i+3));let best=Infinity,finger=-1;
   for(let f=0;f<5;f++)for(let j=0;j<3;j++){
     const a=fingers[f][j],d=fingers[f][j+1].clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(d)/d.lengthSq(),0,1),distance=p.distanceTo(a.clone().addScaledVector(d,t));
     if(distance<best){best=distance;finger=f;}
   }
   const direction=fingers[finger][1].clone().sub(fingers[finger][0]).normalize();
   const blend=THREE.MathUtils.smoothstep(p.clone().sub(fingers[finger][0]).dot(direction),-.035,.055)*(1-THREE.MathUtils.smoothstep(best,.09,.18));
   const nearTip=p.distanceTo(fingers[1][3])<.13,nearPinch=finger<2&&p.distanceTo(fingers[finger][3])<.13;
   p.lerp(deform(p,finger),blend);positions.push(p.x,p.y,p.z);if(nearTip)tipCandidates.push(p.clone());if(nearPinch)pinchCandidates[finger].push(p.clone());
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(source.indices);geometry.computeVertexNormals();
 const tipDirection=deform(fingers[1][3],1).sub(deform(fingers[1][2],1)).normalize();
 const tip=tipCandidates.reduce((best,p)=>!best||p.dot(tipDirection)>best.dot(tipDirection)?p:best,null)||deform(fingers[1][3],1);
 const palm=sculptSurface(geometry)(new THREE.Vector3(0,source.palmAnchor[1],1),new THREE.Vector3(0,0,-1))||V(source.palmAnchor);
 let pinch=null,penAxis=null,pinchRadius=null;
 if(writing){
  let distance=Infinity,pair=null;for(const a of pinchCandidates[0])for(const b of pinchCandidates[1]){const d=a.distanceToSquared(b);if(d<distance){distance=d;pair=[a,b];}}
  if(!pair)throw Error('Writing pose has no anatomical fingertip surfaces');
  pinch=pair[0].clone().add(pair[1]).multiplyScalar(.5);const across=pair[1].clone().sub(pair[0]).normalize();
  penAxis=new THREE.Vector3(0,-.55,.835);penAxis.addScaledVector(across,-penAxis.dot(across)).normalize();pinchRadius=Math.sqrt(distance)/2;
 }
 const result={geometry,tip,tipDirection,palm,pinch,penAxis,pinchRadius,writingError:writing?.error};cache.set(cacheKey,result);return result;
}

export function anatomicalHand(parent,{identity,child,height,side,at,elbow,material,grip=false,curl=1,thumbTurn=.30,style='normal',normal=null,direction=null,contact=null}){
 const source=sourceFor(identity,child)[side>0?'l':'r'],pose=poseHand(source,style,grip,curl,thumbTurn),length=height*.097;
 const axis=direction?V(direction).normalize():V(at).sub(V(elbow)).normalize();
 let face=V(normal||(style==='cup'?[0,1,0]:[0,0,1]));
 if(style==='cup'&&!direction)axis.set(0,0,1);
 // An explicit palm normal controls the hand, rather than being rotated away
 // to match the forearm. The wrist may flex while the arm solves to its base.
 if(normal){axis.addScaledVector(face,-axis.dot(face)/face.lengthSq());if(axis.lengthSq()<.001){axis.set(0,Math.abs(face.y)<.9?1:0,Math.abs(face.y)<.9?0:1);axis.addScaledVector(face,-axis.dot(face)/face.lengthSq());}axis.normalize();}
 face.addScaledVector(axis,-face.dot(axis));if(face.lengthSq()<.001)face.set(0,1,0).addScaledVector(axis,-axis.y);face.normalize();
 const cross=axis.clone().cross(face).normalize(),quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(cross,axis,face));
 const anchor=style==='touch'?pose.tip.clone():style==='write'?pose.pinch.clone():pose.palm.clone();
 const penDirection=style==='write'?pose.penAxis.clone().applyQuaternion(quaternion):null;
 const target=style==='write'?V(contact.paper).addScaledVector(penDirection,-.045):contact?.center?V(contact.center).addScaledVector(pose.tipDirection.clone().applyQuaternion(quaternion),-(contact.radius||0)):V(contact?.plane?at:contact||at);
 const wrist=target.clone().sub(anchor.multiplyScalar(length).applyQuaternion(quaternion));
 if(contact?.plane){const n=V(contact.plane.normal).normalize(),point=V(contact.plane.point);let support=Infinity;const p=pose.geometry.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).multiplyScalar(length).applyQuaternion(quaternion);support=Math.min(support,v.dot(n));}wrist.addScaledVector(n,point.dot(n)+.0002-support-wrist.dot(n));}
 const mesh=new THREE.Mesh(pose.geometry,material);mesh.name='anatomical palm knuckles and articulated fingers';mesh.scale.setScalar(length);mesh.position.copy(wrist);mesh.quaternion.copy(quaternion);mesh.userData.preserveSculptGeometry=true;parent?.add(mesh);
 mesh.userData.storyPart=side<0?'hand-left':'hand-right';
 const pen=style==='write'?{tip:contact.paper,direction:penDirection.toArray(),radius:pose.pinchRadius*length,grip:target.toArray(),writingError:pose.writingError}:null;
 return {wrist:wrist.toArray(),mesh,pen};
}
