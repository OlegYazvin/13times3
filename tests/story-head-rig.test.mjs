import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {anatomicalHead} from '../scripts/anatomical_heads.mjs';
import {attachStoryHead} from '../scripts/rig_story_head.mjs';

test('turning the head keeps the lower neck seated and turns the facial structure',()=>{
 const {geometry}=anatomicalHead('Oleg',{skin:0xd8ad96,hair:0x544235,beard:true},.265);
 const root=new THREE.Group(),features=new THREE.Group(),{mesh,skull}=attachStoryHead(root,features,geometry,new THREE.MeshStandardMaterial(),{headYaw:1.1});
 root.position.y=1.495;root.updateMatrixWorld(true);mesh.skeleton.update();
 const p=geometry.attributes.position;let fixed=0,turned=0;
 for(let i=0;i<p.count;i++){
   const original=new THREE.Vector3().fromBufferAttribute(p,i),actual=mesh.applyBoneTransform(i,original.clone());
   if(original.y<-.037){assert.ok(actual.distanceTo(original)<1e-7);fixed++;}
   if(original.y>.04){assert.ok(actual.distanceTo(original.clone().applyQuaternion(skull.quaternion))<1e-7);turned++;}
 }
 assert.ok(fixed>5&&turned>100,'check actual lower-neck and facial vertices');
});
