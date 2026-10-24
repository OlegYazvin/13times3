import * as THREE from 'three';
import {createRoomArt} from './room_art.mjs';
import {makeStoryPerson} from './storybook_figures.mjs';
import {folkInstruments} from './folk_instruments.mjs';
const width=14.8,height=5.8,depth=22.4,portalZ=2.8;
const art=createRoomArt({index:11,title:'A place in the circle — two rooms, one community',width,height,depth,seed:12023,colors:{sky:0x807568,wood:0x9b7350,ink:0x353b3c,gold:0xbda574,fabric:0x7a9591,brick:0xb3a18b,plaster:0xd7cfb9,red:0xa13943,teal:0x456c66}});
const {root,material,add,box,beam,curve,loft,random,exportRoom}=art;
const instruments=folkInstruments(art);
function group(name,parent=root,at=[0,0,0],yaw=0){const g=new THREE.Group();g.name=name;g.position.fromArray(at);g.rotation.y=yaw;parent.add(g);return g;}
const wood=material(0x805b40),darkWood=material(0x423831),brass=material(0xc2a46b,{metalness:.28}),cream=material(0xe2d7bd),wall=material(0xc5c4b4),red=material(0x9c3040),gray=material(0x777581),teal=material(0x3e655f);
function paintedMap(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const oak=material(0xffffff,{map:paintedMap((ctx,n)=>{
 ctx.fillStyle='#9b7957';ctx.fillRect(0,0,n,n);
 for(let col=0;col<16;col++){const x=col*n/16;ctx.fillStyle=`hsl(${31+random()*5} 27% ${42+random()*10}%)`;ctx.fillRect(x,0,n/16-1,n);ctx.strokeStyle='#765638';ctx.lineWidth=.6;for(let j=0;j<7;j++){ctx.beginPath();const ax=x+3+random()*25;ctx.moveTo(ax,0);ctx.bezierCurveTo(ax+3,160,ax-3,340,ax,n);ctx.stroke();}for(let row=0;row<3;row++){const y=(row+col%3/3)*n/3;ctx.fillStyle='#71573e';ctx.fillRect(x,y,n/16,1);}}
})});oak.map.wrapS=oak.map.wrapT=THREE.RepeatWrapping;oak.map.repeat.set(3,5);
box(root,'one continuous level oak floor connecting both remembered venues',0,-.08,0,width,.16,depth,oak);
function brickMaterial(){const map=paintedMap((ctx,n)=>{ctx.fillStyle='#9d9484';ctx.fillRect(0,0,n,n);for(let r=0;r<12;r++)for(let c=-1;c<7;c++){const x=(c+(r%2)/2)*n/6,y=r*n/12;ctx.fillStyle=`hsl(${31+random()*8} ${12+random()*10}% ${52+random()*17}%)`;ctx.fillRect(x+2,y+2,n/6-4,n/12-4);for(let i=0;i<7;i++){ctx.fillStyle='rgba(223,210,182,.13)';ctx.fillRect(x+random()*80,y+random()*40,12+random()*15,2);}}});map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(2,3);return material(0xffffff,{map});}
const brick=brickMaterial();
const ceilingAt=(x,z)=>5.05+1.7*(1-(x/7.4)**2)+.12*Math.cos(z*.18);
// A continuous high ceiling rises gently across the impossible shared room.
{
 const g=new THREE.PlaneGeometry(width,depth,40,60);g.rotateX(Math.PI/2);const p=g.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,ceilingAt(x,z));const c=new THREE.Color(0xeee9d4).lerp(new THREE.Color(0x6d7773),THREE.MathUtils.smoothstep(z,.4,6)*.79);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();add(root,'joined plaster and charcoal ceiling above both jam interiors',g,material(0xffffff,{vertexColors:true}));
}
for(const side of [-1,1])box(root,'joined wall between the two remembered interiors',side*7.25,2.55,3.35,.25,5.1,1.3,wall,true);
// Full side walls, recessed windows and actual depth behind the openings.
for(const side of [-1,1]){
 const x=side*7.25;
 box(root,'continuous lower plaster wall beneath tall windows',x,.43,-4.1,.25,.86,13.8,wall,true);
 box(root,'plaster lintel over tall upstairs windows',x,4.65,-4.1,.25,1,13.8,wall,true);
 for(let i=0;i<5;i++){
  const z=-9.8+i*2.6;box(root,'brick pier between tall windows',x,2.55,z,.28,3.45,.40,brick,true);
  const win=group('Beat Kitchen tall window in deep timber reveal',root,[x,0,z+1.3],-side*Math.PI/2);
  windowFrame(win,2.15,3.25,2.48);
  curtain(win,-1.04,2.48,3.3,.34,gray);curtain(win,1.04,2.48,3.3,.34,gray);
 }
 box(root,'Borellis teal wall above timber wainscot',x,2.45,7.65,.25,4.9,7,teal,true);
 box(root,'Borellis timber wall dado',x,.5,7.65,.30,1,7,darkWood);
 // Original botanical wallpaper drawn from the interior’s palette, no photo pixels.
 const bot=paintedMap((ctx,n)=>{ctx.fillStyle='#35564f';ctx.fillRect(0,0,n,n);ctx.strokeStyle='#688a78';ctx.lineWidth=3;for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x=c*110+(r%2)*30,y=r*145;for(let k=-4;k<=4;k++){ctx.beginPath();ctx.moveTo(x,y+100);ctx.quadraticCurveTo(x+k*13,y+45,x+k*16,y+10+Math.abs(k)*11);ctx.stroke();}}});bot.wrapS=bot.wrapT=THREE.RepeatWrapping;bot.repeat.set(2,1);
 const wallpaper=material(0xffffff,{map:bot});const panel=add(root,'painted botanical wallpaper in the Borellis alcove',new THREE.PlaneGeometry(6.8,3.3),wallpaper,x-side*.14,2.8,7.65);panel.rotation.y=-side*Math.PI/2;
}
function windowFrame(parent,w,h,cy){
 const glazing=material(0xcad9d4,{transparent:true,opacity:.18,roughness:.5});
 const dawn=paintedMap((ctx,n)=>{const g=ctx.createLinearGradient(0,0,0,n);g.addColorStop(0,'#789cae');g.addColorStop(.52,'#d5cbb5');g.addColorStop(1,'#ddc59b');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);for(let i=0;i<70;i++){ctx.fillStyle='rgba(239,224,194,.09)';ctx.beginPath();ctx.ellipse(random()*n,random()*n*.65,40+random()*90,5+random()*16,0,0,Math.PI*2);ctx.fill();}});
 box(parent,'painted evening sky beyond the upstairs windows',0,cy,-.75,w,h,.02,material(0xffffff,{map:dawn,emissive:0x9ab4bf,emissiveIntensity:.18}));
 box(parent,'recessed twilight window pane',0,cy,-.15,w,h,.035,glazing);
 for(const x of [-w/2,0,w/2])box(parent,'window timber upright',x,cy,0,.055,h+.14,.16,darkWood);
 for(const y of [cy-h/2,cy+.08,cy+h/2])box(parent,'window timber cross rail',0,y,0,w+.12,.055,.16,darkWood);
 box(parent,'deep painted window sill',0,cy-h/2-.025,.04,w+.22,.08,.32,cream);
 // The remembered city is quietly modeled beyond the glass rather than a blank fill.
 for(let i=0;i<4;i++){
  const bx=(i-1.5)*w/4,bh=.7+random()*.6,by=cy-h*.50+bh/2;
  const shade=material(i%2?0x728b92:0x8f9b9b);
  box(parent,'distant neighborhood building with actual depth',bx,by,-.47,w*.205,bh,.22,shade);
  box(parent,'distant stepped cornice',bx,by+bh/2+.025,-.44,w*.23,.05,.26,cream);
  for(const sy of [-.15,.13])for(const sx of [-.04,.04])box(parent,'small warm window in a distant home',bx+sx,by+sy,-.34,.035,.075,.012,material(0xddcc9c,{emissive:0xbaa16d,emissiveIntensity:.23}));
 }

}
function curtain(parent,cx,cy,h,w,mat){
 const g=new THREE.PlaneGeometry(w,h,28,28),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=(y+h/2)/h;p.setZ(i,.03+.045*Math.cos((x/w+.5)*Math.PI*7)+.025*(1-t)**2);p.setX(i,cx+x*(.88+.12*t));p.setY(i,cy+y+.015*Math.sin(x*20)*(1-t));}
 g.computeVertexNormals();add(parent,'soft gathered curtain attached to its rod',g,mat);
 beam(parent,'curtain rod',[cx-w*.6,cy+h/2+.06,0],[cx+w*.6,cy+h/2+.06,0],.014,.014,darkWood,12);
}
// The upstairs bay and exposed chimney continue around the back of the circle.
box(root,'Beat Kitchen back plaster wall',0,2.55,-11.08,14.6,5.1,.24,wall,true);
for(const [x,yaw] of [[-4.6,-.18],[0,0],[4.6,.18]]){
 const bay=group('deep upstairs bay window with gray drapes',root,[x,0,-10.6],yaw);
 windowFrame(bay,3.4,3.35,2.55);curtain(bay,-1.48,2.55,3.42,.88,gray);curtain(bay,1.48,2.55,3.42,.88,gray);
}
box(root,'exposed brick chimney at Beat Kitchen',-2.25,2.55,-9.9,1.18,5.1,.75,brick,true);
{
 const masonry=group('individual softened brick courses on the upstairs chimney',root,[-2.25,0,-9.48]);
 const brickG=new THREE.BoxGeometry(.265,.136,.025,1,1,1),palette=Array.from({length:7},(_,i)=>material(new THREE.Color().setHSL(.09,.13,.48+i*.035)));
 for(let r=0;r<34;r++)for(let c=0;c<4;c++){
  const x=-.43+c*.285+(r%2)*.035;
  const b=add(masonry,'worn exposed brick with visible mortar course',brickG,palette[(r*3+c*5)%7],x,.08+r*.149,.012+random()*.007);
 }
}
box(root,'whitewashed brick return pier upstairs',5.8,2.5,-9.65,.75,5,.9,material(0xd5d0bf),true);
for(const z of [-8,-3.8,.5])box(root,'black timber ceiling beam upstairs',0,5.02,z,14.45,.16,.20,darkWood);
for(const [z,mat]of[[-11.08,wall],[11.08,teal]]){
 const shape=new THREE.Shape();shape.moveTo(-7.35,4.98);shape.lineTo(7.35,4.98);for(let i=0;i<=64;i++){const x=7.35-i*14.7/64;shape.lineTo(x,ceilingAt(x,z)+.025);}shape.closePath();
 add(root,'continuous arched end wall closing the joined ceiling',new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false,curveSegments:48}),mat,0,0,z-.09);
}
// Borelli’s red stage curtain, cream cross beams and compact cafe furniture.
box(root,'Borellis rear wall behind red velvet',0,2.5,11.08,14.6,5,.24,teal,true);
const back=group('Borellis recognizable red-curtain jam room',root,[0,0,10.78],Math.PI);
for(let i=-3;i<=3;i++)curtain(back,i*1.8,2.25,3.85,2.2,red);
for(const z of [5.3,8.25,10.2])box(root,'cream ceiling cross beam at Borellis',0,4.91,z,14.45,.20,.34,cream);
for(const x of [-6.8,6.8])box(root,'charcoal ceiling return beam',x,4.85,7.8,.3,.24,6,darkWood);
function chandelier(x,z,style='globe'){
 const g=group('warm globe chandelier suspended from a real ceiling mount',root,[x,0,z]);beam(g,'chandelier stem',[0,ceilingAt(x,z)-.015,0],[0,3.85,0],.013,.013,brass,12);
 for(let k=0;k<5;k++){const a=k/5*Math.PI*2,b=[Math.cos(a)*.43,3.79,Math.sin(a)*.43];beam(g,'brass chandelier arm',[0,3.88,0],b,.012,.012,brass,10);add(g,'warm opal globe',new THREE.SphereGeometry(.105,20,12),material(0xffe7bd,{emissive:0xeac288,emissiveIntensity:.65}),...b);}
}
chandelier(-3.4,-3.2);chandelier(3.4,7.6);chandelier(-3.6,7.6);
{
 const g=add(root,'small faceted mirror ball at Borellis',new THREE.SphereGeometry(.18,18,12),material(0x9d9f95,{metalness:.7,roughness:.36}),0,4.45,8.3);beam(root,'mirror ball fixed suspension',[0,ceilingAt(0,8.3)-.015,8.3],[0,4.62,8.3],.004,.004,darkWood,6);
}
// Subtle architectural dream: the two ceiling languages share curved timber
// ribs at the portal, all attached to the walls. No floating notes or wires.
for(const z of [1.5,4])curve(root,'joined timber rib across the two-place memory',[[-7.18,4.65,z],[-4.5,5.15,z],[0,5.52,z],[4.5,5.15,z],[7.18,4.65,z]],.065,wood,64);
function label(parent,text,w=.9){const map=paintedMap((ctx,n)=>{ctx.fillStyle='#394740';ctx.fillRect(0,0,n,n);ctx.strokeStyle='#baa67b';ctx.strokeRect(15,180,n-30,152);ctx.fillStyle='#eddfbd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='36px Georgia';ctx.fillText(text,n/2,n/2);});const m=add(parent,'small venue name on an architectural plaque',new THREE.PlaneGeometry(w,w*.36),material(0xffffff,{map}),0,0,.013);return m;}
label(group('Beat Kitchen upstairs plaque',root,[-2.25,3.25,-9.48]),'BEAT KITCHEN',1.2);label(group('Borellis plaque above the curtain',root,[0,4.42,10.53],Math.PI),'BORELLI’S',1.65);
function chair(parent,at=[0,0,0],yaw=0,{cafe=false,seatTop=.453}={}){
 const g=group(cafe?'Borellis bentwood cafe chair':'upstairs curved wooden jam chair',parent,at,yaw);
 const seat=loft(g,'formed chair seat supporting the player',[[seatTop-.038,.23,.225,0,-.04],[seatTop-.008,.232,.226,0,-.04],[seatTop,.217,.213,0,-.04]],cafe?darkWood:wood,40,true);
 for(const s of [-1,1])for(const z of [-.20,.16])beam(g,'splayed chair leg',[s*.24,.015,z*1.12],[s*.18,.44,z],.020,.017,cafe?darkWood:wood,12);
 const points=[[-.215,.45,-.23],[-.235,.83,-.255],[-.18,.95,-.28],[0,.99,-.29],[.18,.95,-.28],[.235,.83,-.255],[.215,.45,-.23]];curve(g,'continuous bowed chair back',points,.020,cafe?darkWood:wood,50);
 for(const s of [-1,0,1])curve(g,'fitted curved chair back splat',[[s*.115,.48,-.23],[s*.12,.72,-.255],[s*.105,.94,-.28]],.010,cafe?darkWood:wood,22);
 return g;
}
function cafeTable(x,z){const g=group('Borellis marble cafe table with turned pedestal',root,[x,0,z]);
 const marble=material(0xd5ceba);const top=loft(g,'rounded marble cafe tabletop',[[.74,.56,.44],[.78,.56,.44],[.79,.54,.42]],marble,48,true);beam(g,'cast table pedestal',[0,.05,0],[0,.74,0],.06,.035,darkWood,16);for(let k=0;k<4;k++){const a=k*Math.PI/2;curve(g,'table splayed cast foot',[[0,.19,0],[Math.cos(a)*.12,.08,Math.sin(a)*.12],[Math.cos(a)*.39,.025,Math.sin(a)*.39]],.018,darkWood,20);}for(let i=0;i<5;i++)curve(g,'quiet marble veining',[[-.4+i*.16,.793,-.30],[-.35+i*.16,.793,-.09],[-.44+i*.16,.793,.10],[-.31+i*.16,.793,.30]],.0018,material(0xa8a494),16);
 const cup=loft(g,'small water cup on table',[[.793,.035,.035,.22,.03],[.91,.044,.044,.22,.03]],material(0x8ca69d),24);return g;
}
for(const [x,z]of[[-5.55,6.0],[5.65,6.0],[-5.35,9.0],[5.45,9.0]])cafeTable(x,z);
// The compact back bar has real joinery and an open undercut.
const bar=group('Borellis side bar with fitted curved counter',root,[6.2,0,8.2],-Math.PI/2);
loft(bar,'shaped walnut bar counter top',[[1.02,1.55,.42],[1.10,1.55,.42],[1.12,1.50,.38]],wood,44,true);
box(bar,'recessed bar apron',0,.55,-.15,2.85,1,.12,darkWood,true);for(const x of [-1.3,0,1.3])box(bar,'fitted bar front panel',x,.55,-.22,.035,.88,.025,wood);
{
 const g=group('Beat Kitchen compact upstairs bar by the bay',root,[-5.95,0,-6.8],Math.PI/2);
 const shape=new THREE.Shape();shape.moveTo(-1.35,-.35);shape.lineTo(1.35,-.35);shape.quadraticCurveTo(1.55,-.32,1.54,-.04);shape.lineTo(1.54,.22);shape.quadraticCurveTo(.1,.45,-1.50,.25);shape.lineTo(-1.50,-.12);shape.quadraticCurveTo(-1.5,-.35,-1.35,-.35);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:3,curveSegments:24});geo.rotateX(-Math.PI/2);const top=add(g,'shaped upstairs bar top with rounded front and curved return',geo,darkWood,0,1.02,0);top.userData.solidFootprint=true;
 box(g,'upstairs bar recessed walnut front',0,.52,-.09,2.78,1.0,.20,wood,true);
 for(const x of [-1.30,0,1.30])box(g,'bar front fitted wooden stile',x,.52,.025,.035,.91,.025,darkWood);
 for(const x of [-.85,.85]){loft(g,'formed upholstered bar stool seat',[[.69,.17,.17,x,.67],[.74,.18,.18,x,.67],[.76,.16,.16,x,.67]],material(0x4e6170),32,true);for(const side of [-1,1])for(const end of [-1,1])beam(g,'bar stool turned leg',[x+side*.16,.02,.67+end*.14],[x+side*.13,.69,.67+end*.10],.016,.014,darkWood,12);for(const end of [-1,1])beam(g,'bar stool joined footrest',[x-.16,.27,.67+end*.14],[x+.16,.27,.67+end*.14],.009,.009,darkWood,8);}
 for(const x of [-.7,-.32,.26])loft(g,'small glass on upstairs bar',[[1.10,.027,.027,x,0],[1.19,.035,.035,x,0]],material(0x9baea4),20);
}
// The actual return aperture stands within this world; both venues continue
// around its posts. Post inner edges remain beyond the 3.35m clear opening.
for(const sign of [-1,1]){
 loft(root,'solid timber walk-around portal post',[[0,.17,.18,sign*1.92,portalZ],[.15,.17,.18,sign*1.92,portalZ],[.27,.13,.15,sign*1.92,portalZ],[3.95,.13,.15,sign*1.92,portalZ],[4.22,.19,.20,sign*1.92,portalZ]],wood,24,true);
}
const crown=new THREE.Shape();crown.moveTo(-2.1,4.08);crown.bezierCurveTo(-1.3,4.42,1.3,4.42,2.1,4.08);crown.lineTo(2.1,4.32);crown.bezierCurveTo(1.3,4.76,-1.3,4.76,-2.1,4.32);crown.closePath();const cg=new THREE.ExtrudeGeometry(crown,{depth:.32,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3,curveSegments:32});add(root,'joined carved timber return portal crown',cg,wood,0,0,portalZ-.16);
// The complete instrument/hand/chair arrangement is posed locally before the
// participant is placed into the circle, retaining every physical relationship.
const standard={sculptedCloth:true,refinedGarment:true,anatomicalHead:true,anatomicalHands:true,expression:'joy'};
function participant(identity,at,yaw,opts={},instrument=null){
 const g=group(`${identity} — ${opts.role||'community participant'}`,root,at,yaw);g.userData.storyIdentity=identity;
 const seated=opts.seated??true,h=opts.height??(seated?1.40:1.72),stature=opts.stature??1.72;
 let held=null;const hands={...(opts.hands||{})};
 if(instrument){held=instruments.held(g,instrument,{at:instrument==='mandolin'?[.13,.83,.30]:instrument==='guitar'?[.13,.9261,.31]:[.13,.81,.31],angle:instrument==='fiddle'?1.20:1.01});hands[-1]=held.left;hands[1]=held.right;}
 const personOptions={...standard,child:false,skin:0xd8b297,hair:0x6b4b34,iris:0x53615a,bob:false,glasses:false,beard:false,anatomySource:'sam',shirt:0x81938b,pants:0x485562,...opts,height:h,stature,seated,hipY:seated?.57:undefined,knees:seated?[[-.14,.53,.31],[.14,.53,.33]]:opts.knees,ankles:seated?[[-.15,.1,.47],[.15,.1,.49]]:opts.ankles,hands,
 handNormals:instrument?{'-1':[0,0,-1],'1':[0,0,-1]}:opts.handNormals,
 handAxes:instrument?{'-1':held.axis,'1':held.strumAxis}:opts.handAxes,
 handPoints:instrument?{'-1':{plane:{point:held.left,normal:held.normal}},'1':{plane:{point:held.right,normal:held.normal}}}:opts.handPoints,
 handStyles:instrument?{'-1':'normal','1':'normal'}:opts.handStyles,handGrips:instrument?{'-1':true,'1':true}:opts.handGrips,handCurls:instrument?{'-1':.8,'1':.65}:opts.handCurls,thumbTurns:instrument?{'-1':.6,'1':.4}:opts.thumbTurns,headYaw:opts.headYaw??-.1,headPitch:opts.headPitch??.06};
 let person=makeStoryPerson(identity,personOptions);
 if(['Jane','Oleg'].includes(identity)||opts.listen){
  // Fit the whole arm to the actual posed trousers, not an estimated lap plane.
  // Explicit hand axes keep this a translation; the anatomical arm is rebuilt.
  person.updateMatrixWorld(true);const legs=[],palms=[];
  person.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='trousers')legs.push(o);if(o.isMesh&&/^hand-/.test(o.userData.storyPart||''))palms.push(o);});
  const ray=new THREE.Raycaster(),v=new THREE.Vector3();
  for(const palm of palms){let lift=0;const side=palm.userData.storyPart==='hand-left'?'-1':'1';
   for(let i=0;i<palm.geometry.attributes.position.count;i++){
    palm.getVertexPosition(i,v).applyMatrix4(palm.matrixWorld);ray.set(new THREE.Vector3(v.x,1.8,v.z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(legs,false)[0];if(hit)lift=Math.max(lift,hit.point.y+.0004-v.y);
   }
   if(lift>0){personOptions.hands[side]=[...personOptions.hands[side]];personOptions.hands[side][1]+=lift;const old=personOptions.handPoints[side].plane;personOptions.handPoints[side]={plane:{normal:old.normal,point:[old.point[0],old.point[1]+lift,old.point[2]]}};}
  }
  person=makeStoryPerson(identity,personOptions);
 }
 if(instrument==='fiddle'){
  // Fit the complete bow to a real curled finger surface in the posed hand.
  person.updateMatrixWorld(true);const inverse=held.group.matrix.clone().invert(),v=new THREE.Vector3();let nearest=null;
  person.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='hand-right')for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);if(!nearest||v.z<nearest.z)nearest=v.clone();}});
  const delta=nearest.clone().sub(new THREE.Vector3(.055,.048,.0553));
  for(const o of held.group.children)if(o.name.startsWith('fiddle bow'))o.position.add(delta);
 }
 g.add(person);
 if(seated)chair(g,[0,0,-.03],0,{cafe:at[2]>portalZ,seatTop:.57-(identity==='Jane'?.175:.195)*.54-.001});
 if(identity==='Jonas Friddle'){
  const face=person.getObjectByName(`${identity}: dimensional face, cranium and fitted hair`);if(face)face.scale.set(.94,1,.97);
  person.traverse(o=>{if(o.isMesh&&/fitted continuous hair/.test(o.name)){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i),t=THREE.MathUtils.smoothstep(y,.17,.26);p.setY(i,y+.012*t*THREE.MathUtils.smoothstep(z,-.04,.07));}o.geometry.computeVertexNormals();}});
 }
 return g;
}
// An original soft-edged woven rug gathers the upstairs circle in color.
{
 const shape=new THREE.Shape();shape.moveTo(-3.25,-2.8);shape.bezierCurveTo(-3.62,-2.5,-3.5,2.3,-3.2,2.8);shape.bezierCurveTo(-2.9,3.06,2.9,2.94,3.3,2.7);shape.bezierCurveTo(3.58,2.2,3.55,-2.4,3.25,-2.8);shape.bezierCurveTo(2.8,-3.04,-2.9,-3.08,-3.25,-2.8);
 const g=new THREE.ShapeGeometry(shape,64);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+3.6)/7.2,(p.getZ(i)+3.1)/6.2);
 const map=paintedMap((ctx,n)=>{ctx.fillStyle='#9a6558';ctx.fillRect(0,0,n,n);ctx.fillStyle='#697b74';ctx.fillRect(15,15,n-30,n-30);ctx.fillStyle='#be9b71';ctx.fillRect(33,33,n-66,n-66);ctx.fillStyle='#6c817c';ctx.fillRect(40,40,n-80,n-80);for(let i=0;i<1800;i++){ctx.fillStyle=i%2?'rgba(231,212,173,.08)':'rgba(65,77,71,.06)';ctx.fillRect(random()*n,random()*n,1,4);}ctx.strokeStyle='#b79e79';ctx.lineWidth=1.4;for(let j=0;j<8;j++){ctx.beginPath();ctx.moveTo(50,55+j*57);ctx.bezierCurveTo(160,50+j*57,350,70+j*57,460,55+j*57);ctx.stroke();}});
 add(root,'low woven gathering rug with a soft irregular edge',g,material(0xffffff,{map}),0,.002,-1.4);
}
// Open crescent: the visitor can enter the circle, Jane belongs within it.
participant('Jane',[-1.25,0,.25],1.25,{role:'listening with delight, looking toward Zephrine and her friend',height:1.39,stature:1.68,anatomySource:'maya',bun:true,skin:0xd6a58d,hair:0x322b2c,iris:0x4c463c,shirt:0x638087,pants:0x374755,headYaw:.60,headPitch:.15,hands:{'-1':[-.14,.62,.33],'1':[.16,.62,.33]},handNormals:{'-1':[0,1,0],'1':[0,1,0]},handAxes:{'-1':[0,0,1],'1':[0,0,1]},handStyles:{'-1':'touch','1':'touch'},handPoints:{'-1':{plane:{point:[-.14,.62,.33],normal:[0,1,0]}},'1':{plane:{point:[.16,.62,.33],normal:[0,1,0]}}}});
{
 const g=group('Jonas Friddle — leading the welcoming old-time banjo circle',root,[1.00,0,-1.15],-.18);g.userData.storyIdentity='Jonas Friddle';
 const held=instruments.held(g,'banjo',{at:[.14,1.14,.30],angle:1.01});
 const p=makeStoryPerson('Jonas Friddle',{...standard,height:1.77,stature:1.77,child:false,anatomySource:'sam',skin:0xe0b89c,hair:0x8b714d,iris:0x688277,bob:false,glasses:false,beard:false,shirt:0x607b89,pants:0x8b8573,headPitch:.06,headYaw:.14,hands:{'-1':held.left,'1':held.right},handNormals:{'-1':[0,0,-1],'1':[0,0,-1]},handAxes:{'-1':held.axis,'1':held.strumAxis},handStyles:{'-1':'normal','1':'normal'},handGrips:{'-1':true,'1':true},handCurls:{'-1':.8,'1':.65},thumbTurns:{'-1':.6,'1':.4},handPoints:{'-1':{plane:{point:held.left,normal:held.normal}},'1':{plane:{point:held.right,normal:held.normal}}}});g.add(p);
 const face=p.getObjectByName('Jonas Friddle: dimensional face, cranium and fitted hair');face.scale.x=.94;
 p.traverse(o=>{if(o.isMesh&&/fitted continuous hair/.test(o.name)){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const t=THREE.MathUtils.smoothstep(p.getY(i),.17,.26);p.setY(i,p.getY(i)+.012*t*THREE.MathUtils.smoothstep(p.getZ(i),-.04,.07));}o.geometry.computeVertexNormals();}});
}
participant('Guitar neighbor',[-2.4,0,-1.5],.52,{role:'sharing the tune across the circle',hair:0x685343,shirt:0x9c6c58,headYaw:.55},'guitar');
participant('Mandolin neighbor',[2.65,0,-2.55],-.55,{role:'playing a carved mandolin',skin:0xa47a5d,hair:0x342a27,shirt:0x9b955e,headYaw:-.35},'mandolin');
participant('Fiddle neighbor',[-2.65,0,-3.75],.60,{role:'listening with a fiddle resting in her lap',anatomySource:'maya',skin:0xc5987a,hair:0x48392f,bob:true,shirt:0x8a7185,headYaw:.05},'fiddle');
// The bass player and instrument share a standing support arrangement.
{
 const g=group('Bass neighbor — upright bass in the community circle',root,[2.1,0,-3.85],-.26);g.userData.storyIdentity='Bass neighbor';const bass=instruments.make('bass');bass.position.set(-.18,.70,.23);bass.rotation.z=-.06;g.add(bass);
 g.add(makeStoryPerson('Bass neighbor',{...standard,height:1.78,child:false,anatomySource:'sam',skin:0x9c7258,hair:0x393532,bob:false,glasses:false,beard:true,shirt:0x465754,pants:0x4c4b47,hands:{'-1':[-.123,1.648,.260],'1':[-.145,1.28,.308]},headPitch:.12,headYaw:-.10,handNormals:{'-1':[0,0,-1],'1':[0,0,-1]},handAxes:{'-1':[0,1,0],'1':[0,-1,0]},handStyles:{'-1':'touch','1':'touch'},handPoints:{'-1':{plane:{point:[-.123,1.648,.260],normal:[0,0,1]}},'1':{plane:{point:[-.145,1.28,.308],normal:[0,0,1]}}}}));
}
// Two children connect across the center as in the private upstairs reference.
{
 const g=group('Zephrine — finding a friend in the music circle',root,[.10,0,-.18],-2.88);g.userData.storyIdentity='Zephrine';const zeph=makeStoryPerson('Zephrine',{...standard,height:.98,stature:.98,child:true,shirt:0xe4d2b4,pants:0x365872,headYaw:.02,headPitch:.14,hands:{'-1':[-.18,.54,.14],'1':[.20,.55,.13]},handNormals:{'-1':[0,1,0],'1':[0,1,0]}});g.add(zeph);
 zeph.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='shirt'){o.material=o.material.clone();o.material.color.set(0xffffff);o.material.map=paintedMap((ctx,n)=>{
  ctx.fillStyle='#e2d2b7';ctx.fillRect(0,0,n,n);for(let row=0;row<10;row++)for(let col=0;col<10;col++){
   const x=col*n/10+(row%2)*12,y=row*n/10;ctx.strokeStyle='#684737';ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(x,y,5+random()*3,4+random()*3,random()*3,0,Math.PI*1.6);ctx.stroke();ctx.fillStyle='#a07957';ctx.beginPath();ctx.ellipse(x+1,y,2.5,2,0,0,Math.PI*2);ctx.fill();
  }
 },256);}});
 const f=group('Zephrines friend — striped shirt, seated beside her fiddle',root,[-.30,0,-1.65],.20);f.userData.storyIdentity='Jam child friend';
 const child=makeStoryPerson('Jam child friend',{...standard,height:.77,stature:1.22,child:true,seated:true,hipY:.06,skin:0xdfb593,hair:0x4a342c,iris:0x53483d,anatomySource:'child',bob:true,glasses:false,bun:false,shirt:0xb2b2a0,pants:0x405668,headPitch:-.10,headYaw:.04,knees:[[-.24,.09,.20],[.23,.09,.24]],ankles:[[-.12,.1,.42],[.16,.1,.41]],hands:{'-1':[-.20,.34,.15],'1':[.17,.47,.18]},handNormals:{'-1':[0,1,0],'1':[0,0,1]},handAxes:{'-1':[0,0,1],'1':[0,1,0]}});
 const hips=loft(child,'clothed seated hips supported by the woven rug',[[0,.055,.055],[.02,.10,.095],[.065,.115,.11],[.11,.09,.09]],material(0x405668),40);hips.userData.storyPart='trousers';
 // Add restrained fabric stripes directly onto the sewn shirt UVs.
 child.traverse(o=>{if(o.isMesh&&o.userData.storyPart==='shirt'){o.material=o.material.clone();o.material.map=paintedMap((ctx,n)=>{ctx.fillStyle='#adad9a';ctx.fillRect(0,0,n,n);ctx.fillStyle='#3b4e4c';for(let x=0;x<n;x+=24)ctx.fillRect(x,0,7,n);});}});f.add(child);
 const fiddle=instruments.make('fiddle');fiddle.position.set(-.36,.19,.10);fiddle.rotation.z=.13;f.add(fiddle);
}
// A second, distinct acoustic circle unfolds behind the return portal.
participant('Borellis guitarist',[-1.1,0,7.15],Math.PI-.40,{role:'playing guitar in the red-curtain room',skin:0xcb9d7d,hair:0x42372f,shirt:0x697f91,headYaw:-.3},'guitar');
participant('Borellis banjo player',[1.15,0,7.4],Math.PI+.45,{role:'trading the tune with a neighbor',skin:0xdfbba0,anatomySource:'maya',hair:0xb2a38c,bob:true,shirt:0x98644f,glasses:true,headYaw:.25},'banjo');
const drummer=participant('Borellis drummer',[2.65,0,7.8],Math.PI+.70,{role:'keeping a gentle rhythm',skin:0xb58867,hair:0x3f3530,shirt:0x6b7c61,hands:{'-1':[-.12,.79,.35],'1':[.08,.82,.35]},handNormals:{'-1':[0,0,-1],'1':[0,0,-1]},handAxes:{'-1':[0,1,0],'1':[0,-1,0]},handPoints:{'-1':{plane:{point:[-.12,.79,.348],normal:[0,0,1]}},'1':{plane:{point:[.08,.82,.346],normal:[0,0,1]}}}},null);
const drum=instruments.make('frame drum');drum.position.set(0,.82,.31);drummer.add(drum);
participant('Oleg',[-2.75,0,8.4],Math.PI-.85,{role:'enjoying the music with the community',stature:1.76,height:1.44,skin:0xd8ad96,hair:0x544235,iris:0x617466,glasses:true,beard:true,shirt:0x41494f,pants:0x6f7267,headYaw:-.20,hands:{'-1':[-.15,.64,.32],'1':[.15,.64,.34]},handPoints:{'-1':{plane:{point:[-.15,.63,.32],normal:[0,1,0]}},'1':{plane:{point:[.15,.63,.34],normal:[0,1,0]}}},handNormals:{'-1':[0,1,0],'1':[0,1,0]},handAxes:{'-1':[0,0,1],'1':[0,0,1]}});
participant('Borellis listening neighbor',[.15,0,9.1],Math.PI,{
 role:'listening warmly across the community circle',listen:true,anatomySource:'older',skin:0xd7af92,hair:0x9c927e,bob:true,glasses:true,shirt:0x9d7783,pants:0x4d5c62,headYaw:.1,
 hands:{'-1':[-.15,.64,.32],'1':[.15,.64,.34]},
 handNormals:{'-1':[0,1,0],'1':[0,1,0]},handAxes:{'-1':[0,0,1],'1':[0,0,1]},
 handPoints:{'-1':{plane:{point:[-.15,.63,.32],normal:[0,1,0]}},'1':{plane:{point:[.15,.63,.34],normal:[0,1,0]}}}
});
// Welcoming vacant chairs make the circle feel open without filling the paths.
chair(root,[3.85,0,-.85],-.85);chair(root,[-4.5,0,4.6],2.0,{cafe:true});
// A few grounded cases and a song folder give the places a lived-in scale.
for(const [x,z,yaw]of[[-4.8,-4.6,.3],[4.1,9.45,-.4]]){
 const g=group('closed instrument case resting beside the circle',root,[x,.075,z],yaw);const shape=new THREE.Shape();shape.moveTo(-.2,-.45);shape.quadraticCurveTo(-.36,-.1,-.18,.18);shape.lineTo(-.09,.65);shape.quadraticCurveTo(0,.73,.09,.65);shape.lineTo(.18,.18);shape.quadraticCurveTo(.36,-.1,.2,-.45);shape.quadraticCurveTo(0,-.58,-.2,-.45);const geo=new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelSize:.035,bevelThickness:.02,bevelSegments:3,curveSegments:24});geo.rotateX(-Math.PI/2);add(g,'shaped fitted instrument case',geo,material(0x494c43));
}
for(const g of root.children)if(g.userData.storyIdentity&&g.position.z>-4.3&&g.position.z<1.3){g.position.y+=.002;g.position.x+=.45;}
window.__authorRoom=async()=>exportRoom({batchStatic:true,afterCompose:root=>root.traverse(o=>{if(o.isMesh&&['trousers','shoe'].includes(o.userData.storyPart))o.userData.solidFootprint=true;})});
