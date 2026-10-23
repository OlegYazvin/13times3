import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Remove rejected leaves before the author batches them. Their former names
// disappear during merging, so hiding them later leaves the polygons visible.
export function clearFriendshipPlanting(root){
 const rejected=[];
 root.traverse(o=>{if(/rooted flowering stalk|leaf attached to the garden stalk|small layered flower on its rooted stalk|small painted leaf fallen|living flower stem beside|low garden leaf attached|overlapping dimensional garden flower|tiny flower heart|low leaves along room edge|pretend-food flower|soft playground tile|soft shaded play surface/.test(o.name))rejected.push(o);});
 for(const o of rejected)o.removeFromParent();
}

const matte=color=>new THREE.MeshStandardMaterial({color,roughness:.94});
function put(root,name,g,m,at=[0,0,0]){const o=new THREE.Mesh(g,m);o.name=name;o.position.fromArray(at);root.add(o);return o;}
function board(root,name,from,to,w,d,m){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),v=b.clone().sub(a),o=put(root,name,new THREE.BoxGeometry(w,v.length(),d),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}

export function landscapeFriendshipGarden(root){
 root.traverse(o=>{if(/the ground where park visits|continuous distant terrain|distant ground beyond the walkable scene/.test(o.name))o.visible=false;});
 const coordinates=[-72,-50,-36,-26,-18,-14,-12,...Array.from({length:61},(_,i)=>-10+i/3),12,14,18,26,36,50,72],n=coordinates.length,p=[],c=[],idx=[];
 const grass=new THREE.Color(0x91aa8e),haze=new THREE.Color(0xb7c5b0),earth=new THREE.Color(0x738c70);
 const bedCenter=(z,side)=>side*(2.04+.19*Math.sin(z*.71)+.37*Math.exp(-(((z-3.5)/.9)**2)));
 const bedWidth=z=>.54+.10*Math.sin(z*.6+.7);
 const bedHeight=(x,z)=>{const side=Math.sign(x)||1,u=(x-bedCenter(z,side))/bedWidth(z),t=THREE.MathUtils.clamp((z+5.8)/13.3,0,1);return .002+Math.max(0,1-u*u)*Math.sin(t*Math.PI)**.7*.095;};
 const groundHeight=(x,z)=>{const far=THREE.MathUtils.smoothstep(Math.max(Math.abs(x),Math.abs(z)),11,42);return far*(.13+.11*Math.sin(x*.17+z*.13)+.08*Math.sin(z*.2-x*.1));};
 for(const tree of root.children.filter(o=>o.isGroup&&/shade tree|foreground park canopy|distant modeled park tree|distant planted canopy/.test(o.name)))tree.position.y=groundHeight(tree.position.x,tree.position.z);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=coordinates[i],z=coordinates[j],far=THREE.MathUtils.smoothstep(Math.max(Math.abs(x),Math.abs(z)),11,42);
  const y=groundHeight(x,z);p.push(x,y,z);
  const shade=.045*Math.sin(x*.8+z*.4)+.02*Math.sin(x*2-z*.8),color=grass.clone().lerp(haze,far*.64);color.offsetHSL(0,0,shade*(1-far*.6));c.push(color.r,color.g,color.b);
  if(i<n-1&&j<n-1){const a=j*n+i;idx.push(a,a+n,a+1,a+1,a+n,a+n+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();
 put(root,'continuous shaded friendship park ground through the horizon',g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
 const leaves=[],stems=[],flowers=[],beds=[],leafBase=new THREE.SphereGeometry(1,14,10);
 const actors=root.children.filter(o=>o.userData.storyIdentity);
 for(const side of[-1,1]){
  const bp=[],bc=[],bi=[],along=64,across=12;
  for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
   const z=-5.8+j*13.3/along,u=i/across*2-1,x=bedCenter(z,side)+u*bedWidth(z);bp.push(x,bedHeight(x,z),z);
   const color=grass.clone().lerp(earth,(1-u*u)*.55);bc.push(color.r,color.g,color.b);
   if(i<across&&j<along){const a=j*(across+1)+i;bi.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);}
  }
  const bed=new THREE.BufferGeometry();bed.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));bed.setAttribute('color',new THREE.Float32BufferAttribute(bc,3));bed.setIndex(bi);bed.computeVertexNormals();beds.push(bed);
  for(let clump=0;clump<29;clump++){
   const z=-5.45+clump*.44+.08*Math.sin(clump*2.1),x=bedCenter(z,side)+.21*Math.sin(clump*2.4+side),y=bedHeight(x,z)+.001;
   if(actors.some(a=>Math.hypot(a.position.x-x,a.position.z-z)<.65))continue;
   for(let k=0;k<6;k++){
    const angle=clump*2.399+k*2.399+side,length=.22+.18*(.5+.5*Math.sin(k*2.2+clump)),shape=leafBase.clone(),pos=shape.attributes.position,colors=[];
    for(let v=0;v<pos.count;v++){
     const t=(pos.getY(v)+1)/2,px=pos.getX(v)*(.035+.014*Math.sin(k+clump)),py=length*Math.sin(t*Math.PI*.80),pz=pos.getZ(v)*.0035+.29*t+.02*Math.sin(t*Math.PI);
     pos.setXYZ(v,x+Math.cos(angle)*px+Math.sin(angle)*pz,y+py,z-Math.sin(angle)*px+Math.cos(angle)*pz);
     const color=new THREE.Color(0x4b7864).lerp(new THREE.Color(0xa4b580),.15+t*.48+.09*Math.sin(k+clump));colors.push(color.r,color.g,color.b);
    }
    shape.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));shape.computeVertexNormals();leaves.push(shape);
   }
   // Small flower heads grow from connected stems; their petals are closed
   // curved surfaces and much smaller than the children's hands.
   if(clump%5===2)for(let bloom=0;bloom<3;bloom++){
    const dx=.07*Math.cos(bloom*2.4+clump),dz=.07*Math.sin(bloom*2.4+clump),h=.32+.045*Math.sin(bloom+clump),tip=new THREE.Vector3(x+dx,y+h,z+dz);
    stems.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x+dx*.4,y+h*.65,z+dz*.4),tip]),12,.003,5,false));
    for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5,flower=new THREE.SphereGeometry(1,10,6);flower.scale(.013,.005,.023);flower.rotateY(a);flower.translate(tip.x+Math.sin(a)*.016,tip.y,tip.z+Math.cos(a)*.016);flowers.push(flower);}
   }
  }
 }
 for(const[name,parts,m]of[['softly raised rooted beds beside the friendship walk',beds,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})],['closed curved perennial leaves growing from the friendship beds',leaves,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})],['connected stems beneath the small friendship flowers',stems,matte(0x5e775b)],['small curved cream flower heads on the living stems',flowers,matte(0xdac9b2)]]){
  put(root,name,mergeGeometries(parts),m);for(const part of parts)part.dispose();
 }
 leafBase.dispose();
 // A continuous rounded play surface replaces the detached tile rectangles.
 const outline=new THREE.Shape(),w=3.60,d=2.80,r=.38;
 outline.moveTo(-w/2+r,-d/2);outline.lineTo(w/2-r,-d/2);outline.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);outline.lineTo(w/2,d/2-r);outline.quadraticCurveTo(w/2,d/2,w/2-r,d/2);outline.lineTo(-w/2+r,d/2);outline.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);outline.lineTo(-w/2,-d/2+r);outline.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
 const pad=new THREE.ExtrudeGeometry(outline,{depth:.032,bevelEnabled:false,curveSegments:16});pad.rotateX(-Math.PI/2);
 put(root,'continuous rounded rubber surface in the shaded play nook',pad,matte(0xaba5ad),[-3.45,.001,-3.55]);
 const playTable=root.getObjectByName('solid petal-shaped play table');
 const pedestalProfile=[[0,.034],[.14,.034],[.17,.065],[.11,.12],[.075,.57],[.13,.64],[0,.64]].map(([r,y])=>new THREE.Vector2(r,y));
 put(root,'joined pedestal grounding the child play table on its play surface',new THREE.LatheGeometry(pedestalProfile,32),playTable?.material||matte(0xd2c5ad),[-3.7,0,-3.65]);
 const bridge=root.getObjectByName('storybook park bridge');
 if(bridge)for(const side of[-1,1])for(let step=0;step<3;step++){
  const h=.19*(step+1),stair=put(bridge,'solid timber arrival step joined to the garden bridge',new THREE.BoxGeometry(.20,h,1.06),matte(0x9b876b),[side*(2.3-step*.2),h/2,0]);stair.userData.solidFootprint=true;
 }
 const wood=matte(0x92735a),metal=matte(0x53655b);
 for(const[x,z,yaw]of[[-3.8,.2,Math.PI/2],[4.3,1.4,-Math.PI/2]]){
  const bench=new THREE.Group();bench.name='solid park bench seating with joined chair supports';bench.position.set(x,0,z);bench.rotation.y=yaw;bench.userData.solidFootprint=true;root.add(bench);
  for(const seatZ of[-.14,0,.14])put(bench,'joined timber slat in the park bench seat',new THREE.BoxGeometry(1.30,.055,.13),wood,[0,.46,seatZ]);
  for(const side of[-1,1]){
   board(bench,'joined park bench leg',[side*.49,0,-.17],[side*.49,.44,-.14],.045,.045,metal);
   board(bench,'joined park bench leg',[side*.49,0,.18],[side*.49,.44,.14],.045,.045,metal);
   board(bench,'continuous bench back support',[side*.49,.42,-.16],[side*.49,.93,-.23],.035,.035,metal);
   board(bench,'seat bearer joining both bench legs',[side*.49,.42,-.18],[side*.49,.42,.18],.04,.04,metal);
  }
  for(const y of[.66,.84])put(bench,'timber back slat joined to the bench supports',new THREE.BoxGeometry(1.30,.13,.035),wood,[0,y,-.18-(y-.46)*.14]);
 }
}
