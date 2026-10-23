import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

// Reject invalid authoring indices before welding can obscure their cause.
// This checks data integrity, not silhouette, intersections or artistic merit.
export async function validateGalleryGeometry(path){
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const bytes=await readFile(path);await MeshoptDecoder.ready;
 const doc=await io.readBinary(bytes),meshes=doc.getRoot().listMeshes();
 let primitives=0,vertices=0,triangles=0;
 for(const mesh of meshes)for(const primitive of mesh.listPrimitives()){
  const position=primitive.getAttribute('POSITION'),normal=primitive.getAttribute('NORMAL'),name=mesh.getName()||'unnamed mesh';
  if(!position||!normal||normal.getCount()!==position.getCount())throw Error(`${path}: incomplete position/normal surfaces in ${name}`);
  for(const attribute of[position,normal])for(const value of attribute.getArray())if(!Number.isFinite(value))throw Error(`${path}: nonfinite surface data in ${name}`);
  const index=primitive.getIndices(),count=position.getCount();
  if(index)for(const value of index.getArray())if(value<0||value>=count)throw Error(`${path}: index ${value} outside ${count} vertices in ${name}`);
  const elements=index?index.getCount():count;
  if(primitive.getMode()===4&&elements%3!==0)throw Error(`${path}: incomplete triangle in ${name}`);
  primitives++;vertices+=count;if(primitive.getMode()===4)triangles+=elements/3;
 }
 return{path,sha256:createHash('sha256').update(bytes).digest('hex'),meshes:meshes.length,primitives,vertices,triangles,valid:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let files=process.argv.slice(2);
 if(files.includes('--published')){const gallery=JSON.parse(await readFile('src/_data/gallery.json','utf8'));files=gallery.frames.filter(f=>f.room.modelUrl).map(f=>'src'+f.room.modelUrl);}
 if(!files.length)throw Error('Pass the raw or packed GLB files to validate');
 for(const file of files)console.log(JSON.stringify(await validateGalleryGeometry(file)));
}
