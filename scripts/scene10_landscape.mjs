import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// One park surface continues through the visitor bounds into its own sky.
// Dense sampling stays near the game; the distant lawn uses wider intervals.
export function landscapePlayGarden(root){
 root.traverse(o=>{if(/walkable painted ground|continuous play garden lawn|low sculpted garden mound|rooted flower stem in the Play Garden|veined leaf attached to a garden stem|five-petal garden blossom|small center of a modeled garden blossom/.test(o.name))o.visible=false;});
 const coordinates=[-72,-50,-36,-26,-18,-14,-12,...Array.from({length:51},(_,i)=>-10+i*.4),12,14,18,26,36,50,72],n=coordinates.length;
 const positions=[],colors=[],indices=[],grass=new THREE.Color(0x8da98b),sand=new THREE.Color(0xc5b69a),haze=new THREE.Color(0xb4c2b0);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=coordinates[i],z=coordinates[j],far=THREE.MathUtils.smoothstep(Math.max(Math.abs(x),Math.abs(z)),12,42);
  const y=far*(.18+.16*Math.sin(x*.14+z*.1)+.12*Math.sin(z*.19-x*.08));positions.push(x,y,z);
  const path=Math.exp(-Math.pow((x-.24*Math.sin(z*.42))/(1.75+.12*Math.sin(z*.63)),2))*(1-THREE.MathUtils.smoothstep(Math.abs(z),12,28));
  const c=grass.clone().lerp(sand,path*.58).lerp(haze,far*.58);c.offsetHSL(0,0,.012*Math.sin(x*1.7+z*1.1));colors.push(c.r,c.g,c.b);
  if(i<n-1&&j<n-1){const a=j*n+i;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
 }
 const ground=new THREE.BufferGeometry();ground.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.setIndex(indices);ground.computeVertexNormals();
 const lawn=new THREE.Mesh(ground,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));lawn.name='continuous park ground and atmospheric lawn beyond the play garden';root.add(lawn);
 const leafParts=[],stemParts=[],seedParts=[],soilParts=[],leafMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94}),stemMaterial=new THREE.MeshStandardMaterial({color:0x607655,roughness:1}),seedMaterial=new THREE.MeshStandardMaterial({color:0xd3b58b,roughness:1});
 const leafShape=new THREE.SphereGeometry(1,12,8),soilMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
 function bedCenter(z,side){return side*(2.65+.32*Math.sin(z*.54+.8)+.95*Math.exp(-Math.pow((z-3)/1.1,2)));}
 function bedHeight(x,z,side){
  const u=(x-bedCenter(z,side))/(.67+.13*Math.sin(z*.7)),t=THREE.MathUtils.clamp((z+7.8)/15.4,0,1),depth=Math.max(0,1-u*u)*Math.sqrt(Math.sin(t*Math.PI));
  const playElement=side>0?1-.95*Math.exp(-Math.pow((z-1.8)/.65,4)):1-.95*Math.exp(-Math.pow((z-6.25)/.50,4));
  return .001+depth*(.10+.028*Math.sin(z*1.3))*playElement;
 }
 const actors=root.children.filter(o=>o.userData.storyIdentity);
 for(const side of[-1,1]){
  const p=[],c=[],idx=[],along=52,across=10;
  for(let j=0;j<=along;j++)for(let i=0;i<=across;i++){
   const z=-7.8+j*15.4/along,u=i/across*2-1,x=bedCenter(z,side)+u*(.67+.13*Math.sin(z*.7));
   const taper=Math.sin(j/along*Math.PI)**.5,depth=Math.max(0,1-u*u)*taper;
   p.push(x,bedHeight(x,z,side),z);
   const color=new THREE.Color(0x7e9274).lerp(grass,Math.abs(u)**.45).lerp(new THREE.Color(0x5b725c),depth*.28);c.push(color.r,color.g,color.b);
   if(i<across&&j<along){const a=j*(across+1)+i;idx.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();soilParts.push(g);
  for(let clump=0;clump<22;clump++){
   const z=-7.15+clump*.66+.17*Math.sin(clump*2.4),x=bedCenter(z,side)+.30*Math.sin(clump*2.9+side);
   // Plant around the actual play elements, leaving their occupied forms clear.
   if(side>0&&z>.8&&z<2.8||side<0&&z>5.6&&z<7||actors.some(a=>Math.hypot(a.position.x-x,a.position.z-z)<.65))continue;
   const y=bedHeight(x,z,side)+.001,phase=clump*2.399+side;
   for(let k=0;k<7;k++){
    const angle=phase+k*2.399,length=.24+.18*(.5+.5*Math.sin(k*2.7+clump)),g=leafShape.clone(),p=g.attributes.position,paint=[];
    for(let v=0;v<p.count;v++){
     const t=(p.getY(v)+1)/2,px=p.getX(v)*(.022+.009*Math.sin(k+clump)),py=t*length,pz=p.getZ(v)*.004+.16*Math.sin(t*Math.PI*.72);
     p.setXYZ(v,x+Math.cos(angle)*px+Math.sin(angle)*pz,y+py,z-Math.sin(angle)*px+Math.cos(angle)*pz);
     const color=new THREE.Color(0x4c7867).lerp(new THREE.Color(0x97af7c),t*.6+.12*Math.sin(k+clump));paint.push(color.r,color.g,color.b);
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(paint,3));g.computeVertexNormals();leafParts.push(g);
   }
   if(clump%3===1)for(let flower=0;flower<3;flower++){
    const angle=phase+flower*2.4,h=.40+.11*Math.sin(clump+flower),dx=Math.cos(angle)*.09,dz=Math.sin(angle)*.09;
    const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x+dx*.4,y+h*.6,z+dz*.4),new THREE.Vector3(x+dx,y+h,z+dz)]);stemParts.push(new THREE.TubeGeometry(path,10,.004,5,false));
    for(let bud=0;bud<5;bud++){const a=bud*2.4,g=new THREE.SphereGeometry(.016,8,6);g.scale(.75,1.2,.75);g.translate(x+dx+Math.cos(a)*.014,y+h+bud*.006,z+dz+Math.sin(a)*.014);seedParts.push(g);}
   }
  }
 }
 for(const [name,parts,material]of[['continuous softly raised planted park beds',soilParts,soilMaterial],['formed lanceolate leaves rooted in the park beds',leafParts,leafMaterial],['joined stems supporting the quiet park seed heads',stemParts,stemMaterial],['small dimensional seed heads growing above park leaves',seedParts,seedMaterial]]){
  const mesh=new THREE.Mesh(mergeGeometries(parts),material);mesh.name=name;root.add(mesh);for(const g of parts)g.dispose();
 }
 leafShape.dispose();
}
