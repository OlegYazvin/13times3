import * as THREE from 'three';
import {makeStoryPerson} from './storybook_figures.mjs';
import {BLUEBERRY_ACTORS} from './scene07_arrangement.mjs';
import {WEANING_ACTORS} from './scene06_arrangement.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdcd1bf);
scene.add(new THREE.HemisphereLight(0xe7eff4,0x88705c,2.0));
const key=new THREE.DirectionalLight(0xffe0b6,2.4);key.position.set(-3,5,4);scene.add(key);
const root=new THREE.Group();scene.add(root);
for(const [name,x,opts] of [
 ['Jane',-1.25,{height:1.68,shirt:0x58717c}],['Oleg',-.4,{height:1.76,shirt:0xd8cbb6}],
 ['Zephrine',.36,{height:1.04,shirt:0xc59383,dress:true,skirt:0xbd8997}],['G',1.12,{height:1.62,shirt:0xc8bba1}],
]){const p=makeStoryPerson(name,{...opts,sculptedCloth:true,refinedGarment:true,anatomicalHead:true,anatomicalHands:true});p.position.x=x;root.add(p);}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xbeb8a9,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,800);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.style.margin=0;document.body.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1100/800,.03,100);
window.__studio=(angle=0,close=false)=>{root.rotation.y=angle;camera.position.set(close?-.35:0,close?1.59:1.5,close?1.05:4.4);camera.lookAt(close?-.35:0,close?1.59:.94,0);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');};
window.__studio();

const bentStudy=new THREE.Group();scene.add(bentStudy);bentStudy.visible=false;
const adult=makeStoryPerson('Oleg',{height:1.76,shirt:0x587384,sculptedCloth:true,hands:{'-1':[-.133,1.22,.276],'1':[.204,1.22,.229]},elbows:{'-1':[-.38,1.12,.22],'1':[.38,1.12,.22]},handNormals:{'-1':[0,0,-1],'1':[0,0,-1]},grip:true});
const child=makeStoryPerson('Zephrine',{height:1.04,shirt:0xc0918d,sculptedCloth:true,hands:{'1':[.39,.72,.02]},elbows:{'1':[.29,.66,.04]},dress:false});child.position.x=.8;
bentStudy.add(adult,child);
window.__studioBent=(angle=0)=>{root.visible=false;bentStudy.visible=true;bentStudy.rotation.y=angle;camera.position.set(0,1.3,3);camera.lookAt(0,1.16,0);renderer.render(scene,camera);const result=renderer.domElement.toDataURL('image/png');root.visible=true;bentStudy.visible=false;return result;};

const carryStudy=new THREE.Group();scene.add(carryStudy);carryStudy.visible=false;
for(const identity of ['Oleg','Zephrine']){
 const {position,yaw,options}=BLUEBERRY_ACTORS[identity];
 const model=makeStoryPerson(identity,{...options,sculptedCloth:true,anatomicalHead:true,anatomicalHands:true});
 model.position.set(position[0]+.58,position[1],position[2]-3.12);model.rotation.y=yaw;carryStudy.add(model);
}
window.__studioCarry=(angle=0)=>{root.visible=false;carryStudy.visible=true;carryStudy.rotation.y=angle;camera.position.set(0,1.55,2.5);camera.lookAt(0,1.5,0);renderer.render(scene,camera);const result=renderer.domElement.toDataURL('image/png');root.visible=true;carryStudy.visible=false;return result;};

const weaningStudy=new THREE.Group();scene.add(weaningStudy);weaningStudy.visible=false;
for(const identity of ['Jane','Zephrine']){
 const {position,yaw,roll=0,options}=WEANING_ACTORS[identity],p=makeStoryPerson(identity,{...options,sculptedCloth:true,anatomicalHead:true,anatomicalHands:true});
 const pose=new THREE.Group();pose.position.set(position[0],position[1],position[2]-2.15);pose.rotation.set(0,yaw,roll);pose.add(p);weaningStudy.add(pose);
}
window.__studioWeaning=(angle=0)=>{root.visible=false;weaningStudy.visible=true;weaningStudy.rotation.y=angle;camera.position.set(0,1.13,2.8);camera.lookAt(0,.86,.22);renderer.render(scene,camera);const result=renderer.domElement.toDataURL('image/png');root.visible=true;weaningStudy.visible=false;return result;};

// Isolate the child for reference-guided hair silhouette checks.
window.__studioChild=(angle=0)=>{
 root.rotation.y=angle;
 const target=new THREE.Vector3(.36,.93,0).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
 camera.position.copy(target).add(new THREE.Vector3(0,.015,.67));camera.lookAt(target);
 for(const p of root.children)p.visible=p.userData.identity==='Zephrine';
 renderer.render(scene,camera);const image=renderer.domElement.toDataURL('image/png');
 for(const p of root.children)p.visible=true;return image;
};
