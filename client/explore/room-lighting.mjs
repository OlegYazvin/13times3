import * as THREE from "three";

// The still painting and its walkable room use the same lights. Keeping this
// in one module prevents a bright preview from darkening at the threshold.
export function addRoomLighting(parent, roomId = '01') {
  // Preview and live room share the same emotional light, including direction.
  const settings = {
    '01':[0xf6c9a0,0x88b5bc,1.9,.65], '02':[0xffd2a1,0x91b1bb,2.2,.64],
    '03':[0xffdfb6,0x9cbfc1,2.2,.67], '04':[0xffd3a1,0x8faebf,2.4,.60],
    '05':[0xffd291,0x879aaf,2.7,.44], '06':[0xffd7ad,0xc5d5d6,2.35,.96],
    '07':[0xffd7a1,0xb0cfcc,2.75,.96], '08':[0xffcc97,0x8eacc1,2.3,.55],
    '09':[0xffd6a0,0x9aafad,2.25,.60], '10':[0xffdfb7,0x98bdc7,2.3,.64],
    '11':[0xd9eee2,0x75a9b9,1.8,.67],
    '12':[0xffead1,0xc4d6df,2.4,1.05],
  }[roomId] || [0xffdfab,0xb7c7ff,2.1,.7];
  parent.add(new THREE.HemisphereLight(settings[1],roomId==='12'?0x788e8e:0x78645b,settings[3]));
  const key = new THREE.DirectionalLight(settings[0], settings[2]);
  if(roomId==='07')key.position.set(-5,7,9);
  else key.position.set(roomId==='05'?-3.5:-2.5,4.5,3.2);
  const shadow={
    '01':[[0,.8,0],[-3,5.2,5],4],
    '02':[[-1,.8,0],[-7,11,9],9],
    '03':[[0,.8,0],[-6,11.2,10],8],
    '04':[[0,.8,5],[-3,5.2,5],5],
    '05':[[0,1,3],[-4.5,7,6],7],
    '06':[[0,.8,.6],[-3,5.2,5],5],
    '07':[[-.2,1,5.1],[-5,7,8],6],
    '08':[[0,1,0],[-6,10,10],15],
    '09':[[0,.8,2.6],[-5,7,8],7],
    '10':[[0,1,4],[-5,8,8],8],
    '11':[[0,1,8],[-4,7,5],12],
    '12':[[0,1,0],[-4,7,8],13],
  }[roomId];
  if(shadow){
    const [target,offset,span]=shadow;
    key.target.position.fromArray(target);key.position.copy(key.target.position).add(new THREE.Vector3(...offset));
    key.castShadow=true;key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.2,far:60});
    key.shadow.intensity=.55;key.shadow.bias=-.0003;key.shadow.normalBias=.010;key.shadow.radius=3;
    key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;
  }
  parent.add(key, key.target);
  const fill = new THREE.DirectionalLight(settings[1], .48);
  fill.position.set(3, 2.5, -2);
  parent.add(fill, fill.target);
  if(roomId==='12'){for(const [x,y,z,power] of [[-3.4,3.45,-3.2,4.5],[0,3.8,7.5,14]]){const glow=new THREE.PointLight(0xffd3a3,power,10,2);glow.position.set(x,y,z);parent.add(glow);}}
  if(roomId==='05'){const focus=new THREE.SpotLight(0xffd6a2,30,12,.70,.9,2);focus.position.set(-1.5,5.4,3.6);focus.target.position.set(-.25,1.1,5.1);parent.add(focus,focus.target);}
  if(roomId==='02'){const bounce=new THREE.PointLight(0xffe5c1,12,9,2);bounce.position.set(-2.6,2.6,4.2);parent.add(bounce);}
  if(roomId==='11'){
    // Light the actual water from the exhibit hoods. The visitor hall remains
    // softly lit while fish and coral are readable behind the glazing.
    for(const [x,y,z,power] of [[8.9,4.75,5.2,18],[-8.9,4.75,3.0,15],[0,4.95,-13.3,20],[0,4.95,18.6,20]]){
      const tankLight=new THREE.PointLight(0xbde8e8,power,13,2);tankLight.position.set(x,y,z);parent.add(tankLight);
    }
  }
  if(roomId==='06'){const bounce=new THREE.PointLight(0xffd4b6,9,10,2);bounce.position.set(.8,2.4,3.1);parent.add(bounce);}
  if(roomId==='01'){
    for(const [at,look,power] of [[[.9,3.08,-.8],[1.05,1.05,-1.5],15],[[-.45,2.7,1.15],[-.35,.95,.52],10]]){
      const pool=new THREE.SpotLight(0xffd29b,power,7,.88,.85,2);pool.position.fromArray(at);pool.target.position.fromArray(look);parent.add(pool,pool.target);
    }
  }
}

// Cache one room-local shadow map. Only people and furniture cast in the
// enclosed studies; a directional art light must not be blocked by their
// symbolic vaults. Both the exported painting and the live world use this rig.
export function prepareRoomShadows(root,roomId,renderer){
  if(!/^0[1-9]$|^1[012]$/.test(roomId))return;
  if(renderer){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;}
  root.traverse(object=>{
    if(!object.isMesh)return;
    let names='';for(let p=object;p;p=p.parent)names+=' '+p.name.replaceAll('_',' ');
    const name=object.name.replaceAll('_',' '),list=Array.isArray(object.material)?object.material:[object.material];
    if(list.some(m=>m?.transparent&&m.opacity<.95)||/shadow|bubble|glass/.test(name))return;
    object.receiveShadow=true;
    let actor=false,parkTree=false;for(let p=object;p;p=p.parent){if(p.userData.storyIdentity||p.userData.storyFigure)actor=true;if(/shade tree|foreground park canopy|parkway tree|blueberry bush|sculpted apple tree|^apple tree \d|sculpted blue toddler push car/.test(p.name.replaceAll('_',' ')))parkTree=true;}
    object.castShadow=actor||parkTree||/chair|desk|counter|cabinet|table|stage plinth|stage deck|curtain|bridge|pavilion post|masonry pier|office pod|moving trolley|solid blue play|play-tower|lighthouse tower|architectural stop/.test(names);
    if(object.castShadow&&/chair|desk|table|car|wheel|bonnet/.test(name))for(const material of list)if(material.side===THREE.DoubleSide)material.shadowSide=THREE.BackSide;
  });
}
