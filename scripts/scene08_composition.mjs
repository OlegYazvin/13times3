import * as THREE from 'three';

export function finishArchitecturalRouteGround(root){
 root.traverse(o=>{if(/walkable painted ground|continuous distant terrain|distant ground beyond the walkable scene/.test(o.name))o.visible=false;});
 const coordinates=[-72,-50,-36,-26,-20,...Array.from({length:65},(_,i)=>-16+i*.5),20,26,36,50,72],n=coordinates.length,p=[],c=[],indices=[];
 const paving=new THREE.Color(0xb5b0a4),walk=new THREE.Color(0xcabdA5),haze=new THREE.Color(0xa8b8b2);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=coordinates[i],z=coordinates[j],far=THREE.MathUtils.smoothstep(Math.max(Math.abs(x),Math.abs(z)),20,54);
  p.push(x,far*(.12+.08*Math.sin(x*.12+z*.1)+.04*Math.sin(z*.14)),z);
  const path=Math.exp(-(((x-.10*Math.sin(z*.4))/1.8)**2)),color=paving.clone().lerp(walk,path*.85).lerp(haze,far*.7);color.offsetHSL(0,0,.008*Math.sin(x*1.2+z*.8));c.push(color.r,color.g,color.b);
  if(i<n-1&&j<n-1){const a=j*n+i;indices.push(a,a+n,a+1,a+1,a+n,a+n+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeVertexNormals();
 const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));mesh.name='walkable painted ground continuing through the architectural route';root.add(mesh);
}

// Present the original principal elevations to the walker. The previous
// path-side copies obscured real blank walls while leaving a second facade
// facing the entry painting; temple and quarry still read as display models.
export function composeArchitecturalRoute(root,stops){
 const recorded=new Set(stops.flatMap(s=>s.parts));
 const additions=/joined pitched roof|deep auditorium roof|whole bank roof|continuous roof over|deep red schoolhouse roof|recessed window in a complete building return|projecting stone sill on a building return|continuous cornice over a deep architectural volume|solid masonry hall at the quiet end|restrained lodge-hall|temple hall recessed|tall quiet temple-hall|temple-hall stone|rooted planting in the temple forecourt/;
 for(const object of root.children.filter(o=>!recorded.has(o)&&additions.test(o.name))){
  const box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3());
  const nearest=stops.filter(s=>Math.sign(s.x)===Math.sign(center.x)).sort((a,b)=>Math.abs(a.z-center.z)-Math.abs(b.z-center.z))[0];
  if(nearest)nearest.parts.push(object);
 }
 // The background city sits beyond the new building depth, with no hidden
 // interpenetration between the principal stop and a background facade.
 for(const object of root.children){
  if(/solid layered Chicago streetscape|projecting civic cornice|recessed city window|light stone window sill|solid small city stoop|^cut stone step$/.test(object.name))object.position.x+=Math.sign(object.position.x)*2.6;
  if(/shaped distant city building beyond|arched window on distant street building/.test(object.name))object.position.z-=4.5;
  if(/solid fluted route lantern post|carved lamppost flute|square metal foot of route lantern|warm frosted glass enclosed by lantern frame|four slender route-lantern corner rails|formed lantern cap cornice|pitched lantern hood|contained amber light within route lantern/.test(object.name)){
   const center=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());object.position.x+=Math.sign(center.x)*(2.05-3.03);
  }
  if(/^route label |^slim label stand$/.test(object.name))object.position.x=Math.sign(object.position.x)*2.20;
 }
 root.updateMatrixWorld(true);
 for(const stop of stops){
  const group=new THREE.Group();group.name=`architectural stop ${stop.name} facing Jane's route`;group.position.set(stop.x,0,stop.z);root.add(group);group.updateMatrixWorld(true);
  for(const object of stop.parts){
   if(/path-facing dimensional facade|single quiet courtyard leaf|temple gate|upper timber eave|quiet gate lintel/.test(object.name)){object.removeFromParent();continue;}
   group.attach(object);
  }
  const vertical=stop.name.includes('Pullman')?1.55:1.45;
  group.scale.set(1.15,vertical,1.15);group.rotation.y=-stop.side*Math.PI/2;
  group.position.y=.06-.36*vertical;
  if(stop.name.includes('Pullman'))group.position.x=-3.8;
  // Low paving belongs to the street. A thick pedestal makes every stop
  // look like a specimen displayed on a shelf.
  group.traverse(o=>{if(/sculpted foundation/.test(o.name)){
   o.scale.y*=.06/(.36*vertical);o.position.y=.36-.03/vertical;
   o.userData.solidFootprint=false;
  }});
  if(stop.name.includes('quarry'))quarryLandscape(group);
 }
 root.updateMatrixWorld(true);
}

function quarryLandscape(group){
 const rejected=[];group.traverse(o=>{if(/stepped former quarry ledge|small blue quarry pond|park meadow grass/.test(o.name))rejected.push(o);});for(const o of rejected)o.removeFromParent();
 const grass=new THREE.Color(0x819c75),stone=new THREE.Color(0xa4a397),soil=new THREE.Color(0x78836b),positions=[],colors=[],indices=[];
 const height=(x,z)=>{
  const edge=Math.max(0,1-(x/1.86)**2-(z/1.55)**2);
  const ridge=Math.exp(-(((x+.64)/.85)**2+((z+.24)/.93)**2));
  const d=Math.hypot((x-.64)/.64,(z-.58)/.46),pondWeight=1-THREE.MathUtils.smoothstep(d,1,1.55);
  const meadow=.36+edge*(.96*ridge+.07),basin=.31+.10*Math.min(d,1.2)**2;
  return THREE.MathUtils.lerp(meadow,basin,pondWeight);
 };
 const rows=30,sides=96;
 for(let row=0;row<=rows;row++)for(let side=0;side<=sides;side++){
  const a=side/sides*Math.PI*2,r=row/rows,x=Math.cos(a)*1.86*r,z=Math.sin(a)*1.55*r,y=height(x,z);positions.push(x,y,z);
  const cut=THREE.MathUtils.smoothstep(y,.50,.85)*THREE.MathUtils.smoothstep(x,-.8,-.1),c=grass.clone().lerp(stone,cut*.78).lerp(soil,.12*Math.sin(a*7+r*12));colors.push(c.r,c.g,c.b);
  if(row<rows&&side<sides){const n=row*(sides+1)+side;if(row>0)indices.push(n,n+1,n+sides+1);indices.push(n+1,n+sides+2,n+sides+1);}
 }
 const terrain=new THREE.BufferGeometry();terrain.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrain.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();
 const land=new THREE.Mesh(terrain,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));land.name='continuous quarry meadow descending toward the pond';group.add(land);
 const water=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({color:0x568e94,emissive:0x244f58,emissiveIntensity:.14,roughness:.18,metalness:.05}));water.name='recessed quarry pond embraced by the modeled meadow';water.rotation.x=-Math.PI/2;water.scale.set(.64,.46,1);water.position.set(.64,.39,.58);group.add(water);
 // A small raised landform remains solid, while its low pond edge is clear.
 const core=new THREE.Mesh(new THREE.BoxGeometry(1.03,.08,1.05),new THREE.MeshStandardMaterial({color:0x819c75,roughness:1}));core.name='solid core inside the continuous quarry hillside';core.position.set(-.60,.40,-.24);core.userData.solidFootprint=true;group.add(core);
 const leafMaterial=new THREE.MeshStandardMaterial({color:0x708b68,roughness:1}),base=new THREE.SphereGeometry(1,10,8);
 for(let clump=0;clump<18;clump++){
  const a=clump*2.399,r=.55+.24*Math.sin(clump*1.7),x=Math.cos(a)*r*1.65,z=Math.sin(a)*r*1.35;
  if(((x-.64)/.82)**2+((z-.58)/.63)**2<1)continue;
  const y=height(x,z);
  for(let leaf=0;leaf<5;leaf++){
   const angle=a+leaf*2.399,g=base.clone(),p=g.attributes.position,h=.17+.09*Math.sin(clump+leaf);
   for(let i=0;i<p.count;i++){const t=(p.getY(i)+1)/2,px=p.getX(i)*.009,pz=p.getZ(i)*.003+.075*Math.sin(t*Math.PI*.7);p.setXYZ(i,x+Math.cos(angle)*px+Math.sin(angle)*pz,y+t*h,z-Math.sin(angle)*px+Math.cos(angle)*pz);}g.computeVertexNormals();
   const mesh=new THREE.Mesh(g,leafMaterial);mesh.name='rooted curved meadow blades around the quarry pond';group.add(mesh);
  }
 }
 base.dispose();
}
