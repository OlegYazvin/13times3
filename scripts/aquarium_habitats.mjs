import * as THREE from 'three';

// Water occupies explicit, enclosed exhibit volumes, never the visitor aisle.
// Keep the usable bounds inside the actual glass, bed, lid and painted back.
export const AQUARIUM_TANKS = [
  {id:'river',min:[-10.52,.30,-11.17],max:[-7.64,5.48,16.62]},
  {id:'side-reef',min:[7.64,.30,-11.17],max:[10.52,5.48,16.62]},
  {id:'far-reef',min:[-7.32,.30,-14.88],max:[7.32,5.48,-11.46]},
  {id:'rear-reef',min:[-7.32,.30,17.00],max:[7.32,5.48,20.40]},
  {id:'round-reef',profile:[[.55,1.25,1.15],[1.55,1.29,1.19],[3.05,1.26,1.16],[4.3,1.17,1.08],[4.49,1.05,.97]],center:[1.6,6]},
  {id:'tide-globe',profile:[[.55,.97,.89],[1.18,1.01,.93],[2.16,.95,.88],[2.54,.82,.76]],center:[5.05,10.64]},
];

function roundedRect(shape,x,y,w,h,r){
  // Shape holes need opposite winding; Three's triangulator handles Path holes.
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
  shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);shape.closePath();
  return shape;
}
function mesh(parent,name,geometry,material,position=[0,0,0]){
  const object=new THREE.Mesh(geometry,material);object.name=name;object.position.fromArray(position);parent.add(object);return object;
}
function frame(parent,name,width,height,depth,position,yaw,stone){
  const outline=roundedRect(new THREE.Shape(),-width/2,-height/2,width,height,.18);
  outline.holes.push(roundedRect(new THREE.Path(),-width/2+.15,-height/2+.20,width-.30,height-.40,.12));
  const geometry=new THREE.ExtrudeGeometry(outline,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:3,curveSegments:12});
  geometry.translate(0,0,-depth/2);
  const object=mesh(parent,name,geometry,stone,position);object.rotation.y=yaw;
  return object;
}
function reflection(parent,name,width,height,position,yaw){
  const positions=[],colors=[],indices=[];
  // A broad, soft reflection of the bright hall, rather than scratched lines.
  for(let row=0;row<=12;row++)for(let col=0;col<=8;col++){
    const v=row/12,u=col/8,skew=(v-.5)*width*.65;
    positions.push((u-.5)*width+skew,(v-.5)*height,0);
    const alpha=.085*Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**1.3;
    colors.push(.86,.96,.96,alpha);
    if(row<12&&col<8){const n=row*9+col;indices.push(n,n+1,n+9,n+1,n+10,n+9);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.setIndex(indices);g.computeVertexNormals();
  const object=mesh(parent,name,g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide}),position);object.rotation.y=yaw;
}
function bed(parent,name,x0,x1,z0,z1,marine){
  const g=new THREE.PlaneGeometry(x1-x0,z1-z0,18,40);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,c=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),y=.13+.045*Math.sin(x*2.6+z*.9)+.027*Math.sin(z*3.7-x*1.4);
    p.setY(i,y);
    const color=new THREE.Color(marine?0x849d8d:0x526f65).lerp(new THREE.Color(0xc7c8ab),.32+.15*Math.sin(z*.6+x*1.7));c.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();
  mesh(parent,name,g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98}),[(x0+x1)/2,0,(z0+z1)/2]);
}

export function encloseAquarium(root,ceilingHeight){
  const stone=new THREE.MeshStandardMaterial({color:0xd6d7c6,roughness:.88});
  const dark=new THREE.MeshStandardMaterial({color:0x264b54,roughness:.91});
  const water=new THREE.MeshStandardMaterial({color:0x397a89,transparent:true,opacity:.32,roughness:.16,depthWrite:false,side:THREE.DoubleSide});
  const glass=new THREE.MeshPhysicalMaterial({color:0xc5e3e3,transparent:true,opacity:.14,roughness:.11,metalness:0,depthWrite:false,side:THREE.FrontSide});
  const remove=[];
  root.traverse(o=>{
    if(/^(continuous thick aquarium viewing glass|distant reef aquarium viewing pane|rear aquarium glazing beyond portal|soft vertical glass glint|dappled underwater light across viewing glass)$/.test(o.name))remove.push(o);
    if(o.name==='continuous solid sculpted tank wall')o.position.x=Math.sign(o.position.x)*10.74;
    if(/^(painted saltwater reef habitat|painted freshwater river habitat)$/.test(o.name)){
      o.position.x=Math.sign(o.position.x)*10.63;
      o.geometry.scale(1,1,5.12/4.66);
    }
    if(o.name==='solid distant reef backdrop')o.position.z=-15.10;
    if(o.name==='painted distant reef habitat')o.position.z=-15.00;
    if(o.name==='world-wrapping side atmosphere')o.position.x=Math.sign(o.position.x)*10.90;
  });
  for(const o of remove)o.removeFromParent();
  const architecture=new THREE.Group();architecture.name='enclosed aquariums with glazed fronts water surfaces and recessed beds';root.add(architecture);
  function pane(name,w,h,at,yaw,id){
    const object=mesh(architecture,name,new THREE.BoxGeometry(w,h,.045),glass,at);object.rotation.y=yaw;
    object.userData={solidFootprint:true,preserveSculptGeometry:true,aquariumGlass:id};
    return object;
  }
  function slab(name,w,h,d,at,material=dark){return mesh(architecture,name,new THREE.BoxGeometry(w,h,d),material,at);}
  for(const side of [-1,1]){
    const id=side<0?'river':'side-reef',centerZ=2.735,length=28.17;
    pane('sealed continuous viewing glass of '+id,length,5.05,[side*7.56,3.125,centerZ],Math.PI/2,id);
    frame(architecture,'beveled stone surround sealing the '+id+' viewing wall',length+.30,5.55,.23,[side*7.48,3.12,centerZ],Math.PI/2,stone);
    // A real sediment bed, opaque end returns, upper cabinet and waterline
    // provide depth behind the glass even when viewed from a sharp angle.
    bed(architecture,'recessed sediment bed inside '+id,side<0?-10.66:7.57,side<0?-7.57:10.66,-11.35,16.82,side>0);
    for(const z of[-11.35,16.82])slab('closed stone end of '+id,3.20,5.82,.14,[side*9.12,2.92,z]);
    slab('enclosed upper hood over '+id,3.20,.18,length,[side*9.12,5.76,centerZ]);
    if(ceilingHeight){
      const p=[],idx=[];
      for(let i=0;i<=32;i++){
        const z=-11.35+i*length/32;
        p.push(side*7.49,5.875,z,side*7.49,ceilingHeight(side*7.49,z)-.005,z);
        if(i<32){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
      mesh(architecture,'stone frieze closing the '+id+' cabinet to the actual vault',g,new THREE.MeshStandardMaterial({color:0x6a8788,roughness:.95,side:THREE.DoubleSide}));
    }
    const surface=mesh(architecture,'visible waterline inside '+id,new THREE.PlaneGeometry(3.06,length),water,[side*9.10,5.59,centerZ]);surface.rotation.x=-Math.PI/2;
    for(const z of[-7.6,.6,8.1,14.4])reflection(architecture,'soft hall reflection seated on '+id+' glass',.52,3.8,[side*7.532,3.16,z],Math.PI/2);
  }
  for(const [id,z,back,sign] of[['far-reef',-11.35,-15.02,1],['rear-reef',16.82,20.53,-1]]){
    pane('complete sealed viewing glass of '+id,14.96,5.05,[0,3.125,z],0,id);
    frame(architecture,'sculpted marble picture surround of '+id,15.30,5.55,.25,[0,3.12,z+sign*.035],0,stone);
    slab('center stone mullion on '+id,.18,5.42,.23,[0,3.15,z+sign*.025],stone);
    const low=Math.min(z,back),high=Math.max(z,back),depth=high-low;
    bed(architecture,'continuous inset sand floor of '+id,-7.48,7.48,low,high,true);
    for(const x of[-7.48,7.48])slab('closed side return of '+id,.14,5.82,depth,[x,2.92,(z+back)/2]);
    slab('enclosed tank canopy of '+id,15.1,.18,depth,[0,5.76,(z+back)/2]);
    const surface=mesh(architecture,'water surface behind '+id+' viewing glass',new THREE.PlaneGeometry(14.82,depth),water,[0,5.59,(z+back)/2]);surface.rotation.x=-Math.PI/2;
    for(const x of[-5.2,3.8])reflection(architecture,'soft gallery reflection on '+id,.65,3.9,[x,3.15,z+sign*.028],0);
  }
  // The round exhibits were transparent shells with open tops. Add actual
  // capped water surfaces and seated, shaped lids around their existing rims.
  for(const [id,x,z,y,rx,rz] of[['round-reef',1.6,6,4.53,1.12,1.04],['tide-globe',5.05,10.64,2.58,.87,.81]]){
    const surface=mesh(architecture,'enclosed water surface of '+id,new THREE.CircleGeometry(1,64),water,[x,y-.045,z]);surface.rotation.x=-Math.PI/2;surface.scale.set(rx,rz,1);
    const rim=new THREE.Shape();rim.absellipse(0,0,rx+.045,rz+.045,0,Math.PI*2,false,0);
    const hole=new THREE.Path();hole.absellipse(0,0,rx-.035,rz-.035,0,Math.PI*2,true,0);rim.holes.push(hole);
    const g=new THREE.ExtrudeGeometry(rim,{depth:.075,bevelEnabled:true,bevelSize:.014,bevelThickness:.012,bevelSegments:2,curveSegments:64});g.rotateX(-Math.PI/2);
    mesh(architecture,'joined shaped lid resting on '+id+' glazing',g,stone,[x,y+.012,z]);
  }
  root.userData.aquariumTanks=AQUARIUM_TANKS;
}

// Bake the source's posed skin before fitting it to the water. This preserves
// the ray's actual rendered anatomy, rather than measuring unskinned bind axes.
export function freezeAquariumAnimal(source){
  source.updateMatrixWorld(true);
  const frozen=new THREE.Group();
  source.traverse(o=>{
    if(!o.isMesh)return;
    const geometry=o.geometry.clone(),p=geometry.attributes.position,v=new THREE.Vector3();
    if(o.isSkinnedMesh){for(let i=0;i<p.count;i++){o.getVertexPosition(i,v);p.setXYZ(i,v.x,v.y,v.z);}geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');}
    geometry.applyMatrix4(o.matrixWorld);geometry.computeVertexNormals();
    const object=new THREE.Mesh(geometry,o.material);object.name=o.name+' frozen posed surface';frozen.add(object);
  });
  return frozen;
}

function radiusAt(tank,y){
  const profile=tank.profile;if(y<profile[0][0]||y>profile.at(-1)[0])return null;
  let i=1;while(i<profile.length-1&&y>profile[i][0])i++;
  const a=profile[i-1],b=profile[i],t=(y-a[0])/(b[0]-a[0]);return[a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
}
export function insideAquariumTank(tank,point,margin=0){
  if(tank.min)return point.every((v,i)=>v>=tank.min[i]+margin&&v<=tank.max[i]-margin);
  const radius=radiusAt(tank,point[1]);if(!radius)return false;
  return ((point[0]-tank.center[0])/(radius[0]-margin))**2+((point[2]-tank.center[1])/(radius[1]-margin))**2<=1;
}

export function fitAquariumAnimals(root){
  const animals=[];root.traverse(o=>{if(typeof o.userData.driftPhase==='number'||o.userData.aquariumAnimal)animals.push(o);});
  const proof=[];
  for(const animal of animals){
    const p=animal.position;
    const id=animal.userData.aquariumHabitat??(p.z>16.82?'rear-reef':p.z< -11.35?'far-reef':p.x>7?'side-reef':p.x< -7?'river':p.z>9?'tide-globe':'round-reef');
    const tank=AQUARIUM_TANKS.find(t=>t.id===id);if(!tank)throw Error('Unknown tank '+id);
    const baseYaw=animal.rotation.y,amplitude=animal.userData.driftAmplitude??0;
    function envelope(){
      const points=[];
      for(const phase of[-1,0,1]){
        animal.rotation.y=baseYaw+phase*.065;root.updateMatrixWorld(true);
        animal.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,v=new THREE.Vector3();for(let i=0;i<a.count;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);points.push([v.x,v.y+phase*amplitude,v.z]);}});
      }
      animal.rotation.y=baseYaw;return points;
    }
    let points=envelope(),box=new THREE.Box3().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
    if(tank.min){
      const available=new THREE.Vector3().fromArray(tank.max).sub(new THREE.Vector3().fromArray(tank.min)).addScalar(-.10),size=box.getSize(new THREE.Vector3());
      const factor=Math.min(1,available.x/size.x,available.y/size.y,available.z/size.z);
      if(factor<1){animal.scale.multiplyScalar(factor);points=envelope();box.setFromPoints(points.map(p=>new THREE.Vector3(...p)));}
      for(let axis=0;axis<3;axis++){
        const key=['x','y','z'][axis];
        p[key]+=Math.max(0,tank.min[axis]+.045-box.min[key])-Math.max(0,box.max[key]-(tank.max[axis]-.045));
      }
    }else{
      // Keep the already composed focal fish in place when they fit. For an
      // oversized or off-center animal, move the coupled sculpture and shrink
      // it uniformly; no limb, fin or shell is independently distorted.
      let attempts=0;
      while(points.some(point=>!insideAquariumTank(tank,point,.035))&&attempts++<30){
        animal.scale.multiplyScalar(.97);
        p.x=THREE.MathUtils.lerp(p.x,tank.center[0],.08);p.z=THREE.MathUtils.lerp(p.z,tank.center[1],.08);
        const middle=(tank.profile[0][0]+tank.profile.at(-1)[0])/2;p.y=THREE.MathUtils.lerp(p.y,middle,.025);
        points=envelope();
      }
    }
    points=envelope();const outside=points.filter(point=>!insideAquariumTank(tank,point,.025)).length;
    if(outside)throw Error(`${animal.name}: ${outside} sampled vertices outside ${id}`);
    animal.userData.aquariumHabitat=id;
    proof.push({name:animal.name,tank:id,verticesChecked:points.length,position:animal.position.toArray(),scale:animal.scale.toArray()});
  }
  root.updateMatrixWorld(true);root.userData.aquariumContainment=proof;
}
