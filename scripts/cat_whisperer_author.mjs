import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeStoryPerson,shapedTube} from './storybook_figures.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
const STONE=0xd8d5c9,PALE=0xc1c1b8,DETAIL=0x96998f;
const material=tone=>new THREE.MeshStandardMaterial({color:tone,roughness:.76});
function posedGeometry(o){const p=[],v=new THREE.Vector3(),a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);p.push(...v.toArray());}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(o.geometry.index?o.geometry.index.clone():Array.from({length:a.count},(_,i)=>i));return g;}
function combined(parts){return mergeGeometries(parts.map(o=>posedGeometry(o).toNonIndexed()));}
function query(parts){const g=mergeVertices(combined(parts),.000001);return sculptSurface(g);}
export async function catWhisperer(){
 const root=new THREE.Group();root.name='Cat Whisperer';
 const catSources=await Promise.all(['sitting','walking'].map(n=>new GLTFLoader().loadAsync('/cat-'+n+'.glb')));
 function cat(name,kind,scale,position,yaw,tone=STONE){
  const g=catSources[kind==='walking'?1:0].scene.clone(true);g.name=name;g.scale.setScalar(scale);g.position.fromArray(position);g.rotation.y=yaw;g.userData.sculpturePart=name;root.add(g);
  g.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();o.visible=!/glint|iris/i.test(o.name);o.material=material(/pupil|nose/i.test(o.name)?DETAIL:/pinna/i.test(o.name)?PALE:tone);o.userData.stoneTone=o.material.color.getHex();
   // Restrain the source's protruding cartoon eye spheres. Carved, unpainted
   // eyeballs and a small inset pupil belong to the stone sculpture language.
   if(/Dark_eye_socket/.test(o.name))o.scale.multiplyScalar(.76);
   if(/Eye_pupil/.test(o.name))o.scale.multiplyScalar(.60);
  });return g;
 }
 const jane=makeStoryPerson('Jane',{height:1.37,stature:1.68,seated:true,hipY:.53,anatomicalHead:true,anatomicalHands:true,sculptedCloth:true,refinedGarment:true,expression:'tender',headYaw:-.55,headTilt:.08,headPitch:.10,
  knees:[[-.14,.47,.35],[.15,.46,.30]],ankles:[[-.15,.10,.46],[.17,.10,.38]],
  hands:{'-1':[-.25,1.045,.015],'1':[-.09,.7815,.30]},elbows:{'-1':[-.34,.84,.06],'1':[.31,.84,.13]},
  handStyles:{'-1':'cup','1':'touch'},handAxes:{'-1':[0,1,0],'1':[-.6,-.8,0]},handNormals:{'-1':[1,0,0],'1':[0,0,1]},
  handPoints:{'-1':{plane:{point:[-.215,0,0],normal:[-1,0,0]}}}});
 jane.name='Seated Jane, gently attending to her cats';jane.userData.sculpturePart='Jane';root.add(jane);
 // A carved stool provides a real seat, with an open underside and joined legs.
 const seat=new THREE.Mesh(new RoundedBoxGeometry(.48,.075,.37,4,.035),material(PALE));seat.position.set(0,.40,-.025);seat.name='carved stool seat supporting Jane';seat.userData.sculpturePart='stool';root.add(seat);
 for(const x of[-.17,.17])for(const z of[-.14,.10])shapedTube(root,'tapered stool leg',[[x*1.16,0,z*1.18],[x,.39,z]],[.026,.033],material(PALE));
 for(const z of[-.14,.10])shapedTube(root,'stool cross stretcher',[[-.18,.19,z],[.18,.19,z]],[.015,.015],material(PALE));
 const shoulder=cat('shoulder cat','sitting',.62,[-.17,1.015,.015],-Math.PI/2);
 const lap=cat('lap cat','sitting',.78,[-.025,.57,.30],0,PALE);
 const waiting=cat('cat beside her left foot','sitting',1.02,[-.67,0,.30],-Math.PI/2+.25);
 const walking=cat('cat circling the stool','walking',.90,[.58,0,-.12],.65,PALE);
 root.updateMatrixWorld(true);
 // Fit the weight-bearing lower surfaces to the actual posed garment. The
 // smooth falloff preserves the legs and haunches instead of burying the cat.
 const garments=[];jane.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='shirt')garments.push(o);});
 const trousers=[];jane.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='trousers')trousers.push(o);});
 const shirtSurface=query(garments),collar=[];
 for(const [x,y]of[[-.075,1.044],[-.060,1.019],[-.033,.996],[0,.989],[.033,.996],[.060,1.019],[.075,1.044]]){const p=shirtSurface(new THREE.Vector3(x,y,.5),new THREE.Vector3(0,0,-1));if(p)collar.push([p.x,p.y,p.z+.001]);}
 if(collar.length>2){const trim=shapedTube(root,'carved sweater neckline following the shoulder cloth',collar,[.002,.002,.002],material(PALE));trim.userData.sculpturePart='Jane';}
 function settle(g,supportParts,base,falloff,maxShift){
  const surface=query(supportParts),v=new THREE.Vector3(),origin=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0);let fitted=0,maxDeform=0;
  g.traverse(o=>{if(!o.isMesh||!o.visible)return;const inv=o.matrixWorld.clone().invert(),a=o.geometry.attributes.position;
   for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(v.y>base+falloff)continue;origin.set(v.x,base+.16,v.z);const hit=surface(origin,down);if(!hit||Math.abs(hit.y-base)>maxShift)continue;const shift=(hit.y-base)*Math.max(0,1-(v.y-base)/falloff);v.y+=shift;maxDeform=Math.max(maxDeform,Math.abs(shift));v.applyMatrix4(inv);a.setXYZ(i,v.x,v.y,v.z);fitted++;}o.geometry.computeVertexNormals();
  });return {fittedVertices:fitted,maxDeformM:maxDeform};
 }
 const shoulderFit=settle(shoulder,garments,1.015,.085,.075);
 const lapFit=settle(lap,trousers,.57,.085,.08);
 root.updateMatrixWorld(true);
 // Contact measurements are emitted for review and preserved alongside the
 // exported evidence. They describe this actual pose, not a generic cat model.
 function contact(a,b){const v=new THREE.Vector3();let gap=Infinity;for(const [first,second]of [[a,b],[b,a]]){const surface=query(second);for(const o of first){const g=posedGeometry(o),p=g.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);gap=Math.min(gap,surface.nearest(v).distance);}}}return gap;}
 const meshes=g=>{const r=[];g.traverse(o=>{if(o.isMesh&&o.visible&&!o.material.transparent)r.push(o);});return r;};
 const leftHand=[],rightHand=[];jane.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='hand-left')leftHand.push(o);if(o.isMesh&&o.userData.storyPart==='hand-right')rightHand.push(o);});
 const contacts={shoulderFit,lapFit,shoulderToShirtM:contact(meshes(shoulder),garments),lapToTrousersM:contact(meshes(lap),trousers),leftHandToShoulderCatM:contact(leftHand,meshes(shoulder)),rightHandToLapCatM:contact(rightHand,meshes(lap)),stoolToTrousersM:contact([seat],trousers)};
 function handPenetration(hand,cat){const surface=query(meshes(cat).filter(o=>o.name==='Continuous_anatomical_skin')),v=new THREE.Vector3();let vertices=0,maxDepth=0;for(const o of hand){const a=posedGeometry(o).attributes.position;for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);const n=surface.nearest(v);if(n.distance>.001&&surface.contains(v)){vertices++;maxDepth=Math.max(maxDepth,n.distance);}}}return {verticesInsideOver1mm:vertices,maxDepthM:maxDepth};}
 contacts.leftHandPenetration=handPenetration(leftHand,shoulder);contacts.rightHandPenetration=handPenetration(rightHand,lap);
 if(['shoulderToShirtM','lapToTrousersM','leftHandToShoulderCatM','rightHandToLapCatM','stoolToTrousersM'].some(k=>contacts[k]>.002)||contacts.leftHandPenetration.verticesInsideOver1mm||contacts.rightHandPenetration.verticesInsideOver1mm)throw Error('Cat Whisperer support/contact check failed: '+JSON.stringify(contacts));
 const baked=new THREE.Group();baked.name='Cat Whisperer';baked.userData.museumSculpture=true;baked.userData.cats=4;
 // Keep named objects for independent exported contact and support checks,
 // but batch their surfaces into the small shared stone palette.
 const groups=new Map();
 root.traverse(o=>{if(!o.isMesh||!o.visible||o.material.transparent)return;let owner=o;while(owner.parent&&owner.parent!==root&&!owner.userData.sculpturePart)owner=owner.parent;const part=owner.userData.sculpturePart||'stool',tone=o.userData.stoneTone??(part==='Jane'?STONE:o.material.color.getHex());const key=part+':'+tone;
  if(!groups.has(key))groups.set(key,{part,tone,geometries:[]});const g=mergeVertices(posedGeometry(o),.00001);g.computeVertexNormals();groups.get(key).geometries.push(g.toNonIndexed());
 });
 for(const {part,tone,geometries}of groups.values()){const m=new THREE.Mesh(mergeGeometries(geometries),material(tone));m.name=part+' — carved stone';m.userData.sculpturePart=part;baked.add(m);}
 baked.updateMatrixWorld(true);return {baked,contacts,bounds:new THREE.Box3().setFromObject(baked)};
}
window.__authorCatWhisperer=async()=>{const {baked,contacts,bounds}=await catWhisperer();window.__catSculpture=baked;const glb=await new GLTFExporter().parseAsync(baked,{binary:true});const data=await new Promise(resolve=>{const f=new FileReader();f.onload=()=>resolve(f.result);f.readAsDataURL(new Blob([glb]));});return {glb:data,contacts,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};};
