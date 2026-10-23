import * as THREE from 'three';

// Development inspection only: geometry in room coordinates, including the
// actual bone pose. No reference images, materials or personal metadata.
export function subjectMeshesInRoot(group){
 group.updateMatrixWorld(true);
 const inverse=group.matrixWorld.clone().invert(),vertex=new THREE.Vector3(),meshes=[];
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const name=mesh.name.replaceAll('_',' ');
  const part=mesh.userData.storyPart||(/draped cloth skirt/.test(name)?'skirt':/fitted quilted vest/.test(name)?'vest':/tailored cloth apron/.test(name)?'apron':null);
  if(!part)return;
  let actor=mesh.parent;while(actor&&!actor.userData.storyIdentity)actor=actor.parent;if(!actor)return;
  const positions=new Float32Array(mesh.geometry.attributes.position.count*3);
  for(let i=0;i<positions.length/3;i++){mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);positions.set(vertex.toArray(),i*3);}
  meshes.push({identity:actor.userData.storyIdentity,actor:actor.name,name:mesh.name,part,positions:Array.from(positions),indices:mesh.geometry.index?Array.from(mesh.geometry.index.array):Array.from({length:positions.length/3},(_,i)=>i)});
 });
 return meshes;
}
