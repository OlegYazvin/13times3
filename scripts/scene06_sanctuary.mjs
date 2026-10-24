import * as THREE from 'three';

export function sculptSanctuary(root){
  root.traverse(o=>{
    if(/fabric side wall|fabric wall pleat|edge of the fabric fold|linen vault panel|vault seam|transverse fabric seam|solid wall behind the quiet chair|stained daylight pane|lead line around arched|window arch becoming/.test(o.name))o.visible=false;
  });
  // One continuous folded shell joins wall to vault without a box corner.
  const p=[],c=[],indices=[],rows=128,sides=96;
  for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){
    const a=i/sides*Math.PI,z=-5.77+j/rows*11.54;
    const fold=.13*Math.sin(z*2.05+a*.55)+.035*Math.sin(z*5.8+a);
    const x=Math.cos(a)*(4.46+fold),y=.035+Math.sin(a)*(4.95+fold)+.045*Math.sin(a*5+z*.3)*Math.sin(a);
    p.push(x,y,z);
    const warm=THREE.MathUtils.smoothstep(x,-3.8,3.5);
    const pigment=new THREE.Color(0x8998ad).lerp(new THREE.Color(0xe5c7b4),warm);
    pigment.offsetHSL(0,0,.018*Math.sin(z*1.3+a*2));c.push(pigment.r,pigment.g,pigment.b);
    if(j<rows&&i<sides){const n=j*(sides+1)+i;indices.push(n,n+1,n+sides+1,n+1,n+sides+2,n+sides+1);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeVertexNormals();
  const shell=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1,emissive:0xa9a0a1,emissiveIntensity:.08}));shell.name='continuous folded fabric cocoon opening from blue dusk into warm linen';root.add(shell);
  const outline=new THREE.Shape();outline.moveTo(-4.70,0);outline.lineTo(4.70,0);for(let i=0;i<=64;i++){const a=i/64*Math.PI;outline.lineTo(Math.cos(a)*4.70,.035+Math.sin(a)*5.20);}outline.closePath();
  const end=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.08,bevelEnabled:false,curveSegments:64}),new THREE.MeshStandardMaterial({color:0xc9bab5,roughness:1,side:THREE.DoubleSide}));end.position.z=-3.88;end.userData.solidFootprint=true;end.name='arched linen end wall completing the sanctuary';root.add(end);
  const window=new THREE.CircleGeometry(1,96),v=window.attributes.position,colors=[];
  for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i);v.setXYZ(i,x*2.65+.65,y*1.80+2.43,-3.75+.045*(1-x*x-y*y));const color=new THREE.Color(0xabbacb).lerp(new THREE.Color(0xffdbac),THREE.MathUtils.smoothstep(x,-.8,.55));colors.push(color.r,color.g,color.b);}
  window.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));window.computeVertexNormals();
  const light=new THREE.Mesh(window,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));light.name='broad folded daylight held beside the cool memory';root.add(light);
}
