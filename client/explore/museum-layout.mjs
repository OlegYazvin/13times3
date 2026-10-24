import {HALL_WIDTH} from './layout.mjs';

export function museumPoint(section,x,along){return {x:section.start.x+section.right.x*x+section.forward.x*along,z:section.start.z+section.right.z*x+section.forward.z*along};}
function footprint(section,x,along,width,depth){
 const points=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([a,b])=>museumPoint(section,x+a*width/2,along+b*depth/2));
 return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minZ:Math.min(...points.map(p=>p.z)),maxZ:Math.max(...points.map(p=>p.z))};
}
export function museumExhibits(layout){
 return layout.sections.map((section,i)=>({id:['dishwasher','cat-whisperer','embrace'][i],section,along:i===0?14.4:section.length*.52,width:i===0?3.1:2.45,depth:i===0?2.5:2.1}));
}
// Suspended fixtures stay above the visitor and every artwork sightline.
// Positions belong to the shared museum, independently of memory worlds.
export function museumFixtureSites(layout){
 const plan=[
  [0,7.5,'crystal'],[0,14.4,'botanical'],[0,26,'alabaster'],
  [1,10.5,'glass'],[1,20,'edison'],[1,28,'crystal'],
  [2,7.5,'glass'],[2,15.6,'alabaster'],[2,24,'botanical'],
 ];
 return plan.map(([index,along,kind],i)=>({id:'pendant-'+(i+1),kind,section:index,along,...museumPoint(layout.sections[index],0,along),yaw:layout.sections[index].yaw}));
}
export function museumColliders(layout){
 const colliders=[];
 for(const e of museumExhibits(layout)){
  colliders.push(footprint(e.section,0,e.along,e.width,e.depth));
  colliders.push(footprint(e.section,0,e.along+5.4,2.6,.8));
 }
 for(const sign of[-1,1])colliders.push(footprint(layout.sections[0],sign*3.45,4,.62,.72));
 for(const section of layout.sections)for(const sign of[-1,1]){
  const frames=layout.frames.filter(f=>f.section===section.index&&f.sideSign===sign).sort((a,b)=>a.along-b.along);
  for(let i=1;i<frames.length;i++)colliders.push(footprint(section,sign*(HALL_WIDTH/2-.18),(frames[i-1].along+frames[i].along)/2,.58,.58));
 }
 return colliders;
}
export function museumSconceSites(layout){
 const sites=[];
 for(const section of layout.sections)for(const sign of[-1,1]){
  const centers=layout.frames.filter(f=>f.section===section.index&&f.sideSign===sign).map(f=>f.along).sort((a,b)=>a-b);
  const locations=[...new Set(centers.slice(1).map((c,i)=>(centers[i]+c)/2))];
  if(section.index===0)locations.unshift(3.8);
  for(const along of locations){const onColumn=!(section.index===0&&along===3.8),mountX=HALL_WIDTH/2-(onColumn?.37:.08);const p=museumPoint(section,sign*(mountX-.43),along);sites.push({...p,y:2.80,section:section.index,sign,along,mountX});}
 }
 return sites;
}
