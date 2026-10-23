import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

// A closed bitten surface. The pale cut belongs to the apple's geometry;
// there is no separate flesh insert floating over an unbroken red sphere.
export function bittenApple(){
 const size=64,half=.080,effect=new MarchingCubes(size,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}),false,false,18000);effect.isolation=0;
 const bite=p=>Math.hypot(p.x-.026,p.y-.045,p.z-.040)-.031;
 for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=new THREE.Vector3((x/size*2-1)*half,(y/size*2-1)*half,(z/size*2-1)*half);
  const angle=Math.atan2(p.z,p.x),lobes=1+.023*Math.cos(angle*5)*Math.max(0,p.y/.056),d=(Math.hypot(p.x/(.055*lobes),p.y/.056,p.z/(.052*lobes))-1)*.052;
  effect.field[z*size*size+y*size+x]=-Math.max(d,-bite(p));
 }
 effect.update();const count=effect.geometry.drawRange.count,g=new THREE.BufferGeometry();
 const positions=effect.geometry.attributes.position.array.slice(0,count*3),colors=new Float32Array(count*3),p=new THREE.Vector3(),red=new THREE.Color(0xa44b3f),cream=new THREE.Color(0xe9d6a2);
 for(let i=0;i<count;i++){
  p.fromArray(positions,i*3).multiplyScalar(half);p.toArray(positions,i*3);
  const cut=Math.abs(bite(p))<.0014,c=cut?cream.clone():red.clone().lerp(new THREE.Color(0xc78e43),.14+.11*Math.sin(p.y*170+p.x*75));c.toArray(colors,i*3);
 }
 g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,effect.material);mesh.name='closed first apple with an actual concave bite and pale cut flesh';mesh.userData.preserveSculptGeometry=true;mesh.userData.storyPart='apple';effect.geometry.dispose();return mesh;
}
