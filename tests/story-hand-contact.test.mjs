import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {anatomicalHand} from '../scripts/anatomical_hands.mjs';

test('an explicit supporting palm keeps its contact normal while the wrist flexes',()=>{
 const normal=new THREE.Vector3(0,0,-1);
 const {mesh}=anatomicalHand(null,{identity:'Oleg',height:1.76,side:-1,at:[-.18,1.25,.30],elbow:[-.40,1.18,.04],material:new THREE.MeshStandardMaterial(),grip:true,normal:normal.toArray()});
 const palm=new THREE.Vector3(0,0,1).applyQuaternion(mesh.quaternion);
 assert.ok(palm.dot(normal)>.99999,'the palm must face the supported shin, not tilt away with the forearm');
});

test('the child fingertip meets the berry surface without embedding the palm',()=>{
 const center=new THREE.Vector3(.44175,.55485,-.05101),radius=.010;
 const {mesh}=anatomicalHand(null,{identity:'Zephrine',child:true,height:1.04,side:1,at:[.39,.55,-.06],elbow:[.27,.60,.02],material:new THREE.MeshStandardMaterial(),style:'touch',contact:{center:center.toArray(),radius}});
 mesh.updateMatrixWorld(true);
 const p=mesh.geometry.attributes.position,index=mesh.geometry.index.array,tri=new THREE.Triangle(),nearest=new THREE.Vector3();let distance=Infinity;
 for(let i=0;i<index.length;i+=3){
   tri.a.fromBufferAttribute(p,index[i]).applyMatrix4(mesh.matrixWorld);tri.b.fromBufferAttribute(p,index[i+1]).applyMatrix4(mesh.matrixWorld);tri.c.fromBufferAttribute(p,index[i+2]).applyMatrix4(mesh.matrixWorld);
   tri.closestPointToPoint(center,nearest);distance=Math.min(distance,nearest.distanceTo(center));
 }
 assert.ok(distance>=radius-.0005,`hand penetrates the berry: ${distance.toFixed(6)} m surface distance`);
 assert.ok(distance<=radius+.0005,`finger misses the berry: ${distance.toFixed(6)} m surface distance`);
});

test('the writing grip encloses a pencil above the paper with its point on the page',()=>{
 const paper=[.15,.9465,.48],{mesh,pen}=anatomicalHand(null,{identity:'Jane',height:1.68,side:1,at:[.18,.995,.44],elbow:[.26,1.10,.22],material:new THREE.MeshStandardMaterial(),style:'write',normal:[0,-1,0],contact:{paper}});
 assert.deepEqual(pen.tip,paper);
 assert.ok(pen.radius>.002&&pen.radius<.005,'the anatomical pinch must fit a normal pencil');
 const tip=new THREE.Vector3(...pen.tip),axis=new THREE.Vector3(...pen.direction);
 assert.ok(axis.y<-.5,'the pencil must point down to the paper');
 mesh.updateMatrixWorld(true);
 const position=mesh.geometry.attributes.position,index=mesh.geometry.index.array,triangle=new THREE.Triangle(),point=new THREE.Vector3(),nearest=new THREE.Vector3();let minY=Infinity,minClearance=Infinity;
 for(let i=0;i<position.count;i++){point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);minY=Math.min(minY,point.y);}
 for(let step=1;step<=11;step++){
  point.copy(tip).addScaledVector(axis,-step*.01);
  for(let i=0;i<index.length;i+=3){triangle.a.fromBufferAttribute(position,index[i]).applyMatrix4(mesh.matrixWorld);triangle.b.fromBufferAttribute(position,index[i+1]).applyMatrix4(mesh.matrixWorld);triangle.c.fromBufferAttribute(position,index[i+2]).applyMatrix4(mesh.matrixWorld);triangle.closestPointToPoint(point,nearest);minClearance=Math.min(minClearance,nearest.distanceTo(point));}
 }
 assert.ok(minY>paper[1],`writing hand crosses the page at ${minY}`);
 assert.ok(minClearance>pen.radius-.0005,`pencil shaft crosses fingers: ${minClearance} m clearance for ${pen.radius} m radius`);
 assert.ok(minClearance<pen.radius+.001,'the pencil must touch the grip rather than hover between fingers');
});

test('a resting hand meets a desk plane without any finger passing through it',()=>{
 const pageY=.9465,{mesh}=anatomicalHand(null,{identity:'Jane',height:1.68,side:-1,at:[-.18,.968,.45],elbow:[-.25,1.02,.24],material:new THREE.MeshStandardMaterial(),normal:[0,-1,0],contact:{plane:{point:[0,pageY,0],normal:[0,1,0]}}});
 mesh.updateMatrixWorld(true);let lowest=Infinity;const p=mesh.geometry.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);lowest=Math.min(lowest,v.y);}
 assert.ok(lowest>=pageY&&lowest<pageY+.0005,`supporting skin misses its page: ${lowest-pageY} m`);
});
