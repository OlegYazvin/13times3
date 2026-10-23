import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {packGalleryRoom} from './pack_gallery_room.mjs';
const ids=process.argv.slice(2).length?process.argv.slice(2):JSON.parse(await readFile('src/_data/gallery.json','utf8')).frames.filter(f=>f.room.modelUrl).map(f=>f.id);
for(const id of ids){
 const raw=resolve(`.cache/room${id}/room-uncompressed.glb`),packed=resolve(`.cache/room${id}/room-meshopt.glb`),destination=`src/assets/explore/room${id}/room.glb`;
 const before=(await stat(destination)).size;await packGalleryRoom(raw,packed);const bytes=await readFile(packed);await writeFile(destination,bytes);
 console.log(`Room ${id}: ${before} → ${bytes.length} bytes; exact vertex welding before meshopt`);
}
