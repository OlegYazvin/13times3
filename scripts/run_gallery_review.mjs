import sharp from 'sharp';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {buildLayout} from '../client/explore/layout.mjs';
import {galleryBrowserExecutable} from './gallery_browser.mjs';
const executablePath=await galleryBrowserExecutable();
const manifest=JSON.parse(await readFile('src/_data/gallery.json','utf8'));
const frames=buildLayout(manifest).frames.filter(f=>f.room.modelUrl);
const output='.cache/art-review';await mkdir(output,{recursive:true});
const approachesOnly=process.argv.includes('--approaches');
const profilesOnly=process.argv.includes('--profiles');
const returnsOnly=process.argv.includes('--returns');
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const mime={html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',webp:'image/webp',png:'image/png',glb:'model/gltf-binary',mp3:'audio/mpeg',ogg:'audio/ogg',woff2:'font/woff2'};res.setHeader('content-type',mime[path.split('.').pop()]||'application/octet-stream');res.end(await readFile('_site'+path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
if(process.argv.includes('--global')){
 browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const p=await browser.newPage({viewport:{width:1280,height:800}});
 await p.goto(base+'/explore/',{waitUntil:'networkidle'});await p.getByRole('button',{name:/begin walking/i}).click();
 await p.waitForFunction(()=>window.__galleryDebug().activeRoom==='01');
 const yaw=(await p.evaluate(()=>window.__galleryDebug())).yaw;
 await p.mouse.move(700,350);await p.mouse.down();await p.mouse.move(760,350);await p.mouse.up();
 assert.ok((await p.evaluate(()=>window.__galleryDebug())).yaw>yaw);
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>window.__galleryDebug().cameraFov===100);
 const size=await p.locator('#scene canvas').boundingBox();assert.ok(size.width>=380&&size.height>700);
 await p.evaluate(()=>document.querySelector('#scene canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await p.locator('#fallback').waitFor({state:'visible'});assert.equal(await p.locator('.frame-list li').count(),41);await p.close();
 const fallback=await browser.newContext();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
 const f=await fallback.newPage();await f.goto(base+'/explore/');await f.locator('#fallback').waitFor({state:'visible'});assert.equal(await f.locator('.frame-list li').count(),41);assert.equal(await f.locator('.fallback-previews img').count(),11);await fallback.close();
 const failed=await browser.newPage();await failed.route('**/assets/explore/room01/room.glb*',r=>r.abort());await failed.goto(base+'/explore/');await failed.getByRole('button',{name:/begin walking/i}).click();await failed.waitForTimeout(500);assert.equal((await failed.evaluate(()=>window.__galleryDebug())).mode,'hall');await failed.close();
 await writeFile(output+'/global-verification.json',JSON.stringify({dragLook:true,resize:true,webglLossFallback:true,noWebglFallback:true,failedRoomStaysInHall:true,frameCount:41,previewCount:11},null,2));
 console.log('Global controls, resize and fallback checks passed');
}else if(process.argv.includes('--functional')){
  const r=await promisify(execFile)(process.execPath,['scripts/browser_check.mjs'],{env:{...process.env,GALLERY_TEST_BASE:base,GALLERY_BROWSER_EXECUTABLE:executablePath},maxBuffer:8e6});console.log(r.stdout);if(r.stderr)console.log(r.stderr.slice(-2000));
}else{
 const targets={'01':[-.3,0],'02':[-1.0,4.8],'03':[0,4],'04':[0,4],'05':[-.2,4.9],'06':[0,2.6],'07':[-.58,3.1],'08':[0,0],'09':[0,3.05],'10':[-.23,4.37],'11':[.55,7.5]};
 const selected=process.argv.filter(x=>/^\d\d$/.test(x));
 const results=[];
 for(const f of frames.filter(f=>!selected.length||selected.includes(f.id))){
  const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
  const modelPath=f.room.modelUrl.replace(/^\//,'');
  const modelSha256=digest(await readFile('src/'+modelPath));
  assert.equal(digest(await readFile('_site/'+modelPath)),modelSha256,`frame ${f.id}: rebuild the site before inspecting changed source assets`);
  const captureBuild={id:f.id,modelSha256,paintingSha256:digest(await readFile('src/'+f.room.previewImage.replace(/^\//,''))),appSha256:digest(await readFile('_site/assets/explore/app.js')),recordedAt:new Date().toISOString()};
  browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
  for(const phone of ((approachesOnly||profilesOnly||returnsOnly)?[false]:[false,true])){
   console.log(`Review ${f.id}: ${phone?'phone':'desktop'} load`);
   const p=await browser.newPage(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:960,height:720}});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'/explore/',{waitUntil:'networkidle'});await p.getByRole('button',{name:/begin walking/i}).click();
   const o={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign},baseYaw=Math.atan2(o.x,-o.z);
   if(!phone&&!profilesOnly&&!returnsOnly&&!process.argv.includes('--checks')){
    await p.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[f.center.x-o.x*4.2,f.center.z-o.z*4.2,baseYaw]);
    const pixels=await p.evaluate(()=>window.__galleryTestSnapshot());
    await writeFile(`${output}/${f.id}-hallway.png`,Buffer.from(pixels.split(',')[1],'base64'));
   }
   await p.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[f.center.x-o.x*2.8,f.center.z-o.z*2.8,baseYaw]);
   await p.waitForFunction(id=>window.__galleryDebug().activeRoom===id,f.id,{timeout:45000});
   console.log(`Review ${f.id}: ${phone?'phone':'desktop'} model loaded`);
   if(!phone&&!profilesOnly&&!returnsOnly&&(!process.argv.includes('--checks')||f.id==='02')){
    const pixels=await p.evaluate(()=>window.__galleryTestSnapshot());
    await writeFile(`${output}/${f.id}-reveal.png`,Buffer.from(pixels.split(',')[1],'base64'));
    if(f.id==='02'){
      // This patch is live sky inside the aperture. It previously showed a
      // distant gallery wall because the first world's depth buffer survived.
      // Changing unrelated hall colors must not change the room's pixels.
      const patch=async url=>sharp(Buffer.from(url.split(',')[1],'base64')).extract({left:400,top:325,width:8,height:8}).removeAlpha().raw().toBuffer();
      const before=await patch(pixels);
      await p.evaluate(()=>window.__galleryTestHallTint(0xff00ff));
      const tinted=await p.evaluate(()=>window.__galleryTestSnapshot());
      await p.evaluate(()=>window.__galleryTestHallTint());
      const after=await patch(tinted);
      assert.ok(before.every((value,i)=>Math.abs(value-after[i])<=1),'room 02 sky must be independent of distant hallway wall colors');
      results.push({id:f.id,name:'hall-depth-isolation',passed:true});
      await writeFile(`${output}/02-hall-depth-isolation.png`,Buffer.from(tinted.split(',')[1],'base64'));
    }
   }
   if(approachesOnly){await p.close();continue;}
   await p.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[f.center.x+o.x*.55,f.center.z+o.z*.55]);
   assert.equal((await p.evaluate(()=>window.__galleryDebug())).mode,'room',`frame ${f.id} entry`);
   const [tx,tz]=targets[f.id],portal=f.room.portalZ??f.room.dimensionsM[2]/2;
   const profiles=f.id==='01'?[['profile-left',-1.8,.05,Math.PI/2],['profile-right',1.7,.05,-Math.PI/2]]:f.id==='02'?[['profile-left',-2.20,4.95,Math.PI/2],['profile-right',1,4.8,-Math.PI/2]]:[['profile-left',tx-2,tz,Math.PI/2],['profile-right',tx+2,tz,-Math.PI/2]];
   if(f.id==='07')profiles.push(['picking-contact',.15,3.8,Math.atan2(-.13825-.15,3.8-2.88899),.026]);
   const shots=(returnsOnly||process.argv.includes('--checks'))?[]:profilesOnly?profiles:phone?[['phone',0,portal-.55,0]]:[['entry',0,portal-.55,0],['front',tx,Math.min(portal-.55,tz+2.5),0],...profiles,['left',tx-2,tz+1.7,Math.atan2(2,1.7)],['right',tx+2,tz+1.7,Math.atan2(-2,1.7)],['rear',tx+1.8,tz-1.8,Math.atan2(-1.8,-1.8)],['close',tx,Math.min(portal-.55,tz+1.4),0,-.28]];
   if(!phone&&!profilesOnly&&!returnsOnly&&!process.argv.includes('--checks')){
    if(f.id==='02')shots.push(['care',-3.3,-1.2,0],['household',-3.5,-3.8,Math.atan2(-.7,2.2)],['contacts',2.5,4.2,0],['embrace',0,-2.7,0],['embrace-rear',-1,-7.8,2.75]);
    if(f.id==='11')shots.push(['portal-back',0,12.7,0],['rear-habitat',0,15.5,Math.PI]);
   }
   for(let [name,x,z,yaw,pitch=0] of shots){
    let stand=await p.evaluate(([x,z])=>window.__galleryTestRoomCanStand(x,z),[x,z]);
    if(!stand){for(const [dx,dz] of [[.9,0],[-.9,0],[0,.9],[0,-.9],[1.4,0],[-1.4,0],[2.5,0],[-2.5,0]])if(await p.evaluate(([x,z])=>window.__galleryTestRoomCanStand(x,z),[x+dx,z+dz])){x+=dx;z+=dz;yaw=Math.atan2(tx-x,z-tz);stand=true;break;}}
    if(!stand){results.push({id:f.id,name,unreachable:true});continue;}
    await p.evaluate(([x,z,y,pitch])=>window.__galleryTestRoomPose(x,z,y,pitch),[x,z,baseYaw+yaw,pitch]);
    const pixels=await p.evaluate(()=>window.__galleryTestSnapshot());
    await writeFile(`${output}/${f.id}-${name}.png`,Buffer.from(pixels.split(',')[1],'base64'));
    results.push({id:f.id,name,x,z,stand});console.log(`Review ${f.id}: captured ${name}`);
   }
   if(profilesOnly){await p.close();continue;}
   // Check actual exported footprints rather than stale author-name counts.
   const state=await p.evaluate(()=>window.__galleryDebug());
   if(!phone)await writeFile(`${output}/${f.id}-colliders.json`,JSON.stringify(state.roomColliders,null,2));
   assert.equal(state.loadedWorldCount,1,`frame ${f.id}: one isolated world`);
   assert.ok(state.modelColliderCount>=2,`frame ${f.id}: exported model collision`);
   const interior=state.roomColliders.filter(c=>c.minX>-f.room.dimensionsM[0]/2&&c.maxX<f.room.dimensionsM[0]/2&&c.minZ>-f.room.dimensionsM[2]/2&&c.maxZ<f.room.dimensionsM[2]/2);
   const permitted=await p.evaluate(cs=>cs.map(c=>window.__galleryTestRoomCanStand((c.minX+c.maxX)/2,(c.minZ+c.maxZ)/2)),interior.slice(0,40));
   assert.ok(permitted.every(x=>x===false),`frame ${f.id}: cannot stand inside solid`);
   if(f.id==='11'){
    assert.ok(state.driftingFishCount>0,'frame 11: moving inhabitants retained');
    await p.waitForFunction(before=>window.__galleryDebug().fishProbeY.some((y,i)=>Math.abs(y-before[i])>.0001),state.fishProbeY,{timeout:20000});
    for(const x of [-3.2,3.2]){
      await p.evaluate(x=>window.__galleryTestRoomPose(x,9.2,0),x);
      await p.evaluate(x=>window.__galleryTestRoomMove(x,12.2),x);
      const loop=await p.evaluate(()=>window.__galleryDebug());assert.equal(loop.mode,'room');assert.ok(loop.roomLocal.z>11.8,`frame 11: clear route around post at ${x}`);
    }
    await p.evaluate(()=>window.__galleryTestRoomPose(0,12.2,0));await p.evaluate(()=>window.__galleryTestRoomMove(0,9.8));assert.equal((await p.evaluate(()=>window.__galleryDebug())).mode,'room');
   }
   await p.evaluate(([z,y])=>window.__galleryTestRoomPose(0,z,y),[portal-.58,baseYaw]);
   if(phone){
    assert.equal((await p.evaluate(()=>window.__galleryDebug())).cameraFov,100);
    const touch=await p.context().newCDPSession(p),before=(await p.evaluate(()=>window.__galleryDebug())).yaw;
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:235,y:330,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:315,y:330,id:1}]});
    await p.waitForFunction(y=>window.__galleryDebug().yaw>y+.08,before,{timeout:10000});
    const mid=(await p.evaluate(()=>window.__galleryDebug())).yaw;
    await p.waitForFunction(y=>window.__galleryDebug().yaw>y+.08,mid,{timeout:10000});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    const before=(await p.evaluate(()=>window.__galleryDebug())).roomLocal.z;
    await p.keyboard.down('w');await p.waitForFunction(z=>window.__galleryDebug().roomLocal.z<z-.02,before,{timeout:10000});await p.keyboard.up('w');
   }
   await p.evaluate(([z,y])=>window.__galleryTestRoomPose(0,z,y),[portal-.58,baseYaw+Math.PI]);
   const beforeExit=await p.evaluate(()=>window.__galleryDebug());
   await p.evaluate(z=>window.__galleryTestRoomMove(0,z),portal+.58);
   const afterExit=await p.evaluate(()=>window.__galleryDebug());
   assert.equal(afterExit.mode,'hall',`frame ${f.id}: return crossing`);
   assert.equal(afterExit.yaw,beforeExit.yaw,`frame ${f.id}: no heading jump`);
   assert.equal(afterExit.cameraFov,beforeExit.cameraFov,`frame ${f.id}: no FOV jump`);
   if(!phone&&!process.argv.includes('--checks')){const pixels=await p.evaluate(()=>window.__galleryTestSnapshot());await writeFile(`${output}/${f.id}-return.png`,Buffer.from(pixels.split(',')[1],'base64'));}
   await p.evaluate(()=>window.__galleryTestPose(45,-20,0));
   await p.waitForFunction(()=>window.__galleryDebug().activeRoom===null);
   assert.equal((await p.evaluate(()=>window.__galleryDebug())).loadedWorldCount,0,`frame ${f.id}: cleanup`);
   results.push({id:f.id,viewport:phone?'phone':'desktop',entry:true,collisionSamples:interior.slice(0,40).length,return:true,continuousCamera:true,controls:true,cleanup:true});
   assert.deepEqual(errors,[],`frame ${f.id} page errors`);await p.close();
  }
  await browser.close();browser=null;
  if(returnsOnly){await writeFile(`${output}/${f.id}-return-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: continuous return view captured`);}
  else if(profilesOnly){await writeFile(`${output}/${f.id}-profiles.json`,JSON.stringify(results.filter(r=>r.id===f.id),null,2));await writeFile(`${output}/${f.id}-profile-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: accessible side-profile views captured`);}
  else if(approachesOnly){await writeFile(`${output}/${f.id}-approach-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: hallway painting and partial reveal captured`);}
  else {await writeFile(`${output}/${f.id}-verification.json`,JSON.stringify(results.filter(r=>r.id===f.id),null,2));await writeFile(`${output}/${f.id}-verification-build.json`,JSON.stringify(captureBuild,null,2));if(!process.argv.includes('--checks')){await writeFile(`${output}/${f.id}-capture-build.json`,JSON.stringify({...captureBuild,captured:true},null,2));await writeFile(`${output}/${f.id}-return-build.json`,JSON.stringify(captureBuild,null,2));}console.log(`Frame ${f.id}: desktop and fresh phone checks passed${process.argv.includes('--checks')?'':' with walkaround captures'}`);}
 }
}
}finally{await browser?.close();await new Promise(r=>server.close(r));}
