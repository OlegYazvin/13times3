import * as THREE from 'three';
import {ADVICE_LAPTOP,ADVICE_SCREEN_POINT} from './scene02_arrangement.mjs';

// The remembered home unfolds into the street as one architectural gesture.
// The people and their five simultaneous acts of support stay in place.
export function composeSupportWorld(root){
  root.traverse(o=>{
    if(/golden sidewalk seam/.test(o.name))o.visible=false;
    if(/tall luminous wall window|warm window upright|window sill|arched top of a remembered room|music wall|music-wall|hanging instruments|below the hanging|hanging string instrument|fixing instrument/.test(o.name)){o.scale.y*=.75;o.position.y*=.75;}
    if(/shallow plaster pier/.test(o.name)){o.scale.y*=.64;o.position.y*=.64;}
    if(/capital over the home windows/.test(o.name)){o.scale.y*=.64;o.position.y*=.64;}
  });
  // Seat the reference desk's equipment on its actual 0.93 m beveled top.
  // The old independent placements left keyboards and the monitor floating.
  for(const o of root.children){
    if(/monitor|webcam|unbranded open laptop|small pile of blank job-search pages|^paper edge$/.test(o.name))o.position.y-=.09;
    if(o.name==='little drinking glass on desk')o.position.y-=.08;
  }
  const adviceLaptop=root.children.find(o=>o.name==='unbranded open laptop'&&o.position.x>-2);
  if(adviceLaptop){adviceLaptop.position.fromArray(ADVICE_LAPTOP.position);adviceLaptop.userData.adviceScreen=true;adviceLaptop.userData.adviceTarget=ADVICE_SCREEN_POINT;}
  const glass=root.children.find(o=>o.name==='little drinking glass on desk');if(glass){glass.position.x=-.80;glass.position.z=4.10;}
  // An occupied home has a wall around its windows. Leave true openings,
  // so the neighborhood still continues beyond the room in the dream.
  const wallShape=new THREE.Shape();wallShape.moveTo(-6.2,0);wallShape.lineTo(7.8,0);wallShape.lineTo(7.8,3.02);wallShape.lineTo(-6.2,3.02);wallShape.closePath();
  for(const z of[-4.8,-1.4,2]){const hole=new THREE.Path(),x=-z,w=.565,b=1.226,t=2.914;hole.moveTo(x-w,b);hole.lineTo(x-w,t);hole.lineTo(x+w,t);hole.lineTo(x+w,b);hole.closePath();wallShape.holes.push(hole);}
  const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(wallShape,{depth:.16,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0xc9bda7,roughness:.96}));wall.name='solid home wall with real neighborhood window openings';wall.rotation.y=Math.PI/2;wall.position.x=-5.98;wall.userData.solidFootprint=true;root.add(wall);
  const positions=[],uv=[],indices=[],colors=[],rows=48,cols=24;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,z=-7.8+(14-2*u)*j/rows,x=-6.1+3.8*u;
    const y=3.02+.60*u+.90*u**3+.12*Math.sin(z*.32)*u;
    positions.push(x,y,z);uv.push(u,j/rows);
    const c=new THREE.Color(0xd8c8af).lerp(new THREE.Color(0xb6c6bd),u*u*.45);colors.push(c.r,c.g,c.b);
    if(i<cols&&j<rows){const a=j*(cols+1)+i,b=a+1,c=a+cols+1;indices.push(a,b,c,b,c+1,c);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const roof=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.96,emissive:0xb9ab92,emissiveIntensity:.30}));roof.name='one home ceiling unfolding upward into the open neighborhood';root.add(roof);
  // A solid cut edge explains the thickness of the lifted plaster sheet.
  const curve=new THREE.CatmullRomCurve3(Array.from({length:49},(_,i)=>{const z=-7.8+12*i/48;return new THREE.Vector3(-2.3,4.52+.12*Math.sin(z*.32),z);}));
  const edge=new THREE.Mesh(new THREE.TubeGeometry(curve,96,.035,8,false),new THREE.MeshStandardMaterial({color:0xc3b395,roughness:.9}));edge.name='joined plaster edge of the unfolding home';root.add(edge);
}
