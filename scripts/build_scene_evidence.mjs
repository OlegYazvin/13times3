import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Persist representative renders of the reviewed exports. Never copy reference
// photographs or historical art experiments into this public evidence folder.
const destination='docs/scene-evidence/2026-10-23',review='.cache/art-review';
await mkdir(destination,{recursive:true});
const gallery=JSON.parse(await readFile('src/_data/gallery.json','utf8'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const appSha256=digest(await readFile('src/assets/explore/app.js'));
const views={'01':['profile-right'],'02':['embrace','household'],'03':['front'],'04':['profile-left'],'05':['front'],'06':['phone'],'07':['front','picking-contact'],'08':['front','route-arts-bank'],'09':['close'],'10':['front','profile-left'],'11':['phone','portal-back']};
const records=[],contacts=[];
for(const frame of gallery.frames.filter(f=>f.room.modelUrl)){
 const id=frame.id,model=await readFile('src'+frame.room.modelUrl),painting=await readFile('src'+frame.room.previewImage);
 const capture=JSON.parse(await readFile(`${review}/${id}-capture-build.json`,'utf8')),verified=JSON.parse(await readFile(`${review}/${id}-verification-build.json`,'utf8'));
 const modelSha256=digest(model),paintingSha256=digest(painting);
 if(!capture.captured||capture.modelSha256!==modelSha256||capture.paintingSha256!==paintingSha256||capture.appSha256!==appSha256||verified.modelSha256!==modelSha256||verified.appSha256!==appSha256)throw Error(`Scene ${id}: current exported visual/functional evidence is required`);
 const checks=JSON.parse(await readFile(`${review}/${id}-verification.json`,'utf8')).filter(r=>r.viewport);
 if(checks.length!==2||checks.some(c=>!c.entry||!c.return||!c.controls||!c.cleanup))throw Error(`Scene ${id}: incomplete functional evidence`);
 const images=[];
 for(const view of views[id]){const file=`${id}-${view}.png`;await copyFile(`${review}/${file}`,`${destination}/${file}`);images.push(file);}
 records.push({id,title:frame.room.title,modelSha256,paintingSha256,appSha256,modelBytes:model.length,paintingBytes:painting.length,capturedAt:capture.recordedAt,images,functionalChecks:checks});
 const extra=id==='06'?['-crossings-Jane-shirt-Zephrine-trousers']:id==='07'?['-crossings-Oleg-face-neck-Zephrine-shirt']:[];
 for(const suffix of['-offline-report','-prop-contacts','-scan','-crossings',...extra]){
  let data;try{data=JSON.parse(await readFile(`.cache/contact-study/${id}${suffix}.json`,'utf8'));}catch{continue;}
  if(data.build.modelSha256!==modelSha256)throw Error(`Scene ${id}: stale ${suffix} contact evidence`);
  contacts.push({id,...data});
 }
}
await writeFile(`${destination}/manifest.json`,JSON.stringify({date:'2026-10-23',method:'Unmodified canvas snapshots from the actual reviewed GLB exports. Portrait-phone views use fresh browser contexts with touch emulation. These are not physical-device performance measurements.',scenes:records},null,2)+'\n');
await writeFile(`${destination}/contact-checks.json`,JSON.stringify({method:'Selected exported posed surfaces: vertex distances and closed-surface containment with a 1 mm penetration threshold. Open cloth receives distance checks only. Minimum clearance does not establish full support coverage or absence of every edge crossing; visual and edge checks supplement this data.',scenes:contacts},null,2)+'\n');
const sections=records.map(r=>`## ${r.id} — ${r.title}\n\n${r.images.map(file=>`![Scene ${r.id}, ${file.replace(`${r.id}-`,'').replace('.png','')}](./${file})`).join('\n\n')}\n`);
await writeFile(`${destination}/README.md`,'# Reviewed native sculpture evidence\n\nThese are unmodified renders of the current room exports. Private reference photographs and historical art experiments are excluded. The [manifest](manifest.json) identifies model and application hashes; [contact checks](contact-checks.json) record selected geometry measurements. Functional verification and artistic judgment are separate. See the [scene report](../../scene-revision-report.md) for the changes and remaining weaknesses.\n\n'+sections.join('\n'));
console.log(`Saved current evidence for ${records.length} scenes in ${destination}`);
