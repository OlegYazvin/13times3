// Inspect the same decoded, posed GLB geometry as the browser, without needing
// a rendered frame for every small contact adjustment. Visual review is separate.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {subjectMeshesInRoot} from '../client/explore/subject-meshes.mjs';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';

const id=process.argv[2]||'07',bytes=await readFile(`src/assets/explore/room${id}/room.glb`);
const scene=await sceneGeometryFromGLB(bytes);
const meshes=subjectMeshesInRoot(scene);
if(!meshes.length)throw Error(`No semantic character surfaces in room ${id}`);
const digest=b=>createHash('sha256').update(b).digest('hex'),build={id,modelSha256:digest(bytes),paintingSha256:digest(await readFile(`src/assets/explore/room${id}/preview.webp`)),recordedAt:new Date().toISOString(),extractor:'Three.js GLTFLoader; textures omitted; exported geometry and skinning preserved'};
await mkdir('.cache/contact-study',{recursive:true});
await writeFile(`.cache/contact-study/${id}-offline-meshes.json`,JSON.stringify({build,meshes}));
console.log(`Room ${id}: ${meshes.length} posed exported surfaces extracted without rendering`);
