import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addOpenSky} from './open_sky.mjs';
import {OFFICE_LEVEL as L,officeWalkSurfaces} from './scene05_office_plan.mjs';

// New geometry is authored from the private office photographs. No photograph
// or certificate text is embedded. The corridor is a composed connection;
// the operator's public photo establishes the stair finishes, not a floor plan.
export function composeOfficeWorld(art){
 const {root,M,add,box,beam,curve,loft,random,material:makeMaterial}=art;
 const materialCache=new Map();const material=(color,extra={})=>{const key=color+'|'+JSON.stringify(extra);if(!materialCache.has(key))materialCache.set(key,makeMaterial(color,extra));return materialCache.get(key);};
 const group=(parent,name,x=0,y=0,z=0,yaw=0)=>{const g=new THREE.Group();g.name=name;g.position.set(x,y,z);g.rotation.y=yaw;parent.add(g);return g;};
 const round=(p,n,x,y,z,w,h,d,m,r=.04,solid=false)=>{const o=add(p,n,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),m,x,y,z);if(solid)o.userData.solidFootprint=true;return o;};
 const canvasMat=(w,h,paint,extra={})=>{const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map,roughness:.9,side:THREE.DoubleSide,...extra});};
 const wood=canvasMat(256,256,(c,w,h)=>{c.fillStyle='#c7a273';c.fillRect(0,0,w,h);for(let i=0;i<170;i++){c.strokeStyle=`rgba(94,63,39,${.025+random()*.06})`;c.lineWidth=.3+random()*1.2;c.beginPath();const z=random()*h;c.moveTo(0,z);c.bezierCurveTo(80,z-4,140,z+5,w,z+random()*4);c.stroke();}});
 wood.map.wrapS=wood.map.wrapT=THREE.RepeatWrapping;
 const plaster=material(0xe7e4d8,{map:null}),white=material(0xf4f0e3,{map:null}),metal=material(0x303a3c,{map:null,roughness:.65}),navy=material(0x304d69,{map:null}),cushion=material(0x3c607e,{map:null}),green=material(0x617347,{map:null}),mint=material(0xc3d2b3,{map:null}),gold=material(0xb69a60,{metalness:.35,roughness:.48});
 const carpet=canvasMat(256,256,(c,w,h)=>{c.fillStyle='#737b7d';c.fillRect(0,0,w,h);for(let i=0;i<12500;i++){const v=110+Math.floor(random()*30);c.fillStyle=`rgba(${v},${v},${v+3},.30)`;c.fillRect(random()*w,random()*h,.5+random()*1.5,.6+random()*1.3);}});
 carpet.map.wrapS=carpet.map.wrapT=THREE.RepeatWrapping;carpet.map.repeat.set(8,6);
 const glass=new THREE.MeshStandardMaterial({color:0xb8d7d7,transparent:true,opacity:.085,roughness:.24,metalness:.05,depthWrite:false,side:THREE.DoubleSide});
 const diffuser=material(0xffeac3,{emissive:0xffd6a0,emissiveIntensity:.55});
 addOpenSky(root,0xb9cdd0,0xa8b59e);
 // A compact, warm arrival keeps the original family and release motif.
 const foyer=group(root,'opening brick-and-plaster foyer below the office');
 round(foyer,'one continuous pale stone foyer floor',0,-.11,3.975,12.4,.20,9.85,material(0xc9bca6),.035);
 round(foyer,'continuous stone floor of the reception alcove',-1.415,-.11,-3.65,9.33,.20,5.4,material(0xc9bca6),.025);
 round(foyer,'solid stair-side enclosure at the foot of the first flight',5.64,.58,-1.02,1.05,1.16,.16,plaster,.02,true);
 for(const side of[-1,1]){
  box(foyer,'masonry wall beside foyer windows',side*6.18,3.55,3.95,.22,7.1,9.9,M.brickLight,true);
  for(let z=1.1;z<8;z+=2.65){
   round(foyer,'inset bronze-framed foyer wall panel',side*6.045,2.25,z,.035,3.7,2.10,plaster,.01);
   for(let y=.32;y<7;y+=.55)box(foyer,'quiet horizontal brick bed',side*6.045,y,z,.015,.014,2.35,M.mortar);
  }
  box(foyer,'solid return wall beside the existing portal',side*3.99,3.5,8.9,4.42,7,.18,plaster,true);
 }
 box(foyer,'joined lintel above the continuous return portal',0,5.55,8.9,3.55,2.9,.18,plaster);
 round(foyer,'softly lit continuous plaster vault above arrival',0,7.16,3.2,12.6,.2,11.4,white,.06);
 round(foyer,'joined plaster ceiling enclosing the turning stair hall',0,7.16,-5.1,12.6,.2,8.4,white,.04);
 for(const side of[-1,1])box(foyer,'enclosed stair hall outer side wall',side*6.18,3.55,-5.2,.22,7.1,8.5,plaster,true);
 for(const side of[-1,1])box(foyer,'closed stair hall rear corner beside the office',side*4.56,3.55,-9.5,3.12,7.1,.18,plaster,true);
 for(const [z,spread]of[[5.95,3.8],[1.9,4.5]]){
  for(const side of[-1,1]){
   round(foyer,'solid chamfered masonry pier opening around the family',side*spread,2.65,z,.55,5.3,.57,M.brick,.055,true);
   round(foyer,'carved pale plinth under opening pier',side*spread,.16,z,.76,.32,.8,M.mortar,.04,true);
  }
  const a=new THREE.Shape();a.moveTo(-spread-.3,5.1);a.bezierCurveTo(-spread,6.5,-2.1,6.85,0,6.85);a.bezierCurveTo(2.1,6.85,spread,6.5,spread+.3,5.1);a.lineTo(spread-.28,5.1);a.bezierCurveTo(spread-.65,6,-2+spread,6.30,0,6.30);a.bezierCurveTo(-spread+2,6.30,-spread+.65,6,-spread+.28,5.1);a.closePath();add(foyer,'formed arch opening into the brighter stair hall',new THREE.ExtrudeGeometry(a,{depth:.40,bevelEnabled:true,bevelSize:.03,bevelThickness:.02,bevelSegments:2,curveSegments:24}),M.mortar,0,0,z-.2);
 }
 const inlay=new THREE.Shape();inlay.moveTo(-.72,8.8);inlay.bezierCurveTo(-.9,5,-1.4,2.5,-2.3,-.9);inlay.lineTo(2.3,-.9);inlay.bezierCurveTo(1.4,2.5,.9,5,.72,8.8);inlay.closePath();const g=new THREE.ShapeGeometry(inlay,32);g.rotateX(-Math.PI/2); // Shape Y maps to -Z; authored points are reversed below.
 g.scale(1,1,-1);g.computeVertexNormals();add(foyer,'widening warm stone inlay leading past Jane',g,material(0xe0cfb3,{map:null}),0,.008,0);
 // Ceiling pendants are visibly joined; their actual light is in the shared rig.
 for(const[x,z]of[[-2.6,4.1],[2.3,.2]]){beam(foyer,'pendant suspension joined to foyer ceiling',[x,5.5,z],[x,7.05,z],.012,.012,metal);add(foyer,'spun brass pendant shell',new THREE.LatheGeometry([[.06,.48],[.13,.44],[.25,.30],[.43,.05],[.44,0]].map(([r,y])=>new THREE.Vector2(r,y)),32),metal,x,5.13,z);add(foyer,'warm inset pendant diffuser',new THREE.CircleGeometry(.405,32),diffuser,x,5.15,z).rotation.x=-Math.PI/2;}
 // Moving trolley: a bounded part of the memory, outside the walking route.
 const cart=group(root,'office moving trolley with packed unmarked cartons',-3.0,0,3.05,-.1);
 round(cart,'solid shaped timber moving trolley deck',0,.29,0,1.15,.14,.8,wood,.06,true);
 for(const x of[-.42,.42])for(const z of[-.25,.25]){const wheel=add(cart,'rubber caster attached beneath the cart',new THREE.CylinderGeometry(.12,.12,.075,20),metal,x,.14,z);wheel.rotation.z=Math.PI/2;}
 for(const x of[-.48,.48])beam(cart,'attached steel trolley handle',[x,.28,-.3],[x,1.15,-.47],.022,.022,metal);beam(cart,'joined trolley grip',[-.48,1.15,-.47],[.48,1.15,-.47],.024,.024,metal);
 for(const [x,y,z,w,h,d]of[[-.22,.62,.02,.55,.53,.55],[.29,.54,.05,.39,.37,.46],[-.20,1.05,.01,.46,.32,.43]]){round(cart,'solid unmarked moving carton',x,y,z,w,h,d,M.paper,.015,true);box(cart,'tape across closed carton',x,y+h/2+.004,z,.06,.012,d+.006,gold);}
 // Stairs: two properly joined flights with a turn, wood treads and black rails.
 function railing(p,a,b){const run=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),n=Math.ceil(Math.hypot(run.x,run.z)/.24);for(let i=0;i<=n;i++){const t=i/n,at=new THREE.Vector3(...a).addScaledVector(run,t);beam(p,'black steel stair baluster',at.toArray(),[at.x,at.y+1.04,at.z],.012,.012,metal,8);}beam(p,'continuous wood stair handrail',[a[0],a[1]+1.06,a[2]],[b[0],b[1]+1.06,b[2]],.035,.035,wood,12).userData.solidFootprint=true;}
 function flight(name,x,y,z,yaw){const f=group(root,name,x,y,z,yaw),n=10,run=2.9/n,rise=1.6/n,w=1.8;
  const sh=new THREE.Shape();sh.moveTo(0,0);for(let i=0;i<n;i++){sh.lineTo(i*run,(i+1)*rise);sh.lineTo((i+1)*run,(i+1)*rise);}sh.lineTo(2.9,0);sh.closePath();const steps=add(f,'joined wood stair treads and risers',new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false}),wood);steps.userData.officeStair=true;steps.userData.preserveSculptGeometry=true;
  for(let i=0;i<n;i++)round(f,'rounded oak tread nosing',(i+.5)*run,(i+1)*rise+.007,w/2,run+.025,.025,w+.025,wood,.008);
  for(const side of[0,w]){const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(2.9,1.6);s.lineTo(2.9,1.40);s.lineTo(0,-.20);s.closePath();const cheek=add(f,'black metal continuous stair stringer',new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:false}),metal,0,0,side-.0275);cheek.userData.solidFootprint=true;railing(f,[0,.04,side],[2.9,1.64,side]);}
  return f;
 }
 flight('first flight rising from the foyer',3.25,0,-.95,Math.PI/2);
 round(root,'turning stair landing joined to both flights',4.15,1.51,-4.75,1.8,.18,1.8,wood,.025);
 flight('second flight turning toward the upper landing',3.25,1.6,-3.85,Math.PI);
 round(root,'upper stair landing',-.45,L-.09,-4.75,1.6,.18,1.8,wood,.025);
 railing(root,[5.05,1.6,-3.85],[5.05,1.6,-5.65]);railing(root,[5.05,1.6,-5.65],[3.25,1.6,-5.65]);railing(root,[-1.25,L,-3.85],[-1.25,L,-5.65]);railing(root,[-1.25,L,-3.85],[.35,L,-3.85]);
 // Upstairs corridor connects to the inferred office doorway. Its edge is real.
 round(root,'continuous upper corridor floor',1.30,L-.11,-7.575,5.1,.22,3.85,wood,.025);
 railing(root,[.35,L,-5.65],[3.85,L,-5.65]);
 for(const[x,w]of[[-1.31,.12],[3.91,.12]])box(root,'upper corridor side wall',x,4.81,-7.55,w,3.25,3.95,plaster,true);
 round(root,'upper corridor plaster ceiling',1.3,6.52,-7.5,5.35,.18,4.3,white,.02);
 for(const side of[-1,1])box(root,'enclosed back of foyer beneath the upper floor',side*3.0,1.6,-6.5,5.7,3.2,.18,plaster,true);
 const reception=group(root,'reception beneath the wood and steel turning stairs',1.65,0,-4.75);
 round(reception,'solid pale stone reception counter base',0,.52,0,2.45,1.04,1.12,M.mortar,.045,true);
 round(reception,'fitted wood reception counter face',0,.76,.574,2.38,.53,.035,wood,.012);
 round(reception,'joined oak reception counter top',0,1.09,0,2.55,.09,1.20,wood,.025);
 round(reception,'closed unlettered reception folder',-.65,1.16,.20,.34,.035,.25,M.paper,.008);
 const waiting=group(root,'quiet tan and green waiting alcove',-4.35,0,-3.5,.4),tan=material(0xb88d67);
 round(waiting,'solid formed waiting chair base',0,.39,0,.88,.34,.88,tan,.13,true);
 round(waiting,'rounded waiting chair back',0,.78,-.31,.88,.62,.18,tan,.085);
 for(const x of[-.39,.39])round(waiting,'upholstered waiting chair arm',x,.60,0,.14,.30,.88,tan,.06);
 for(const x of[-.29,.29])for(const z of[-.29,.29])beam(waiting,'joined waiting chair foot',[x,.03,z],[x,.25,z],.022,.028,wood);
 // Arrival route stops beside the stair foot; a shaped bench inhabits the alcove.
 round(root,'upholstered landing bench',-.82,L+.43,-8.1,.65,.20,1.15,green,.07,true);
 for(const z of[-8.50,-7.7])for(const x of[-1.0,-.64])beam(root,'tapered bench leg',[x,L,z],[x,L+.35,z],.025,.018,wood);
 // Actual office: sofa left, bookcase / desk / chair and doorway on the right.
 const office=group(root,'Janes actual second floor office — corrected reference layout',0,L,0);office.userData.referenceOffice=true;
 round(office,'grey carpeted office floor',0,-.065,-11.7,5.8,.13,4.4,carpet,.018);
 box(office,'office left end wall',-2.98,1.62,-11.7,.16,3.24,4.58,white,true);box(office,'office right end wall',2.98,1.62,-11.7,.16,3.24,4.58,white,true);
 box(office,'office front wall beside the entry',-.9,1.62,-9.44,4.0,3.24,.14,white,true);box(office,'office front wall beyond the entry',2.65,1.62,-9.44,.6,3.24,.14,white,true);box(office,'joined header over the office door',1.72,2.94,-9.44,1.25,.6,.14,white);
 round(office,'quiet white ceiling above the real office',0,3.27,-11.7,6.0,.16,4.6,white,.02);
 // Window wall has an actual opening, with visible street depth beyond it.
 box(office,'solid white wall below the second floor window',0,.31,-13.94,5.96,.62,.18,white,true);box(office,'solid lintel over the real window opening',0,3.16,-13.94,5.96,.18,.18,white);
 for(const x of[-2.88,-.96,.96,2.88])box(office,'slender black window mullion',x,1.87,-13.88,.055,2.48,.07,metal);
 for(const y of[.64,2.88,3.08])box(office,'horizontal black window rail',0,y,-13.88,5.8,.045,.07,metal);
 box(office,'continuous clear glass inside real second floor window',0,1.86,-13.885,5.72,2.4,.016,glass);
 round(office,'deep white sill with books and small plants',0,.64,-13.70,5.80,.12,.46,white,.025);
 // Door held open at the bookcase end, with an inset frosted panel and joinery.
 for(const x of[1.08,2.37])round(office,'black office door jamb',x,1.25,-9.47,.055,2.5,.10,metal,.008,true);box(office,'wood head of the office door',1.72,2.52,-9.47,1.35,.08,.10,wood);
 const door=group(office,'open frosted wood office door',2.34,0,-9.48,-Math.PI/2);
 for(const x of[-1.23,0])round(door,'joined wood door stile',x,1.23,0,.08,2.46,.06,wood,.012,true);
 for(const y of[.08,2.42])round(door,'joined wood door rail',-.615,y,0,1.30,.12,.06,wood,.012);
 const frost=material(0xc5d0ce,{transparent:true,opacity:.76,roughness:.82,depthWrite:false});box(door,'inset frosted office door glass',-.615,1.25,0,1.15,2.19,.025,frost);
 beam(door,'black lever attached to the office door',[-1.12,1.12,.065],[-.94,1.12,.065],.018,.018,metal);
 // Beige acoustic fabric panels have small raised ribs rather than flat boards.
 function panel(x,z,width,height,y=1.70){const p=group(office,'beige ribbed acoustic wall panel',x,y,z,Math.PI/2);round(p,'joined acoustic panel backing',0,0,0,width,height,.024,material(0xc9bd9d,{map:null}),.012);for(let u=-width/2+.018;u<width/2;u+=.035)round(p,'quiet vertical acoustic rib',u,0,.018,.011,height-.02,.012,material(0xd3c7aa,{map:null}),.004);}
 panel(-2.888,-11.8,3.8,2.45);panel(2.888,-11.0,.65,2.6);panel(2.888,-12.27,.75,2.6);
 // Blue sofa with formed arms, upholstered back, cushions, piping and feet.
 const sofa=group(office,'blue velvet three cushion sofa',-2.37,0,-12.10,Math.PI/2);
 round(sofa,'solid shaped upholstered sofa base',0,.30,0,2.12,.35,.83,navy,.11,true);round(sofa,'curved upholstered sofa back',0,.70,-.32,2.12,.70,.18,navy,.08,true);
 for(const x of[-1.04,1.04])round(sofa,'rounded upholstered sofa arm',x,.53,0,.16,.50,.87,navy,.075);
 for(const x of[-.68,0,.68]){round(sofa,'individual velvet seat cushion',x,.49,.04,.65,.16,.65,cushion,.07);round(sofa,'soft fitted sofa back cushion',x,.77,-.20,.65,.55,.18,cushion,.06);for(const xx of[-.16,.16])add(sofa,'subtle upholstery tuft',new THREE.SphereGeometry(.017,10,7),navy,x+xx,.77,-.102);}
 for(const x of[-.85,.85])for(const z of[-.27,.27])beam(sofa,'tapered wooden sofa foot',[x,.03,z],[x,.18,z],.025,.045,wood);
 for(const [x,z,col]of[[-.68,.05,0xe2d9bb],[-.19,-.03,0xa7b9a1]]){const pillow=round(sofa,'soft loose sofa pillow',x,.76,z,.48,.42,.16,material(col),.09);pillow.rotation.z=x<-.4?.15:-.12;}
 // Original small botanical prints are interpreted with native painted shapes.
 for(let i=0;i<3;i++){const painting=group(office,'framed mint and ochre botanical print above the sofa',-2.875,2.03,-11.25-i*.7,Math.PI/2);round(painting,'dark narrow botanical picture frame',0,0,0,.59,.81,.04,metal,.01);const botanical=canvasMat(256,384,(c,w,h)=>{c.fillStyle='#bfd4c8';c.fillRect(0,0,w,h);c.strokeStyle='#b08a58';c.lineWidth=5;c.beginPath();c.moveTo(120,345);c.bezierCurveTo(95,270,160,175,125,36);c.stroke();for(let n=0;n<9;n++){const y=70+n*29,x=125+Math.sin(n)*12;c.fillStyle=n%2?'#c29c62':'#9ea885';c.beginPath();c.ellipse(x+(n%2?25:-25),y,32,10,n%2?-.6:.6,0,Math.PI*2);c.fill();}});add(painting,'painted botanical artwork',new THREE.PlaneGeometry(.54,.75),botanical,0,0,.024);}
 // Real bookcase: open shelves, varied spines, no copied private book titles.
 const shelf=group(office,'white bookcase at right hand window end',2.63,0,-13.27,-Math.PI/2);
 for(const x of[-.47,.47])round(shelf,'white bookcase side',x,1.05,0,.045,2.10,.31,white,.008,true);
 box(shelf,'white bookcase recessed back',0,1.05,-.14,.94,2.1,.025,white);
 for(let row=0;row<5;row++){const y=.07+row*.43;round(shelf,'joined white bookshelf',0,y,0,.98,.04,.33,white,.008);let x=-.41;while(x<.4){const w=.024+random()*.036,h=.25+random()*.13;const b=round(shelf,'individual book with bound blank spine',x+w/2,y+.03+h/2,.015,w,h,.21,material([0x867d69,0xa68b72,0xcabfa4,0x5e8285,0xb48569,0xd8ccab][Math.floor(random()*6)]),.003);if(random()>.6){for(const yy of[-.07,.07])box(shelf,'small book spine band',x+w/2,y+.03+h/2+yy,.123,w*.75,.005,.003,gold);}x+=w+.006;}}
 round(shelf,'white bookcase top supporting its vase',0,2.13,0,.98,.04,.33,white,.008).userData.preserveSculptGeometry=true;
 // Small desk beside the bookcase, supported by joined pipe-style legs.
 const desk=group(office,'small warm wood desk at the right end',2.47,0,-11.66,-Math.PI/2);
 round(desk,'solid rounded small wood desktop',0,.775,0,.93,.055,.55,wood,.025,true);
 for(const x of[-.37,.37])for(const z of[-.19,.19]){beam(desk,'slender brass desk leg',[x,.02,z],[x,.75,z],.016,.016,gold);add(desk,'small round pipe foot',new THREE.CylinderGeometry(.04,.04,.015,14),gold,x,.014,z);}
 for(const x of[-.37,.37])beam(desk,'connected desk stretcher',[x,.40,-.19],[x,.40,.19],.01,.01,gold);
 // Flat sheets are blank; stationery and a water glass anchor scale.
 round(desk,'closed notebook on the small desk',-.12,.812,.02,.24,.025,.18,material(0xb5c0b0),.008);add(desk,'clear drinking glass on the desk',new THREE.CylinderGeometry(.038,.032,.13,20),glass,.25,.87,-.10);
 const deskChair=group(office,'grey folding desk chair',1.68,0,-11.66,Math.PI/2);
 round(deskChair,'solid padded desk chair seat',0,.46,.03,.43,.08,.43,material(0x9a9c90),.04,true);round(deskChair,'padded desk chair back',0,.79,-.17,.42,.38,.06,material(0x9a9c90),.04);
 for(const x of[-.17,.17]){beam(deskChair,'black crossed folding chair support',[x,.02,-.24],[x,.85,-.18],.014,.014,metal);beam(deskChair,'black diagonal folding chair support',[x,.02,.25],[x,.48,-.2],.014,.014,metal);}
 // Rounded white shell chair with a continuous curved back and green upholstery.
 const chair=group(office,'rounded white shell chair with green cushions',1.40,0,-13.0,-.65);
 const shellPos=[],shellIdx=[],rows=16,cols=36;
 // Open front, rising back and low rounded arms; a closed, thin shell.
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++){const t=j/rows;for(let i=0;i<=cols;i++){const a=(i/cols*2-1)*2.15,r=.35+.10*Math.sin(t*Math.PI*.7)+(layer?-.016:.016),y=.38+t*(.56-.22*Math.pow(Math.abs(a)/2.15,2));shellPos.push(Math.sin(a)*r,y,-Math.cos(a)*r);if(j<rows&&i<cols){const k=layer*(rows+1)*(cols+1)+j*(cols+1)+i;if(layer)shellIdx.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);else shellIdx.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}}}
 const stride=(rows+1)*(cols+1);function seam(a,b){shellIdx.push(a,b,a+stride,b,b+stride,a+stride);}for(let i=0;i<cols;i++){seam(i,i+1);seam(rows*(cols+1)+i+1,rows*(cols+1)+i);}for(let j=0;j<rows;j++){seam(j*(cols+1),(j+1)*(cols+1));seam((j+1)*(cols+1)+cols,j*(cols+1)+cols);}
 const shellGeo=new THREE.BufferGeometry();shellGeo.setAttribute('position',new THREE.Float32BufferAttribute(shellPos,3));shellGeo.setIndex(shellIdx);shellGeo.computeVertexNormals();const shell=add(chair,'continuous sculpted white chair shell',shellGeo,white);shell.userData.solidFootprint=true;
 const seatGeo=new THREE.SphereGeometry(1,32,20);seatGeo.scale(.34,.065,.29);add(chair,'green rounded seat cushion',seatGeo,green,0,.44,.01);
 const backGeo=new THREE.SphereGeometry(1,32,20);backGeo.scale(.30,.22,.065);const back=add(chair,'green fitted curved chair back cushion',backGeo,green,0,.73,-.28);back.rotation.x=-.12;
 for(const side of[-1,1])for(const end of[-1,1])beam(chair,'splayed metal leg under white chair',[side*.32,.02,end*.28],[side*.19,.39,end*.14],.018,.022,material(0xa7aaa2));
 // Mint/gold occasional tables, a quiet mat and the actual deep sill's objects.
 function sideTable(parent,x,z){const t=group(parent,'small mint and gold round side table',x,0,z);const top=add(t,'rounded mint side table tray',new THREE.CylinderGeometry(.24,.24,.035,40),mint,0,.59,0);top.userData.solidFootprint=true;for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(t,'gold table leg joined to circular tray',[Math.cos(a)*.16,.02,Math.sin(a)*.16],[Math.cos(a)*.19,.57,Math.sin(a)*.19],.014,.014,gold);}add(t,'low circular mint table foot',new THREE.TorusGeometry(.18,.018,8,32),mint,0,.045,0).rotation.x=Math.PI/2;}
 sideTable(office,-1.57,-12.00);
 const console=group(office,'long mint and gold table opposite the window',-1.25,0,-9.86);
 const paintedTop=canvasMat(512,128,(c,w,h)=>{c.fillStyle='#c5d4bb';c.fillRect(0,0,w,h);c.fillStyle='#b19751';for(const [cx,cy]of[[90,70],[370,43]]){c.beginPath();for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=30+random()*15;c.lineTo(cx+Math.cos(a)*r*1.65,cy+Math.sin(a)*r*.6);}c.fill();}});
 round(console,'solid long mint and gold leaf tabletop',0,.76,0,1.85,.055,.42,paintedTop,.025,true);
 for(const x of[-.75,.75])for(const z of[-.13,.13])beam(console,'gold pipe table leg',[x,.02,z],[x,.73,z],.017,.017,gold);
 round(office,'pink padded floor mat recalling Zephrines office visits',-.15,.025,-11.50,1.18,.05,.82,material(0xd9919c),.06);
 curve(office,'soft sewn edge of the floor mat',[[-.69,.055,-11.84],[.39,.055,-11.84],[.39,.055,-11.15],[-.69,.055,-11.15],[-.69,.055,-11.84]],.007,material(0xe8afad),36);
 // Mirror, certificates and wall shelves are composed objects, without text.
 round(office,'small dark ottoman near the entry',2.62,.24,-10.80,.42,.48,.42,metal,.09,true);
 const mirror=group(office,'narrow full length mirror near the coat hooks',2.884,1.0,-10.23,-Math.PI/2);round(mirror,'light wood mirror frame',0,0,0,.40,1.65,.04,wood,.012);round(mirror,'soft silver mirror surface',0,0,.025,.34,1.58,.008,material(0xa9b7af,{metalness:.55,roughness:.34}),.008);
 for(const z of[-11.45,-10.98])for(const y of[1.50,2.04]){const cert=group(office,'small blank framed certificate',2.88,y,z,-Math.PI/2);round(cert,'certificate frame',0,0,0,.36,.43,.024,wood,.01);box(cert,'unlettered cream certificate paper',0,0,.014,.31,.38,.01,white);}
 for(const y of[1.42,1.77]){round(office,'wall mounted small mint shelf',2.70,y,-12.45,.38,.035,.51,mint,.01);for(const z of[-12.63,-12.27])beam(office,'gold wall shelf bracket',[2.88,y-.20,z],[2.54,y-.02,z],.01,.01,gold);}
 // Simple grown plants: attached leaves, ceramic pots and supported stems.
 const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.32,.2,-.37,.55,0,.9);leafShape.bezierCurveTo(.37,.55,.32,.2,0,0);
 function plant(parent,x,y,z,scale=1){const p=group(parent,'ceramic pot and living leafy plant',x,y,z);p.scale.setScalar(scale);add(p,'turned ceramic plant pot',new THREE.LatheGeometry([[.10,0],[.14,.02],[.16,.22],[.18,.25],[.16,.27]].map(([r,y])=>new THREE.Vector2(r,y)),24),white);add(p,'recessed pot soil',new THREE.CircleGeometry(.15,20),material(0x665b48),0,.25,0).rotation.x=-Math.PI/2;for(let n=0;n<7;n++){const a=n*2.399,tip=[Math.cos(a)*.25,.57+(n%3)*.12,Math.sin(a)*.25];beam(p,'plant stem attached to soil',[0,.24,0],tip,.004,.003,green);const l=add(p,'formed living plant leaf',new THREE.ShapeGeometry(leafShape,10),material(n%2?0x667b59:0x869975),...tip);l.scale.set(.26,.28,.26);l.rotation.set(-.7,a,-.4);}}
 for(const[x,z,s]of[[-1.9,-13.64,.6],[.15,-13.66,.55],[2.60,-13.27,1.0],[2.73,-12.49,.55]])plant(office,x,x===2.60?2.15:x===2.73?1.79:.71,z,s);
 plant(root,3.35,L,-8.3,1.1);plant(root,-4.8,0,.35,1.8);
 // Books rest on the sill, not hovering against the glass.
 for(const [start,n]of[[-2.55,11],[.6,8]])for(let i=0;i<n;i++){const h=.18+random()*.12;const b=round(office,'book resting on the deep window sill',start+i*.045,.71+h/2,-13.68,.035,h,.17,material([0xc9b68c,0x6f8a85,0xb7866b,0xd8cdb1][i%4]),.003);}
 // A housed clock is part of the office scale, with an original drawn dial.
 const clock=canvasMat(256,256,(c,w,h)=>{c.fillStyle='#ece8dc';c.fillRect(0,0,w,h);c.strokeStyle='#46524e';c.lineWidth=3;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(128+Math.sin(a)*90,128-Math.cos(a)*90);c.lineTo(128+Math.sin(a)*100,128-Math.cos(a)*100);c.stroke();}c.lineWidth=5;c.beginPath();c.moveTo(128,128);c.lineTo(166,99);c.moveTo(128,128);c.lineTo(109,60);c.stroke();});
 const clk=group(office,'round clock on the desk end wall',2.887,1.02,-12.45,-Math.PI/2);add(clk,'white clock housing',new THREE.CylinderGeometry(.18,.18,.025,40),white).rotation.x=Math.PI/2;add(clk,'drawn clock dial',new THREE.CircleGeometry(.16,40),clock,0,0,.016);
 // Exterior: the view is an inhabited second-storey street, not a backdrop slab.
 round(root,'continuous sidewalk below the second storey windows',0,-.12,-15.95,35,.20,3.8,material(0xbcb9a8),.02);round(root,'street pavement one storey below the office',0,-.20,-20.3,44,.10,5,material(0x858e8d),.01);
 for(let x=-18;x<=18;x+=2)box(root,'quiet sidewalk joint below the tree',x,-.009,-15.95,.018,.008,3.7,material(0xa4a697));
 box(root,'continuous raised curb at street edge',0,-.035,-17.8,40,.22,.15,material(0xd5cbb5));
 for(const[x,z,col]of[[-5.5,-18.8,0x788f9a],[3.8,-18.8,0xd1cec0],[9.0,-18.8,0x727a70]]){const car=group(root,'parked neighborhood car seen below the office window',x,0,z);round(car,'formed parked car body',0,.42,0,3.8,.60,1.62,material(col),.24);round(car,'curved parked car cabin',.12,.91,0,2.0,.58,1.35,material(0x779297),.20);for(const xx of[-1.15,1.15])for(const zz of[-.74,.74])add(car,'parked car wheel',new THREE.CylinderGeometry(.30,.30,.15,20),metal,xx,.26,zz).rotation.x=Math.PI/2;}
 for(const[x,w,h,col]of[[-8,6.4,11.6,0x9e9c89],[-.3,8.7,13.3,0x9ba9a6],[8.0,6.2,10.2,0xa9aaa0]]){const b=group(root,'modeled neighborhood building across the street',x,0,-25);round(b,'continuous masonry building volume',0,h/2,0,w,h,5,material(col),.06);for(let y=1.6;y<h-.5;y+=2.4){round(b,'recessed horizontal facade course',0,y-.83,2.53,w+.08,.12,.08,material(0xc4c2af),.01);for(let xx=-w/2+.7;xx<w/2-.4;xx+=1.45){round(b,'recessed broad apartment window',xx,y,2.54,1.12,1.6,.04,material(0x8ea6ab,{emissive:0x526b74,emissiveIntensity:.08}),.01);for(const side of[-1,1])box(b,'window jamb giving the opposite building depth',xx+side*.57,y,2.57,.045,1.7,.07,white);box(b,'opposite building window sill',xx,y-.83,2.60,1.23,.07,.18,white);}}}
 // Catalpa: a rooted, branching sculpture with broad heart-shaped leaves.
 const tree=group(root,'catalpa immediately outside Janes second storey window',-1.8,0,-15.45);tree.userData.officeCatalpa=true;
 const bark=material(0x756d56),leafMats=[material(0x7f9869,{map:null}),material(0x9eae7b,{map:null}),material(0xb1b985,{map:null}),material(0x66876b,{map:null})];
 function limb(points,r0,r1){const crv=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),len=32,sides=12,frames=crv.computeFrenetFrames(len,false),pos=[],idx=[];for(let j=0;j<=len;j++){const p=crv.getPointAt(j/len),r=THREE.MathUtils.lerp(r0,r1,j/len);for(let k=0;k<sides;k++){const a=k*Math.PI*2/sides,v=p.clone().addScaledVector(frames.normals[j],Math.cos(a)*r*(1+.045*Math.sin(a*5+j*.6))).addScaledVector(frames.binormals[j],Math.sin(a)*r);pos.push(...v.toArray());if(j<len){const n=j*sides+k,m=j*sides+(k+1)%sides;idx.push(n,n+sides,m,m,n+sides,m+sides);}}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();add(tree,'tapering gnarled catalpa trunk and attached branch',geo,bark);}
 limb([[0,0,0],[-.08,1.4,.02],[.18,2.8,.08],[.05,4.0,-.05],[-.4,5.6,-.12],[-.28,7.2,-.3]],.36,.045);
 const branches=[[[.10,2.9,.05],[-.7,3.9,.15],[-1.5,4.3,.24],[-2.6,4.65,.15]],[[.04,3.8,-.02],[.7,4.5,.15],[1.8,4.35,.38],[3.2,4.85,.35]],[[-.15,4.6,-.08],[-1.1,5.4,-.45],[-2.6,5.7,-.6]],[[-.25,5.2,-.08],[.8,6.0,-.65],[2.0,6.5,-.75]],[[-.32,5.7,-.1],[-1.3,6.6,-.8],[-1.9,7.0,-1.2]]];
 const heart=new THREE.Shape();heart.moveTo(0,-.44);heart.bezierCurveTo(-.15,-.22,-.53,.10,-.39,.34);heart.bezierCurveTo(-.27,.51,-.07,.46,0,.27);heart.bezierCurveTo(.07,.46,.27,.51,.39,.34);heart.bezierCurveTo(.53,.10,.15,-.22,0,-.44);
 const leafGeo=new THREE.ShapeGeometry(heart,8);leafGeo.translate(0,-.27,0);const lp=leafGeo.attributes.position;for(let i=0;i<lp.count;i++)lp.setZ(i,.05*Math.sin(Math.PI*Math.max(0,Math.min(1,-lp.getY(i)/.71)))*(1-Math.min(1,(lp.getX(i)/.46)**2)));leafGeo.computeVertexNormals();const leafBatches=leafMats.map(()=>[]);
 for(let b=0;b<branches.length;b++){const points=branches[b];limb(points,.16,.018);const tip=new THREE.Vector3(...points.at(-1)),base=new THREE.Vector3(...points.at(-2));for(let t=0;t<12;t++){const a=t*2.399+b*.8,stem=base.clone().lerp(tip,.20+.8*random()),end=stem.clone().add(new THREE.Vector3(Math.cos(a)*(.4+random()*.8),.2+random()*.9,Math.sin(a)*(.35+random()*.7)-.4));end.z=Math.min(end.z,.38);limb([stem.toArray(),stem.clone().lerp(end,.55).add(new THREE.Vector3(0,.15,0)).toArray(),end.toArray()],.021,.003);for(let k=0;k<12;k++){const ang=(k%2)*Math.PI+t*.71,node=stem.clone().lerp(end,.30+Math.floor(k/2)*.13),at=node.clone().add(new THREE.Vector3(Math.cos(ang)*.11,.035,Math.sin(ang)*.11));at.z=Math.min(at.z,.59);beam(tree,'fine catalpa petiole joining leaf to twig',node.toArray(),at.toArray(),.0035,.002,leafMats[0],5);const dummy=new THREE.Object3D();dummy.position.copy(at);dummy.rotation.set((random()-.5)*1.5,random()*Math.PI*2,(random()-.5)*1.3);dummy.scale.setScalar(.25+random()*.28);dummy.updateMatrix();leafBatches[(b+t+k)%4].push(leafGeo.clone().applyMatrix4(dummy.matrix));}}}
 leafBatches.forEach((list,i)=>add(tree,'attached broad heart shaped catalpa leaves',mergeGeometries(list,false),leafMats[i]));
 // Basal roots sit in a real planted opening at street level.
 for(let n=0;n<5;n++){const a=n*1.256;limb([[0,.2,0],[Math.cos(a)*.3,.1,Math.sin(a)*.3],[Math.cos(a)*.8,.015,Math.sin(a)*.8]],.13,.025);}
 round(root,'soil opening around the catalpa roots',-1.8,-.005,-15.45,2.1,.06,1.8,material(0x8c9277),.12);
 root.userData.walkSurfaces=officeWalkSurfaces;
}
