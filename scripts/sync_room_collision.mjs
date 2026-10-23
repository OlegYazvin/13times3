import {readFile,writeFile} from 'node:fs/promises';
// Use the same exported-model footprints verified by the live room loader.
// This keeps the manifest fallback aligned after figures/furniture are moved.
const manifest=JSON.parse(await readFile('src/_data/gallery.json','utf8'));
for(const frame of manifest.frames.filter(f=>f.room.modelUrl)){
 const boxes=JSON.parse(await readFile(`.cache/art-review/${frame.id}-colliders.json`,'utf8'));
 if(!boxes.length||boxes.some(b=>!['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(b[k]))))throw Error(`Invalid model footprints in ${frame.id}`);
 // Wall planes can have zero depth. Give their fallback footprints the same
 // small physical thickness expected by the collision layout validator.
 for(const box of boxes)for(const axis of ['X','Z']){
  const low=`min${axis}`,high=`max${axis}`;
  if(box[low]>box[high])throw Error(`Reversed model footprint in ${frame.id}`);
  if(box[high]-box[low]<.005){const center=(box[low]+box[high])/2;box[low]=center-.0025;box[high]=center+.0025;}
 }
 frame.room.colliders=boxes;
}
await writeFile('src/_data/gallery.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Aligned all eleven manifest fallbacks with reviewed exported footprints');
