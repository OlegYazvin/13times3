import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildLayout,FRAME_WIDTH,HALL_WIDTH} from '../client/explore/layout.mjs';
import {museumColliders,museumExhibits,museumPoint,museumSconceSites} from '../client/explore/museum-layout.mjs';
import {RoomManager} from '../client/explore/rooms.mjs';import {fireSamples,flameMix,FlameAudio} from '../client/explore/flame-audio.mjs';
const layout=buildLayout(JSON.parse(readFileSync(new URL('../src/_data/gallery.json',import.meta.url))));
test('museum paintings have clear wall space and the sculpture islands leave two walking routes',()=>{
 assert.ok(HALL_WIDTH>=10);
 for(const section of layout.sections)for(const side of[-1,1]){
  const frames=layout.frames.filter(f=>f.section===section.index&&f.sideSign===side).sort((a,b)=>a.along-b.along);
  for(let i=1;i<frames.length;i++)assert.ok(frames[i].along-frames[i-1].along>FRAME_WIDTH+.8,'Paintings must not crowd or overlap');
 }
 const colliders=museumColliders(layout),player={x:0,z:-.8},manager=new RoomManager({gallery:{layout,colliders},player});
 assert.equal(manager.canStand({x:3.45,z:-4}),false);assert.equal(manager.canStand({x:0,z:-4}),true);
 assert.equal(manager.canStand({x:4.65,z:-10.15}),false,'Stone pilaster feet block walking beside the wall');
 for(const e of museumExhibits(layout)){
  assert.equal(manager.canStand(museumPoint(e.section,0,e.along)),false,'Sculpture plinth is solid');
  for(const sign of[-1,1]){Object.assign(player,museumPoint(e.section,sign*2.7,e.along-3));const end=museumPoint(e.section,sign*2.7,e.along+7.3);manager.move(end);assert.ok(Math.hypot(player.x-end.x,player.z-end.z)<.02,'A real movement crosses the entire island beside its bench');}
 }
});
test('fire fades with distance and stereo follows the visitor heading',()=>{
 const site={x:4.8,y:2.72,z:0};const far=flameMix([site],{x:0,z:4},0)[0],near=flameMix([site],{x:3.5,z:0},0)[0];
 assert.equal(far.level,0);assert.ok(near.level>.1&&near.level<=.2);assert.ok(near.pan>0);assert.ok(flameMix([site],{x:3.5,z:0},Math.PI)[0].pan<0);
 assert.equal(flameMix(museumSconceSites(layout),{x:0,z:-.8},0).filter(x=>x.level>0).length,0,'The entrance starts away from the fires');
});
test('original crackle samples are quiet, finite, repeatable and have a smooth loop seam',()=>{
 const data=fireSamples(8000),same=fireSamples(8000);assert.deepEqual(data,same);assert.equal(data[0],0);assert.equal(data.at(-1),0);
 let sum=0,squares=0,peak=0;for(const x of data){assert.ok(Number.isFinite(x));sum+=x;squares+=x*x;peak=Math.max(peak,Math.abs(x));}
 assert.ok(Math.abs(sum/data.length)<.005);assert.ok(Math.sqrt(squares/data.length)>.003&&Math.sqrt(squares/data.length)<.06);assert.ok(peak<.25);
});
test('fire audio is lazy, shares mute, fades out inside rooms, and releases its sources',()=>{
 const sources=[];const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});const node=()=>({connect(n){return n;},disconnect(){this.disconnected=true;}});
 const context={sampleRate:8000,currentTime:0,destination:node(),createBuffer:()=>({copyToChannel(){}}),createGain:()=>({...node(),gain:param()}),createStereoPanner:()=>({...node(),pan:param()}),createBiquadFilter:()=>({...node(),frequency:{value:0}}),createBufferSource:()=>{const n={...node(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(n);return n;}};
 const music={started:false,enabled:false,context},audio=new FlameAudio(music,[{x:4.8,y:2.72,z:0}]);
 audio.update({x:3.5,z:0},0,true,true,0);assert.equal(sources.length,0);
 music.started=music.enabled=true;audio.update({x:3.5,z:0},0,true,true,1);assert.equal(sources.length,2);assert.ok(audio.levels[0]>.1);
 audio.update({x:3.5,z:0},0,false,true,2);assert.equal(audio.levels[0],0);
 audio.update({x:3.5,z:0},0,true,false,3);assert.equal(audio.levels[0],0);
 music.enabled=false;audio.update({x:3.5,z:0},0,true,true,4);assert.equal(audio.levels[0],0);
 music.enabled=true;audio.update({x:3.5,z:0},0,true,true,5);assert.ok(audio.levels[0]>.1);assert.equal(sources.length,2);
 audio.stop();assert.ok(sources.every(s=>s.stopped&&s.disconnected));audio.update({x:3.5,z:0},0,true,true,6);assert.equal(sources.length,2);
});
