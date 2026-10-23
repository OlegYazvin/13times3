import * as THREE from 'three';
const matte=color=>new THREE.MeshStandardMaterial({color,roughness:.9});
function box(root,name,size,at,material,solid=false){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.fromArray(at);m.userData.solidFootprint=solid;root.add(m);return m;}
export function composeFriendshipGarden(root){
 for(const actor of root.children.filter(o=>o.userData.storyIdentity)){
  actor.position.z+=1.10;actor.position.y=.037;
  actor.traverse(o=>{if(o.name==='soft contact shadow anchoring the sculpted figure')o.position.y=.002;});
 }

 const plaster=matte(0xded9c8),oak=matte(0xb19978),window=new THREE.MeshStandardMaterial({color:0xb7d3cd,transparent:true,opacity:.18,roughness:.35,depthWrite:false,side:THREE.DoubleSide});
 root.traverse(o=>{
  if(/warm dance floorboard/.test(o.name)){o.scale.z*=1.88;o.position.z=-7.0;}
  if(/fine brass edge of the inlaid|garden border branch/.test(o.name))o.visible=false;
 });
 // The open arch now enters a real studio volume. Its rear glazing still
 // looks into the park: the two settings meet physically in the dream.
 for(const side of[-1,1]){
  box(root,'solid plaster side wall of the open garden dance studio',[.17,3.45,3.18],[side*2.65,1.725,-7.05],plaster,true);
  box(root,'oak skirting seated along the dance studio wall',[.045,.10,3.18],[side*2.55,.15,-7.05],oak);
 }
 box(root,'low solid sill beneath the dance studio garden windows',[5.25,.76,.18],[0,.38,-8.62],plaster,true);
 box(root,'joined studio window head below the curved ceiling',[5.25,.35,.18],[0,3.32,-8.62],plaster);
 for(const x of[-2.57,-.86,.86,2.57])box(root,'deep oak mullion framing a real garden window',[.085,2.40,.19],[x,1.96,-8.60],oak);
 for(const x of[-1.71,0,1.71])box(root,'glazed studio window continuing into the modeled park',[1.63,2.36,.025],[x,1.96,-8.59],window);
 const p=[],indices=[];for(let j=0;j<=12;j++)for(let i=0;i<=32;i++){
  const x=-2.73+i/32*5.46,z=-8.72+j/12*3.38;p.push(x,3.43+.52*(1-(x/2.73)**2),z);
  if(i<32&&j<12){const n=j*33+i;indices.push(n,n+33,n+1,n+1,n+33,n+34);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();const roof=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xd9d8cb,emissive:0xc8c7bd,emissiveIntensity:.10,roughness:1,side:THREE.DoubleSide}));roof.name='joined curved plaster roof over the open dance studio';root.add(roof);
}
