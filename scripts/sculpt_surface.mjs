import * as THREE from 'three';

// Authoring-only acceleration for fitting lids, glasses and hair to a real
// sculpt. The exported room contains the meshes, never this query tree.
export function sculptSurface(geometry){
 const p=geometry.attributes.position,index=geometry.index.array;
 const triangles=Array.from({length:index.length/3},(_,i)=>{
   const ids=[index[i*3],index[i*3+1],index[i*3+2]],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(const id of ids)for(let j=0;j<3;j++){const n=p.array[id*3+j];min[j]=Math.min(min[j],n);max[j]=Math.max(max[j],n);}
   return {ids,min,max,center:min.map((v,j)=>(v+max[j])/2)};
 });
 function branch(list){
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(const t of list)for(let j=0;j<3;j++){min[j]=Math.min(min[j],t.min[j]);max[j]=Math.max(max[j],t.max[j]);}
   const box=new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max));
   if(list.length<=12)return {box,list};
   const axis=max.map((v,j)=>v-min[j]).reduce((a,v,j,x)=>v>x[a]?j:a,0);list.sort((a,b)=>a.center[axis]-b.center[axis]);
   const mid=list.length>>1;return {box,left:branch(list.slice(0,mid)),right:branch(list.slice(mid))};
 }
 const tree=branch(triangles),ray=new THREE.Ray(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),hit=new THREE.Vector3(),entry=new THREE.Vector3();
 const cast=(origin,direction)=>{
   ray.set(origin,direction);let distance=Infinity,point=null;
   function visit(node){
     if(!ray.intersectBox(node.box,entry))return;
     if(entry.distanceToSquared(origin)>distance&&!node.box.containsPoint(origin))return;
     if(node.list){for(const t of node.list){a.fromBufferAttribute(p,t.ids[0]);b.fromBufferAttribute(p,t.ids[1]);c.fromBufferAttribute(p,t.ids[2]);if(ray.intersectTriangle(a,b,c,false,hit)){const d=hit.distanceToSquared(origin);if(d<distance){distance=d;point=hit.clone();}}}}
     else{visit(node.left);visit(node.right);}
   }
   visit(tree);return point;
 };
 cast.nearest=origin=>{
   const triangle=new THREE.Triangle();let distance=Infinity,point=null;
   function visit(node){
     if(node.box.distanceToPoint(origin)>distance)return;
     if(node.list){for(const t of node.list){triangle.a.fromBufferAttribute(p,t.ids[0]);triangle.b.fromBufferAttribute(p,t.ids[1]);triangle.c.fromBufferAttribute(p,t.ids[2]);triangle.closestPointToPoint(origin,hit);const d=hit.distanceTo(origin);if(d<distance){distance=d;point=hit.clone();}}}
     else{const left=node.left.box.distanceToPoint(origin),right=node.right.box.distanceToPoint(origin);if(left<right){visit(node.left);visit(node.right);}else{visit(node.right);visit(node.left);}}
   }
   visit(tree);return {point,distance};
 };
 cast.contains=origin=>{
   if(!tree.box.containsPoint(origin))return false;
   ray.set(origin,new THREE.Vector3(1,.371,.529).normalize());const distances=[];
   function visit(node){
     if(!ray.intersectsBox(node.box))return;
     if(node.list){for(const t of node.list){a.fromBufferAttribute(p,t.ids[0]);b.fromBufferAttribute(p,t.ids[1]);c.fromBufferAttribute(p,t.ids[2]);if(ray.intersectTriangle(a,b,c,false,hit))distances.push(hit.distanceTo(origin));}}
     else{visit(node.left);visit(node.right);}
   }
   visit(tree);distances.sort((a,b)=>a-b);let crossings=0,last=-Infinity;
   for(const distance of distances)if(distance>1e-6&&distance-last>1e-6){crossings++;last=distance;}
   return crossings%2===1;
 };
 return cast;
}
