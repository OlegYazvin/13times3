// Decode exported geometry and bone poses without DOM texture loading.
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
export async function sceneGeometryFromGLB(bytes){
const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length).toString());
// Geometry and skinning are unchanged. Textures are irrelevant to surface
// distances and removing their references avoids a DOM image decoder in Node.
function untexture(value){if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(/Texture$/.test(key))delete value[key];else untexture(value[key]);}}
for(const material of json.materials||[])untexture(material);
delete json.images;delete json.textures;delete json.samplers;
const encoded=Buffer.from(JSON.stringify(json)),padding=(4-encoded.length%4)%4,chunk=Buffer.concat([encoded,Buffer.alloc(padding,32)]),binary=bytes.subarray(20+length);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+chunk.length+binary.length,8);header.writeUInt32LE(chunk.length,12);header.writeUInt32LE(0x4e4f534a,16);
const clean=Buffer.concat([header,chunk,binary]),loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
const gltf=await loader.parseAsync(clean.buffer.slice(clean.byteOffset,clean.byteOffset+clean.byteLength),'');
gltf.scene.updateMatrixWorld(true);return gltf.scene;
}
