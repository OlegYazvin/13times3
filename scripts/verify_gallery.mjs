import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const selected=process.argv.slice(2).filter(x=>/^\d{2}$/.test(x));
const capture=process.argv.includes('--capture');
const ids=selected.length?selected:Array.from({length:11},(_,i)=>String(i+1).padStart(2,'0'));
for(const args of [...(!selected.length?[['--global']]:[]),...ids.map(id=>capture?[id]:['--checks',id])]){
 const r=await run(process.execPath,['scripts/run_gallery_review.mjs',...args],{maxBuffer:4e6});
 console.log(r.stdout.trim());if(r.stderr)console.log(r.stderr.slice(-1500));
}
