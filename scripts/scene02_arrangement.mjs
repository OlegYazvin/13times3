import * as THREE from 'three';
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
