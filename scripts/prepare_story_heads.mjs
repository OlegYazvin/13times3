// CC0 MakeHuman graphical assets, revision a8bc2d54ff0ac92e78ff71431b1023eda42bf482.
// Run scripts/fetch_story_head_sources.mjs first if the ignored sources are absent.
// Only head and hand anatomy is exported; no textures, private references or full bodies.
import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
const folder='.cache/makehuman-head-sources',lines=(await readFile(folder+'/base.obj','utf8')).split('\n');
const original=[],uv=[],faces=[],helpers=new Map();let group='';
for(const line of lines){const s=line.trim().split(/\s+/);if(s[0]==='v')original.push(s.slice(1).map(Number));if(s[0]==='vt')uv.push(s.slice(1).map(Number));if(s[0]==='g')group=s[1];if(s[0]==='f'){const f=s.slice(1).map(t=>t.split('/').map(v=>Number(v)-1));if(group==='body')faces.push(f);else if(group.startsWith('joint-')){const set=helpers.get(group)||new Set();f.forEach(p=>set.add(p[0]));helpers.set(group,set);}}}
const nearestUV=(x,y)=>{let best={d:Infinity};for(const f of faces)for(const [index,tex] of f){const [u,v]=uv[tex],d=(u*512-x)**2+(v*512-y)**2;if(d<best.d)best={d,index};}return best.index;};
const chinIndex=nearestUV(492,263),mouthIndex=nearestUV(465,263);
function clipAtY(triangle,cut){
 const polygon=[];
 for(let i=0;i<3;i++){
   const a=triangle[i],b=triangle[(i+1)%3],inside=a[1]>=cut,next=b[1]>=cut;
   if(inside)polygon.push(a);
   if(inside!==next){const t=(cut-a[1])/(b[1]-a[1]);polygon.push(a.map((v,j)=>v+(b[j]-v)*t));}
 }
 return polygon.slice(1,-1).map((_,i)=>[polygon[0],polygon[i+1],polygon[i+2]]);
}
function appendTriangle(triangle,positions,indices,lookup){
 for(const p of triangle){const rounded=p.map(v=>Math.round(v*1e6)/1e6),key=rounded.join(':');if(!lookup.has(key)){lookup.set(key,positions.length/3);positions.push(...rounded);}indices.push(lookup.get(key));}
}
console.log('base',original.length,'body quads',faces.length,'chin',chinIndex,'mouth',mouthIndex);
function subdivide(vertices,faces){
 const facePoints=faces.map(f=>[0,1,2].map(axis=>f.reduce((n,p)=>n+vertices[p][axis],0)/f.length)),edges=new Map(),adj=vertices.map(()=>({faces:[],edges:[]}));
 faces.forEach((face,fi)=>face.forEach((a,k)=>{adj[a].faces.push(fi);const b=face[(k+1)%face.length],key=a<b?`${a}:${b}`:`${b}:${a}`;let edge=edges.get(key);if(!edge){edge={a,b,faces:[]};edges.set(key,edge);adj[a].edges.push(edge);adj[b].edges.push(edge);}edge.faces.push(fi);}));
 const out=vertices.map((v,i)=>{const a=adj[i],n=a.faces.length;if(!n)return v;const border=a.edges.filter(e=>e.faces.length===1);if(border.length)return [0,1,2].map(j=>v[j]*.75+border.reduce((s,e)=>s+vertices[e.a===i?e.b:e.a][j],0)/border.length*.25);return [0,1,2].map(j=>{const f=a.faces.reduce((n,k)=>n+facePoints[k][j],0)/n,r=a.edges.reduce((n,e)=>n+(vertices[e.a][j]+vertices[e.b][j])/2,0)/a.edges.length;return (f+2*r+(n-3)*v[j])/n;});});
 for(const e of edges.values()){e.index=out.length;out.push([0,1,2].map(j=>e.faces.length===2?(vertices[e.a][j]+vertices[e.b][j]+facePoints[e.faces[0]][j]+facePoints[e.faces[1]][j])/4:(vertices[e.a][j]+vertices[e.b][j])/2));}
 const centerOffset=out.length;out.push(...facePoints);const quads=[];
 faces.forEach((f,fi)=>f.forEach((a,k)=>{const b=f[(k+1)%f.length],c=f[(k+f.length-1)%f.length];const edge=(a,b)=>edges.get(a<b?`${a}:${b}`:`${b}:${a}`).index;quads.push([a,edge(a,b),centerOffset+fi,edge(c,a)]);}));return {vertices:out,faces:quads};
}
const output={},hands={};
for(const [key,weights] of [['sam',{'caucasian-male-young':1}],['maya',{'caucasian-female-young':1}],['toddler',{'caucasian-female-baby':.8,'caucasian-female-child':.2}],['child',{'caucasian-female-baby':.6,'caucasian-female-child':.4}],['older',{'caucasian-female-old':.65,'caucasian-female-young':.35}]]){
 const points=original.map(p=>p.slice());
 for(const [target,weight] of Object.entries(weights))for(const line of (await readFile(`${folder}/${target}.target`,'utf8')).split('\n')){if(!/^\d/.test(line))continue;const [i,x,y,z]=line.trim().split(/\s+/).map(Number);points[i][0]+=x*weight;points[i][1]+=y*weight;points[i][2]+=z*weight;}
 const joint=name=>{const set=helpers.get(name);return [0,1,2].map(j=>[...set].reduce((v,i)=>v+points[i][j],0)/set.size);};
 const eye=['joint-l-eye','joint-r-eye'].map(joint);
 const jaw=points[chinIndex][1],top=Math.max(...faces.flatMap(f=>f.map(([i])=>points[i][1]))),height=top-jaw,scale=.265/height;
 const headPoints=faces.flatMap(f=>f.map(([i])=>points[i])).filter(p=>p[1]>jaw);
 const back=Math.min(...headPoints.map(p=>p[2])),centerZ=(back+(eye[0][2]+eye[1][2])/2)/2;
 const normalized=p=>[p[0]*scale,(p[1]-jaw)*scale,(p[2]-centerZ)*scale];
 const smoothed=subdivide(points,faces.map(f=>f.map(p=>p[0]))),positions=[],indices=[],map=new Map(),cut=jaw-height*.15;
 for(const f of smoothed.faces)for(let k=1;k<f.length-1;k++){
   for(const triangle of clipAtY([f[0],f[k],f[k+1]].map(i=>smoothed.vertices[i]),cut))appendTriangle(triangle.map(normalized),positions,indices,map);
 }
 output[key]={jaw:0,top:.265,centerZ:0,eye:eye.map(normalized),eyeRadius:.12*scale,mouth:normalized(points[mouthIndex]),positions,indices};
 hands[key]={};
 for(const side of ['l','r']){
   const v=name=>new THREE.Vector3(...joint(`joint-${side}-${name}`)),wrist=v('hand'),middle=v('finger-3-1'),tip=v('finger-3-4'),length=wrist.distanceTo(tip);
   const y=middle.clone().sub(wrist).normalize(),x=v('finger-2-1').sub(v('finger-5-1'));x.addScaledVector(y,-x.dot(y)).normalize();
   const z=x.clone().cross(y).normalize(),thumb=v('finger-1-1').sub(wrist).dot(x);
   if((side==='l'&&thumb>0)||(side==='r'&&thumb<0)){x.negate();z.negate();}
   const local=p=>{const q=new THREE.Vector3(...p).sub(wrist);return [q.dot(x)/length,q.dot(y)/length,q.dot(z)/length];};
   const hp=[],hi=[],used=new Map(),cutHand=-.10;
   for(const f of smoothed.faces){const polygon=f.map(i=>smoothed.vertices[i]);if(polygon.some(p=>new THREE.Vector3(...p).distanceTo(wrist)>length*1.3))continue;
     for(let k=1;k<f.length-1;k++)for(const triangle of clipAtY([polygon[0],polygon[k],polygon[k+1]].map(local),cutHand))appendTriangle(triangle,hp,hi,used);
   }
   const fingers=Array.from({length:5},(_,i)=>Array.from({length:4},(_,j)=>local(joint(`joint-${side}-finger-${i+1}-${j+1}`))));
   hands[key][side]={positions:hp,indices:hi,fingers,palmAnchor:[0,fingers.slice(1).reduce((s,f)=>s+f[0][1],0)/4*.52,.075]};
 }
 console.log(key,'head height source',height,'eyes',output[key].eye,'radius',output[key].eyeRadius,'vertices',positions.length/3,'triangles',indices.length/3);
}
await writeFile('scripts/assets/figures/story-heads.json',JSON.stringify(output)+'\n');
await writeFile('scripts/assets/figures/story-hands.json',JSON.stringify(hands)+'\n');
