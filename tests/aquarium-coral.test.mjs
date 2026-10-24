import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {brainCoral,lettuceCoral} from '../scripts/aquarium_coral.mjs';

function signedVolume(geometry){
  const p=geometry.attributes.position,index=geometry.index,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  let volume=0;const count=index?index.count:p.count;
  for(let i=0;i<count;i+=3){
    a.fromBufferAttribute(p,index?index.getX(i):i);b.fromBufferAttribute(p,index?index.getX(i+1):i+1);c.fromBufferAttribute(p,index?index.getX(i+2):i+2);
    volume+=a.dot(b.cross(c))/6;
  }
  return volume;
}

test('the brain coral is an outward-facing solid, including its upper surface',()=>{
  const coral=brainCoral();coral.updateMatrixWorld(true);
  assert.ok(signedVolume(coral.geometry)>3,'Its closed surface must face outward');
  const hits=new THREE.Raycaster(new THREE.Vector3(.07,3,.08),new THREE.Vector3(0,-1,0)).intersectObject(coral);
  assert.ok(hits.length&&hits[0].point.y>.9,'The outside crown must be visible from above');
});

test('the lettuce coral has closed, outward-facing thick plates',()=>{
  const coral=lettuceCoral();assert.equal(coral.children.length,7);
  for(const plate of coral.children)assert.ok(signedVolume(plate.geometry)>0,'Each plate retains a solid upper and lower face');
});
