import {build} from 'esbuild';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {galleryBrowserExecutable} from './gallery_browser.mjs';
const gallery=JSON.parse(await readFile('src/_data/gallery.json','utf8'));
const selected=process.argv.slice(2).filter(x=>/^\d{2}$/.test(x));
const dir='.cache/portal-projection';await mkdir(dir,{recursive:true});
await build({entryPoints:['scripts/portal_preview_author.mjs'],bundle:true,format:'esm',outfile:dir+'/author.js'});
const server=createServer(async(req,res)=>{try{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><body style="margin:0"><script type="module" src="/author.js"></script>');return;}
 if(pathname==='/author.js'){res.setHeader('content-type','text/javascript');res.end(await readFile(dir+'/author.js'));return;}
 if(!/^\/assets\/explore\/room\d\d\/room.glb$/.test(pathname)){res.writeHead(404);res.end();return;}
 res.setHeader('content-type','model/gltf-binary');res.end(await readFile('src'+pathname));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:await galleryBrowserExecutable(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
try{for(const frame of gallery.frames.filter(f=>f.room.modelUrl&&(!selected.length||selected.includes(f.id)))){
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForFunction(()=>typeof window.__portalPreview==='function');
 const image=await page.evaluate(frame=>window.__portalPreview(frame),frame);
 await writeFile(`${dir}/${frame.id}-preview.webp`,Buffer.from(image.split(',')[1],'base64'));
 console.log(`Frame ${frame.id}: frame-projected preview rendered`);await page.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));}
