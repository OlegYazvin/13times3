import * as THREE from 'three';
export function friendshipGrip(identity){
 const charlize=identity==='Charlize',side=charlize?-1:1,yaw=charlize?-.15:.15;
 const origin=new THREE.Vector3(charlize?.42:-.42,0,4),inverse=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-yaw);
 const point=new THREE.Vector3(charlize?.018:-.018,charlize?.642:.63,charlize?4.122:4.09).sub(origin).applyQuaternion(inverse).toArray();
 const direction=new THREE.Vector3(charlize?-1:1,-.2,0).applyQuaternion(inverse).toArray(),normal=new THREE.Vector3(0,0,charlize?-1:1).applyQuaternion(inverse).toArray();
 return {point,options:{handGrips:{[side]:true,[-side]:false},handCurls:{[side]:charlize?.2:.4},thumbTurns:{[side]:-.20},handAxes:{[side]:direction},handNormals:{[side]:normal}}};
}
