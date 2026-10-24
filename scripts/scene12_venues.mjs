import * as THREE from 'three';
import {loadAdaptedTree,plantAdaptedTree} from './adapted_tree.mjs';
import {upstairsBarEdge,upstairsBarPosition,offsetOpenPath} from './scene12_floorplan.mjs';

// Venue photographs guide the joinery, lighting and scale. All visible pixels
// and geometry here are original; private/public reference photos stay out of
// the download. Local +Z faces the guest side of each bar.
export async function dressFolkVenues(art,{group,chair,ceilingAt,paintedMap,brick}){
 const {root,material,add,box,beam,curve,loft}=art;
 const walnut=material(0x48362f),black=material(0x292e30),oak=material(0x76503a),cream=material(0xe6ddc9),brass=material(0xbb9860,{metalness:.6,roughness:.36}),steel=material(0x9aaba9,{metalness:.72,roughness:.3});
 const glass=material(0xb7c8be,{transparent:true,opacity:.48,roughness:.22,depthWrite:false});
 const amber=material(0x96703a),green=material(0x3c6450),blue=material(0x607e88),labelPaper=material(0xd7c6a1),bulb=material(0xffe4ad,{emissive:0xffce80,emissiveIntensity:1.2});
 function rounded(parent,name,at,size,mat,r=.04,solid=false){
  const [w,h,d]=size,shape=new THREE.Shape();shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:8});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2,0);const m=add(parent,name,geo,mat,...at);if(solid)m.userData.solidFootprint=true;return m;
 }
 function bottle(parent,x,y,z,i=0){
  const r=.025+(i%3)*.006,h=.19+(i%4)*.024;
  // Keep stock directly under the bar so the existing static batcher combines
  // it by material. A separate group per bottle added hundreds of draw calls.
  loft(parent,'molded bottle with shoulders and narrow neck',[[y,r*.82,r*.82,x,z],[y+.015,r,r,x,z],[y+h*.68,r,r,x,z],[y+h*.79,r*.42,r*.42,x,z],[y+h,r*.42,r*.42,x,z]], [amber,green,blue][i%3],12);
  box(parent,'small cream bottle label',x,y+h*.38,z+r+.001,r*1.35,h*.25,.003,labelPaper);beam(parent,'fitted bottle cap',[x,y+h,z],[x,y+h+.012,z],r*.46,r*.46,brass,10);
 }
 function tumbler(parent,x,y,z){
  const g=group('water glass set down on a real surface',parent,[x,y,z]);
  loft(g,'thick glass base and open sided tumbler',[[0,.032,.032],[.008,.034,.034],[.115,.040,.040],[.115,.035,.035],[.012,.030,.030]],glass,20);
 }
 function stemGlass(parent,x,y,z){
  const g=group('stemmed glass in the back bar',parent,[x,y,z]);
  loft(g,'wine glass foot',[[0,.038,.038],[.006,.038,.038]],glass,18);beam(g,'slender glass stem',[0,.006,0],[0,.093,0],.005,.004,glass,8);loft(g,'open wine glass bowl',[[.09,.009,.009],[.12,.044,.044],[.18,.047,.047],[.21,.035,.035],[.21,.031,.031],[.18,.043,.043],[.12,.039,.039]],glass,20);
 }
 function stool(parent,x,z,{back=false,yaw=Math.PI}={}){
  const g=group('fitted bar stool with legs and footrests',parent,[x,0,z],yaw);
  rounded(g,'padded charcoal bar stool seat',[0,.765,0],[.43,.065,.38],black,.08,true);
  for(const sx of[-1,1])for(const sz of[-1,1])beam(g,'bar stool splayed steel leg',[sx*.20,.025,sz*.18],[sx*.16,.73,sz*.14],.015,.012,black,10);
  for(const z of[-.17,.17])beam(g,'bar stool joined footrest',[-.19,.29,z],[.19,.29,z],.012,.012,steel,10);
  if(back){curve(g,'curved high stool back',[[-.21,.76,-.16],[-.22,1.10,-.19],[0,1.16,-.21],[.22,1.10,-.19],[.21,.76,-.16]],.018,black,28);for(const x of[-.10,.10])beam(g,'stool back upright',[x,.78,-.18],[x,1.11,-.20],.010,.010,black,8);}
 }
 function pendant(parent,x,z,yTop){
  beam(parent,'pendant cable mounted to the ceiling',[x,yTop,z],[x,2.7,z],.004,.004,black,8);
  loft(parent,'warm rectangular frosted pendant',[[2.43,.064,.064,x,z],[2.73,.064,.064,x,z]],bulb,4);
  for(const y of[2.43,2.73])box(parent,'pendant brass end fitting',x,y,z,.105,.022,.105,brass);
 }
 function framedPrint(parent,x,y,z,w,h,kind=0){
  const g=group('framed community music print',parent,[x,y,z]);
  box(g,'walnut picture frame',0,0,0,w,h,.04,walnut);box(g,'cream picture mount',0,0,.023,w-.05,h-.05,.008,cream);
  const map=paintedMap((ctx,n)=>{ctx.fillStyle=['#315550','#794c44','#48576b'][kind%3];ctx.fillRect(0,0,n,n);ctx.strokeStyle='#d6bc7a';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(n*.45,n*.66,n*.18,n*.21,-.25,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(n*.53,n*.48);ctx.lineTo(n*.70,n*.15);ctx.stroke();ctx.fillStyle='#e6d8ba';ctx.textAlign='center';ctx.font='30px Georgia';ctx.fillText(['FOLK NIGHT','THE CIRCLE','LIVE MUSIC'][kind%3],n/2,n*.91);},256);
  add(g,'original instrument silhouette print',new THREE.PlaneGeometry(w-.13,h-.13),material(0xffffff,{map}),0,0,.029);
 }
 function bar(name,at,yaw,length,{upstairs=false}={}){
  const g=group(name,root,at,yaw);g.userData.venueBar=upstairs?'beat-kitchen':'borellis';
  const topMat=upstairs?material(0x77726a,{roughness:.46}):walnut;
  rounded(g,upstairs?'Beat Kitchen rounded dark stone bar top':'Borellis long polished walnut bar top',[0,1.075,0],[length,.09,.83],topMat,.11,true);
  box(g,'complete enclosed bar cabinet below the counter',0,.51,-.055,length-.18,1.02,.52,upstairs?walnut:black,true);
  for(let x=-length/2+.30;x<length/2;x+=.69){box(g,'recessed timber cabinet panel',x,.54,.214,.55,.78,.018,upstairs?oak:walnut);for(const side of[-1,1])box(g,'raised cabinet stile',x+side*.285,.54,.242,.025,.83,.025,walnut);}
  beam(g,'continuous brass guest foot rail',[-length/2+.14,.19,.53],[length/2-.14,.19,.53],.022,.022,brass,12);
  for(const x of[-length/2+.3,0,length/2-.3])beam(g,'foot rail bracket attached to cabinet',[x,.19,.25],[x,.19,.53],.014,.014,brass,10);
  // There is an actual service aisle between front cabinet and back counter.
  box(g,'back bar cabinet against the venue wall',0,.46,-1.04,length-.15,.92,.38,black,true);
  rounded(g,'back bar working counter',[0,.94,-1.00],[length-.10,.06,.50],steel,.035);
  box(g,upstairs?'exposed brick behind the upstairs bottle shelves':'teal inset behind Borellis bottle shelves',0,1.88,-1.23,length-.12,1.82,.10,upstairs?brick:material(0x274b48));
  for(const y of[1.38,1.97,2.53]){
   box(g,'back bar shelf with a visible front lip',0,y,-1.04,length-.24,.055,.31,walnut);
   box(g,'quiet amber strip below the bottle shelf',0,y-.035,-1.02,length-.34,.014,.14,material(0xd2b176,{emissive:0xedb965,emissiveIntensity:.48}));
   for(let i=0;i<Math.floor((length-.5)/.15);i++){const x=-length/2+.27+i*.15;if((i+Math.round(y*10))%8===0)continue;bottle(g,x,y+.028,-1.01,i+Math.round(y*10));}
  }
  for(const x of[-length/2+.10,length/2-.10])box(g,'back bar shelving end upright',x,1.94,-1.10,.055,1.25,.33,walnut);
  // Properly housed beer tower, drip tray, service sink and register.
  const towerX=length*.18;
  box(g,'inset beer drip tray',towerX,1.123,-.06,.62,.008,.22,steel);
  for(let i=0;i<7;i++)box(g,'beer tray drain slot',towerX-.24+i*.08,1.128,-.06,.018,.003,.17,black);
  for(const dx of[-.17,0,.17]){curve(g,'curved beer tap spout',[[towerX+dx,1.12,-.20],[towerX+dx,1.40,-.20],[towerX+dx,1.44,-.11],[towerX+dx,1.40,.015]],.014,steel,16);beam(g,'upright beer tap handle',[towerX+dx,1.43,-.10],[towerX+dx,1.55,-.10],.018,.024,walnut,10);}
  box(g,'service sink dark recess',-.35,.973,-1.0,.36,.006,.22,black);
  curve(g,'gooseneck sink faucet',[[-.35,.97,-1.12],[-.35,1.22,-1.12],[-.35,1.24,-1.0],[-.35,1.18,-.98]],.010,steel,18);
  const register=group('small register facing the service aisle',g,[-length*.32,1.12,-.08]);beam(register,'register fitted stand',[0,0,0],[0,.08,0],.025,.022,black,10);const screen=box(register,'register screen and housing',0,.13,0,.20,.15,.027,black);screen.rotation.x=-.24;
  for(const x of[-length*.29,-length*.05,length*.36]){tumbler(g,x,1.123,.15);box(g,'small square bar coaster',x,1.1215,.15,.095,.003,.095,cream);}
  for(let i=0;i<5;i++)stemGlass(g,-length/2+.32+i*.13,.970,-.99);
  // A compact refrigerated cabinet reads as a working bar, not just shelves.
  box(g,'bottle cooler door',length*.31,.48,-.833,length*.27,.70,.025,steel);
  box(g,'smoked cooler glass',length*.31,.49,-.815,length*.27-.06,.61,.012,material(0x354d4a,{roughness:.3}));
  beam(g,'cooler door handle',[length*.43,.32,-.78],[length*.43,.66,-.78],.009,.009,steel,8);
  const positions=upstairs?[-1.18,-.28,.85]:[-1.65,-.45,.75,1.75];for(const x of positions)stool(g,x,.94,{back:!upstairs});
  if(upstairs){
   for(const x of[-1.1,0,1.1])pendant(g,x,.05,ceilingAt(at[0],at[2]-x));
   const menu=group('small chalkboard beside the upstairs shelves',g,[1.25,2.98,-1.17]);framedPrint(menu,0,0,0,.56,.50,0);
  }else{
   framedPrint(g,-1.45,3.12,-1.16,.70,.83,1);framedPrint(g,-.55,3.15,-1.16,.65,.78,2);framedPrint(g,.35,3.12,-1.16,.68,.83,0);
   // Reference photos show tabletop memorabilia along the bar, not neon noise.
   for(const x of[-1.35,-.85]){const frame=group('small freestanding music memento on the bar',g,[x,1.2565,.04]);frame.rotation.x=-.13;framedPrint(frame,0,0,0,.22,.27,1);beam(g,'folded support behind tabletop picture frame',[x,1.29,.01],[x,1.126,-.12],.006,.006,walnut,8);}
  }
  return g;
 }
 function upstairsBar(){
  const g=group('Beat Kitchen continuous angled wrapping bar',root,upstairsBarPosition);g.userData.venueBar='beat-kitchen';
  const counter=material(0x696c69,{roughness:.46}),cabinet=material(0x454a4b),fascia=material(0x575e5e);
  function slab(name,points,top,thickness,mat,solid=false){const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p))),geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false});geo.rotateX(Math.PI/2);const m=add(g,name,geo,mat,0,top,0);if(solid)m.userData.solidFootprint=true;return m;}
  const band=(outer,inner)=>[...offsetOpenPath(upstairsBarEdge,outer),...offsetOpenPath(upstairsBarEdge,inner).reverse()];
  slab('one continuous U counter with splayed faces and an open service well',band(0,.65),1.12,.09,counter).userData.beatKitchenCounter=true;
  slab('continuous recessed bar toe kick',band(.13,.54),.06,.06,black);
  slab('dark counter fascia following every angled return',band(.012,.072),1.035,.065,fascia);
  const outer=offsetOpenPath(upstairsBarEdge,.07),inner=offsetOpenPath(upstairsBarEdge,.58);
  for(let i=0;i<outer.length-1;i++){
   const length=Math.hypot(outer[i+1][0]-outer[i][0],outer[i+1][1]-outer[i][1]),steps=Math.ceil(length/.32);
   for(let j=0;j<steps;j++){
    const point=(path,t)=>path[i].map((v,k)=>THREE.MathUtils.lerp(v,path[i+1][k],t));
    slab('fitted cabinet section following the faceted bar', [point(outer,j/steps),point(outer,(j+1)/steps),point(inner,(j+1)/steps),point(inner,j/steps)],1.03,.97,cabinet,true);
   }
   const a=upstairsBarEdge[i],b=upstairsBarEdge[i+1],dx=b[0]-a[0],dz=b[1]-a[1],length2=Math.hypot(dx,dz),n=[-dz/length2,dx/length2];
   for(const t of[.05,.95]){const x=THREE.MathUtils.lerp(a[0],b[0],t)-n[0]*.064,z=THREE.MathUtils.lerp(a[1],b[1],t)-n[1]*.064;beam(g,'cabinet stile fitted under the counter overhang',[x,.11,z],[x,.99,z],.012,.012,fascia,8);}
  }
  // The photos show a compact back counter under the bay glazing, with open
  // shelves on posts. A full invented brick panel would seal that window.
  box(g,'upstairs working back-bar cabinet',-.15,.46,-1.94,2.48,.92,.38,black,true);
  rounded(g,'upstairs working back counter',[-.15,.95,-1.94],[2.56,.06,.42],steel,.025);
  for(const x of[-1.43,1.13])beam(g,'upright supporting the upstairs bottle shelves',[x,.98,-2.04],[x,2.61,-2.04],.025,.025,black,10);
  for(const y of[1.38,1.94,2.51]){
   box(g,'open bottle shelf above the upstairs service counter',-.15,y,-2.04,2.62,.05,.26,black);
   for(let i=0;i<14;i++){if((i+Math.round(y*10))%6===0)continue;bottle(g,-1.32+i*.18,y+.025,-2.02,i+Math.round(y*10));}
  }
  box(g,'inset sink on the back working counter',-.45,.983,-1.93,.36,.005,.22,black);
  curve(g,'small gooseneck faucet over the upstairs sink',[[-.45,.98,-2.03],[-.45,1.20,-2.03],[-.45,1.23,-1.91],[-.45,1.17,-1.89]],.01,steel,18);
  box(g,'under-counter bottle refrigerator',.56,.48,-1.74,.88,.71,.025,steel);
  box(g,'smoked glass refrigerator door',.56,.49,-1.722,.78,.61,.012,material(0x354d4a));
  beam(g,'refrigerator pull attached to the door',[.87,.31,-1.701],[.87,.65,-1.701],.009,.009,steel,8);
  const register=group('compact register on an angled counter',g,[-.85,1.12,.25]);beam(register,'register support',[0,0,0],[0,.08,0],.024,.022,black,10);const screen=box(register,'small service-facing register',0,.13,0,.20,.15,.027,black);screen.rotation.x=-.24;
  for(const x of[-.45,.22,.76]){box(g,'coaster resting on the shaped counter',x,1.1215,.39,.095,.003,.095,cream);tumbler(g,x,1.123,.39);}
  for(const [x,z,yaw]of[[-2.24,-.10,-.6],[-1.75,.95,-.65],[-.65,1.25,0],[.55,1.25,0],[1.72,.60,.85]])stool(g,x,z,{yaw});
  const lamps=[[-1.65,-.23],[-1.22,.42],[-.30,.42],[.63,.42],[1.40,-.10]];
  const track=lamps.map(([x,z])=>[x,ceilingAt(upstairsBarPosition[0]+x,upstairsBarPosition[2]+z)-.018,z]);
  for(let i=1;i<track.length;i++)beam(g,'ceiling track following the upstairs counter facets',track[i-1],track[i],.017,.017,cream,10);
  for(const [x,z]of lamps)pendant(g,x,z,ceilingAt(upstairsBarPosition[0]+x,upstairsBarPosition[2]+z)-.015);
 }
 upstairsBar();
 bar('Borellis long side bar and stocked back counter',[5.80,0,7.85],-Math.PI/2,5.10);

 // Upper-room utility details, kept on the perimeter rather than in the circle.
 // Borelli's piano, café seats, small table lights, framed music and stage cans.
 const piano=group('Borellis upright piano beside the red curtain',root,[-5.6,0,10.35],Math.PI);
 rounded(piano,'upright piano cabinet',[0,.69,0],[1.48,1.38,.54],black,.055,true);
 rounded(piano,'piano keyboard shelf',[0,.77,.38],[1.40,.10,.35],walnut,.025);
 for(let i=0;i<36;i++){const x=-.64+i*.036;box(piano,'individual ivory piano key',x,.831,.40,.033,.025,.20,cream);if(![2,6].includes(i%7))box(piano,'raised black piano key',x+.017,.85,.34,.018,.022,.12,black);}
 box(piano,'piano music stand',0,1.10,.29,.61,.34,.032,walnut);const score=box(piano,'open score on the piano stand',0,1.10,.312,.52,.27,.006,cream);score.rotation.x=-.06;
 for(const x of[-.48,.48])beam(piano,'piano front turned support',[x,.02,.40],[x,.73,.40],.035,.026,walnut,14);
 const bench=group('piano bench beneath keyboard',piano,[0,0,.88]);rounded(bench,'piano bench padded seat',[0,.45,0],[.79,.10,.35],walnut,.04,true);for(const x of[-.31,.31])for(const z of[-.12,.12])beam(bench,'piano bench leg',[x,.02,z],[x,.40,z],.023,.023,black,10);
 chair(root,[-6.30,0,5.65],2.0,{cafe:true});chair(root,[-4.80,0,6.50],-1.0,{cafe:true});chair(root,[-6.25,0,8.65],1.46,{cafe:true});
 for(const [x,z]of[[-5.55,6.0],[-5.35,8.55]]){
  const lamp=group('small café table lamp',root,[x-.22,.790,z-.12]);loft(lamp,'café lamp circular base',[[0,.055,.055],[.014,.055,.055]],brass,16);beam(lamp,'café lamp stem',[0,.01,0],[0,.20,0],.009,.009,brass,8);loft(lamp,'small fluted amber café lamp shade',[[.16,.085,.085],[.25,.045,.045]],bulb,12);
  const menu=group('folded café menu on the marble table',root,[x+.12,.790,z+.12]);box(menu,'small standing menu card',0,.075,0,.11,.15,.008,cream);box(menu,'folded napkin beside the water',.20,.003,0,.12,.006,.10,cream);
 }
 const pictures=group('Borellis music posters on the botanical wall',root,[-7.08,0,7.55],Math.PI/2);framedPrint(pictures,-.58,2.18,0,.62,.86,1);framedPrint(pictures,.33,2.24,0,.72,.96,2);
 beam(root,'Borellis stage lighting rail',[-4.5,4.68,9.88],[4.5,4.68,9.88],.025,.025,black,12);
 for(const x of[-4,-2.4,-.8,.8,2.4,4]){
  beam(root,'stage light hanger fixed to cream beam',[x,4.91,10.2],[x,4.68,9.88],.012,.012,steel,10);
  const g=group('Borellis small mounted theatrical spotlight',root,[x,4.48,9.88]);g.rotation.x=.30;
  beam(g,'silver stage can',[0,-.13,0],[0,.13,0],.09,.09,steel,16);loft(g,'stage lamp warm lens',[[-.14,.075,.075],[-.13,.075,.075]],bulb,20);
 }

 // One shared neighborhood, genuinely several metres beyond the glazing.
 // Floor zero is the upstairs jam; the pavement is a storey below it.
 const outside=group('modeled Chicago neighborhood outside the second floor');outside.userData.upstairsExterior={pavementY:-3.55,reference:'Beat Kitchen upstairs rental and Belmont corner photographs; interpreted streetscape'};
 const road=material(0x59696e),paving=material(0xa9a99b),stone=material(0xc8bea6),trim=material(0x5b5d59),window=material(0x597782,{roughness:.36}),warmWindow=material(0xcbba8b,{emissive:0xceb783,emissiveIntensity:.22});
 const skyMap=paintedMap((ctx,n)=>{const g=ctx.createLinearGradient(0,0,0,n);g.addColorStop(0,'#577c9b');g.addColorStop(.43,'#a9c2ca');g.addColorStop(.56,'#e8ccb0');g.addColorStop(.8,'#879793');g.addColorStop(1,'#77898b');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);},256);
 const sky=add(outside,'continuous evening sky beyond the neighborhood',new THREE.SphereGeometry(85,32,20),new THREE.MeshBasicMaterial({map:skyMap,side:THREE.BackSide}),0,0,-5);sky.userData.preserveSculptGeometry=true;
 box(outside,'continuous neighborhood ground below the upstairs floor',0,-3.68,-15,120,.20,110,material(0x788d87));
 box(outside,'Belmont roadway below the upstairs bay windows',0,-3.57,-23,100,.08,11,road);
 for(const z of[-15.7,-30.3]){box(outside,'Belmont sidewalk and raised curb',0,-3.48,z,100,.22,3.5,paving);box(outside,'rounded pale street curb',0,-3.38,z+(z>-20?-1.78:1.78),100,.12,.16,stone);}
 box(outside,'Leavitt side street below the upstairs windows',-18,-3.57,0,9,.08,48,road);
 box(outside,'Leavitt sidewalk at the venue side',-11,-3.48,-2,4,.22,25,paving);box(outside,'opposite Leavitt sidewalk',-24,-3.48,-2,3,.22,25,paving);
 for(let x=-40;x<=40;x+=7)box(outside,'muted Belmont lane marking',x,-3.524,-23,2.7,.009,.09,material(0xc9bc94));
 for(let i=0;i<6;i++)box(outside,'Belmont corner crosswalk stripe',-18,-3.52,-17.3-i*1.12,4.2,.008,.38,cream);
 function building(x,z,w,h,{yaw=0,tint=0xa5775a,bay=false}={}){
  const g=group('neighboring Chicago masonry building with real side depth',outside,[x,-3.36,z],yaw),map=brick.map.clone();map.repeat.set(w/1.8,h/1.6);map.needsUpdate=true;const masonry=material(tint,{map});
  box(g,'full masonry building volume',0,h/2,-2.25,w,h,4.5,masonry);
  box(g,'raised limestone foundation',0,.39,.055,w+.08,.78,.20,stone);
  for(const y of[.80,h*.5,h-.32,h])box(g,'continuous masonry belt or projecting cornice',0,y,.10,w+.25,.12,.28,y===h?trim:stone);
  const columns=Math.max(2,Math.floor(w/1.6)),floors=Math.floor(h/2.7);
  for(let floor=0;floor<floors;floor++)for(let col=0;col<columns;col++){
   const wx=(col-(columns-1)/2)*(w/columns),wy=1.70+floor*2.65;
   box(g,'recessed sash window opening',wx,wy,.021,.87,1.48,.035,trim);box(g,'blue or softly lit upstairs glass',wx,wy,.043,.74,1.34,.015,(col+floor)%4===0?warmWindow:window);
   box(g,'window stone sill',wx,wy-.77,.15,1.01,.09,.30,stone);box(g,'slender center window sash',wx,wy,.067,.024,1.35,.027,cream);box(g,'horizontal sash rail',wx,wy,.067,.76,.027,.027,cream);
  }
  if(bay){const b=group('projecting three-sided Chicago bay',g,[0,0,.58]);box(b,'bay volume with deep returns',0,h*.53,0,1.80,h*.76,1.0,trim);for(let i=0;i<floors;i++){box(b,'bay glass looking across the street',0,1.7+i*2.65,.52,1.39,1.4,.035,window);box(b,'bay projecting sill',0,.92+i*2.65,.56,1.95,.12,1.18,stone);}}
  // Distinct ground-floor entrances and small neighborhood shop fronts, with
  // physical reveals and canopies rather than repeating every window row.
  const entranceX=bay?-w*.31:-w*.35;
  box(g,'recessed neighborhood entrance surround',entranceX,1.10,.10,.97,2.20,.18,stone);box(g,'dark timber street entrance',entranceX,1.05,.203,.75,2.10,.035,trim);box(g,'entrance door glass',entranceX,1.41,.225,.56,1.08,.016,window);beam(g,'street entrance brass pull',[entranceX+.23,.90,.25],[entranceX+.23,1.11,.25],.012,.012,brass,8);
  if(!bay){
   const sx=w*.16;box(g,'deep neighborhood storefront surround',sx,1.36,.13,w*.45,2.32,.24,trim);box(g,'large warm shop window',sx,1.33,.26,w*.45-.15,2.12,.02,warmWindow);
   box(g,'storefront central mullion',sx,1.33,.28,.05,2.14,.04,cream);box(g,'small shop sign fascia',sx,2.78,.26,w*.49,.27,.25,trim);
   const canopy=box(g,'sloping canvas shop awning',sx,2.62,.68,w*.50,.075,1.04,material(0x657b72));canopy.rotation.x=.15;box(g,'shop awning valance',sx,2.52,1.18,w*.50,.17,.045,material(0x657b72));
  }
  return g;
 }
 for(const [x,w,h,tint,bay]of[[-34,7.2,8.7,0x9e7b63,true],[-25,7.8,11.5,0x88785f,false],[-15,7,8.9,0xa77c67,true],[-6,7.6,10.3,0x9e6959,false],[3,7.2,8.3,0xb39b7e,true],[12,7.2,11.2,0x9d6b5c,false],[21,8.4,9.0,0x9e927a,true],[32,8,12,0x817e79,false]])building(x,-33,w,h,{tint,bay});
 for(const [z,h]of[[-8,9.5],[2,10.8],[12,8.4]])building(-27,z,7.5,h,{yaw:Math.PI/2,tint:0x9c7b65,bay:true});
 for(const [z,h]of[[-8,10.6],[2,8.7],[12,11.4]])building(18,z,7.6,h,{yaw:-Math.PI/2,tint:0xa16c5e,bay:z<0});
 // The red brick neighbor and open metal fire escape appear through the real
 // upstairs reference windows; these are volumes, not a pasted street photo.
 const escape=group('open metal fire escape on the neighboring red brick',outside,[17.98,.25,2],-Math.PI/2);
 for(const y of[0,2.65]){box(escape,'fire escape projecting landing',0,y,.50,2.3,.06,1.0,black);for(const x of[-1.05,1.05]){beam(escape,'fire escape handrail upright',[x,y,.90],[x,y+.85,.90],.016,.016,black,8);beam(escape,'fire escape wall-mounted triangular bracket',[x,y-.48,0],[x,y-.03,.90],.022,.022,black,8);}beam(escape,'fire escape front handrail',[-1.05,y+.85,.90],[1.05,y+.85,.90],.018,.018,black,8);for(let i=0;i<9;i++)beam(escape,'fire escape open baluster',[-1.0+i*.25,y,.90],[-1.0+i*.25,y+.85,.90],.006,.006,black,6);if(y<2.65)for(let i=0;i<12;i++)box(escape,'open fire escape stair tread',-1.0+i*.175,y+i*.22,.4,.22,.035,.52,black);}
 function streetCar(at,yaw,tint){
  const car=group('parked neighborhood car one storey below the jam',outside,at,yaw),body=material(tint,{roughness:.45});
  rounded(car,'rounded street car body',[0,.57,0],[1.65,.64,3.7],body,.28);rounded(car,'street car roof cabin',[0,1.01,-.15],[1.43,.62,1.9],body,.22);
  for(const side of[-1,1]){box(car,'car side windows',side*.724,1.05,-.12,.014,.38,1.55,window);for(const z of[-1.18,1.13]){const wheel=add(car,'street car tyre',new THREE.CylinderGeometry(.30,.30,.16,18),black,side*.81,.30,z);wheel.rotation.z=Math.PI/2;}}
  box(car,'front car windshield',0,1.07,.81,1.27,.36,.022,window);for(const x of[-.58,.58])box(car,'small car headlamp',x,.59,1.86,.27,.13,.025,cream);
 }
 streetCar([-6,-3.35,-18.8],Math.PI/2,0x5b7a86);streetCar([7.5,-3.35,-27.2],-Math.PI/2,0x9d594b);streetCar([-14.8,-3.35,1],0,0xb6b5a0);
 const treeSource=await loadAdaptedTree();
 // These trees are seen through windows, several metres away. Reuse their
 // licensed shaped foliage, with shared 256px maps appropriate to that scale.
 const treeMaps=new Map();
 for(const [x,z,scale]of[[-7,-14.3,1],[8.4,-14.3,.93],[-11,-3,.88],[11,-2,1.05],[11,-8,.94]]){
  const tree=plantAdaptedTree(outside,treeSource,{x,z,scale:scale,rotation:x*.71+z*.13,leafTint:z< -10?0xbbc8a4:0xaabe9e,name:'detailed neighborhood tree rooted at street level',collidable:false});tree.position.y=-3.36;
  tree.traverse(o=>{if(!o.isMesh||!o.material.map)return;const original=o.material.map;if(!treeMaps.has(original)){const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(original.image,0,0,256,256);const map=new THREE.CanvasTexture(c);map.colorSpace=original.colorSpace;map.flipY=original.flipY;map.wrapS=original.wrapS;map.wrapT=original.wrapT;map.repeat.copy(original.repeat);treeMaps.set(original,map);}o.material.map=treeMaps.get(original);});
 }
 for(const [x,z]of[[-10,-16.9],[10,-16.9],[-23,-1]]){
  const g=group('neighborhood street lamp below the windows',outside,[x,-3.36,z]);beam(g,'street lamp pole',[0,0,0],[0,5.1,0],.055,.038,black,10);curve(g,'curved street lamp arm',[[0,4.8,0],[0,5.4,.2],[0,5.4,.8],[0,5.1,1.1]],.035,black,20);rounded(g,'street lamp head',[0,5.05,1.1],[.30,.09,.5],black,.07);box(g,'street lamp warm lower lens',0,5.0,1.1,.23,.012,.38,bulb);
 }
 // A fine distant roofline gives the street a horizon without a hard sky edge.
 for(let i=0;i<18;i++)box(outside,'distant receding neighborhood roofline',-55+i*6.3,-.3+(i%4)*.65,-57,5.8,6+(i%4)*1.3,8,material([0x829599,0x8c9b9b,0x899495][i%3]));
}
