import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,dirname} from 'node:path';
import {validateGalleryGeometry} from './validate_gallery_geometry.mjs';
const run=promisify(execFile);

// Exact welding merges only bitwise-identical vertices. It retains every
// silhouette, material, UV and skin weight while allowing indexed reuse.
export async function packGalleryRoom(rawPath,packedPath){
 await validateGalleryGeometry(rawPath);
 const cli=resolve('node_modules/.bin/gltf-transform'),welded=resolve(dirname(rawPath),'room-welded.glb');
 await run(cli,['weld',rawPath,welded],{maxBuffer:2e6});
 // A 144 m field at the default 14-bit precision moved the flat gathering
 // floor almost 4 mm upward and buried its contact shadows. 16 bits keeps
 // those relationships within a millimetre without changing authored poses.
 await run(cli,['meshopt',welded,packedPath,'--quantize-position','16'],{maxBuffer:2e6});
}
