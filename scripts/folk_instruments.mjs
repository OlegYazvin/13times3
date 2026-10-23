import * as THREE from 'three';
const V=p=>new THREE.Vector3(...p);
export function folkInstruments(art){
 const {add,box,beam,curve,material}=art;
 const spruce=material(0xc99b59),rim=material(0x654333),dark=material(0x302b28),brass=material(0xc5af78,{metalness:.5,roughness:.48}),ivory=material(0xe5d7b4),silver=material(0xa9b5b5,{metalness:.65,roughness:.35});
 function shapeBody(parent,name,shape,depth,mat){
  const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:4,bevelSize:.008,bevelThickness:.008,curveSegments:24});geo.translate(0,0,-depth/2);return add(parent,name,geo,mat);
 }
 function guitarShape(scale=1){
  const s=new THREE.Shape();s.moveTo(0,-.26);s.bezierCurveTo(-.28,-.28,-.25,-.03,-.145,.025);s.bezierCurveTo(-.09,.08,-.205,.13,-.15,.21);s.bezierCurveTo(-.12,.27,.12,.27,.15,.21);s.bezierCurveTo(.205,.13,.09,.08,.145,.025);s.bezierCurveTo(.25,-.03,.28,-.28,0,-.26);
  if(scale!==1){const points=s.getPoints(80).map(p=>p.multiplyScalar(scale));return new THREE.Shape(points);}return s;
 }
 function peg(parent,x,y,z,mat=silver){beam(parent,'turned tuning post',[x,y,z-.012],[x,y,z+.014],.005,.005,mat,10);const k=add(parent,'oval tuning button',new THREE.SphereGeometry(.009,12,8),ivory,x,y,z+.018);k.scale.set(1,.65,.5);}
 function strings(parent,{start,end,count=6,width=.039}){
  for(let i=0;i<count;i++){const x=(i/(count-1)-.5)*width;beam(parent,'taut individual instrument string',[start[0]+x,start[1],start[2]],[end[0]+x,end[1],end[2]],.00045,.00045,silver,4);}
 }
 function neck(parent,length=.51,width=.047,from=.19){
  box(parent,'rounded wooden instrument neck',0,from+length/2,0,width,.01+length,.043,rim);
  box(parent,'ebony fingerboard',0,from+length/2,.025,width*.93,length,.007,dark);
  for(let i=1;i<=17;i++){const y=from+length*(1-2**(-i/12));beam(parent,'seated metal fret',[-width*.45,y,.029],[width*.45,y,.029],.001,.001,brass,4);}
  const head=new THREE.Shape();head.moveTo(-width*.56,from+length-.005);head.lineTo(-width*.78,from+length+.12);head.quadraticCurveTo(0,from+length+.145,width*.78,from+length+.12);head.lineTo(width*.56,from+length-.005);head.closePath();shapeBody(parent,'carved peghead',head,.024,rim);
  for(const side of [-1,1])for(let i=0;i<3;i++)peg(parent,side*width*.88,from+length+.025+i*.032,0);
 }
 function make(kind='guitar'){
  const group=new THREE.Group();group.userData.folkInstrument=kind;group.name=`hand-built ${kind} with dimensional body neck bridge and strings`;
  if(kind==='banjo'){
   const body=add(group,'closed banjo wooden pot',new THREE.CylinderGeometry(.142,.142,.065,64),rim);body.rotation.x=Math.PI/2;
   const head=add(group,'banjo skin head',new THREE.CircleGeometry(.137,64),ivory,0,0,.035);
   const hoop=add(group,'banjo tension hoop',new THREE.TorusGeometry(.140,.006,8,64),silver,0,0,.035);
   for(let i=0;i<20;i++){const a=i/20*Math.PI*2;beam(group,'banjo tension bracket',[Math.cos(a)*.145,Math.sin(a)*.145,-.022],[Math.cos(a)*.145,Math.sin(a)*.145,.035],.0025,.0025,silver,5);}
   neck(group,.49,.037,.12);box(group,'banjo bridge',0,-.05,.044,.067,.012,.012,spruce);box(group,'banjo tailpiece',0,-.12,.043,.033,.035,.008,silver);strings(group,{start:[0,-.12,.051],end:[0,.66,.036],count:5,width:.029});
  }else if(kind==='guitar'||kind==='mandolin'){
   const small=kind==='mandolin',sc=small?.62:1,shape=guitarShape(sc),hole=new THREE.Path();hole.absarc(0,.08*sc,.055*sc,0,Math.PI*2,true);shape.holes.push(hole);
   shapeBody(group,`hollow ${kind} soundboard with open sound hole`,shape,.08*sc,spruce);
   const back=guitarShape(sc);shapeBody(group,`${kind} curved dark back`,back,.008,rim).position.z=-.045*sc;
   const edge=guitarShape(sc).getPoints(100).map(p=>[p.x,p.y,.043*sc]);curve(group,`${kind} ivory binding`,edge.concat([edge[0]]),.0018,ivory,120);
   const rosette=add(group,`${kind} sound-hole rosette`,new THREE.TorusGeometry(.059*sc,.003*sc,6,48),rim,0,.08*sc,.044*sc);
   neck(group,small?.30:.49,small?.036:.047,.22*sc);box(group,`${kind} carved bridge`,0,-.12*sc,.048*sc,.115*sc,.023*sc,.012,rim);strings(group,{start:[0,-.12*sc,.055*sc],end:[0,(small?.46:.76),.033],count:small?8:6,width:small?.027:.038});
  }else if(kind==='fiddle'||kind==='bass'){
   const bass=kind==='bass',sc=bass?2.5:1;
   const s=new THREE.Shape();s.moveTo(0,-.18);s.bezierCurveTo(-.17,-.20,-.17,-.04,-.08,-.015);s.bezierCurveTo(-.055,.015,-.055,.05,-.10,.068);s.bezierCurveTo(-.16,.15,-.10,.21,0,.21);s.bezierCurveTo(.10,.21,.16,.15,.10,.068);s.bezierCurveTo(.055,.05,.055,.015,.08,-.015);s.bezierCurveTo(.17,-.04,.17,-.20,0,-.18);const shape=new THREE.Shape(s.getPoints(100).map(p=>p.multiplyScalar(sc)));
   shapeBody(group,`${kind} arched maple soundbox`,shape,.053*sc,material(bass?0x8e4a31:0xa75c30));
   neck(group,bass?.68:.25,bass?.052:.024,.18*sc);
   for(const sign of [-1,1])curve(group,'inlaid f hole',[[sign*.073*sc,-.05*sc,.034*sc],[sign*.056*sc,0,.036*sc],[sign*.062*sc,.07*sc,.032*sc]],.005*sc,dark,20);
   box(group,'carved instrument bridge',0,-.04*sc,.052*sc,.09*sc,.025*sc,.012,spruce);box(group,'ebony tailpiece',0,-.13*sc,.044*sc,.045*sc,.08*sc,.015,dark);strings(group,{start:[0,-.13*sc,.056*sc],end:[0,.18*sc+(bass?.71:.28),.035],count:4,width:bass?.038:.021});
   if(!bass){beam(group,'fiddle bow stick and fitted frog',[-.44,.05,.0515],[.105,.05,.0515],.0025,.003,rim,8);beam(group,'fiddle bow horsehair',[-.43,.044,.049],[.10,.044,.049],.001,.001,ivory,5);box(group,'fiddle bow ebony frog',.055,.048,.050,.04,.012,.010,dark);}
   const top=.18*sc+(bass?.85:.39);curve(group,'carved volute scroll',[[0,top-.05,0],[0,top,.02],[0,top+.02,0],[0,top,-.02]],.011*sc,rim,18);
   if(bass)beam(group,'bass endpin',[0,-.18*sc,0],[0,-.69,0],.008,.008,dark,12);
  }else if(kind==='frame drum'){
   const shell=add(group,'bentwood frame drum shell',new THREE.CylinderGeometry(.18,.18,.07,64),rim);shell.rotation.x=Math.PI/2;
   add(group,'taut frame drum skin',new THREE.CircleGeometry(.175,64),ivory,0,0,.036);
   const hoop=add(group,'frame drum stitched rim',new THREE.TorusGeometry(.18,.004,6,64),spruce,0,0,.037);
  }
  return group;
 }
 // A local upright instrument is turned as one complete arrangement. These
 // same transformed surface points are used to pose the player’s palms.
 function held(parent,kind,{at,angle=1.03,scale=1}={}){
  const g=make(kind);g.position.fromArray(at);g.rotation.z=angle;g.scale.setScalar(scale);parent.add(g);g.updateMatrix();
  g.userData.solidFootprint=true;
  const point=p=>V(p).applyMatrix4(g.matrix).toArray();
  const neckPoint=kind==='banjo'?[0,.43,.030]:kind==='mandolin'?[0,.34,.030]:kind==='fiddle'?[0,.33,.030]:[0,.48,.030];
  const strumPoint=kind==='banjo'?[0,-.005,.0494]:kind==='mandolin'?[0,.025,.03455]:kind==='fiddle'?[.055,.05,.0552]:[0,.05,.0514];
  return {group:g,left:point(neckPoint),right:point(strumPoint),normal:V([0,0,1]).transformDirection(g.matrix).toArray(),axis:V([0,1,0]).transformDirection(g.matrix).toArray(),strumAxis:V([0,-1,0]).transformDirection(g.matrix).toArray()};
 }
 return {make,held};
}
