import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {storyArmElbow} from '../scripts/story_arm.mjs';

test('contact poses retain the upper-arm and forearm lengths',()=>{
 for(const [a,b,pole,upper,lower] of [
   [[-.19,1.42,0],[-.17,1.24,.27],[-.38,1.12,.22],.308,.264],
   [[.127,.722,0],[.34,.55,-.045],[.27,.60,.04],.1768,.156],
   [[-.20,1.28,0],[-.45,1.67,-.08],[-.35,1.45,.05],.2835,.243],
 ]){
   const elbow=new THREE.Vector3(...storyArmElbow(a,b,pole,upper,lower));
   assert.ok(Math.abs(elbow.distanceTo(new THREE.Vector3(...a))-upper)<1e-9);
   assert.ok(Math.abs(elbow.distanceTo(new THREE.Vector3(...b))-lower)<1e-9);
 }
 assert.throws(()=>storyArmElbow([0,1,0],[1,1,0],[.2,.7,.1],.3,.25),/outside anatomical reach/);
});
