import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import heads from '../scripts/assets/figures/story-heads.json' with {type:'json'};
import {sculptSurface} from '../scripts/sculpt_surface.mjs';

test('sculpt fitting finds the same visible surface as the Three.js raycaster',()=>{
 for(const name of ['sam','toddler']){
   const source=heads[name],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(source.positions,3));g.setIndex(source.indices);
   const probe=sculptSurface(g),mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld(true);
   const raycaster=new THREE.Raycaster();
   for(let i=0;i<80;i++){
     const angle=i*2.399963,height=-.015+(i%23)*.012,direction=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));
     const origin=direction.clone().multiplyScalar(i%5===0?.025:.5).setY(height);direction.negate();
     raycaster.set(origin,direction);const expected=raycaster.intersectObject(mesh,false)[0]?.point,actual=probe(origin,direction);
     assert.equal(Boolean(actual),Boolean(expected),`${name} ray ${i}: hit`);
     if(expected)assert.ok(actual.distanceTo(expected)<1e-7,`${name} ray ${i}: nearest surface`);
   }
   g.dispose();mesh.material.dispose();
 }
});

test('nearest-surface and inside queries agree with simple closed geometry',()=>{
 const g=new THREE.BoxGeometry(2,2,2),probe=sculptSurface(g);
 for(const [position,inside,distance] of [[[0,0,0],true,1],[[.9,.2,-.3],true,.1],[[2,.2,-.3],false,1],[[2,2,2],false,Math.sqrt(3)]]){
   const p=new THREE.Vector3(...position);assert.equal(probe.contains(p),inside);assert.ok(Math.abs(probe.nearest(p).distance-distance)<1e-7);
 }
});
