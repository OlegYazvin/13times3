import * as THREE from 'three';
// Both observers follow the same close, moving sculpted fish. Its breathing
// drift stays small enough that their gaze remains engaged throughout.
export const SHARED_AQUARIUM_FISH=[1.37,2.46,6.42];
export function aquariumAttention(identity){
 const child=identity==='Zephrine',position=child?[-1.08,0,6.62]:[-.10,0,6.25],yaw=.90;
 const eye=new THREE.Vector3(position[0],child?.98:1.56,position[2]),target=new THREE.Vector3(...SHARED_AQUARIUM_FISH),to=target.clone().sub(eye);
 const hand=child?[.37,.89,.18]:[.28,1.36,.12],inverse=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-yaw);
 const localTarget=target.clone().sub(new THREE.Vector3(...position)).applyQuaternion(inverse),axis=localTarget.sub(new THREE.Vector3(...hand)).normalize().toArray();
 return {position,yaw,options:{headYaw:Math.atan2(to.x,to.z)-yaw,headPitch:-Math.atan2(to.y,Math.hypot(to.x,to.z)),headOrder:'YXZ',hands:{'1':hand},handStyles:{'1':'touch'},handAxes:{'1':axis},expression:'wonder'}};
}
