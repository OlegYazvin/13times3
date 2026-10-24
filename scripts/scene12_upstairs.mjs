import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {folkFloorplan} from './scene12_floorplan.mjs';

export function folkFloorGeometry(depth=.16){
 const shape=new THREE.Shape(folkFloorplan.map(p=>new THREE.Vector2(...p)));
 const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});g.rotateX(Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+7.4)/14.8,(p.getZ(i)+11.2)/22.4);return g;
}
export function folkCeilingGeometry(ceilingAt){
 // A stair void has no walking floor, but remains under the building roof.
 const roofPlan=folkFloorplan.flatMap((p,i)=>i===14?[[7.25,-5.5]]:i===15?[]:[p]);
 const base=new THREE.ShapeGeometry(new THREE.Shape(roofPlan.map(p=>new THREE.Vector2(...p))));
 const p=base.attributes.position,positions=[],colors=[];
 function triangle(a,b,c){
  const pairs=[[a,b,c],[b,c,a],[c,a,b]].sort((u,v)=>u[0].distanceToSquared(u[1])-v[0].distanceToSquared(v[1]));
  const [u,v,w]=pairs.at(-1);if(u.distanceToSquared(v)>1.2**2){const m=u.clone().add(v).multiplyScalar(.5);triangle(u,m,w);triangle(m,v,w);return;}
  for(const q of[a,b,c]){const color=new THREE.Color(0xeee9d4).lerp(new THREE.Color(0x6d7773),THREE.MathUtils.smoothstep(q.y,.4,6)*.79);positions.push(q.x,ceilingAt(q.x,q.y),q.y);colors.push(color.r,color.g,color.b);}
 }
 const idx=base.index.array;for(let i=0;i<idx.length;i+=3)triangle(...[0,1,2].map(k=>new THREE.Vector2().fromBufferAttribute(p,idx[i+k])));
 // ShapeGeometry faces +Z in its original XY plane; mapping Y to world Z
 // turns that winding toward the floor, just as the old ceiling plane did.
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const welded=mergeVertices(g,1e-5);welded.computeVertexNormals();return welded;
}

export function buildUpstairsShell(art,{group,ceilingAt,windowFrame,curtain,brick,wall,darkWood,cream,gray}){
 const {root,material,add,box,beam}=art,whiteBrick=material(0xd5d0bf);
 function brickUV(mesh){if(mesh.material!==brick)return mesh;const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+mesh.position.x)/3.6,(p.getY(i)+mesh.position.y)/5.4);return mesh;}
 function segment(a,b,{window=false,mat=wall,name='upstairs wall following the actual angled plan',rail=false,base=0,solid=true}={}){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),g=group(name,root,[(a[0]+b[0])/2,0,(a[1]+b[1])/2],Math.atan2(-dz,dx));
  if(rail){
   for(let i=0;i<=10;i++){const x=-length/2+i*length/10;beam(g,'stair-landing timber baluster',[x,.03,0],[x,1.02,0],.021,.021,darkWood,10);}
   beam(g,'continuous handrail around the stair recess',[-length/2,1.04,0],[length/2,1.04,0],.045,.045,darkWood,14);return;
  }
  const count=Math.ceil(length/.38),low=window?.70:0,top=window?3.32:0;
  // Short, real masonry sections produce fitted collision boxes even on a
  // diagonal. One AABB for a long angled wall would block its usable bay.
  for(let i=0;i<count;i++){
   const x=-length/2+(i+.5)*length/count;
   if(window)brickUV(box(g,'solid wall below the bay glazing',x,low/2,0,length/count,low,.22,mat,true));
   else {const h=ceilingAt(a[0]+dx*(i+.5)/count,a[1]+dz*(i+.5)/count);brickUV(box(g,name,x,(h+base)/2,0,length/count,h-base,.22,mat,solid));}
  }
  if(window){
   const shape=new THREE.Shape();shape.moveTo(-length/2,top);shape.lineTo(length/2,top);
   for(let i=0;i<=20;i++){const t=1-i/20;shape.lineTo(-length/2+length*t,ceilingAt(a[0]+dx*t,a[1]+dz*t)+.015);}shape.closePath();
   brickUV(add(g,'continuous header fitted between window and roof',new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}),mat,0,0,-.11));
   for(const side of[-1,1])box(g,'masonry bay-window jamb',side*(length/2-.04),2.0,0,.08,2.65,.22,mat);
   const frame=group('true window opening on an angled bay face',g,[0,0,.08]);windowFrame(frame,length-.16,2.55,2.0);
   for(const side of[-1,1])curtain(frame,side*(length/2-.24),2.0,2.64,.31,gray);
  }
  box(g,'timber skirting following the room perimeter',0,.085,.122,length,.17,.045,darkWood);
 }
 // The west wall is not mirrored on the stair side. One side window leads
 // toward the corner bar bay, followed by its three angled glazed faces.
 segment(folkFloorplan[0],[-7.25,-.75]);
 segment([-7.25,-.75],[-7.25,-4.25],{window:true});
 segment([-7.25,-4.25],folkFloorplan[1]);
 for(let i=1;i<17;i++){
  const glazed=[1,2,3,7,8,9,12].includes(i),masonry=[3,4,5,6].includes(i)?brick:[10,11,12].includes(i)?whiteBrick:wall;
  segment(folkFloorplan[i],folkFloorplan[i+1],{window:glazed,mat:masonry,rail:i===15,name:i===5?'projecting exposed-brick chimney breast':i===14?'stepped stairwell bulkhead':i===15?'open stair landing with a protective handrail':'faceted upstairs perimeter'});
 }
 // The stair void is inside the building envelope. Enclose it above and
 // below floor level so the landing never opens onto the outdoor backdrop.
 segment([7.25,-5.5],[7.25,-1.25],{base:-1.8,solid:false,name:'enclosed outer stairwell wall'});
 segment([5.25,-5.5],[7.25,-5.5],{base:-1.8,solid:false,name:'stairwell end wall below the upstairs roof'});
 box(root,'inner stairwell wall continuing below floor level',5.25,-.9,-3.375,.22,1.8,4.25,wall);
 box(root,'lower interior stair landing beyond the visible treads',6.22,-1.69,-4.25,1.75,.18,2.5,darkWood);
 // The visible descent remains outside the walkable polygon and behind
 // the landing rail; it does not create a second route out of the world.
 for(let i=0;i<7;i++)box(root,'timber stair tread descending from the upstairs landing',6.22,-.12-i*.22,-1.42-i*.27,1.75,.18,.29,darkWood);
 box(root,'radiator cover below the whitewashed-brick return',4.92,.53,-8.515,1.03,1.06,.25,cream,true);
 for(let i=0;i<14;i++)box(root,'vertical radiator grille slot',4.48+i*.067,.56,-8.382,.019,.78,.013,darkWood);
 // The projecting right wall has the low vent seen beside the room's alcove.
 box(root,'stairwell wall ventilation grille',5.115,.43,-3.1,.035,.50,.70,cream);
 for(let i=0;i<8;i++)box(root,'vent louver attached to stairwell bulkhead',5.09,.23+i*.055,-3.1,.018,.018,.61,darkWood);
 for(const [a,b]of[[[-.65,-9.95],[3.50,-9.95]],[[-6.35,-8.65],[-3.25,-8.65]]]){
  const y=3.87;beam(root,'reference upstairs ceiling-light track',[a[0],y,a[1]],[b[0],y,b[1]],.018,.018,darkWood,10);
  for(let i=0;i<3;i++){const t=(i+.5)/3,x=THREE.MathUtils.lerp(a[0],b[0],t),z=THREE.MathUtils.lerp(a[1],b[1],t);beam(root,'track lamp fitted to the ceiling rail',[x,y,z],[x,y-.14,z],.047,.047,darkWood,12);}
 }
 return {chimneyPlaque:[-1.85,2.9,-8.31]};
}
