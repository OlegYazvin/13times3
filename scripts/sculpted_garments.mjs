import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

const mix=THREE.MathUtils.lerp,clamp=THREE.MathUtils.clamp;
const blend=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return mix(b,a,h)-k*h*(1-h);};

// A single distance surface, rather than a swept tube: at a tight bend the
// inner sleeve compresses into cloth instead of turning its own rings inside
// out. Upper arms blend into the shirt; cuffs end at the actual wrist plane.
export function sculptedShirt(rings,arms,material,{leanZ=0,hip=rings[0][0],shoulder=rings.at(-1)[0],rounded=false}={}){
  const size=88,padding=.095;
  const min=new THREE.Vector3(-.3,rings[0][0]-.04,-.22+Math.min(0,leanZ)),max=new THREE.Vector3(.3,rings.at(-1)[0]+.04,.22+Math.max(0,leanZ));
  for(const a of arms)for(const p of [a.start,a.elbow,a.wrist]){
    min.min(new THREE.Vector3(...p).addScalar(-padding));max.max(new THREE.Vector3(...p).addScalar(padding));
  }
  const center=min.clone().add(max).multiplyScalar(.5),extent=max.clone().sub(min).multiplyScalar(.5);
  // Isotropic cells keep the distance-field normals correct after extraction.
  const half=Math.max(extent.x,extent.y,extent.z)*1.08;
  const effect=new MarchingCubes(size,material,false,false,70000);effect.isolation=0;
  const profile=new THREE.CatmullRomCurve3(rings.map(r=>new THREE.Vector3(...r)));
  const samples=Array.from({length:129},(_,i)=>profile.getPoint(i/128));
  const crossSection=y=>{
    let i=0;while(i<samples.length-2&&samples[i+1].x<y)i++;
    const a=samples[i],b=samples[i+1],t=clamp((y-a.x)/(b.x-a.x),0,1);
    return [mix(a.y,b.y,t),mix(a.z,b.z,t)];
  };
  const segments=arms.map(a=>{
    const s=new THREE.Vector3(...a.start),e=new THREE.Vector3(...a.elbow),w=new THREE.Vector3(...a.wrist);
    return {...a,s,e,w,axis:w.clone().sub(e).normalize(),parts:[[s,e,a.radii[0],a.radii[1]],[e,w,a.radii[1],a.radii[2]]].map(([p,q,r0,r1])=>({p,d:q.clone().sub(p),length2:p.distanceToSquared(q),r0,r1}))};
  });
  const capsule=(x,y,z,s)=>{
    const px=x-s.p.x,py=y-s.p.y,pz=z-s.p.z,t=clamp((px*s.d.x+py*s.d.y+pz*s.d.z)/s.length2,0,1);
    return Math.hypot(px-s.d.x*t,py-s.d.y*t,pz-s.d.z*t)-mix(s.r0,s.r1,t);
  };
  for(let iy=0;iy<size;iy++){
    const y=center.y+(iy/size*2-1)*half,[rx,rz]=crossSection(y);
    for(let iz=0;iz<size;iz++)for(let ix=0;ix<size;ix++){
      const x=center.x+(ix/size*2-1)*half,z=center.z+(iz/size*2-1)*half;
      const centerZ=leanZ*THREE.MathUtils.smoothstep(y,hip,shoulder);
      const radial=(Math.hypot(x/rx,(z-centerZ)/rz)-1)*Math.min(rx,rz)-.003,bottom=rings[0][0]-.003-y,top=y-rings.at(-1)[0]-.003;
      let d=rounded?-blend(blend(-radial,-bottom,.013),-top,.010):Math.max(radial,bottom,top);
      for(const a of segments){
        const cuff=(x-a.w.x)*a.axis.x+(y-a.w.y)*a.axis.y+(z-a.w.z)*a.axis.z;
        // Clip only the forearm at its cuff. At an acute elbow the same
        // infinite plane crosses the upper arm too; clipping both would cut
        // a large triangular hole through the shoulder-facing sleeve.
        const sleeve=blend(capsule(x,y,z,a.parts[0]),Math.max(capsule(x,y,z,a.parts[1]),cuff),.018);
        d=blend(d,sleeve,.024);
      }
      effect.field[iz*size*size+iy*size+ix]=-d;
    }
  }
  effect.update();
  const count=effect.geometry.drawRange.count,g=new THREE.BufferGeometry();
  for(const name of ['position','normal'])g.setAttribute(name,new THREE.BufferAttribute(effect.geometry.attributes[name].array.slice(0,count*3),3));
  const p=g.attributes.position,uv=new Float32Array(count*2);
  for(let i=0;i<count;i++){
    p.setXYZ(i,center.x+p.getX(i)*half,center.y+p.getY(i)*half,center.z+p.getZ(i)*half);
    uv[i*2]=p.getX(i)*1.4+.5;uv[i*2+1]=p.getY(i)*1.4;
  }
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  effect.geometry.dispose();
  const shirt=new THREE.Mesh(g,material);shirt.name='one sculpted shirt with joined shoulders and compressed elbow cloth';
  shirt.userData.storyPart='shirt';shirt.userData.solidFootprint=true;
  return shirt;
}
