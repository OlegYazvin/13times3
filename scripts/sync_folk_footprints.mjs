import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=x=>createHash('sha256').update(x).digest('hex');
const records=[];
for(const path of ['src/assets/explore/room12/room.glb','.cache/room12/room-uncompressed.glb']){
 const before=await readFile(path),length=before.readUInt32LE(12),json=JSON.parse(before.subarray(20,20+length).toString()),binary=before.subarray(20+length);
 const rendered=value=>{const j=structuredClone(value);for(const node of j.nodes||[])if(node.extras)delete node.extras.solidFootprint;return JSON.stringify(j);};
 const definition=rendered(json);let marked=0;
 for(const node of json.nodes||[])if(['trousers','shoe'].includes(node.extras?.storyPart)){if(!node.extras.solidFootprint)marked++;node.extras.solidFootprint=true;}
 assert.equal(rendered(json),definition,'Only collision metadata may change');
 const encoded=Buffer.from(JSON.stringify(json)),padding=(4-encoded.length%4)%4,chunk=Buffer.concat([encoded,Buffer.alloc(padding,32)]),header=Buffer.from(before.subarray(0,20));header.writeUInt32LE(20+chunk.length+binary.length,8);header.writeUInt32LE(chunk.length,12);
 const after=Buffer.concat([header,chunk,binary]);assert.equal(hash(after.subarray(20+chunk.length)),hash(binary));await writeFile(path,after);
 records.push({path,marked,beforeSha256:hash(before),afterSha256:hash(after),renderDefinitionUnchanged:true,binaryChunksSha256:hash(binary)});
}
await writeFile('.cache/contact-study/12-footprint-metadata.json',JSON.stringify({method:'Added lower-body collision metadata only. Every render-defining JSON property and every binary byte is unchanged.',records},null,2)+'\n');console.log(records.map(({path,marked})=>({path,marked})));
