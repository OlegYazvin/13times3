import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {buildLayout} from '../client/explore/layout.mjs';
import {galleryBrowserExecutable,enterExhibit} from './gallery_browser.mjs';

const output='.cache/museum-followup/music';await mkdir(output,{recursive:true});
const frames=buildLayout(JSON.parse(await readFile('src/_data/gallery.json'))).frames;
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';res.setHeader('content-type',({html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',glb:'model/gltf-binary',mp3:'audio/mpeg',webp:'image/webp',woff2:'font/woff2'})[path.split('.').pop()]||'application/octet-stream');res.end(await readFile('_site'+path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`,results=[];
const browser=await chromium.launch({headless:true,executablePath:await galleryBrowserExecutable(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const debug=p=>p.evaluate(()=>window.__galleryDebug());
async function enter(p,id='01'){
 const f=frames.find(f=>f.id===id),out={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign};
 await p.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[f.center.x-out.x*2.8,f.center.z-out.z*2.8,Math.atan2(out.x,-out.z)]);
 await p.waitForFunction(id=>window.__galleryDebug().activeRoom===id,id,{timeout:60000});
 await p.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[f.center.x+out.x*.55,f.center.z+out.z*.55]);assert.equal((await debug(p)).mode,'room');
}
async function exit(p){const f=frames[0],out={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign};await p.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[f.center.x-out.x*.65,f.center.z-out.z*.65]);assert.equal((await debug(p)).mode,'hall');}
async function playback(p){
 await p.waitForFunction(()=>window.__galleryDebug().music.sceneReady,null,{timeout:60000});
 // The next real touch/click is the supported browser-autoplay retry path.
 const viewport=p.viewportSize();if(viewport.width<500)await p.touchscreen.tap(viewport.width*.65,viewport.height*.55);else await p.mouse.click(viewport.width*.65,viewport.height*.55);
 await p.waitForFunction(()=>window.__galleryDebug().music.scenePlaying&&window.__galleryDebug().music.sceneTime>1,null,{timeout:60000});
}
async function screenshot(p,path){await p.evaluate(()=>{const c=document.querySelector('#scene canvas'),read=c.toDataURL;c.toDataURL=()=>null;try{window.__galleryTestSnapshot();}finally{c.toDataURL=read;}c.getContext('webgl2').finish();});await p.screenshot({path});}
try{
 for(const phone of[false,true]){
  const p=await browser.newPage(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1100,height:800}}),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('soundcloud.com'))requests.push(r.url());});
  await p.goto(base+'/explore/',{waitUntil:'networkidle'});await enterExhibit(p);assert.equal(requests.length,0,'Provider stays lazy until room entry');
  await enter(p);await playback(p);const started=await debug(p);
  const panel=await p.locator('#scene-music').boundingBox();assert.ok(panel.x+panel.width<0&&panel.width===1&&panel.height===1,'No provider overlay in the viewport');
  assert.equal(await p.locator('#scene-music').getAttribute('aria-hidden'),'true');assert.equal(await p.locator('#scene-music iframe').getAttribute('tabindex'),'-1');assert.equal(await p.locator('.scene-music-credit').count(),0);
  await p.waitForFunction(()=>window.__galleryDebug().music.level<.01);await screenshot(p,output+'/'+(phone?'phone':'desktop')+'.png');
  await p.getByRole('button',{name:'Turn sound off',exact:true}).click();assert.equal(await p.locator('#scene-music iframe').count(),0);await exit(p);await enter(p);assert.equal((await debug(p)).music.sceneActive,false,'Mute persists through return/reentry');
  await p.getByRole('button',{name:'Turn sound on',exact:true}).click();await playback(p);await exit(p);assert.equal(await p.locator('#scene-music iframe').count(),0);await p.waitForFunction(()=>window.__galleryDebug().music.level>.4);
  await enter(p,'02');assert.equal((await debug(p)).music.sceneActive,false);assert.equal(await p.locator('#scene-music iframe').count(),0);assert.equal(await p.locator('#fallback').isVisible(),false);assert.deepEqual(errors,[]);
  results.push({viewport:phone?'390×844 portrait emulation':'1100×800 desktop',realProviderPlayAndProgress:true,sceneTime:started.music.sceneTime,noVisiblePlayer:true,providerOutsideFocus:true,lazyUntilEntry:true,hallSilentInRoom:true,mutePersistsAcrossPortals:true,returnRestoresHall:true,otherRoomSilent:true,pageErrors:errors});console.log(results.at(-1));await p.close();
 }
 const p=await browser.newPage();await p.route('https://w.soundcloud.com/**',r=>r.abort());await p.goto(base+'/explore/');await enterExhibit(p);await enter(p);await p.waitForFunction(()=>document.querySelector('.scene-music-status').textContent.includes('unavailable'));assert.equal(await p.locator('#scene-music iframe').count(),0);await exit(p);await p.waitForFunction(()=>window.__galleryDebug().music.level>.4);assert.equal(await p.locator('#fallback').isVisible(),false);results.push({providerFailure:true,noOverlay:true,returnUsable:true,hallMusicResumes:true});await p.close();
 await writeFile(output+'/verification.json',JSON.stringify({appSha256:createHash('sha256').update(await readFile('_site/assets/explore/app.js')).digest('hex'),recordedAt:new Date().toISOString(),results},null,2)+'\n');
}finally{server.closeAllConnections();await browser.close();await new Promise(r=>server.close(r));}
