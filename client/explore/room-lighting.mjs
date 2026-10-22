import * as THREE from "three";

// The still painting and its walkable room use the same lights. Keeping this
// in one module prevents a bright preview from darkening at the threshold.
export function addRoomLighting(parent, roomId = '01') {
  // Preview and live room share the same emotional light, including direction.
  const settings = {
    '01':[0xf6c9a0,0x88b5bc,1.9,.65], '02':[0xffd2a1,0x91b1bb,2.2,.64],
    '03':[0xffdfb6,0x9cbfc1,2.2,.67], '04':[0xffd3a1,0x8faebf,2.4,.60],
    '05':[0xffd291,0x879aaf,2.7,.44], '06':[0xffc39e,0x99a8c3,2.1,.78],
    '07':[0xffdfac,0x99c5bc,2.2,.67], '08':[0xffcc97,0x8eacc1,2.3,.55],
    '09':[0xffd6a0,0x9aafad,2.25,.60], '10':[0xffdfb7,0x98bdc7,2.3,.64],
    '11':[0xd9eee2,0x75a9b9,1.8,.67],
  }[roomId] || [0xffdfab,0xb7c7ff,2.1,.7];
  parent.add(new THREE.HemisphereLight(settings[1],0x78645b,settings[3]));
  const key = new THREE.DirectionalLight(settings[0], settings[2]);
  key.position.set(roomId==='05'?-3.5:-2.5, 4.5, 3.2);
  parent.add(key, key.target);
  const fill = new THREE.DirectionalLight(settings[1], .48);
  fill.position.set(3, 2.5, -2);
  parent.add(fill, fill.target);
}
