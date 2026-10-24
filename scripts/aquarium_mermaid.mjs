import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sculptSurface} from './sculpt_surface.mjs';
import upperURL from './assets/room11/ariel-upper.glb';

// Requested 1989 Ariel design: a newly composed swimming sculpture. Facial
// anatomy and hands adapt Blender Studio's CC-BY Rain rig; see scene notes.
export async function aquariumMermaid(){
  const mermaid=new THREE.Group();mermaid.name='Ariel quietly swimming among the side-reef coral';
  const assembly=new THREE.Group();assembly.name='connected posed Ariel upper body hair and shell costume';
  mermaid.add(assembly);
  const upper=(await new GLTFLoader().loadAsync(upperURL)).scene;
  upper.updateMatrixWorld(true);
  let body;upper.traverse(o=>{if(o.isMesh&&/body_nomask/.test(o.name))body=o;});
  if(!body)throw Error('Missing sculpted mermaid body');
  const bodySurface=sculptSurface(body.geometry.clone().applyMatrix4(body.matrixWorld));
  const front=(x,y)=>bodySurface(new THREE.Vector3(x,y,.6),new THREE.Vector3(0,0,-1))?.z??.10;
  assembly.add(upper);
  // Small modeled highlights sit on the actual blue iris surfaces. They keep
  // the eyes alive even in the aquarium's soft, diffuse underwater light.
  upper.traverse(o=>{
    if(!o.isMesh||!o.material.name.includes('blue irises'))return;
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld),probe=sculptSurface(geometry);
    for(const sign of [-1,1]){
      const box=new THREE.Box3(),p=geometry.attributes.position;
      for(const i of geometry.index.array)if(p.getX(i)*sign>0)box.expandByPoint(new THREE.Vector3().fromBufferAttribute(p,i));
      if(box.isEmpty())continue;
      const center=box.getCenter(new THREE.Vector3()),at=probe(new THREE.Vector3(center.x-.010,center.y+.008,.5),new THREE.Vector3(0,0,-1));
      if(!at)continue;
      const glint=new THREE.Mesh(new THREE.SphereGeometry(.0018,12,8),new THREE.MeshStandardMaterial({color:0xfffae9,emissive:0xfffae9,emissiveIntensity:.14,roughness:.35}));
      glint.name='small light seated on Ariel blue iris';glint.position.copy(at).add(new THREE.Vector3(0,0,.001));assembly.add(glint);
    }
  });
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.82});
  function surface(parent,name,positions,indices,colors,mat){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    if(colors)geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;parent.add(mesh);return mesh;
  }
  function sweep(parent,name,points,radii,flatten,base,highlight,{rows=80,sides=48,relief=0,crossTurn=0}={}){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const frames=path.computeFrenetFrames(rows,false),p=[],c=[],idx=[];
    const dark=new THREE.Color(base),light=new THREE.Color(highlight);
    for(let row=0;row<=rows;row++){
      const t=row/rows,k=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(k));
      const radius=THREE.MathUtils.lerp(radii[a],radii[a+1],k-a),center=path.getPoint(t);
      for(let side=0;side<=sides;side++){
        const angle=side/sides*Math.PI*2;
        const scales=Math.pow(.5+.5*Math.cos(angle*18+Math.PI*Math.round(t*36)),12)*Math.pow(.5+.5*Math.cos(t*Math.PI*72),10);
        const r=radius+relief*scales*Math.sin(Math.PI*t);
        const normal=frames.normals[row].clone().multiplyScalar(Math.cos(crossTurn)).addScaledVector(frames.binormals[row],Math.sin(crossTurn));
        const binormal=frames.binormals[row].clone().multiplyScalar(Math.cos(crossTurn)).addScaledVector(frames.normals[row],-Math.sin(crossTurn));
        const point=center.clone().addScaledVector(normal,Math.cos(angle)*r)
          .addScaledVector(binormal,Math.sin(angle)*r*flatten);
        p.push(point.x,point.y,point.z);
        const color=dark.clone().lerp(light,Math.max(0,.12+.12*Math.cos(angle-.4)+.05*scales+.035*Math.sin(t*8)));
        if(name.includes('Ariel green tail'))color.lerp(new THREE.Color(0x85c9a0),1-THREE.MathUtils.smoothstep(t,0,.055));
        c.push(color.r,color.g,color.b);
        if(row<rows&&side<sides){const n=row*(sides+1)+side;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
      }
    }
    for(let s=1;s<sides-1;s++){idx.push(0,s+1,s);const n=rows*(sides+1);idx.push(n,n+s,n+s+1);}
    return surface(parent,name,p,idx,c,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83}));
  }

  // The two scalloped shell cups sit on the body's actual curved surface.
  // Their modeled ribs follow each cup; neither is a flat chest panel.
  const purple=material(0x9f75b6);
  for(const sign of [-1,1]){
    const p=[],idx=[],rows=20,sides=72,cx=sign*.060;
    for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
      const r=row/rows,a=side/sides*Math.PI,x=cx+Math.cos(a)*r*.059;
      const scallop=1-.026*Math.pow(r,8)*(1+Math.cos(a*14));
      const y=1.100+Math.sin(a)*r*.103*scallop;
      const z=front(x,y)+.007+.025*Math.sin(Math.PI*r)*Math.sin(a);
      p.push(x,y,z);
      if(row<rows&&side<sides){const n=row*(sides+1)+side;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
    }
    const cup=surface(assembly,'fitted purple scallop shell '+sign,p,idx,null,purple);cup.material.side=THREE.DoubleSide;
    for(let rib=1;rib<7;rib++){
      const a=rib/7*Math.PI,points=[];
      for(let k=0;k<=20;k++){
        const r=k/20*.96,x=cx+Math.cos(a)*r*.059,y=1.100+Math.sin(a)*r*.103;
        points.push([x,y,front(x,y)+.009+.025*Math.sin(Math.PI*r)*Math.sin(a)]);
      }
      sweep(assembly,'relief following the purple shell cup',points,[.0009,.0009],1,0xae87be,0xb896ca,{rows:24,sides:6});
    }
  }
  // A narrow band wraps the chest beneath the joined shells.
  {
    const points=[];for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,d=new THREE.Vector3(Math.cos(a),0,Math.sin(a));const hit=bodySurface(d.clone().multiplyScalar(.18).setY(1.104),d.clone().negate());points.push((hit??d.clone().multiplyScalar(.12).setY(1.104)).addScaledVector(d,.005));}
    const band=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),72,.006,8,false),purple);
    band.name='purple shell top band wrapped around the torso';assembly.add(band);
  }

  sweep(mermaid,'continuous Ariel green tail with a relaxed swimming curve',
    [[0,.915,0],[.015,.69,0],[.17,.44,0],[.47,.35,0],[.76,.46,.012],[.97,.66,.025]],
    [.158,.169,.151,.108,.065,.027],.82,0x238f79,0x75c49c,{relief:.001,crossTurn:Math.PI/2});
  // Two curved membranes, with thickness and a flowing edge. The fins are
  // shaped in water rather than extruded as a rigid fork-shaped board.
  for(const [name,points,maxWidth] of [
    ['upper',[[.95,.65,.025],[1.13,.77,.02],[1.34,1.02,.055]],.11],
    ['lower',[[.95,.65,.025],[1.21,.55,.035],[1.49,.49,.08]],.12],
  ]){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),p=[],idx=[],c=[],rows=48,columns=20;
    for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
      const t=row/rows,u=col/columns*2-1,at=path.getPoint(t),tangent=path.getTangent(t);
      const width=.012*(1-t)+maxWidth*Math.pow(Math.sin(Math.PI*t),.72);
      const normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();at.addScaledVector(normal,u*width);
      at.z+=.025*Math.sin(t*Math.PI*1.4)*u*u+.006*Math.sin(col/columns*Math.PI*6)*Math.sin(Math.PI*t);
      p.push(at.x,at.y,at.z);
      const color=new THREE.Color(0x71bb99).lerp(new THREE.Color(0xb0dfb3),.30+.22*u+.13*Math.sin(t*3));c.push(color.r,color.g,color.b);
      if(row<rows&&col<columns){const n=row*(columns+1)+col;idx.push(n,n+1,n+columns+1,n+1,n+columns+2,n+columns+1);}
    }
    surface(mermaid,'Ariel flowing '+name+' tail fin',p,idx,c,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide}));
  }
  // Bend the coupled upper body, hair and costume together at the tail root.
  for(const child of assembly.children)child.position.y-=.89;
  assembly.position.y=.89;assembly.rotation.z=-.105;assembly.rotation.x=-.045;
  mermaid.scale.setScalar(.85);
  return mermaid;
}
