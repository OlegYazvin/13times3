import * as THREE from 'three';

export function storyArmElbow(shoulder,wrist,pole,upper,lower){
 const a=new THREE.Vector3(...shoulder),b=new THREE.Vector3(...wrist),axis=b.clone().sub(a),distance=axis.length();
 if(distance>upper+lower-.001||distance<Math.abs(upper-lower)+.001)throw Error(`Arm contact is outside anatomical reach (${distance.toFixed(3)} m; upper ${upper.toFixed(3)}, forearm ${lower.toFixed(3)})`);
 axis.divideScalar(distance);
 const bend=new THREE.Vector3(...pole).sub(a);bend.addScaledVector(axis,-bend.dot(axis));
 if(bend.lengthSq()<1e-8)bend.set(0,0,1).addScaledVector(axis,-axis.z);
 bend.normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),radius=Math.sqrt(Math.max(0,upper*upper-along*along));
 return a.addScaledVector(axis,along).addScaledVector(bend,radius).toArray();
}
