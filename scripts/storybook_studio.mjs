import * as THREE from 'three';
import {makeStoryPerson} from './storybook_figures.mjs';
const scene=new THREE.Scene();scene.background=new THREE.Color(0xdcd1bf);
scene.add(new THREE.HemisphereLight(0xe7eff4,0x88705c,2.0));
const key=new THREE.DirectionalLight(0xffe0b6,2.4);key.position.set(-3,5,4);scene.add(key);
const root=new THREE.Group();scene.add(root);
for(const [name,x,opts] of [
 ['Jane',-1.25,{height:1.68,shirt:0x58717c}],['Oleg',-.4,{height:1.76,shirt:0xd8cbb6}],
 ['Zephrine',.36,{height:1.04,shirt:0xc59383,dress:true,skirt:0xbd8997}],['G',1.12,{height:1.62,shirt:0xc8bba1}],
]){const p=makeStoryPerson(name,opts);p.position.x=x;root.add(p);}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xbeb8a9,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1100,800);renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.style.margin=0;document.body.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1100/800,.03,100);
window.__studio=(angle=0,close=false)=>{root.rotation.y=angle;camera.position.set(close?-.35:0,close?1.59:1.5,close?1.05:4.4);camera.lookAt(close?-.35:0,close?1.59:.94,0);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');};
window.__studio();

// Isolate the child for reference-guided hair silhouette checks.
window.__studioChild=(angle=0)=>{
 root.rotation.y=angle;
 const target=new THREE.Vector3(.36,.93,0).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
 camera.position.copy(target).add(new THREE.Vector3(0,.015,.67));camera.lookAt(target);
 for(const p of root.children)p.visible=p.userData.identity==='Zephrine';
 renderer.render(scene,camera);const image=renderer.domElement.toDataURL('image/png');
 for(const p of root.children)p.visible=true;return image;
};
