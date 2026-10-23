import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {addRoomLighting,prepareRoomShadows} from '../client/explore/room-lighting.mjs';
import {portalPreviewCamera} from './portal_preview_camera.mjs';
// A framed painting predicts a doorway only when its rays pass through that
// physical rectangle. A symmetric camera aimed into the room shifts the
// horizon and magnifies subjects differently from the live approach.
window.__portalPreview=async(frame)=>{
 const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
 const gltf=await loader.loadAsync(frame.room.modelUrl);
 const scene=new THREE.Scene();scene.background=new THREE.Color(frame.room.backgroundColor);
 addRoomLighting(scene,frame.id);scene.add(gltf.scene);
 const camera=portalPreviewCamera(frame.room);
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 prepareRoomShadows(gltf.scene,frame.id,renderer);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setSize(735,Math.round(735/camera.aspect));
 document.body.append(renderer.domElement);renderer.render(scene,camera);
 const image=renderer.domElement.toDataURL('image/webp',.88);renderer.dispose();
 return image;
};
