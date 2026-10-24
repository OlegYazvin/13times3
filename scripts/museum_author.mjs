import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeStoryPerson,shapedTube} from './storybook_figures.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
import glyphs from './assets/museum/grawlix.json' with {type:'json'};

function dishwasherSculpture(){
 const root=new THREE.Group();root.name='The Dishwasher Dilemma — monochrome stone assemblage';
 const marble=new THREE.MeshStandardMaterial({color:0xd8d5c9,roughness:.73});
 const pale=new THREE.MeshStandardMaterial({color:0xc1c1b8,roughness:.73});
 const dark=new THREE.MeshStandardMaterial({color:0x747971,roughness:.70});
 function block(name,pos,size,material=marble,r=.018){const m=new THREE.Mesh(new RoundedBoxGeometry(...size,3,r),material);m.position.fromArray(pos);m.name=name;root.add(m);return m;}
 function plate(parent,name,pos,r=.15,material=marble){
  const profile=[[0,.008],[r*.60,.008],[r*.78,.016],[r*.93,.028],[r,.033],[r,.043],[r*.92,.045],[r*.76,.028],[r*.58,.020],[0,.020]];
  const m=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),material);m.name=name;m.position.fromArray(pos);parent.add(m);return m;
 }
 const jane=makeStoryPerson('Jane',{height:1.70,anatomicalHead:true,anatomicalHands:true,sculptedCloth:true,refinedGarment:true,expression:'angry',headPitch:.34,headYaw:.25,leanZ:.045,
   hands:{'-1':[-.26,1.02,.08],'1':[.22,.98,.35]},elbows:{'-1':[-.33,1.24,-.04],'1':[.29,1.17,.10]},
   handStyles:{'-1':'fist','1':'cup'},handAxes:{'-1':[0,-1,0],'1':[0,0,1]},handNormals:{'-1':[0,0,1],'1':[0,1,0]},
   handPoints:{'1':{plane:{point:[0,.98,0],normal:[0,-1,0]}}},
   ankles:[[-.11,.10,.10],[.13,.10,-.08]],knees:[[-.11,.44,.11],[.13,.47,-.04]]});
 jane.name='Jane carved in stone, exasperated with the dishwasher';jane.position.set(-.37,0,.48);jane.rotation.y=1.55;root.add(jane);
 plate(jane,'plate supported by Jane’s upturned hand',[.22,.9724,.45],.155);
 let features;jane.traverse(o=>{if(o.name.includes('facial features and hairstyle'))features=o;});
 for(const [x,y,z]of[[-.075,.168,.081],[.076,.147,.078],[-.084,.130,.066]]){
  const shape=new THREE.Shape();shape.moveTo(0,.022);shape.bezierCurveTo(-.003,.010,-.012,.002,-.010,-.007);shape.bezierCurveTo(-.008,-.020,.011,-.020,.011,-.007);shape.bezierCurveTo(.012,.002,.003,.010,0,.022);
  const drop=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.005,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,steps:1}),marble);drop.name='raised carved sweat drop';drop.position.set(x,y,z);features.add(drop);
 }
 block('dishwasher left stone cabinet wall',[.18,.46,-.10],[.045,.92,.66]);
 block('dishwasher right stone cabinet wall',[.92,.46,-.10],[.045,.92,.66]);
 block('dishwasher stone back',[.55,.46,-.415],[.78,.92,.045],pale);
 block('dishwasher stone top',[.55,.91,-.10],[.79,.045,.68]);
 block('dishwasher dark recessed kick plate',[.55,.045,-.10],[.70,.09,.56],dark);
 block('dishwasher control fascia',[.55,.835,.245],[.75,.09,.055]);
 shapedTube(root,'carved dishwasher handle',[[.32,.83,.29],[.36,.83,.325],[.74,.83,.325],[.78,.83,.29]],[.014,.014,.014],dark);
 for(let i=0;i<4;i++)block('raised stone control button',[.67+i*.048,.84,.281],[.025,.025,.008],dark,.004);
 block('open hinged dishwasher door',[.55,.10,.59],[.76,.05,.72],pale);
 block('carved detergent dispenser',[.74,.139,.77],[.16,.03,.12],marble,.012);
 for(const height of[.26,.58]){
  const front=height<.4?.75:.17,back=-.34;
  for(const x of[.24,.86])shapedTube(root,'dish rack side rail',[[x,height,back],[x,height,front]],[.008,.008],dark);
  for(let i=0;i<8;i++){const z=back+(front-back)*i/7;shapedTube(root,'dish rack cross rod',[[.24,height,z],[.86,height,z]],[.006,.006],dark);}
  for(const x of[.35,.75])for(let i=0;i<(height<.4?5:3);i++){
   const p=plate(root,'upright stone plate seated in the rack',[x,height+.14,back+.09+i*.13],.13,i%2?pale:marble);p.rotation.x=Math.PI/2;p.rotation.z=.08;
  }
 }
 for(const x of[.23,.87])block('fitted upper-rack runner',[x,.56,-.09],[.06,.035,.53],dark,.007);
 for(const [x,sign]of[[.25,-1],[.85,1]])for(const z of[.36,.67]){
  const profile=[[0,-.012],[.024,-.012],[.049,-.009],[.060,0],[.057,.009],[.047,.014],[.024,.014],[0,.014]];
  const wheel=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),dark);wheel.name='lower-rack roller resting on the open door';wheel.position.set(x,.185,z);wheel.rotation.z=Math.PI/2;root.add(wheel);
  shapedTube(root,'roller fork joining the rack to its axle',[[x+sign*.02,.26,z],[x+sign*.02,.185,z],[x,.185,z]],[.008,.008,.008],dark);
 }
 shapedTube(root,'hinge across the open dishwasher door',[[.22,.10,.245],[.88,.10,.245]],[.013,.013],dark);
 // A fine display arm makes the hanging stone expletive symbols an actual
 // assemblage, rather than unrelated floating text in the gallery.
 const supportPoints=[[.91,0,-.35],[.98,1.8,-.35],[.65,2.18,-.24],[-.15,2.34,-.10],[-.90,2.22,.04]];
 shapedTube(root,'slender support for the suspended stone grawlix',supportPoints,[.010,.009,.007,.007,.006],dark);
 const supportCurve=new THREE.CatmullRomCurve3(supportPoints.map(p=>new THREE.Vector3(...p)));
 let cursor=-.93;
 for(const [i,char]of[...'@#$!'].entries()){
  const d=glyphs.glyphs[char],scale=.44/glyphs.unitsPerEm;
  const paths=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d.path}"/></svg>`).paths;
  const letter=new THREE.Group();letter.name='suspended carved symbol '+char;
  for(const path of paths)for(const shape of SVGLoader.createShapes(path)){
   const geo=new THREE.ExtrudeGeometry(shape,{depth:55,bevelEnabled:true,bevelSize:8,bevelThickness:8,bevelSegments:2,steps:1});geo.scale(scale,scale,scale);letter.add(new THREE.Mesh(geo,dark));
  }
  const y=1.90+Math.sin(i*.9)*.08;letter.position.set(cursor,y,.09);letter.rotation.z=(i-1.5)*-.07;root.add(letter);
  letter.updateWorldMatrix(true,true);const top=new THREE.Vector3(0,-Infinity,0),v=new THREE.Vector3();letter.traverse(o=>{if(o.isMesh)for(let j=0;j<o.geometry.attributes.position.count;j++){v.fromBufferAttribute(o.geometry.attributes.position,j).applyMatrix4(o.matrixWorld);if(v.y>top.y)top.copy(v);}});
  let attachment,distance=Infinity;for(let j=0;j<=240;j++){const p=supportCurve.getPoint(j/240),d=p.distanceToSquared(top);if(p.y>top.y+.01&&d<distance){attachment=p;distance=d;}}
  if(!attachment)throw Error('The stone symbol needs a real suspension point');
  shapedTube(root,'wire meeting the glyph and its display arm',[top.toArray(),attachment.toArray()],[.0025,.0025],dark);cursor+=d.advance*scale+.035;
 }
 return root;
}

window.__authorMuseum=async()=>{
 const source=dishwasherSculpture();source.updateMatrixWorld(true);const baked=new THREE.Group(),groups=new Map();
 let heldPlate;const checkParts=[];source.traverse(o=>{if(o.name==='plate supported by Jane’s upturned hand')heldPlate=o;if(o.isMesh&&['hand-right','shirt','shoe'].includes(o.userData.storyPart))checkParts.push(o);});
 const posedGeometry=o=>{const p=[],v=new THREE.Vector3(),a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);p.push(...v.toArray());}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(o.geometry.index?o.geometry.index.clone():Array.from({length:a.count},(_,i)=>i));return g;};
 const plateGeometry=posedGeometry(heldPlate),probe=sculptSurface(plateGeometry);plateGeometry.computeBoundingBox();const contacts=[];
 for(const part of checkParts){const g=posedGeometry(part),a=g.attributes.position,v=new THREE.Vector3();let gap=Infinity,penetrations=0,depth=0,minY=Infinity;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);minY=Math.min(minY,v.y);const near=probe.nearest(v);gap=Math.min(gap,near.distance);if(near.distance>.001&&plateGeometry.boundingBox.containsPoint(v)&&probe.contains(v)){penetrations++;depth=Math.max(depth,near.distance);}}contacts.push({part:part.userData.storyPart,plateGapM:gap,verticesInsidePlateOver1mm:penetrations,penetrationM:depth,minY});}
 if(contacts.some(c=>c.verticesInsidePlateOver1mm)||contacts.find(c=>c.part==='hand-right').plateGapM>.001||contacts.filter(c=>c.part==='shoe').some(c=>Math.abs(c.minY)>.001))throw Error('The statue contact arrangement failed: '+JSON.stringify(contacts));
 source.traverse(o=>{
  if(!o.isMesh||!o.visible||o.material.transparent)return;
  const material=o.name.includes('symbol')?null:o.material;
  // Native anatomy is baked in its actual pose. Every part is carved stone;
  // photographic textures, painted eyes and cloth maps are absent.
  let tone=0xd8d5c9;if(!o.userData.storyPart&&material?.color){const c=material.color.getHex();if([0x747971,0xc1c1b8].includes(c))tone=c;}
  const key=tone;let list=groups.get(key);if(!list){list=[];groups.set(key,list);}
  const a=o.geometry.attributes.position,v=new THREE.Vector3(),p=[];
  for(let i=0;i<a.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);p.push(v.x,v.y,v.z);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));if(o.geometry.index)geo.setIndex(o.geometry.index.clone());const smooth=mergeVertices(geo,.00001);smooth.computeVertexNormals();list.push(smooth.toNonIndexed());
 });
 for(const [color,geometries]of groups){const mesh=new THREE.Mesh(mergeGeometries(geometries),new THREE.MeshStandardMaterial({color,roughness:.73}));mesh.name='carved stone surfaces '+color.toString(16);baked.add(mesh);}
 baked.name='The Dishwasher Dilemma';baked.userData.museumSculpture=true;
 const model=await new GLTFExporter().parseAsync(baked,{binary:true});
 const base64=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([model]));});
 return {glb:base64,bounds:new THREE.Box3().setFromObject(baked).getSize(new THREE.Vector3()).toArray(),sourceContacts:contacts};
};
