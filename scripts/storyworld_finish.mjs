import * as THREE from 'three';

// Composition changes are applied to the authored world, before its painting
// and GLB are made. No hallway/world dimensions or portal positions change.
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.94,...extra});}
function add(parent,name,g,m,p=[0,0,0]){const o=new THREE.Mesh(g,m);o.name=name;o.position.fromArray(p);parent.add(o);return o;}
function timber(parent,name,a,b,width,depth,m){const axis=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=add(parent,name,new THREE.BoxGeometry(width,axis.length(),depth),m,a);o.position.addScaledVector(axis,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());return o;}
function atmosphereTerrain(root,id){
  const palettes={'02':[0x9caa92,0x778e7c],'03':[0xa8b59b,0x7b9a8a],'04':[0x9fab92,0x748777],
    '07':[0x9aaf8a,0x628878],'08':[0xafa89a,0x7e9291],'09':[0xadb18c,0x8d9c77],'10':[0xa1b899,0x71958b]};
  const palette=palettes[id];if(!palette)return;
  if(id==='07'){
    // The field author owns one continuous ground mesh through the horizon.
    // Overlaying a second plane produced a visible rectangle at its old edge.
    root.traverse(o=>{if(o.name==='distant ground beyond the walkable scene')o.visible=false;});
    return;
  }
  const g=new THREE.PlaneGeometry(144,144,96,96);g.rotateX(-Math.PI/2);
  const colors=[],p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x*.7,z*.7);
    const far=THREE.MathUtils.smoothstep(r,11,35);
    p.setY(i,-.09+far*(.35+.24*Math.sin(x*.18+z*.09)+.27*Math.sin(z*.15-x*.1)));
    const c=new THREE.Color(palette[0]).lerp(new THREE.Color(palette[1]),far*.4+.08*Math.sin(x*.3+z*.2));colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  add(root,'continuous distant terrain with layered atmospheric ridges',g,material(0xffffff,{vertexColors:true}));
  // The old sky-world ground is lower, but its uniform color need not form a
  // visible rectangular edge when the visitor turns away from the tableau.
  root.traverse(o=>{if(o.name==='distant ground beyond the walkable scene')o.visible=false;});
}
function distantPlanting(root,id){
  const trees=root.children.filter(o=>o.isGroup&&/detailed shade tree|branching tree along Jane|sculpted apple tree/.test(o.name));
  if(!trees.length)return;
  const spots=id==='09'?[[-8,-10],[8,-11],[-11,-17],[12,-18],[-8,9],[10,10]]:
    id==='03'?[[-9,-10],[9,-11],[-12,-18],[12,-16]]:[[-8,-11],[9,-13]];
  spots.forEach(([x,z],i)=>{
    const tree=trees[i%trees.length].clone(true);tree.name='distant planted canopy continuing the memory world';
    tree.position.set(x,0,z);tree.scale.multiplyScalar(.74+(i%3)*.12);tree.rotation.y+=i*1.38;
    tree.traverse(o=>{o.userData={...o.userData,solidFootprint:false};});root.add(tree);
  });
}
function officeLight(root){
  // The joined floor itself carries a warm opening toward the family; the
  // cold enclosed side remains in dusk instead of relying on a text label.
  root.traverse(o=>{
    if(!o.isMesh||!o.geometry.attributes.position)return;
    if(/terrazzo|walkable painted ground|widening/.test(o.name)){
      const g=o.geometry.clone(),p=g.attributes.position,colors=[];
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),opening=Math.exp(-(((x+.4)/3.7)**2))*THREE.MathUtils.smoothstep(z,-4,6);
        const c=new THREE.Color(0x777b87).lerp(new THREE.Color(0xdac6a3),opening*.68);colors.push(c.r,c.g,c.b);
      }
      g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));o.geometry=g;o.material=o.material.clone();o.material.color.setHex(0xffffff);o.material.vertexColors=true;
    }
    if(/arched daylight|warm window|daylight window/.test(o.name)&&o.material?.color){o.material=o.material.clone();o.material.emissive=new THREE.Color(0xb89065);o.material.emissiveIntensity=.23;}
  });
}
function sanctuary(root){
  const chair=root.children.find(o=>o.isGroup&&o.name==='solid deeply cushioned nursing chair');
  if(chair)chair.scale.set(.84,.83,.68);
  for(const o of root.children)if(o===chair||o.userData.storyIdentity||/rug|woven.*edge|small turned side table|irregular stitched thread/.test(o.name))o.position.z+=.65;
  root.traverse(o=>{
    if(!o.isMesh||!o.material?.color)return;
    if(/vault|fabric|arched glass/.test(o.name)){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(o.position.x<0?0x939db7:0xe4ba9d),.15);}
    // Fine upholstery piping can support a silhouette. Repeated unrelated
    // arcs and strands around the mother and child cannot.
    if(/loosening thread|light thread|suspended petal/.test(o.name))o.visible=false;
  });
}
function signupChair(root){
  const chair=new THREE.Group();chair.name='joined walnut chair supporting Jane at the signup desk';
  chair.position.set(-.47,0,.05);chair.rotation.y=.09;chair.userData.solidFootprint=true;root.add(chair);
  const wood=material(0x765342),seat=new THREE.SphereGeometry(1,32,16);seat.scale(.23,.025,.205);
  add(chair,'formed wooden chair seat beneath the seated thighs',seat,wood,[0,.410,.015]);
  for(const x of [-.16,.16])for(const z of [-.13,.15])timber(chair,'joined tapered chair leg',[x*1.1,.02,z*1.1],[x,.40,z],.035,.035,wood);
  for(const x of [-.18,.18])timber(chair,'chair back upright',[x,.40,-.15],[x,.98,-.18],.033,.033,wood);
  const crest=new THREE.CatmullRomCurve3([new THREE.Vector3(-.2,.96,-.18),new THREE.Vector3(0,1.01,-.205),new THREE.Vector3(.2,.96,-.18)]);
  add(chair,'curved joined chair crest',new THREE.TubeGeometry(crest,32,.035,10,false),wood);
  for(const x of [-.10,0,.10])timber(chair,'chair back spindle',[x,.43,-.15],[x,.98,-.19],.018,.018,wood);
}
function streetDetails(root){
  // Window recesses use a quieter value than the pale projecting stone,
  // preserving the existing modeled bay depth at side viewing angles.
  root.traverse(o=>{if(o.isMesh&&/window glass|glazed bay/.test(o.name)&&o.material?.color){o.material=o.material.clone();o.material.color.lerp(new THREE.Color(0x718a91),.3);}});
}
function routeContinuity(root){
  const bronze=material(0x897154),stone=material(0xb4a897);
  for(const side of [-1,1]){
    const curb=new THREE.CatmullRomCurve3(Array.from({length:33},(_,i)=>new THREE.Vector3(side*(1.7+.10*Math.sin(i*.35)),.025,13-i*.87)));
    add(root,'continuous cut-stone promenade edge',new THREE.TubeGeometry(curb,100,.026,6,false),stone);
  }
  // A real clock face makes the opening Pullman tower readable without its
  // sign. Its hands are part of the building rather than suspended symbols.
  const tower=[];root.traverse(o=>{if(o.isMesh&&/clock face/.test(o.name))tower.push(o);});
  for(const face of tower){face.material=face.material.clone();face.material.roughness=.8;}
  root.traverse(o=>{if(o.isMesh&&/route label/.test(o.name))o.userData.labelAtHumanScale=true;});
}
function playground(root){
  // These low, shaped play pads give the children's linked hands a purpose:
  // two friends steady the third while she balances toward the next pad.
  const timberTop=material(0xb99870),timberSide=material(0x8f9179);
  for(const [x,z,width,depth] of [[-1.18,4.04,.48,.34],[-.32,4.41,.24,.28],[.72,3.99,.48,.34],[.08,5.05,.31,.32]]){
    const shape=new THREE.Shape();
    shape.moveTo(-width*.34,-depth*.5);
    shape.bezierCurveTo(width*.12,-depth*.54,width*.52,-depth*.39,width*.5,-depth*.05);
    shape.bezierCurveTo(width*.54,depth*.29,width*.28,depth*.52,-width*.12,depth*.48);
    shape.bezierCurveTo(-width*.49,depth*.49,-width*.54,depth*.14,-width*.48,-depth*.20);
    shape.quadraticCurveTo(-width*.48,-depth*.46,-width*.34,-depth*.5);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSize:.01,bevelThickness:.01,bevelSegments:2,curveSegments:12});geometry.rotateX(-Math.PI/2);
    add(root,'low rounded stepping pad for the shared balancing game',geometry,[timberTop,timberSide],[x,.008,z]);
  }
  // Scattered flower mounds are connected by a planted border, leaving the
  // central shared play surface open and keeping the skyline visible.
  const earth=material(0x6f998b),g=new THREE.PlaneGeometry(35,34,45,45);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-.018+.018*Math.sin(x*.48+z*.32));const c=new THREE.Color(0x91ac95).lerp(new THREE.Color(0xb9b697),Math.exp(-((x/3.2)**2))*.4);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();earth.vertexColors=true;earth.color.setHex(0xffffff);add(root,'continuous play garden lawn beyond the planted promenade',g,earth);
}
export function finishStoryWorld(root,id){
  atmosphereTerrain(root,id);distantPlanting(root,id);
  if(id==='01'){
    signupChair(root);
    let count=0;root.traverse(o=>{if(/winding tide mark|short shell rib|shell pendant|floating bubble/.test(o.name)){count++;if(count%3!==0)o.visible=false;}});
  }
  if(id==='04')streetDetails(root);
  if(id==='05')officeLight(root);
  if(id==='06')sanctuary(root);
  if(id==='08')routeContinuity(root);
  if(id==='10')playground(root);
  if(id==='11'){
    root.traverse(o=>{if(o.isMesh&&/guide curve|floor guide|concentric|wire-like|isolated turquoise/.test(o.name))o.visible=false;});
  }
  root.userData.artRevision='geometry-first storybook revision 2026-10-22';
}
