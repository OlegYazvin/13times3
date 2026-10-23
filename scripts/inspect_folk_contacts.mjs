import * as THREE from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';
import {subjectMeshesInRoot} from '../client/explore/subject-meshes.mjs';
import {sculptSurface} from './sculpt_surface.mjs';
const bytes=await readFile('src/assets/explore/room12/room.glb'),root=await sceneGeometryFromGLB(bytes),subjects=subjectMeshesInRoot(root),props=[];
const inverse=root.matrixWorld.clone().invert(),v=new THREE.Vector3();root.traverse(o=>{
 if(!o.isMesh)return;let actor=o;while(actor&&!actor.userData.storyIdentity)actor=actor.parent;
 let inst=o;while(inst&&!inst.userData.folkInstrument)inst=inst.parent;
 const positions=[];for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);positions.push(...v.toArray());}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(o.geometry.index?Array.from(o.geometry.index.array):Array.from({length:positions.length/3},(_,i)=>i));g.computeBoundingBox();props.push({name:o.name.replaceAll('_',' ')+' '+(o.userData.storyPart||'')+(inst?' instrument-part':''),actor:actor?.userData.storyIdentity,g,bounds:g.boundingBox});
});
const rows=[];const sample=(identity,part,pattern,label,closed=true)=>{
 const source=subjects.filter(m=>m.identity===identity&&m.part===part),targets=props.filter(p=>p.actor===identity&&pattern.test(p.name));
 if(!source.length||!targets.length)throw Error('Missing arrangement: '+label);
 for(const t of targets)t.probe??=sculptSurface(t.g);
 let min=Infinity,inside=0,depth=0;
 for(const m of source)for(let i=0;i<m.positions.length;i+=3){v.fromArray(m.positions,i);let penetrated=false;for(const t of targets){const n=t.probe.nearest(v);min=Math.min(min,n.distance);if(closed&&n.distance>.001&&t.bounds.containsPoint(v)&&t.probe.contains(v)){penetrated=true;depth=Math.max(depth,n.distance);}}if(penetrated)inside++;}
 rows.push({identity,part,label,minimumSurfaceDistanceM:min,containmentTested:closed,verticesDeeperThan1mm:closed?inside:null,maximumSampledPenetrationM:closed?depth:null});
};
for(const who of ['Jonas Friddle','Guitar neighbor','Mandolin neighbor','Fiddle neighbor','Borellis guitarist','Borellis banjo player']){
 sample(who,'hand-left',/^(ebony fingerboard|seated metal fret)/,'fingering hand against its own instrument fingerboard');
 sample(who,'hand-right',/instrument-part/,'strumming hand against its own sounding surface',false);
}
sample('Bass neighbor','hand-left',/ebony fingerboard|seated metal fret/,'upright bass fingering hand');
sample('Bass neighbor','hand-right',/instrument-part/,'upright bass plucking hand',false);
for(const who of ['Guitar neighbor','Borellis guitarist'])sample(who,'trousers',/hollow guitar soundboard/,'guitar clearance above the seated thighs');
for(const who of ['Jane','Oleg','Borellis listening neighbor']){
 sample(who,'hand-left',/trousers/,'left listening hand on its own lap');
 sample(who,'hand-right',/trousers/,'right listening hand on its own lap');
 sample(who,'trousers',/formed chair seat/,'seated thigh support on own chair');
}
sample('Borellis drummer','hand-left',/taut frame drum skin|bentwood frame drum shell/,'supporting drum hand',false);
sample('Borellis drummer','hand-right',/taut frame drum skin/,'tapping drum hand',false);
await mkdir('.cache/contact-study',{recursive:true});await writeFile('.cache/contact-study/12-folk-contacts.json',JSON.stringify({modelSha256:createHash('sha256').update(bytes).digest('hex'),recordedAt:new Date().toISOString(),method:'Actual exported posed vertices against actor-specific decoded prop triangles. Distances and closed-mesh containment samples supplement visual inspection; they are not a proof of full contact coverage.',rows},null,2)+'\n');console.log(JSON.stringify(rows,null,2));
