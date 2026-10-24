import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import {insideAquariumTank} from './aquarium_habitats.mjs';

export async function checkAquariumHabitats(path='src/assets/explore/room11/room.glb'){
  await MeshoptDecoder.ready;
  const bytes=await readFile(path),io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
  const doc=await io.readBinary(bytes),nodes=doc.getRoot().listNodes();
  const tanks=nodes.find(n=>n.getExtras().aquariumTanks)?.getExtras().aquariumTanks;
  assert.ok(tanks?.length===6,'The aquarium has six defined, enclosed water volumes');
  const animals=nodes.filter(n=>typeof n.getExtras().driftPhase==='number'||n.getExtras().aquariumAnimal);
  assert.ok(animals.length>=80,'Retain the inhabited aquarium and its moving schools');
  const results=[];
  for(const animal of animals){
    const extras=animal.getExtras(),tank=tanks.find(t=>t.id===extras.aquariumHabitat);
    assert.ok(tank,animal.getName()+': every animal must have a tank');
    const originalWorld=new THREE.Matrix4().fromArray(animal.getWorldMatrix()),inverse=originalWorld.clone().invert(),points=[];
    animal.traverse(node=>{
      const mesh=node.getMesh();if(!mesh)return;
      assert.equal(node.getSkin(),null,'Freeze animal skin before geometric verification: '+node.getName());
      const relative=inverse.clone().multiply(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
      for(const primitive of mesh.listPrimitives()){
        const a=primitive.getAttribute('POSITION'),p=[];
        for(let i=0;i<a.getCount();i++){a.getElement(i,p);points.push(new THREE.Vector3(...p).applyMatrix4(relative));}
      }
    });
    const position=new THREE.Vector3().fromArray(animal.getTranslation()),scale=new THREE.Vector3().fromArray(animal.getScale()),quaternion=new THREE.Quaternion().fromArray(animal.getRotation());
    const euler=new THREE.Euler().setFromQuaternion(quaternion,'XYZ'),originalYaw=euler.y;
    const parent=animal.getParentNode(),parentMatrix=parent?new THREE.Matrix4().fromArray(parent.getWorldMatrix()):new THREE.Matrix4();
    const moving=typeof extras.driftPhase==='number',samples=moving?33:1;
    const world=new THREE.Vector3(),coordinates=[];
    let checked=0;
    for(let sample=0;sample<samples;sample++){
      const motion=moving?-1+sample*2/(samples-1):0;euler.y=originalYaw+motion*.065;
      const pose=parentMatrix.clone().multiply(new THREE.Matrix4().compose(position.clone().add(new THREE.Vector3(0,motion*(extras.driftAmplitude||.05),0)),quaternion.clone().setFromEuler(euler),scale));
      for(const point of points){
        world.copy(point).applyMatrix4(pose).toArray(coordinates);
        if(!insideAquariumTank(tank,coordinates))assert.fail(`${animal.getName()} leaves ${tank.id} at drift ${motion}: ${coordinates}`);
        checked++;
      }
    }
    results.push({name:animal.getName(),tank:tank.id,motionSamples:samples,verticesChecked:checked});
  }
  for(const id of['river','side-reef','far-reef','rear-reef'])assert.ok(nodes.some(n=>n.getExtras().aquariumGlass===id&&n.getExtras().solidFootprint),id+': complete glazing must stop the visitor');
  // Mirror the renderer's Box3 mesh bounds for fallback collision, including
  // the new continuous glass and the same posed people and portal posts.
  function worldBox(node){
    const box=new THREE.Box3();node.traverse(child=>{
      const mesh=child.getMesh();if(!mesh)return;
      const matrix=new THREE.Matrix4().fromArray(child.getWorldMatrix());
      for(const primitive of mesh.listPrimitives()){
        const a=primitive.getAttribute('POSITION'),min=a.getMinNormalized([]),max=a.getMaxNormalized([]);
        for(let bits=0;bits<8;bits++)box.expandByPoint(new THREE.Vector3(...min.map((v,i)=>bits&(1<<i)?max[i]:v)).applyMatrix4(matrix));
      }
    });
    return box;
  }
  const mermaid=nodes.find(n=>n.getName().startsWith('Ariel quietly'));
  assert.ok(mermaid,'Retain the hidden mermaid');
  const mermaidBox=worldBox(mermaid),coralSeparation=[];
  for(const part of nodes.filter(n=>n.getExtras().mermaidCoralPart)){
    const layer=part.getExtras().mermaidCoralPart,box=worldBox(part);
    const clearance=layer==='foreground'?mermaidBox.min.x-box.max.x:layer==='background'?box.min.x-mermaidBox.max.x:mermaidBox.min.y-box.max.y;
    assert.ok(clearance>.02,part.getName()+': coral must screen the mermaid without intersecting her');
    coralSeparation.push({part:part.getName(),layer,clearanceM:clearance});
  }
  assert.equal(coralSeparation.length,7,'Retain the foreground coral, rear colony and reef footing');
  const colliders=nodes.filter(n=>n.getExtras().solidFootprint).map(node=>{
    const box=worldBox(node);
    assert.equal(box.isEmpty(),false,node.getName()+': collision geometry exists');
    assert.ok(box.max.x>box.min.x&&box.max.z>box.min.z,node.getName()+': solid glass needs physical thickness in its footprint');
    return{minX:box.min.x,maxX:box.max.x,minZ:box.min.z,maxZ:box.max.z};
  });
  return {path,sha256:createHash('sha256').update(bytes).digest('hex'),tankCount:tanks.length,animalGroups:animals.length,verticesChecked:results.reduce((n,r)=>n+r.verticesChecked,0),coralSeparation,results,colliders};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await checkAquariumHabitats();
  const gallery=JSON.parse(await readFile('src/_data/gallery.json','utf8')),room=gallery.frames.find(f=>f.id==='11').room;
  if(process.argv.includes('--sync-colliders')){
    room.colliders=result.colliders;await writeFile('src/_data/gallery.json',JSON.stringify(gallery,null,2)+'\n');
  }else{
    assert.equal(room.colliders.length,result.colliders.length,'Fallback footprint count');
    const key=b=>Object.values(b).join(','),actual=[...result.colliders].sort((a,b)=>key(a).localeCompare(key(b))),expected=[...room.colliders].sort((a,b)=>key(a).localeCompare(key(b)));
    for(let i=0;i<actual.length;i++)for(const key of['minX','maxX','minZ','maxZ'])assert.ok(Math.abs(actual[i][key]-expected[i][key])<.002,'Fallback bounds follow the reviewed model');
  }
  if(process.argv.includes('--report'))await writeFile('.cache/aquarium-tanks/containment.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({sha256:result.sha256,tanks:result.tankCount,animalGroups:result.animalGroups,verticesChecked:result.verticesChecked,collisionFootprints:result.colliders.length,contained:true}));
}
