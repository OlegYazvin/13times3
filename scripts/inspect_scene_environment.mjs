import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneGeometryFromGLB} from './scene_geometry.mjs';

const id=process.argv[2],bytes=await readFile(`src/assets/explore/room${id}/room.glb`),root=await sceneGeometryFromGLB(bytes),meshes=[],v=new THREE.Vector3();
root.traverse(o=>{
 if(!o.isMesh)return;
 const name=o.name.replaceAll('_',' '),bounds=new THREE.Box3(),points=[];
 for(let i=0;i<o.geometry.attributes.position.count;i++){
  o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld);bounds.expandByPoint(v);
  if(name.includes('cambered plank-built bridge deck'))points.push(v.toArray());
 }
 meshes.push({name,bounds,object:o,points});
});
const horizontalGap=(a,b)=>Math.hypot(Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z));
const results=[];
if(id==='08'){
 const bodies=meshes.filter(m=>/solid Pullman administration facade|solid layered theater facade|solid neoclassical arts bank body|solid former congregation building|solid broad school masonry|solid masonry hall at the quiet end/.test(m.name));
 const posts=meshes.filter(m=>m.name.startsWith('solid fluted route lantern post')),labels=meshes.filter(m=>m.name.startsWith('route label ')),floor=meshes.find(m=>m.name.includes('walkable painted ground continuing'));
 if(bodies.length!==6||posts.length!==6||labels.length!==7||!floor)throw Error('Missing route environment surfaces');
 const ray=new THREE.Raycaster();
 for(const post of posts){
  const c=post.bounds.getCenter(new THREE.Vector3());ray.set(new THREE.Vector3(c.x,10,c.z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(floor.object)[0];
  results.push({label:'lantern clears principal building walls and meets the street',x:c.x,z:c.z,minimumHorizontalWallClearanceM:Math.min(...bodies.map(b=>horizontalGap(post.bounds,b.bounds))),footMinusGroundM:hit?post.bounds.min.y-hit.point.y:null});
 }
 for(const label of labels)results.push({label:label.name,minimumHorizontalWallClearanceM:Math.min(...bodies.map(b=>horizontalGap(label.bounds,b.bounds)))});
}else if(id==='03'){
 const pedestal=meshes.find(m=>m.name.startsWith('joined pedestal grounding')),pad=meshes.find(m=>m.name.startsWith('continuous rounded rubber surface')),table=meshes.find(m=>m.name==='solid petal-shaped play table'),deck=meshes.find(m=>m.name.includes('cambered plank-built bridge deck')),stairs=meshes.filter(m=>m.name.startsWith('solid timber arrival step'));
 if(!pedestal||!pad||!table||!deck||stairs.length!==6)throw Error('Missing supported park arrangements');
 results.push({label:'play-table pedestal meets the play surface and joins the tabletop',footMinusSurfaceM:pedestal.bounds.min.y-pad.bounds.max.y,verticalJoinOverlapM:pedestal.bounds.max.y-table.bounds.min.y});
 for(const edge of['min','max']){
  const endX=deck.bounds[edge].x,endHeight=Math.max(...deck.points.filter(p=>Math.abs(p[0]-endX)<.001).map(p=>p[1]));
  const stair=stairs.filter(s=>edge==='min'?s.bounds.max.x<=endX+.002:s.bounds.min.x>=endX-.002).sort((a,b)=>b.bounds.max.y-a.bounds.max.y)[0];
  if(!stair)throw Error('Missing bridge arrival');
  results.push({label:`${edge==='min'?'left':'right'} stair joins the bridge end`,horizontalGapM:horizontalGap(stair.bounds,deck.bounds),topMinusDeckEndM:stair.bounds.max.y-endHeight});
 }
}else throw Error('Pass scene 03 or 08');
const report={build:{id,modelSha256:createHash('sha256').update(bytes).digest('hex'),recordedAt:new Date().toISOString()},method:'Actual decoded world-space vertices and ground ray tests. Wall clearance uses projected surface bounds; join overlaps are intentional support construction. This does not test all environmental triangles.',results};
await writeFile(`.cache/contact-study/${id}-environment.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(results,null,2));
