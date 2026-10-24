import sharp from 'sharp';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {buildLayout} from '../client/explore/layout.mjs';
import {galleryBrowserExecutable,enterExhibit} from './gallery_browser.mjs';
// Finish the actual GPU render before PNG readback. This is local review
// instrumentation; the public renderer and its movement path are unchanged.
const finishedSnapshot=page=>page.evaluate(()=>{
 const canvas=document.querySelector('#scene canvas'),original=canvas.toDataURL;
 canvas.toDataURL=()=>null;
 try{window.__galleryTestSnapshot();}finally{canvas.toDataURL=original;}
 canvas.getContext('webgl2').finish();
 return original.call(canvas,'image/png');
});
const executablePath=await galleryBrowserExecutable();
const manifest=JSON.parse(await readFile('src/_data/gallery.json','utf8'));
const exhibitLayout=buildLayout(manifest),frames=exhibitLayout.frames.filter(f=>f.room.modelUrl);
const output='.cache/art-review';await mkdir(output,{recursive:true});
const approachesOnly=process.argv.includes('--approaches');
const profilesOnly=process.argv.includes('--profiles');
const returnsOnly=process.argv.includes('--returns');
const contactsOnly=process.argv.includes('--contacts');
const server=createServer(async(req,res)=>{try{let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const mime={html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',webp:'image/webp',png:'image/png',glb:'model/gltf-binary',mp3:'audio/mpeg',ogg:'audio/ogg',woff2:'font/woff2'};res.setHeader('content-type',mime[path.split('.').pop()]||'application/octet-stream');res.end(await readFile('_site'+path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
if(process.argv.includes('--global')){
 browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 const p=await browser.newPage({viewport:{width:1280,height:800}});
 await p.goto(base+'/explore/',{waitUntil:'networkidle'});await enterExhibit(p);
 await p.waitForFunction(()=>window.__galleryDebug().activeRoom==='01');
 const yaw=(await p.evaluate(()=>window.__galleryDebug())).yaw;
 await p.mouse.move(700,350);await p.mouse.down();await p.mouse.move(760,350);await p.mouse.up();
 assert.ok((await p.evaluate(()=>window.__galleryDebug())).yaw>yaw);
 await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>window.__galleryDebug().cameraFov===100);
 const size=await p.locator('#scene canvas').boundingBox();assert.ok(size.width>=380&&size.height>700);
 await p.evaluate(()=>document.querySelector('#scene canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await p.locator('#fallback').waitFor({state:'visible'});assert.equal(await p.locator('.frame-list li').count(),exhibitLayout.frames.length);await p.close();
 const fallback=await browser.newContext();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:get.call(this,kind,...args);};});
 const f=await fallback.newPage();await f.goto(base+'/explore/');await f.locator('#fallback').waitFor({state:'visible'});assert.equal(await f.locator('.frame-list li').count(),exhibitLayout.frames.length);assert.equal(await f.locator('.fallback-previews img').count(),frames.length);await fallback.close();
 const failed=await browser.newPage();await failed.route('**/assets/explore/room01/room.glb*',r=>r.abort());await failed.goto(base+'/explore/');await enterExhibit(failed);await failed.waitForTimeout(500);assert.equal((await failed.evaluate(()=>window.__galleryDebug())).mode,'hall');await failed.close();
 await writeFile(output+'/global-verification.json',JSON.stringify({dragLook:true,resize:true,webglLossFallback:true,noWebglFallback:true,failedRoomStaysInHall:true,storedFrameCount:41,exhibitedFrameCount:exhibitLayout.frames.length,previewCount:frames.length},null,2));
 console.log('Global controls, resize and fallback checks passed');
}else if(process.argv.includes('--functional')){
  const r=await promisify(execFile)(process.execPath,['scripts/browser_check.mjs'],{env:{...process.env,GALLERY_TEST_BASE:base,GALLERY_BROWSER_EXECUTABLE:executablePath},maxBuffer:8e6});console.log(r.stdout);if(r.stderr)console.log(r.stderr.slice(-2000));
}else{
 const targets={'01':[-.3,0],'02':[-1.0,4.8],'03':[0,5.1],'04':[0,5.5],'05':[-.2,4.9],'06':[0,.5],'07':[-.58,5.3],'08':[0,7.6],'09':[0,3.05],'10':[-.23,4.37],'11':[-.55,6.6],'12':[.45,-1.8]};
 const selected=process.argv.filter(x=>/^\d\d$/.test(x));
 const results=[];
 for(const f of frames.filter(f=>!selected.length||selected.includes(f.id))){
  const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
  const modelPath=f.room.modelUrl.replace(/^\//,'');
  const modelSha256=digest(await readFile('src/'+modelPath));
  assert.equal(digest(await readFile('_site/'+modelPath)),modelSha256,`frame ${f.id}: rebuild the site before inspecting changed source assets`);
  const captureBuild={id:f.id,modelSha256,paintingSha256:digest(await readFile('src/'+f.room.previewImage.replace(/^\//,''))),appSha256:digest(await readFile('_site/assets/explore/app.js')),recordedAt:new Date().toISOString()};
  browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
  for(const phone of ((approachesOnly||profilesOnly||returnsOnly||contactsOnly)?[false]:f.id==='12'?[true,false]:[false,true])){
   if(f.id==='12'&&!phone&&!approachesOnly&&!profilesOnly&&!returnsOnly&&!contactsOnly){
    await browser.close();browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
   }
   console.log(`Review ${f.id}: ${phone?'phone':'desktop'} load`);
   let p=await browser.newPage(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:960,height:720}});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+'/explore/',{waitUntil:'networkidle'});await enterExhibit(p);
   const o={x:f.sectionData.right.x*f.sideSign,z:f.sectionData.right.z*f.sideSign},baseYaw=Math.atan2(o.x,-o.z);
   const approach=async distance=>{
    const x=f.center.x-o.x*distance,z=f.center.z-o.z*distance;
    let pose=[x,z,baseYaw];
    if(!await p.evaluate(([x,z])=>window.__galleryTestHallCanStand(x,z),[x,z])){
     let found=false;for(const shift of[.8,-.8,1.6,-1.6,2.4,-2.4]){const sx=x+f.sectionData.forward.x*shift,sz=z+f.sectionData.forward.z*shift;if(await p.evaluate(([x,z])=>window.__galleryTestHallCanStand(x,z),[sx,sz])){pose=[sx,sz,Math.atan2(f.center.x-sx,sz-f.center.z)];found=true;break;}}
     assert.ok(found,'An accessible painting approach is required for '+f.id);
    }
    await p.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),pose);
   };
   if(!phone&&!profilesOnly&&!returnsOnly&&!contactsOnly&&!process.argv.includes('--checks')){
    await approach(4.2);
    const pixels=await finishedSnapshot(p);
    await writeFile(`${output}/${f.id}-hallway.png`,Buffer.from(pixels.split(',')[1],'base64'));
   }
   await approach(2.8);
   await p.waitForFunction(id=>window.__galleryDebug().activeRoom===id,f.id,{timeout:45000});
   console.log(`Review ${f.id}: ${phone?'phone':'desktop'} model loaded`);
   if(!phone&&!profilesOnly&&!returnsOnly&&!contactsOnly&&(!process.argv.includes('--checks')||f.id==='02')){
    const pixels=await finishedSnapshot(p);
    await writeFile(`${output}/${f.id}-reveal.png`,Buffer.from(pixels.split(',')[1],'base64'));
    if(f.id==='02'){
      // This patch is live sky inside the aperture. It previously showed a
      // distant gallery wall because the first world's depth buffer survived.
      // Changing unrelated hall colors must not change the room's pixels.
      const patch=async url=>sharp(Buffer.from(url.split(',')[1],'base64')).extract({left:400,top:325,width:8,height:8}).removeAlpha().raw().toBuffer();
      const before=await patch(pixels);
      await p.evaluate(()=>window.__galleryTestHallTint(0xff00ff));
      const tinted=await finishedSnapshot(p);
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
   if(contactsOnly||(!phone&&process.argv.includes('--record-contacts'))){
     await finishedSnapshot(p);
     const meshes=await p.evaluate(()=>window.__galleryTestSubjectMeshes());
     assert.ok(meshes.length,'semantic subject meshes are present');await mkdir('.cache/contact-study',{recursive:true});
     await writeFile(`.cache/contact-study/${f.id}-meshes.json`,JSON.stringify({build:captureBuild,meshes}));
     console.log(`Frame ${f.id}: extracted ${meshes.length} posed subject surfaces`);
     if(contactsOnly){await p.close();continue;}
   }
   const [tx,tz]=targets[f.id],portal=f.room.portalZ??f.room.dimensionsM[2]/2;
   const profiles=f.id==='01'?[['profile-left',-1.8,.05,Math.PI/2],['profile-right',1.7,.05,-Math.PI/2]]:f.id==='02'?[['profile-left',-2.20,4.95,Math.PI/2],['profile-right',1,4.8,-Math.PI/2]]:[['profile-left',tx-2,tz,Math.PI/2],['profile-right',tx+2,tz,-Math.PI/2]];
   if(f.id==='07')profiles.push(['picking-contact',.15,6.0,Math.atan2(-.13825-.15,6.0-5.08899),.026]);
   if(profilesOnly&&f.id==='03')profiles.unshift(['front',tx,Math.min(portal-.55,tz+2.5),0,-.28]);
   const shots=(returnsOnly||process.argv.includes('--checks'))?[]:profilesOnly?profiles:phone?[['phone',0,portal-.55,0]]:[['entry',0,portal-.55,0],['front',tx,Math.min(portal-.55,tz+2.5),0],...profiles,['left',tx-2,tz+1.7,Math.atan2(2,1.7)],['right',tx+2,tz+1.7,Math.atan2(-2,1.7)],['rear',tx+1.8,tz-1.8,Math.atan2(-1.8,-1.8)],['close',tx,Math.min(portal-.55,tz+1.4),0,-.28]];
   if(!phone&&!profilesOnly&&!returnsOnly&&!process.argv.includes('--checks')){
    if(f.id==='06'){
      for(const [i,food] of ['nigiri','avocado','blueberries','rice','smoothie','chicken'].entries()){
        const x=-2.25+i*.90,z=.10+.15*x*x;
        shots.push(['food-'+food,x,z+1.50,0,-.53]);
      }
      shots.push(['food-side',3.9,.1,-Math.PI/2,-.30],['food-rear',0,-1.8,Math.PI,-.34],['family-corner',-1.4,.3,-.50,-.32]);
    }
    if(f.id==='02')shots.push(['care',-3.3,-1.2,0],['household',-3.1,-4.6,-Math.PI/2,-.25],['contacts',2.5,4.2,0],['embrace',0,-2.7,0],['embrace-rear',-1,-7.8,2.75]);
    if(f.id==='02')shots.push(['advisor',-.15,6.0,-.62,-.13],['advisor-screen',.3,4.4,-1.12,-.13],['advisor-front',.25,3.3,-2.37,-.10],['advisor-rear',-.9,5.8,0,-.10]);
    if(f.id==='02')shots.push(['sprout-front',1.4,-.2,.55,-.24],['sprout-angle',3.7,-.5,-.296,-.20],['sprout-profile',4.5,-2.8,-Math.PI/2,-.22],['sprout-rear',3.6,-4.55,-2.811,-.20],['sprout-fist',1.4,-1.65,.82,0]);

    if(f.id==='12')shots.push(['borellis',0,4.5,Math.PI,-.08],['borellis-side',-4.3,7.5,Math.PI/2,-.12],['portal-back',0,5.0,0],['children',.60,.6,0,-.40],['jonas',1.70,-.65,-.2,-.06],['beat-windows',-4,-5.8,0],
      ['beat-bar',-3.5,-5.8,Math.atan2(-2.3,1.25),-.10],['beat-bar-side',-4.1,-9.3,Math.atan2(-1.7,-2.25),-.10],
      ['belmont-view',1.0,-9.7,0,-.30],['leavitt-view',-6.1,-2.5,-Math.PI/2,-.40],
      ['borellis-bar',3.4,5.45,Math.atan2(2.4,-2.4),-.08],['borellis-bar-side',3.5,10.1,Math.atan2(2.3,2.25),-.10],['borellis-piano',-3.5,9.3,Math.atan2(-2.1,-1.0),-.20]);
    if(f.id==='11'){
      shots.unshift(['mermaid-aisle',4.8,6.9,Math.atan2(3.12,2.18),-.08],
      ['mermaid-close',6.8,4.72,Math.PI/2,-.20],
      ['mermaid-oblique',6.4,3.8,Math.atan2(1.52,-.92),-.16]);
      shots.push(['side-reef',6.5,3.0,Math.PI/2],['river-tank',-6.3,.1,-Math.PI/2],['far-reef',0,-8.5,0],['clear-ceiling',-.2,6.9,0,.60],['round-tank-side',4.2,6.8,-Math.PI/2,-.12],['portal-back',0,12.7,0],['rear-habitat',0,15.5,Math.PI]);
    }
   }
   if(f.id==='02'&&phone&&!process.argv.includes('--checks'))shots.push(['advisor-phone',.1,6.5,-.55,-.08]);
   if(f.id==='02'&&phone&&!process.argv.includes('--checks'))shots.push(['sprout-phone',1.4,-.2,.55,-.18]);
   if(f.id==='11'&&phone&&!process.argv.includes('--checks'))shots.push(['mermaid-phone',6.0,5.15,Math.PI/2,-.14]);
   if(f.id==='12'&&phone&&!process.argv.includes('--checks'))shots.push(['beat-bar-phone',-3.5,-5.8,Math.atan2(-2.3,1.25),-.10],['borellis-phone',0,4.5,Math.PI,-.08]);
   if(f.id==='08'&&!phone&&!returnsOnly&&!process.argv.includes('--checks'))for(const [stop,z,side]of[['pullman',7.05,-1],['avalon',5.8,1],['arts-bank',2.1,-1],['narrow-bridge',-1.65,1],['palmisano',-5.4,-1],['saint-ignatius',-9.15,1],['temple',-12.05,-1]]){
    const standZ=stop==='pullman'?9.15:stop==='avalon'?6.6:z,lookX=stop==='pullman'?-3.8:side*4.25;
    shots.push(['route-'+stop,0,standZ,Math.atan2(lookX,standZ-z),stop==='pullman'?.30:stop==='avalon'?.20:stop==='palmisano'?-.06:.15]);
   }
   if(f.id==='11'&&process.argv.includes('--aquarium')){
    const keep=new Set(['entry','mermaid-aisle','mermaid-close','mermaid-oblique','side-reef','river-tank','far-reef','clear-ceiling','round-tank-side','portal-back','rear-habitat','phone','mermaid-phone']);
    for(let i=shots.length-1;i>=0;i--)if(!keep.has(shots[i][0]))shots.splice(i,1);
   }
   if(f.id==='02'&&process.argv.includes('--advisor')){const keep=new Set(['entry','advisor','advisor-screen','advisor-front','advisor-rear','phone','advisor-phone']);for(let i=shots.length-1;i>=0;i--)if(!keep.has(shots[i][0]))shots.splice(i,1);}
   if(f.id==='02'&&process.argv.includes('--sprout')){const keep=new Set(['entry','advisor-screen','sprout-front','sprout-angle','sprout-profile','sprout-rear','sprout-fist','phone','sprout-phone']);for(let i=shots.length-1;i>=0;i--)if(!keep.has(shots[i][0]))shots.splice(i,1);}
   if(f.id==='12'&&process.argv.includes('--venues')){const keep=new Set(['entry','phone','beat-windows','beat-bar','beat-bar-side','belmont-view','leavitt-view','borellis','borellis-side','borellis-bar','borellis-bar-side','borellis-piano','beat-bar-phone','borellis-phone','portal-back']);for(let i=shots.length-1;i>=0;i--)if(!keep.has(shots[i][0]))shots.splice(i,1);}
   if(f.id==='12'&&process.argv.includes('--subjects')){const keep=new Set(['entry','phone','front','profile-left','profile-right','left','right','rear','close','children','jonas']);for(let i=shots.length-1;i>=0;i--)if(!keep.has(shots[i][0]))shots.splice(i,1);}
   let captured=0;
   for(let [name,x,z,yaw,pitch=0] of shots){
    // Software WebGL retains substantial snapshot memory for the large cast.
    // Fresh renderers between small capture batches keep evidence reliable.
    if(f.id==='12'&&captured>0&&captured%2===0){
      await p.close();await browser.close();
      browser=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
      p=await browser.newPage(phone?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:960,height:720}});p.on('pageerror',e=>errors.push(e.message));
      await p.goto(base+'/explore/',{waitUntil:'networkidle'});await enterExhibit(p);
      await p.evaluate(([x,z,y])=>window.__galleryTestPose(x,z,y),[f.center.x-o.x*2.8,f.center.z-o.z*2.8,baseYaw]);
      await p.waitForFunction(id=>window.__galleryDebug().activeRoom===id,f.id,{timeout:45000});
      await p.evaluate(([x,z])=>window.__galleryTestWorldMove(x,z),[f.center.x+o.x*.55,f.center.z+o.z*.55]);
    }
    if(name==='front'&&f.id==='03')pitch=-.28;
    if(name==='front'&&f.id==='04')pitch=-.22;
    if(f.id==='06'&&['front','profile-left','profile-right','left','right','rear','close'].includes(name))pitch=name==='front'||name==='close'?-.44:-.32;
    const focal=f.id==='06'&&name.startsWith('food-')&&['nigiri','avocado','blueberries','rice','smoothie','chicken'].includes(name.slice(5))?(()=>{const i=['nigiri','avocado','blueberries','rice','smoothie','chicken'].indexOf(name.slice(5)),x=-2.25+i*.90;return[x,.10+.15*x*x];})():f.id==='02'?(name.startsWith('sprout-')?[3,-2.8]:{care:[-3.5,-3.3],household:[-4.16,-4.50],contacts:[3.1,1.9],embrace:[-.1,-5.65],'embrace-rear':[-.1,-5.65]}[name]||[tx,tz]):f.id==='08'?({'route-pullman':[-3.8,7.05],'route-avalon':[4.25,5.8],'route-arts-bank':[-4.25,2.1],'route-narrow-bridge':[4.25,-1.65],'route-palmisano':[-4.25,-5.4],'route-saint-ignatius':[4.25,-9.15],'route-temple':[-4.25,-12.05]}[name]||[tx,tz]):[tx,tz];
    let stand=await p.evaluate(([x,z])=>window.__galleryTestRoomCanStand(x,z),[x,z]);
    if(!stand){for(const [dx,dz] of [[.9,0],[-.9,0],[0,.9],[0,-.9],[1.4,0],[-1.4,0],[2.5,0],[-2.5,0]])if(await p.evaluate(([x,z])=>window.__galleryTestRoomCanStand(x,z),[x+dx,z+dz])){x+=dx;z+=dz;yaw=Math.atan2(focal[0]-x,z-focal[1]);stand=true;break;}}
    if(!stand){results.push({id:f.id,name,unreachable:true});continue;}
    await p.evaluate(([x,z,y,pitch])=>window.__galleryTestRoomPose(x,z,y,pitch),[x,z,baseYaw+yaw,pitch]);
    const pixels=await finishedSnapshot(p);
    await writeFile(`${output}/${f.id}-${name}.png`,Buffer.from(pixels.split(',')[1],'base64'));
    captured++;results.push({id:f.id,name,x,z,yaw,pitch,stand});console.log(`Review ${f.id}: captured ${name}`);
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
   if(f.id==='02'){
    await p.evaluate(()=>window.__galleryTestRoomPose(.9,7.9,0));
    for(const point of[[.9,4],[.9,-.2],[1.4,-.2],[3.8,-.2],[3.8,-.5],[4,-2.3],[3.9,-4.55],[1.4,-4.55],[1.4,-.2]]){
      await p.evaluate(([x,z])=>window.__galleryTestRoomMove(x,z),point);
      const s=await p.evaluate(()=>window.__galleryDebug());assert.equal(s.mode,'room');
      assert.ok(Math.hypot(s.roomLocal.x-point[0],s.roomLocal.z-point[1])<.08,'frame 02: clear route to and around the sprout vignette '+JSON.stringify({intended:point,actual:s.roomLocal}));
    }
    results.push({id:f.id,name:'sprout walking route and circuit',viewport:phone?'phone':'desktop',passed:true});
   }
   if(f.id==='12'&&process.argv.includes('--soak')&&!phone){
    const samples=[];
    for(let cycle=0;cycle<6;cycle++){
      await p.evaluate(y=>window.__galleryTestRoomPose(3.2,1.4,y),baseYaw);
      for(const [x,z]of[[3.2,4.7],[-3.2,4.7],[-3.2,1.4],[0,1.4]]){
        await p.evaluate(([x,z])=>window.__galleryTestRoomMove(x,z),[x,z]);
        const result=await p.evaluate(async y=>{
          window.__galleryTestRoomPose(window.__galleryDebug().roomLocal.x,window.__galleryDebug().roomLocal.z,y);
          const start=performance.now();for(let i=0;i<6;i++)await new Promise(requestAnimationFrame);
          return {elapsedMs:performance.now()-start,heapBytes:performance.memory?.usedJSHeapSize??null,state:window.__galleryDebug().mode,worlds:window.__galleryDebug().loadedWorldCount};
        },baseYaw+cycle*.8);
        assert.equal(result.state,'room');assert.equal(result.worlds,1);samples.push(result);
      }
    }
    await writeFile(output+'/12-soak.json',JSON.stringify({build:captureBuild,movementLoops:6,renderedFrames:144,contextSurvived:true,screenshotReadback:false,samples},null,2));
    console.log('Frame 12: repeated continuous-render exploration survived without screenshot readbacks');
   }
   if(f.id==='12'){
    for(const x of [-3.2,3.2]){
      await p.evaluate(x=>window.__galleryTestRoomPose(x,1.4,0),x);
      await p.evaluate(x=>window.__galleryTestRoomMove(x,4.7),x);
      const loop=await p.evaluate(()=>window.__galleryDebug());assert.equal(loop.mode,'room');assert.ok(loop.roomLocal.z>4.5,`frame 12: clear route to Borellis around post at ${x}`);
    }
    await p.evaluate(()=>window.__galleryTestRoomPose(0,4.7,0));await p.evaluate(()=>window.__galleryTestRoomMove(0,1.7));assert.equal((await p.evaluate(()=>window.__galleryDebug())).mode,'room','rear crossing stays in the continuous jam world');
    // Walk the actual perimeter with the revised bars and café furniture. A
    // reachable screenshot position alone does not establish a clear route.
    const routes=[{name:'upstairs bar',start:[-4.1,1.4],points:[[-4.1,-4.7],[-3.5,-5.8],[0,-8.7],[1,-9.7]]},
      {name:'side street window',start:[-4.1,1.4],points:[[-4.1,-2.5],[-6.1,-2.5]]},
      {name:'Borellis bar',start:[3.2,1.4],points:[[3.2,4.7],[3.4,5.45]]},
      {name:'Borellis piano',start:[-3.6,4.7],points:[[-3.6,6.0],[-3.9,6.0],[-3.9,9.3],[-3.5,9.3]]}];
    for(const route of routes){await p.evaluate(([x,z])=>window.__galleryTestRoomPose(x,z,0),route.start);for(const point of route.points){await p.evaluate(([x,z])=>window.__galleryTestRoomMove(x,z),point);const s=await p.evaluate(()=>window.__galleryDebug());assert.equal(s.mode,'room');assert.ok(Math.hypot(s.roomLocal.x-point[0],s.roomLocal.z-point[1])<.08,`frame 12: clear route to ${route.name}`);}results.push({id:f.id,name:route.name+' walking route',viewport:phone?'phone':'desktop',passed:true});}
    await p.evaluate(()=>window.__galleryTestRoomPose(1,-9.7,0));await p.evaluate(()=>window.__galleryTestRoomMove(1,-13.0));assert.ok((await p.evaluate(()=>window.__galleryDebug())).roomLocal.z>-11,'frame 12: upstairs window boundary blocks walking into the street');
   }
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
    if(f.id==='12'){
      await p.evaluate(([z,y])=>window.__galleryTestRoomPose(0,z,y),[portal-.58,baseYaw]);
      const ring=await p.locator('.joystick-ring').boundingBox();assert.ok(ring);
      const x=ring.x+ring.width/2,y=ring.y+ring.height/2,prior=(await p.evaluate(()=>window.__galleryDebug())).roomLocal.z;
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-32,id:2}]});
      await p.waitForFunction(z=>window.__galleryDebug().roomLocal.z<z-.02,prior,{timeout:15000});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      results.push({id:f.id,name:'thumb-joystick-moves',passed:true});
    }
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
   if(!phone&&!process.argv.includes('--checks')){const pixels=await finishedSnapshot(p);await writeFile(`${output}/${f.id}-return.png`,Buffer.from(pixels.split(',')[1],'base64'));}
   // The compact exhibition has no empty wing. Probe distance-based disposal
   // beyond every frame instead of reusing an old hallway coordinate near 07.
   const cleanup={x:Math.max(...frames.map(f=>f.center.x))+30,z:Math.max(...frames.map(f=>f.center.z))+30};
   await p.evaluate(([x,z])=>window.__galleryTestPose(x,z,0),[cleanup.x,cleanup.z]);
   await p.waitForFunction(()=>window.__galleryDebug().activeRoom===null);
   assert.equal((await p.evaluate(()=>window.__galleryDebug())).loadedWorldCount,0,`frame ${f.id}: cleanup`);
   results.push({id:f.id,viewport:phone?'phone':'desktop',entry:true,collisionSamples:interior.slice(0,40).length,return:true,continuousCamera:true,controls:true,cleanup:true});
   assert.deepEqual(errors,[],`frame ${f.id} page errors`);await p.close();
  }
  await browser.close();browser=null;
  if(contactsOnly){console.log(`Frame ${f.id}: contact data saved separately from visual and functional acceptance`);}
  else if(returnsOnly){await writeFile(`${output}/${f.id}-return-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: continuous return view captured`);}
  else if(profilesOnly){await writeFile(`${output}/${f.id}-profiles.json`,JSON.stringify(results.filter(r=>r.id===f.id),null,2));await writeFile(`${output}/${f.id}-profile-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: accessible side-profile views captured`);}
  else if(approachesOnly){await writeFile(`${output}/${f.id}-approach-build.json`,JSON.stringify(captureBuild,null,2));console.log(`Frame ${f.id}: hallway painting and partial reveal captured`);}
  else {await writeFile(`${output}/${f.id}-verification.json`,JSON.stringify(results.filter(r=>r.id===f.id),null,2));await writeFile(`${output}/${f.id}-verification-build.json`,JSON.stringify(captureBuild,null,2));if(!process.argv.includes('--checks')){await writeFile(`${output}/${f.id}-capture-poses.json`,JSON.stringify(results.filter(r=>r.id===f.id),null,2));await writeFile(`${output}/${f.id}-capture-build.json`,JSON.stringify({...captureBuild,captured:true},null,2));await writeFile(`${output}/${f.id}-return-build.json`,JSON.stringify(captureBuild,null,2));}console.log(`Frame ${f.id}: desktop and fresh phone checks passed${process.argv.includes('--checks')?'':' with walkaround captures'}`);}
 }
}
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
