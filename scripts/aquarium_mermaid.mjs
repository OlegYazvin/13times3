import * as THREE from 'three';
import {makeStoryPerson} from './storybook_figures.mjs';

// An original, clothed storybook inhabitant, using the cast's CC0 anatomical
// base. No portrait, photographic texture, or additional downloaded model.
export function aquariumMermaid(){
  const mermaid=new THREE.Group();
  mermaid.name='small mermaid resting among the side-reef coral';
  const figure=makeStoryPerson('Mermaid',{
    height:1.7,child:false,skin:0xd6ae92,hair:0x795343,iris:0x527f75,
    bun:false,bob:false,curls:false,glasses:false,shirt:0xb7abbc,pants:0x153c41,
    shoes:0x142f35,expression:'tender',carried:true,
    anatomicalHead:true,anatomicalHands:true,sculptedCloth:true,
    refinedGarment:true,headYaw:-.15,headTilt:.07,
    hands:{'-1':[-.12,1.04,.22],'1':[.22,1.33,.25]},
    elbows:{'-1':[-.16,1.08,-.01],'1':[.30,1.12,.02]},
    handAxes:{'-1':[.2,-.8,.4],'1':[-.2,.5,.8]},
    handCurls:{'-1':.32,'1':.38},
  });
  // Replace the complete lower body before the room's static batching, so no
  // trouser or shoe inserts survive inside the new continuous fish tail.
  const removed=[];
  figure.traverse(o=>{
    if(['trousers','shoe'].includes(o.userData.storyPart))removed.push(o);
    delete o.userData.solidFootprint; // Entire sculpture is behind solid glass.
  });
  for(const o of removed)o.removeFromParent();
  mermaid.add(figure);

  function sweep(name,points,radii,flatten,base,highlight,relief=0){
    const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const rows=72,sides=48,frames=path.computeFrenetFrames(rows,false);
    const positions=[],colors=[],indices=[];
    const dark=new THREE.Color(base),light=new THREE.Color(highlight);
    for(let row=0;row<=rows;row++){
      const t=row/rows,k=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(k));
      const radius=THREE.MathUtils.lerp(radii[a],radii[a+1],k-a);
      const center=path.getPoint(t);
      for(let side=0;side<=sides;side++){
        const angle=side/sides*Math.PI*2;
        const scales=Math.pow(.5+.5*Math.cos(angle*18+Math.PI*Math.round(t*38)),12)
          *Math.pow(.5+.5*Math.cos(t*Math.PI*76),10);
        const r=radius+relief*scales*Math.sin(Math.PI*t);
        const point=center.clone().addScaledVector(frames.normals[row],Math.cos(angle)*r)
          .addScaledVector(frames.binormals[row],Math.sin(angle)*r*flatten);
        positions.push(point.x,point.y,point.z);
        const pigment=.15+.17*Math.sin(angle+.4)+.10*scales+.08*Math.sin(t*8);
        const color=dark.clone().lerp(light,Math.max(0,pigment));
        colors.push(color.r,color.g,color.b);
        if(row<rows&&side<sides){
          const n=row*(sides+1)+side;
          indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);
        }
      }
    }
    for(let side=1;side<sides-1;side++){
      indices.push(0,side+1,side);
      const n=rows*(sides+1);indices.push(n,n+side,n+side+1);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87}));
    mesh.name=name;mermaid.add(mesh);return mesh;
  }
  sweep('continuous curled mermaid tail with fine overlapping scale relief',
    [[0,.91,0],[.07,.68,-.025],[.28,.43,-.025],[.59,.40,-.015],[.82,.54,0],[.96,.59,0]],
    [.177,.165,.128,.082,.045,.026],.79,0x367f7e,0xb1cbb2,.002);

  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  shape.bezierCurveTo(.10,.08,.20,.26,.38,.31);
  shape.bezierCurveTo(.34,.18,.29,.05,.24,.01);
  shape.bezierCurveTo(.30,-.02,.38,-.15,.43,-.24);
  shape.bezierCurveTo(.23,-.24,.08,-.10,0,0);
  const fin=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{
    depth:.009,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,
    bevelSegments:2,curveSegments:20,
  }),new THREE.MeshStandardMaterial({color:0x82b4a4,roughness:.85}));
  fin.name='joined forked tail flukes with shaped membrane';
  fin.position.set(.94,.59,-.005);mermaid.add(fin);
  const veinMaterial=new THREE.MeshStandardMaterial({color:0x508e88,roughness:.9});
  for(const [x,y] of [[.34,.27],[.29,.15],[.24,.04],[.27,-.08],[.37,-.21]]){
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.95,.59,.010),new THREE.Vector3(.94+x*.48,.59+y*.25,.010),
      new THREE.Vector3(.94+x,.59+y,.010),
    ]);
    const vein=new THREE.Mesh(new THREE.TubeGeometry(path,18,.0018,6,false),veinMaterial);
    vein.name='fine ray seated on the mermaid tail membrane';mermaid.add(vein);
  }
  // Broad joined locks grow from the fitted scalp; their mass, rather than
  // disconnected wire strands, carries the gently floating hair silhouette.
  sweep('flowing copper hair joined behind the crown',
    [[0,1.63,-.075],[.02,1.48,-.12],[.09,1.28,-.15],[.25,1.15,-.17],[.39,1.20,-.17]],
    [.075,.105,.10,.07,.002],.48,0x795343,0xb58a62,.0007);
  sweep('left swept lock attached at the temple',
    [[-.08,1.61,-.025],[-.12,1.46,-.045],[-.13,1.29,-.06],[-.22,1.22,-.045]],
    [.042,.053,.04,.002],.58,0x795343,0xb58a62,.0007);
  mermaid.scale.setScalar(.85);
  return mermaid;
}
