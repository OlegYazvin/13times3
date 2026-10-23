import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,copyFile,readFile} from 'node:fs/promises';
import {galleryBrowserExecutable} from './gallery_browser.mjs';
const run=promisify(execFile);
const executablePath=await galleryBrowserExecutable();
const ids=process.argv.slice(2).length?process.argv.slice(2):JSON.parse(await readFile('src/_data/gallery.json','utf8')).frames.filter(f=>f.room.modelUrl).map(f=>f.id);
await mkdir('.cache/art-review/before',{recursive:true});
const failures=[];
for(const id of ids){
  try{await copyFile(`src/assets/explore/room${id}/preview.webp`,`.cache/art-review/before/${id}.webp`,4);}catch{}
  const file='scripts/build_gallery_room.mjs';
  const args=[file,id];
  try{const r=await run(process.execPath,args,{env:{...process.env,GALLERY_BROWSER_EXECUTABLE:executablePath},maxBuffer:2e6});
    console.log(r.stdout.trim());if(r.stderr.trim())console.log(r.stderr.slice(-800));
  }catch(error){failures.push(id);console.error(`Room ${id} failed: ${(error.stderr||error.message).slice(-2000)}`);}
}
if(failures.length)throw Error(`Scenes requiring correction: ${failures.join(', ')}`);
