import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createServer} from 'node:http';import {createHash} from 'node:crypto';
import {chromium} from 'playwright';import {galleryBrowserExecutable} from './gallery_browser.mjs';
import {buildLayout} from '../client/explore/layout.mjs';import {museumExhibits,museumPoint,museumSconceSites} from '../client/explore/museum-layout.mjs';
const draft=process.argv.includes('--draft'),checks=process.argv.includes('--checks'),output=process.env.MUSEUM_REVIEW_OUTPUT||'.cache/museum/review';await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('src/_data/gallery.json')),layout=buildLayout(manifest);
const fireZ=museumSconceSites(layout).find(p=>p.section===0&&p.sign===1&&p.along>5).z;
const digest=b=>createHash('sha256').update(b).digest('hex'),build={recordedAt:new Date().toISOString(),appSha256:digest(await readFile('_site/assets/explore/app.js')),manifestSha256:digest(await readFile('src/_data/gallery.json')),statueSha256:digest(await readFile('src/assets/explore/museum/dishwasher.glb'))};
const server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://local').pathname;if(path.endsWith('/'))path+='index.html';res.setHeader('content-type',({html:'text/html',js:'application/javascript',css:'text/css',glb:'model/gltf-binary',webp:'image/webp',mp3:'audio/mpeg',woff2:'font/woff2'})[path.split('.').pop()]||'application/octet-stream');res.end(await readFile('_site'+path));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.GALLERY_TEST_BASE||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:await galleryBrowserExecutable(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const results=[];
const snapshot=page=>page.evaluate(()=>{const canvas=document.querySelector('#scene canvas'),read=canvas.toDataURL;canvas.toDataURL=()=>null;try{window.__galleryTestSnapshot();}finally{canvas.toDataURL=read;}canvas.getContext('webgl2').finish();return read.call(canvas,'image/png');});
try{
 for(const phone of draft?[false]:[false,true]){
  const page=await browser.newPage(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1100,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/explore/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__galleryDebug?.().museum.modelReady&&window.__galleryDebug().museum.catWhispererReady&&window.__galleryDebug().museum.artReady===2,null,{timeout:60000});
  assert.equal(await page.locator('#welcome').isVisible(),false);assert.equal(await page.locator('#fallback').isVisible(),false);
  const initial=await page.evaluate(()=>window.__galleryDebug());
  assert.equal(initial.storedFrameCount,41);assert.equal(initial.frameCount,13);
  assert.deepEqual(initial.exhibitedFrames,Array.from({length:13},(_,i)=>String(i+1).padStart(2,'0')));
  assert.equal(initial.museum.lights.length,initial.museum.flameCount);
  assert.ok(initial.museum.lights.every(l=>l.intensity>0),'Every fixture casts light at the entrance, before approaching');
  if(!checks){await snapshot(page);await page.screenshot({path:output+'/entrance-ui'+(phone?'-phone':'')+'.png'});}
  assert.equal((await page.evaluate(()=>window.__galleryDebug())).music.started,false,'No audio before a user gesture');
  const shots=phone?[['entrance-phone',0,-.8,0,0],['sculpture-phone',0,-11.0,0,-.12],['sconce-phone',3.1,fireZ,Math.PI/2,.30]]:[['entrance',0,-.8,0,0],['sculpture-front',0,-11.0,0,-.12],['sculpture-left',-2.5,-14.3,Math.PI/2,-.15],['sculpture-right',2.4,-13.9,-1.36,-.20],['sculpture-rear',0,-17.4,Math.PI,-.15],['sculpture-label',0,-12.55,0,-.42],['sconce',3.1,fireZ,Math.PI/2,.30],['still-life',-2.1,-1.65,-Math.PI/2,.10],['shore',2.3,-1.65,Math.PI/2,.10],['ceiling',2.8,-9,.1,.80]];
  if(!phone&&!draft)for(const e of museumExhibits(layout).slice(1)){const p=museumPoint(e.section,2.9,e.along-5);shots.push(['gallery-'+(e.section.index+1),p.x,p.z,e.section.yaw+Math.atan2(-2.9,5),-.05]);}
  if(!draft){const f=layout.frames.find(f=>f.id==='13'),out={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign};shots.push(['la-jolla'+(phone?'-phone':''),f.center.x-out.x*3.1,f.center.z-out.z*3.1,Math.atan2(out.x,-out.z),0]);}
  if(!checks)for(const [name,x,z,yaw,pitch]of shots){
   assert.ok(await page.evaluate(([x,z])=>window.__galleryTestHallCanStand(x,z),[x,z]),name+' needs an accessible camera position');
   await page.evaluate(([x,z,y,p])=>window.__galleryTestPose(x,z,y,p),[x,z,yaw,pitch]);const png=await snapshot(page);await writeFile(output+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));console.log('Museum: captured '+name);
  }
  if(draft){assert.deepEqual(errors,[]);await page.close();continue;}
  // Controls are live before Help or any start-button interaction.
  await page.evaluate(()=>window.__galleryTestPose(0,-.8,0));await page.keyboard.down('w');await page.waitForFunction(()=>window.__galleryDebug().z<-.88);await page.keyboard.up('w');
  await page.waitForFunction(()=>window.__galleryDebug().museum.audioVoices===2);
  await page.getByRole('button',{name:'Show instructions'}).click();assert.equal(await page.locator('#welcome').isVisible(),true);await page.getByRole('button',{name:/return to exhibit/i}).click();assert.equal(await page.locator('#welcome').isVisible(),false);
  const colliders=(await page.evaluate(()=>window.__galleryDebug())).museum.colliders;
  for(const b of colliders)assert.equal(await page.evaluate(([x,z])=>window.__galleryTestHallCanStand(x,z),[(b.minX+b.maxX)/2,(b.minZ+b.maxZ)/2]),false,'Museum objects block walking');
  for(const e of museumExhibits(layout))for(const sign of[-1,1]){
   const start=museumPoint(e.section,sign*2.7,e.along-3);await page.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[start.x,start.z,e.section.yaw]);
   for(const along of[e.along+3,e.along+7.3]){const p=museumPoint(e.section,sign*2.7,along);await page.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[p.x,p.z]);const s=await page.evaluate(()=>window.__galleryDebug());assert.ok(Math.hypot(s.x-p.x,s.z-p.z)<.05,'Both sides of sculpture and bench remain open');}
  }
  for(let i=0;i<layout.sections.length;i++){
   const s=layout.sections[i],from=museumPoint(s,2.4,3),to=museumPoint(s,2.4,s.length-4.7);await page.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[from.x,from.z,s.yaw]);await page.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[to.x,to.z]);const end=await page.evaluate(()=>window.__galleryDebug());assert.ok(Math.hypot(end.x-to.x,end.z-to.z)<.08,'Gallery '+(i+1)+' has a continuous walking route '+JSON.stringify({from,to,actual:[end.x,end.z]}));
   if(i<layout.sections.length-1){await page.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[s.end.x,s.end.z]);const next=museumPoint(layout.sections[i+1],0,3);await page.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[next.x,next.z]);const turn=await page.evaluate(()=>window.__galleryDebug());assert.ok(Math.hypot(turn.x-next.x,turn.z-next.z)<.08,'Gallery turns connect');}
  }
  // Sconces use the same global mute; no flame sound leaks into memories.
  await page.evaluate(()=>window.__galleryTestPose(0,-.8,0));await page.waitForFunction(()=>window.__galleryDebug().museum.audioLevels.every(x=>x===0));
  await page.evaluate(z=>window.__galleryTestPose(3.5,z,Math.PI/2),fireZ);await page.waitForFunction(()=>window.__galleryDebug().museum.audioLevels.some(x=>x>.10));const near=await page.evaluate(()=>window.__galleryDebug().museum.audioLevels);
  assert.deepEqual((await page.evaluate(()=>window.__galleryDebug())).museum.lights,initial.museum.lights,'Light positions and intensity stay fixed across every gallery and at close range');
  await page.getByRole('button',{name:'Turn sound off'}).click();await page.waitForFunction(()=>window.__galleryDebug().museum.audioLevels.every(x=>x===0));await page.getByRole('button',{name:'Turn sound on'}).click();await page.waitForFunction(()=>window.__galleryDebug().museum.audioLevels.some(x=>x>.10));
  const f=layout.frames[0],out={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign};await page.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[f.center.x-out.x*.6,f.center.z-out.z*.6,-Math.PI/2]);await page.waitForFunction(()=>window.__galleryDebug().activeRoom==='01');await page.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[f.center.x+out.x*.55,f.center.z+out.z*.55]);assert.equal((await page.evaluate(()=>window.__galleryDebug())).mode,'room');await page.waitForFunction(()=>window.__galleryDebug().museum.audioLevels.every(x=>x===0));
  const state=await page.evaluate(()=>window.__galleryDebug());results.push({viewport:phone?'phone':'desktop',storedFrameCount:41,exhibitedFrames:initial.exhibitedFrames,galleries:layout.sections.map(s=>s.title),alwaysOnSconceLights:initial.museum.lights.length,stationaryLightingAcrossWalkingRoute:true,noStartOverlay:true,immediateKeyboardMovement:true,optionalHelp:true,modelReady:state.museum.modelReady,catWhispererReady:state.museum.catWhispererReady,originalPaintings:state.museum.artReady,flameCount:state.museum.flameCount,colliders:colliders.length,allGalleryRoutes:true,bothSidesOfEverySculpture:true,fireAudio:{voices:state.museum.audioVoices,nearLevels:near,silentAway:true,mutePersists:true,silentInRooms:true},pageErrors:errors});assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile(output+'/'+(draft?'draft':'verification')+'.json',JSON.stringify({build,results,draft},null,2)+'\n');console.log(draft?'Museum draft views captured':'Museum desktop and fresh portrait checks passed');
}finally{server.closeAllConnections();await browser.close();await new Promise(r=>server.close(r));}
