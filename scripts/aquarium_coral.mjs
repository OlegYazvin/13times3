import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

let branching;
function branchGeometry(){
  if(branching)return branching;
  // Smoothly union thick, curved branches into a single closed colony. The
  // rounded forks and clustered crowns are coral, rather than separate pipes.
  const segments=[];
  function path(points,radii){for(let i=1;i<points.length;i++)segments.push({a:new THREE.Vector3(...points[i-1]),b:new THREE.Vector3(...points[i]),ra:radii[i-1],rb:radii[i]});}
  path([[0,.08,0],[.015,.4,-.02],[-.035,.77,.03],[.01,1.18,-.015],[.02,1.49,.015]],[.11,.09,.076,.064,.063]);
  for(let i=0;i<10;i++){
    const a=i*2.399,level=.28+(i%5)*.19,reach=.24+(i%3)*.105;
    const tip=[Math.cos(a)*reach,level+.34+(i%3)*.10,Math.sin(a)*reach];
    const joint=[tip[0]*.53,level+.15,tip[2]*.50];
    path([[0,level,0],joint,tip],[.073,.064,.055]);
    for(const turn of[-.66,.66]){
      const end=[tip[0]+Math.cos(a+turn)*.14,tip[1]+.16,tip[2]+Math.sin(a+turn)*.14];
      path([joint,[tip[0]*.86,end[1]-.14,tip[2]*.86],end],[.060,.052,.049]);
    }
  }
  for(const s of segments){s.axis=s.b.clone().sub(s.a);s.length2=s.axis.lengthSq();}
  const surface=new MarchingCubes(58,new THREE.MeshStandardMaterial(),false,false,60000);surface.isolation=0;
  const size=surface.size,p=new THREE.Vector3(),delta=new THREE.Vector3();
  for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    p.set((x/size-.5)*1.55,y/size*1.90-.12,(z/size-.5)*1.55);
    let field=-1;
    for(const s of segments){
      delta.copy(p).sub(s.a);const t=THREE.MathUtils.clamp(delta.dot(s.axis)/s.length2,0,1);
      delta.addScaledVector(s.axis,-t);const distance=delta.length(),radius=s.ra+(s.rb-s.ra)*t;
      const value=radius-distance,k=.040,h=THREE.MathUtils.clamp(.5+.5*(field-value)/k,0,1);
      field=THREE.MathUtils.lerp(value,field,h)+k*h*(1-h);
    }
    // Small connected living lobes follow the surface; no separate bead layer.
    field+=.0035*Math.sin(p.x*65+p.z*17)*Math.sin(p.y*47-p.z*34);
    surface.field[z*size*size+y*size+x]=field;
  }
  surface.update();
  const source=surface.geometry,count=source.drawRange.count,g=new THREE.BufferGeometry();
  for(const name of ['position','normal'])g.setAttribute(name,new THREE.Float32BufferAttribute(source.attributes[name].array.slice(0,count*3),3));
  g.scale(.775,.95,.775);g.translate(0,.83,0);g.computeBoundingBox();
  const colors=[],color=new THREE.Color();
  for(let i=0;i<count;i++){
    const y=g.attributes.position.getY(i),x=g.attributes.position.getX(i),z=g.attributes.position.getZ(i);
    const tip=THREE.MathUtils.smoothstep(y,.35,1.75),polyp=.04*Math.sin(x*77+y*31)*Math.sin(z*71-y*45);
    color.setHex(0xcf819e).lerp(new THREE.Color(0xf5d9bf),.12+tip*.44+polyp);colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));surface.geometry.dispose();surface.material.dispose();branching=g;return g;
}
export function branchingCoral(){
  const mesh=new THREE.Mesh(branchGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,emissive:0x653c51,emissiveIntensity:.13,roughness:.86}));
  mesh.name='continuous rounded branching reef coral with fused living crowns';return mesh;
}

export function brainCoral(){
  const p=[],colors=[],idx=[],rows=48,sides=112;
  for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
    const theta=row/rows*Math.PI,phi=side/sides*Math.PI*2;
    const ridge=.5+.5*Math.cos(theta*48+3.5*Math.sin(phi*6)+1.2*Math.sin(phi*12+theta*4));
    const radius=1+.035*Math.sin(phi*5)*Math.sin(theta)**2+.065*ridge*Math.sin(theta)**.6;
    p.push(Math.sin(theta)*Math.cos(phi)*radius,Math.cos(theta)*radius,Math.sin(theta)*Math.sin(phi)*radius);
    const c=new THREE.Color(0xa88964).lerp(new THREE.Color(0xe7d2a6),.32+ridge*.46);colors.push(c.r,c.g,c.b);
    if(row<rows&&side<sides){const n=row*(sides+1)+side;idx.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
  }
  for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,emissive:0x675536,emissiveIntensity:.12,roughness:.93}));mesh.name='rounded brain coral with continuous winding ridges';return mesh;
}

export function lettuceCoral(){
  const colony=new THREE.Group();colony.name='overlapping thick ruffled lettuce coral attached to the reef';
  const material=new THREE.MeshStandardMaterial({color:0xd59ba8,roughness:.89,emissive:0x684150,emissiveIntensity:.11});
  for(let leaf=0;leaf<7;leaf++){
    const p=[],idx=[],rows=18,sides=80;
    for(let layer=0;layer<2;layer++)for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
      const r=row/rows,a=side/sides*Math.PI*2,edge=1+.12*Math.sin(a*7+leaf*.8),radius=(.42-leaf*.025)*r*edge;
      p.push(Math.cos(a)*radius*.43,.20+leaf*.095+.14*r*r+.065*Math.sin(a*5+leaf*.6)*r*r+(layer?.012:-.012),Math.sin(a)*radius);
      if(row<rows&&side<sides){const n=layer*(rows+1)*(sides+1)+row*(sides+1)+side;if(layer)idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);else idx.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
    }
    const stride=(rows+1)*(sides+1);for(let s=0;s<sides;s++){const a=rows*(sides+1)+s,b=a+stride;idx.push(a,b,a+1,a+1,b,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,material);mesh.name='solid waved coral plate with a closed ruffled edge';colony.add(mesh);
  }
  return colony;
}
