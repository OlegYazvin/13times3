import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,copyFile} from 'node:fs/promises';
import {galleryBrowserExecutable} from './gallery_browser.mjs';
const run=promisify(execFile);
const executablePath=await galleryBrowserExecutable();
const ids=process.argv.slice(2).length?process.argv.slice(2):Array.from({length:11},(_,i)=>String(i+1).padStart(2,'0'));
await mkdir('.cache/art-review/before',{recursive:true});
for(const id of ids){
  try{await copyFile(`src/assets/explore/room${id}/preview.webp`,`.cache/art-review/before/${id}.webp`,4);}catch{}
  const file='scripts/build_gallery_room.mjs';
  const args=[file,id];
  const r=await run(process.execPath,args,{env:{...process.env,GALLERY_BROWSER_EXECUTABLE:executablePath},maxBuffer:2e6});
  console.log(r.stdout.trim());if(r.stderr.trim())console.log(r.stderr.slice(-800));
}
