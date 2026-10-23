import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {writeFile} from 'node:fs/promises';
// Geometry-only footwear from the prepared CC0 Innerscene Sam source.
const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read('scripts/assets/figures/rigged-casual-sam.glb');
const primitive=doc.getRoot().listNodes().find(n=>n.getName()==='shoes01').getMesh().listPrimitives()[0],p=primitive.getAttribute('POSITION'),index=primitive.getIndices().getArray(),result={};
for(const sign of [-1,1]){
 const positions=[],indices=[],used=new Map();
 for(let i=0;i<index.length;i+=3){const triangle=Array.from(index.slice(i,i+3));if(!triangle.every(k=>p.getElement(k,[])[0]*sign>0))continue;
   for(const k of triangle){if(!used.has(k)){used.set(k,positions.length/3);const [x,y,z]=p.getElement(k,[]);positions.push(x-sign*.19038,y-.002,z-.01490);}indices.push(used.get(k));}
 }
 result[sign]={positions,indices};
}
await writeFile('scripts/assets/figures/story-shoes.json',JSON.stringify(result)+'\n');
console.log('Prepared shaped CC0 shoes, without source textures.');
