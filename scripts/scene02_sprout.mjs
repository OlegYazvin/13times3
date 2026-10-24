import * as THREE from 'three';
import {makeStoryPerson,shapedTube} from './storybook_figures.mjs';
import {addContactShadow} from './stage_shadows.mjs';

// A simultaneous, symbolic Oleg: the user's remembered rejection joke. The
// small plant stays unbranded and separate from Jane's acts of support.
export function addSproutRejection(root){
  const vignette=new THREE.Group();vignette.name='Oleg objects to a very small sprout';
  vignette.position.set(3.0,0,-2.8);vignette.rotation.y=-.60;
  vignette.userData.sproutRejection=true;root.add(vignette);
  const actor=makeStoryPerson('Oleg',{
    anatomicalHead:true,anatomicalHands:true,sculptedCloth:true,refinedGarment:true,
    height:1.76,shirt:0xdccdb7,pants:0x414b5b,expression:'angry',
    headOrder:'YXZ',headYaw:-.30,headPitch:.61,leanZ:.035,
    hands:{'-1':[-.30,1.62,.22],'1':[.26,.87,.12]},
    elbows:{'-1':[-.44,1.27,.03],'1':[.30,1.14,.03]},
    handStyles:{'-1':'fist','1':'fist'},thumbTurns:{'-1':.55,'1':.55},
    handAxes:{'-1':[0,1,0],'1':[0,-1,0]},
    handNormals:{'-1':[0,0,.999],'1':[0,0,1]},
    ankles:[[-.12,.10,.12],[.15,.10,-.10]],
    knees:[[-.12,.47,.13],[.14,.49,-.03]]
  });
  actor.name='Oleg angrily raising a clenched fist at the sprout';
  actor.userData.storyIdentity='Oleg';actor.userData.sproutActor=true;
  actor.traverse(o=>{if(o.userData.storyPart==='shoe')o.userData.solidFootprint=true;});
  vignette.add(actor);
  const plant=new THREE.Group();plant.name='a tiny two-leaf sprout facing Oleg';
  plant.position.set(-.28,0,.95);plant.userData.sproutTarget=true;vignette.add(plant);
  addContactShadow(plant,1.5,.62);
  const ceramic=new THREE.MeshStandardMaterial({color:0xad6e4d,roughness:.84});
  const wood=new THREE.MeshStandardMaterial({color:0x9c7653,roughness:.88});
  const soil=new THREE.MeshStandardMaterial({color:0x493b2d,roughness:1});
  const green=new THREE.MeshStandardMaterial({color:0x72a859,roughness:.86});
  function lathe(name,profile,material,y){
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),material);
    mesh.name=name;mesh.position.y=y;plant.add(mesh);return mesh;
  }
  const stool=lathe('rounded wooden plant stool',[[0,0],[.16,0],[.19,.012],[.196,.027],[.19,.045],[.16,.054],[0,.054]],wood,.53);
  stool.userData.solidFootprint=true;
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3+.25,s=Math.sin(a),c=Math.cos(a);
    shapedTube(plant,'splayed tapered stool leg',[[s*.14,.55,c*.14],[s*.16,.28,c*.16],[s*.19,0,c*.19]],[.023,.019,.014],wood);
  }
  lathe('terracotta saucer with turned lip',[[0,0],[.092,0],[.12,.012],[.121,.024],[.111,.031],[.102,.021],[0,.021]],ceramic,.584);
  lathe('open terracotta pot with rolled rim',[[.063,0],[.072,.012],[.098,.156],[.107,.166],[.108,.181],[.098,.186],[.088,.173],[.085,.155],[.060,.017],[.063,0]],ceramic,.605);
  lathe('earth seated inside the pot',[[0,0],[.086,0],[.086,.006],[0,.006]],soil,.761);
  shapedTube(plant,'single curved living sprout stem',[[0,.764,0],[-.009,.85,.008],[.008,.945,.002],[0,1.025,0]],[.008,.006,.003],green);
  // Closed, gently cupped leaves: rounded silhouettes and a real underside.
  for(const sign of[-1,1]){
    const p=[],indices=[],rows=20,cols=10;
    for(let underside=0;underside<2;underside++)for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const t=r/rows,v=c/cols*2-1,w=.066*Math.sin(Math.PI*t)**.85;
      p.push(sign*(.004+.205*t),.955+.095*t+.026*Math.sin(Math.PI*t)-v*v*.026*Math.sin(Math.PI*t)-underside*.0035*Math.sin(Math.PI*t),.003+v*w);
      if(r<rows&&c<cols){const a=(underside*(rows+1)+r)*(cols+1)+c,b=a+cols+1;indices.push(...(underside?[a,b,a+1,a+1,b,b+1]:[a,a+1,b,a+1,b+1,b]));}
    }
    // Join the two surfaces around their shared perimeter.
    const n=(rows+1)*(cols+1);
    for(let r=0;r<rows;r++)for(const c of[0,cols]){const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,b,a+n,b,b+n,a+n);}
    if(sign<0)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();
    const leaf=new THREE.Mesh(g,green);leaf.name='formed green cotyledon with a cupped underside';plant.add(leaf);
    shapedTube(plant,'subtle leaf midrib',[[sign*.006,.959,.003],[sign*.103,1.029,.003],[sign*.200,1.052,.003]],[.003,.002,.0004],green);
  }
  return vignette;
}
