import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const selected=process.argv.slice(2).filter(x=>/^\d{2}$/.test(x));
const capture=process.argv.includes('--capture');
const ids=selected.length?selected:JSON.parse(await readFile('src/_data/gallery.json','utf8')).frames.filter(f=>f.room.modelUrl).map(f=>f.id);
if(!selected.length){
 console.log('Verifying museum entrance, sculptures, routes and proximity sound');
 const museum=await run(process.execPath,['scripts/review_museum.mjs',...(capture?[]:['--checks'])],{maxBuffer:4e6});console.log(museum.stdout.trim());
}
for(const args of [...(!selected.length?[['--global']]:[]),...ids.map(id=>capture?[id]:['--checks',id])]){
 console.log('Verifying gallery '+args.join(' '));
 const r=await run(process.execPath,['scripts/run_gallery_review.mjs',...args],{maxBuffer:4e6});
 console.log(r.stdout.trim());if(r.stderr)console.log(r.stderr.slice(-1500));
}
