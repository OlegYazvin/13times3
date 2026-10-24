import * as THREE from 'three';
import {makeStoryPerson} from './storybook_figures.mjs';
import {anatomicalHead} from './anatomical_heads.mjs';
import {sculptSurface} from './sculpt_surface.mjs';

// Six moments of the same toddler around one impossible, gently curving table.
// The earlier clothed lap memory remains a complete coupled arrangement.
export const FOOD_MEMORIES=['nigiri','avocado','blueberries','rice','smoothie','chicken'];
export const foodSeat=(i)=>{const x=-2.25+i*.90;return {x,z:.10+.15*x*x,yaw:-x*.06};};
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.82});
const M={wood:mat(0x9c7050),edge:mat(0xc29a71),chair:mat(0x71968c),cream:mat(0xf1e2ca),rice:mat(0xf3e8ce),salmon:mat(0xe29276),salmonLight:mat(0xf5c0a1),green:mat(0xc8d187),skin:mat(0x4f704b),pit:mat(0x94704c),berry:mat(0x4f607f),bloom:mat(0x8294b3),chicken:mat(0xb87943),chickenLight:mat(0xd5a36c),metal:new THREE.MeshStandardMaterial({color:0xb6c3be,metalness:.55,roughness:.36}),smoothie:mat(0xbb819d),straw:mat(0xe8cf9a)};
function mesh(parent,name,g,m,p=[0,0,0]){const o=new THREE.Mesh(g,m);o.name=name;o.position.fromArray(p);parent.add(o);return o;}
function ellipsoid(parent,name,p,r,m){const g=new THREE.SphereGeometry(1,28,18);g.scale(...r);return mesh(parent,name,g,m,p);}
function tube(parent,name,points,r,m){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(parent,name,new THREE.TubeGeometry(path,24,r,10,false),m);}
function timber(parent,name,a,b,r=.026,m=M.wood){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from);const o=mesh(parent,name,new THREE.CylinderGeometry(r*.87,r,d.length(),16),m,from.add(to).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function bowl(parent,p,r=.087){const points=[[0,.002],[.035,.002],[r*.92,.025],[r,.050],[r*.98,.057],[r*.91,.057],[r*.86,.030],[.029,.010],[0,.010]].map(([x,y])=>new THREE.Vector2(x,y));return mesh(parent,'small ceramic eating bowl with a real hollow interior',new THREE.LatheGeometry(points,48),M.cream,p);}
function plate(parent,p){const points=[[0,0],[.065,0],[.10,.008],[.12,.025],[.12,.030],[.112,.031],[.09,.017],[0,.010]].map(([x,y])=>new THREE.Vector2(x,y));return mesh(parent,'glazed toddler plate resting on the table',new THREE.LatheGeometry(points,48),M.cream,p);}
function grains(parent,center,n=38,spread=.055){for(let i=0;i<n;i++){const a=i*2.399,r=spread*Math.sqrt((i+.5)/n);const grain=ellipsoid(parent,'separate cooked rice grain',[center[0]+Math.cos(a)*r,center[1]+.004+(1-r/spread)*.015,center[2]+Math.sin(a)*r],[.0048,.0025,.0026],M.rice);grain.rotation.y=i*1.73;}}
function nigiri(parent,p){const food=new THREE.Group();food.name='salmon nigiri with formed rice and a draped salmon slice';food.position.fromArray(p);parent.add(food);ellipsoid(food,'oblong formed sushi rice',[0,0,0],[.044,.019,.026],M.rice);for(let i=0;i<22;i++){const a=i*2.399;ellipsoid(food,'rice texture on the nigiri',[Math.cos(a)*.033,.010+Math.sin(i*1.7)*.004,Math.sin(a)*.018],[.005,.003,.0025],M.rice);}
 const pos=[],idx=[],rows=18,cols=20;for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const x=(c/cols-.5)*.105,z=(r/rows-.5)*.063;pos.push(x,.018+.007*Math.cos(x/.052*Math.PI/2)-.012*(Math.abs(x)/.052)**5,z);if(r<rows&&c<cols){const a=r*(cols+1)+c;idx.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const material=M.salmon.clone();material.side=THREE.DoubleSide;mesh(food,'curved salmon slice lying across the rice',g,material);for(let i=-2;i<=2;i++)tube(food,'cream salmon marbling seated in the fish',[[-.040,.019,i*.009-.004],[0,.025,i*.009],[.040,.019,i*.009+.004]],.00085,M.salmonLight);return food;}
function avocado(parent,p,scale=1){const group=new THREE.Group();group.name='curved avocado slice with pale flesh and dark green skin';group.position.fromArray(p);group.scale.setScalar(scale);parent.add(group);const shape=new THREE.Shape();shape.moveTo(-.040,0);shape.quadraticCurveTo(-.030,.060,.036,.073);shape.quadraticCurveTo(.014,.038,-.016,.008);shape.quadraticCurveTo(-.030,-.003,-.040,0);const g=new THREE.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:3,curveSegments:24});g.translate(0,0,-.008);mesh(group,'avocado flesh in a curved hand-sized wedge',g,M.green);tube(group,'continuous avocado skin on the outer edge',[[-.038,.002,0],[-.028,.036,0],[.002,.061,0],[.036,.073,0]],.004,M.skin);return group;}
function berry(parent,p,r=.009){const b=ellipsoid(parent,'blueberry with a dusty blue bloom',p,[r,r*.94,r],M.berry);const crown=[];for(let i=0;i<=10;i++){const a=i*Math.PI/5,rr=r*(i%2?.25:.46);crown.push([p[0]+Math.cos(a)*rr,p[1]+r*.92,p[2]+Math.sin(a)*rr]);}tube(parent,'five-point blueberry calyx attached to the fruit',crown,.0009,M.bloom);return b;}
function chicken(parent,p,scale=1){const g=new THREE.Group();g.name='golden cooked chicken piece with a pale bitten edge';g.position.fromArray(p);g.scale.setScalar(scale);parent.add(g);const o=ellipsoid(g,'irregular cooked chicken bite',[0,0,0],[.034,.018,.025],M.chicken);const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)*(1+.09*Math.sin(a.getX(i)*150+a.getZ(i)*130)));o.geometry.computeVertexNormals();ellipsoid(g,'pale interior at the bitten chicken edge',[-.024,.003,-.001],[.013,.013,.019],M.chickenLight);return g;}
function chair(parent,person){const g=new THREE.Group();g.name='joined toddler dining chair with a supported seat and grounded feet';g.userData.solidFootprint=true;parent.add(g);const seatGeometry=new THREE.SphereGeometry(1,96,64);seatGeometry.scale(.195,.026,.185);const seat=mesh(g,'formed child seat supporting the clothed pelvis',seatGeometry,M.chair,[0,.245,-.015]);
 parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),surfaces=[];
 person.traverse(o=>{if(!o.isMesh||o.userData.storyPart!=='trousers')return;const geo=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));surfaces.push(sculptSurface(geo));});
 const a=seat.geometry.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).add(seat.position);if(v.y<=.245)continue;const hits=surfaces.map(probe=>probe(new THREE.Vector3(v.x,.13,v.z),new THREE.Vector3(0,1,0))).filter(Boolean);if(hits.length){const y=Math.min(...hits.map(p=>p.y));a.setY(i,THREE.MathUtils.clamp(y-.00060,.224,.30)-seat.position.y);}}
 seat.geometry.computeVertexNormals();for(const x of[-.14,.14])for(const z of[-.13,.13])timber(g,'tapered chair leg joined to the seat',[x*1.12,.017,z*1.1],[x,.28,z]);for(const x of[-.155,.155])timber(g,'chair upright joined to its curved back',[x,.26,-.15],[x,.65,-.17]);tube(g,'rounded open back of the toddler chair',[[-.155,.63,-.17],[0,.69,-.185],[.155,.63,-.17]],.025,M.chair);return g;}
function foodFigure(parent,id,i){
 const height=.92,head=anatomicalHead('Zephrine',{child:true,skin:0xefc3a5,hair:0x80593e,expression:'joy'},.245),pitch=.10;
 const lip=new THREE.Vector3(0,head.mouthT*.245,head.front(0,head.mouthT)).applyEuler(new THREE.Euler(pitch,0,0)).add(new THREE.Vector3(0,height-.245,0));
 const bite=lip.clone().add(new THREE.Vector3(.012,-.008,.039));
 const opt={height,stature:1.04,seated:true,hipY:.34,child:true,dress:false,refinedGarment:true,sculptedCloth:true,anatomicalHead:true,anatomicalHands:true,expression:'joy',headPitch:pitch,gazeY:-.0014,shirt:[0xc18a70,0xc6ae75,0x9d91ac,0x8eac9a,0xc58f9f,0x8ba4b2][i],pants:0x66727b,shoes:0x99846b,knees:[[-.075,.30,.19],[.075,.30,.19]],ankles:[[-.082,.10,.26],[.082,.10,.26]],hands:{'-1':[-.12,.525,.31],'1':bite.clone().add(new THREE.Vector3(.015,-.034,.018)).toArray()},handStyles:{'-1':'normal','1':'cup'},handNormals:{'-1':[0,-1,0],'1':[0,1,0]},handAxes:{'-1':[0,0,1],'1':[-.10,0,-1]},handPoints:{'-1':{plane:{point:[0,.526,0],normal:[0,1,0]}},'1':{plane:{point:[0,bite.y-.024,0],normal:[0,-1,0]}}},elbows:{'-1':[-.20,.48,.17],'1':[.24,.50,.17]}};
 if(id==='smoothie'){
  opt.hands={'-1':[-.046,.644,.178],'1':[.046,.644,.178]};opt.handStyles={'-1':'normal','1':'normal'};opt.handGrips={'-1':true,'1':true};opt.handCurls={'-1':.75,'1':.75};opt.thumbTurns={'-1':0,'1':0};opt.handNormals={'-1':[1,0,0],'1':[-1,0,0]};opt.handAxes={'-1':[0,1,0],'1':[0,1,0]};opt.handPoints={'-1':{plane:{point:[-.047,0,0],normal:[-1,0,0]}},'1':{plane:{point:[.047,0,0],normal:[1,0,0]}}};
 }
 if(id==='blueberries'){
  opt.handStyles['1']='cup';opt.handPoints['1']={plane:{point:[0,bite.y-.010,0],normal:[0,-1,0]}};
 }
 if(id==='rice'){
  opt.handStyles['1']='write';opt.handNormals['1']=[0,1,0];opt.handAxes['1']=[-.30,0,-.954];opt.handPoints['1']={paper:lip.clone().add(new THREE.Vector3(.006,-.012,.020)).toArray()};
 }
 let person=makeStoryPerson('Zephrine',opt);person.name='toddler Zephrine enjoying '+id;person.userData.foodMemory=id;parent.add(person);
 const props=new THREE.Group();props.name='food and utensils physically arranged with Zephrine: '+id;props.userData.foodProps=id;parent.add(props);
 // Tabletop is exactly .526 m at the occupied stations.
 if(id==='nigiri'){nigiri(props,bite.toArray());plate(props,[.03,.527,.37]);nigiri(props,[.015,.57,.37]);}
 if(id==='avocado'){const held=avocado(props,bite.clone().add(new THREE.Vector3(-.028,-.019,0)).toArray(),.85);held.rotation.z=-1.0;plate(props,[.03,.527,.37]);const half=ellipsoid(props,'half avocado resting skin down on the plate',[.025,.565,.37],[.056,.023,.085],M.skin);ellipsoid(props,'pale green cut surface of the avocado',[.025,.580,.37],[.051,.010,.078],M.green);ellipsoid(props,'rounded avocado stone seated in the cut fruit',[.025,.589,.38],[.026,.014,.030],M.pit);}
 if(id==='blueberries'){berry(props,bite.toArray());berry(props,bite.clone().add(new THREE.Vector3(.012,.003,.006)).toArray(),.008);berry(props,bite.clone().add(new THREE.Vector3(-.010,.001,.007)).toArray(),.008);bowl(props,[.02,.527,.36]);for(let j=0;j<28;j++){const a=j*2.399,r=.065*Math.sqrt((j+.5)/28);berry(props,[.02+Math.cos(a)*r,.566+.015*(1-r/.065),.36+Math.sin(a)*r],.009);}}
 if(id==='rice'){
  bowl(props,[-.055,.527,.36]);grains(props,[-.055,.561,.36],54,.065);
  let shaft;const remove=[];person.traverse(o=>{if(o.name==='pencil pinched between anatomical thumb and index')shaft=o;if(o.name==='sharpened pencil tip touching the signup paper')remove.push(o);});for(const o of remove)o.removeFromParent();
  if(!shaft)throw Error('The spoon needs an actual fitted thumb/index grip');shaft.name='slender spoon handle pinched between thumb and index';shaft.material=M.metal;shaft.userData.storyPart='eating-spoon';
  const tip=new THREE.Vector3(...opt.handPoints['1'].paper),a=shaft.geometry.attributes.position,from=new THREE.Vector3(),to=new THREE.Vector3();for(let k=0;k<16;k++){from.add(new THREE.Vector3().fromBufferAttribute(a,k));to.add(new THREE.Vector3().fromBufferAttribute(a,a.count-16+k));}from.divideScalar(16);to.divideScalar(16);const d=from.sub(to).normalize();
  const spoon=ellipsoid(props,'shallow oval spoon bowl carrying rice to the lips',tip.toArray(),[.012,.003,.021],M.metal);spoon.rotation.y=Math.atan2(d.x,d.z);grains(props,[tip.x,tip.y+.003,tip.z],7,.009);
 }
 if(id==='smoothie'){
  const g=new THREE.CylinderGeometry(.045,.035,.122,48);mesh(props,'small smoothie cup held between both hands',g,M.smoothie,[0,.635,.178]);mesh(props,'closed straw lid seated on the smoothie cup',new THREE.CylinderGeometry(.047,.047,.008,48),M.cream,[0,.700,.178]);tube(props,'bent drinking straw meeting Zephrine’s lips',[[.003,.701,.178],[.003,.733,.172],[lip.x,lip.y,lip.z+.0015]],.0032,M.straw);plate(props,[.02,.527,.36]);
 }
 if(id==='chicken'){chicken(props,bite.toArray());plate(props,[.02,.527,.36]);for(let k=0;k<3;k++)chicken(props,[-.025+k*.034,.561,.35+(k%2)*.03],.76);}
 // Fit the real hand surface to its own carried food, then rebuild the whole
 // arm from that wrist. Moving a food beside a floating hand is insufficient.
 if(id!=='rice'){
  for(let pass=0;pass<2;pass++){
   parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),targets=[];
   props.traverse(o=>{if(!o.isMesh)return;if(id==='smoothie'&&!o.name.startsWith('small smoothie cup'))return;
    const geo=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));geo.computeBoundingBox();if(id!=='smoothie'&&geo.boundingBox.min.y<.60)return;if(!geo.index)geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i));targets.push(sculptSurface(geo));
   });
   let changed=false;
   for(const sign of id==='smoothie'?[-1,1]:[1]){
    let closest=null,distance=Infinity;const v=new THREE.Vector3();
    person.traverse(o=>{if(!o.isMesh||o.userData.storyPart!==(sign<0?'hand-left':'hand-right'))return;const matrix=inverse.clone().multiply(o.matrixWorld),a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(matrix);for(const probe of targets){const hit=probe.nearest(v);if(hit.distance<distance){distance=hit.distance;closest=hit.point.clone().sub(v);}}}});
    if(distance>.001&&closest){closest.multiplyScalar((distance-.00045)/distance);opt.hands[sign]=new THREE.Vector3(...opt.hands[sign]).add(closest).toArray();const plane=opt.handPoints[sign]?.plane;if(plane)plane.point=new THREE.Vector3(...plane.point).add(closest).toArray();changed=true;}
   }
   if(!changed)break;
   person.removeFromParent();person=makeStoryPerson('Zephrine',opt);person.name='toddler Zephrine enjoying '+id;person.userData.foodMemory=id;parent.add(person);
  }
 }
 parent.userData.mouth=lip.toArray();parent.userData.bitePoint=bite.toArray();chair(parent,person);
}
function diningTable(root){
 const table=new THREE.Group();table.name='one curving family table linking the six food memories';root.add(table);
 // Adjacent closed sections meet at shared coordinates. Their real footprints
 // leave the table's concavity walkable without invisible proxy geometry.
 const sides=24;
 for(let section=0;section<8;section++){
  const points=[],idx=[],rows=12,x0=-2.65+section*.6625;
  for(let i=0;i<=rows;i++){
   const x=x0+i*.6625/rows,z=.10+.15*x*x+.39;
   for(let side=0;side<=sides;side++){
    const a=side/sides*Math.PI*2;points.push(x,.488+Math.cos(a)*.038,z+Math.sin(a)*.30);
    if(i<rows&&side<sides){const n=i*(sides+1)+side;idx.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
   }
  }
  for(const end of[0,rows])for(let side=1;side<sides-1;side++){if((end===0&&section!==0)||(end===rows&&section!==7))continue;const b=end*(sides+1);if(end===0)idx.push(b,b+side+1,b+side);else idx.push(b,b+side,b+side+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(idx);g.computeVertexNormals();
  const top=mesh(table,'solid rounded curved dining tabletop section',g,M.edge);top.userData.solidFootprint=true;
 }
 for(const x of[-2.4,-.9,.9,2.4]){
  const z=.10+.15*x*x+.39,support=new THREE.Group();support.name='joined splayed dining table trestle';support.userData.solidFootprint=true;table.add(support);
  for(const dz of[-.20,.20])timber(support,'splayed table trestle leg',[x,.018,z+dz],[x,.48,z+dz*.55],.037);
  timber(support,'table trestle crosspiece',[x-.23,.17,z],[x+.23,.17,z],.024);
 }

}
export function composeFoodMemories(root){
 // Move the original family, chair, rug and side table together; preserve every
 // internal supporting contact from the accepted clothed arrangement.
 const family=new THREE.Group();family.name='preserved clothed lap memory beside the family table';root.add(family);const pivot=new THREE.Vector3(0,0,3.15);
 for(const o of [...root.children]){if(o===family)continue;if(o.userData.storyIdentity||o.name==='solid deeply cushioned nursing chair'||/rug|woven.*edge|small turned side table|irregular stitched thread/.test(o.name)){family.attach(o);o.position.sub(pivot);}}
 family.position.set(-2.55,0,-1.70);family.rotation.y=.18;
 const sideTable=family.children.find(o=>o.name==='small turned side table beside the nursing chair');if(sideTable)sideTable.position.set(-1.10,-.02,-.05);
 const rug=new THREE.Group();rug.name='woven family rug fitted to the quiet corner';family.add(rug);
 for(const o of [...family.children])if(o!==rug&&/rug|woven.*edge|irregular stitched thread/.test(o.name))rug.attach(o);
 rug.scale.set(.72,1,.85);
 diningTable(root);
 for(let i=0;i<6;i++){const at=foodSeat(i),station=new THREE.Group();station.name='Zephrine food memory — '+FOOD_MEMORIES[i];station.userData.foodStation=FOOD_MEMORIES[i];station.position.set(at.x,0,at.z);station.rotation.y=at.yaw;root.add(station);foodFigure(station,FOOD_MEMORIES[i],i);}
 root.userData.foodMemories=FOOD_MEMORIES;
}
