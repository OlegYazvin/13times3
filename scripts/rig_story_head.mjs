import * as THREE from 'three';

// The native neck stays continuous with the face. Its lower ring remains
// seated in the shirt while the skull, gaze and hairstyle turn together.
export function attachStoryHead(root,features,geometry,material,options={}){
 if(!geometry.attributes.skinIndex){
   const p=geometry.attributes.position,indices=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);
   for(let i=0;i<p.count;i++){
     const turn=THREE.MathUtils.smoothstep(p.getY(i),-.037,0);indices[i*4+1]=1;weights[i*4]=1-turn;weights[i*4+1]=turn;
   }
   geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 }
 const neck=new THREE.Bone(),skull=new THREE.Bone();neck.name='anchored neck';skull.name='posed head';neck.add(skull);skull.add(features);root.add(neck);
 const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='continuous anatomical face jaw and flexible neck';root.add(mesh);
 mesh.userData.storyPart='face-neck';
 root.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton([neck,skull]));
 skull.rotation.order=options.headOrder||'XYZ';skull.rotation.set(options.headPitch||0,options.headYaw||0,options.headTilt||0);
 root.userData.nativeHeadRig=true;return {mesh,neck,skull};
}
