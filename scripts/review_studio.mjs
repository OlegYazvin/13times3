import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {galleryBrowserExecutable} from './gallery_browser.mjs';
const executablePath=await galleryBrowserExecutable();
await mkdir('.cache/art-review',{recursive:true});
await build({entryPoints:['scripts/storybook_studio.mjs'],bundle:true,format:'esm',outfile:'.cache/art-review/studio.js'});
const server=createServer(async(req,res)=>{if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<script type="module" src="/studio.js"></script>');}else{res.setHeader('content-type','application/javascript');res.end(await readFile('.cache/art-review/studio.js'));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const b=await chromium.launch({headless:true,executablePath,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
try{const p=await b.newPage({viewport:{width:1100,height:800}});p.on('pageerror',e=>console.log(e.message));await p.goto(`http://127.0.0.1:${server.address().port}`);await p.waitForFunction(()=>window.__studio);
for(const [name,angle,close] of [['front',0,false],['angle',.65,false],['profile',1.57,false],['rear',3.14,false],['close',0,true]]){const data=await p.evaluate(([a,c])=>window.__studio(a,c),[angle,close]);await writeFile(`.cache/art-review/studio-${name}.png`,Buffer.from(data.split(',')[1],'base64'));}for(const [name,angle] of [['front',0],['angle',.65],['profile',1.57],['rear',3.14]]){const data=await p.evaluate(a=>window.__studioChild(a),angle);await writeFile(`.cache/art-review/studio-zephrine-${name}.png`,Buffer.from(data.split(',')[1],'base64'));}console.log('Studio: cast and close child views saved');}finally{await b.close();await new Promise(r=>server.close(r));}
