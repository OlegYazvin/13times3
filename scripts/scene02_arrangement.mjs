import * as THREE from 'three';
import {anatomicalHand} from './anatomical_hands.mjs';
export function caregivingBlanketPoint(u,v){
 const x=(-.24+.48*u)*(1-.12*v),held=.81-.03*u-.14*Math.sin(Math.PI*u);
 return [x+.015*v*Math.sin(u*7),held-.25*v+.025*Math.sin(u*10+v*5)*v+.045*v**3*Math.abs(u-.5)*2,.30+.02*u+.08*Math.sin(Math.PI*u)+.15*v*Math.sin(Math.PI*u)];
}
const jane={position:[-3.8,0,-3.5],yaw:.65},child={position:[-3.38,0,-3.16],yaw:-1.7};
const q=a=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a);
const touch=new THREE.Vector3(...caregivingBlanketPoint(.91,0)).applyQuaternion(q(jane.yaw)).add(new THREE.Vector3(...jane.position)).sub(new THREE.Vector3(...child.position)).applyQuaternion(q(-child.yaw)).toArray();
export const CARING_ACTORS={
 Jane:{...jane,options:{height:1.48,stature:1.68,knees:[[-.105,.43,.17],[.105,.43,.17]],hands:{'1':[.24,.78,.32],'-1':[-.24,.81,.30]},handStyles:{'-1':'cup','1':'cup'},handNormals:{'-1':[0,1,0],'1':[0,1,0]},headPitch:.45,headYaw:.25,expression:'tender'}},
 Zephrine:{...child,options:{hands:{'-1':touch},handStyles:{'-1':'touch'},handPoints:{'-1':touch},headYaw:-.25,headPitch:-.5}},
};

// The real right-hand laptop sits within normal working distance. The point
// is in its display plane; screen content stays abstract and unbranded.
export const ADVICE_LAPTOP={position:[-.96,.93,3.48],scale:.71};
export const ADVICE_SCREEN_POINT=new THREE.Vector3(-.21,.105,.006)
 .applyEuler(new THREE.Euler(-.15,0,0)).add(new THREE.Vector3(0,.58,-.245))
 .multiplyScalar(ADVICE_LAPTOP.scale).add(new THREE.Vector3(...ADVICE_LAPTOP.position)).toArray();
const adviceJane={position:[-1.05,0,4.67],yaw:Math.PI};
const localAdvicePoint=point=>new THREE.Vector3(...point).sub(new THREE.Vector3(...adviceJane.position)).applyQuaternion(q(-adviceJane.yaw)).toArray();
function lookAtAdvice(position,yaw,height,leanZ=0){
 const target=new THREE.Vector3(...ADVICE_SCREEN_POINT).sub(new THREE.Vector3(...position)).applyQuaternion(q(-yaw))
  .sub(new THREE.Vector3(0,height-.265+.145,leanZ+.085));
 return {headOrder:'YXZ',headYaw:Math.atan2(target.x,target.z),headPitch:Math.atan2(-target.y,Math.hypot(target.x,target.z)),gazeX:0,gazeY:0};
}
// Align the lowest actual hand surface to the curved outer shoulder's
// tangent, rather than putting the entire palm above a global shirt height.
const shoulder=localAdvicePoint([-1.57177913,1.44845831,4.37873153]);
const shoulderNormal=new THREE.Vector3(.344,.881,-.326).normalize().applyQuaternion(q(-adviceJane.yaw));
const shoulderPlane={point:new THREE.Vector3(...shoulder).addScaledVector(shoulderNormal,.00025).toArray(),normal:shoulderNormal.toArray()};
const shoulderFace=shoulderNormal.clone().negate().toArray();
const trial=anatomicalHand(null,{identity:'Jane',child:false,height:1.68,side:1,at:shoulder,elbow:[.04,1.43,.36],material:null,normal:shoulderFace,direction:[0,0,1],contact:{plane:shoulderPlane}});
trial.mesh.updateMatrix();let minimum=Infinity,lowest;const vertex=new THREE.Vector3(),positions=trial.mesh.geometry.attributes.position;
for(let i=0;i<positions.count;i++){vertex.fromBufferAttribute(positions,i).applyMatrix4(trial.mesh.matrix);const d=vertex.dot(shoulderNormal);if(d<minimum){minimum=d;lowest=vertex.clone();}}
const shoulderAnchor=new THREE.Vector3(...shoulder).add(new THREE.Vector3(...shoulder).addScaledVector(shoulderNormal,.00045).sub(lowest)).toArray();
export const DESK_ADVICE_ACTORS={
 Oleg:{position:[-1.7,0,4.42],yaw:Math.PI,options:{...lookAtAdvice([-1.7,0,4.42],Math.PI,1.76)}},
 Jane:{...adviceJane,options:{leanZ:.08,expression:'proud',
  hands:{'-1':localAdvicePoint([-1.05,1.38,4.03]),'1':shoulderAnchor},
  handStyles:{'-1':'touch','1':'normal'},
  handAxes:{'-1':[.55,.05,.83],'1':[0,0,1]},
  handNormals:{'-1':[.83,0,-.55],'1':shoulderFace},
  handPoints:{'-1':{point:localAdvicePoint([-1.05,1.38,4.03]),aim:localAdvicePoint(ADVICE_SCREEN_POINT)},'1':{plane:shoulderPlane}},
  elbows:{'-1':[-.26,1.18,.28],'1':[.35,1.30,-.15]},armRadii:{'1':[.048,.028,.018]},
  ...lookAtAdvice(adviceJane.position,adviceJane.yaw,1.68,.08),
 }},
};
