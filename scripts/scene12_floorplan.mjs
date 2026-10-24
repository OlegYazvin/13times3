// Photo-informed plan, not a measured survey. +Z leads through the dream seam
// to Borelli's. The two front bays, chimney notch and stair return deliberately
// break the former rectangular upstairs envelope.
export const folkFloorplan=Object.freeze([
 [-7.25,3.8],[-7.25,-5.6],[-7.25,-8.05],[-6.15,-9.45],
 [-3.55,-9.45],[-2.55,-8.45],[-1.15,-8.45],[-1.15,-9.45],
 [-.15,-10.95],[2.75,-10.95],[4.2,-9.65],[4.2,-8.75],
 [5.9,-8.75],[5.9,-5.5],[5.25,-5.5],[5.25,-1.25],
 [7.25,-1.25],[7.25,3.8],[7.25,11.08],[-7.25,11.08],
]);
// Guest edge of the continuous wrapping bar. The inner service opening remains
// open at the back; no rectangular slab fills it.
export const upstairsBarEdge=Object.freeze([
 [-1.95,-.82],[-1.95,-.12],[-1.35,.68],[.90,.68],[1.65,.08],[1.65,-.48],
]);
export const upstairsBarPosition=Object.freeze([-4.6,0,-6.7]);

export function offsetOpenPath(path,distance){
 const lines=path.slice(1).map((b,i)=>{const a=path[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return {a:[a[0]+dz/l*distance,a[1]-dx/l*distance],d:[dx/l,dz/l]};});
 return path.map((p,i)=>{
  if(i===0)return lines[0].a;
  if(i===path.length-1){const l=lines.at(-1);return[l.a[0]+l.d[0]*Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1]),l.a[1]+l.d[1]*Math.hypot(p[0]-path[i-1][0],p[1]-path[i-1][1])];}
  const a=lines[i-1],b=lines[i],cross=a.d[0]*b.d[1]-a.d[1]*b.d[0];
  if(Math.abs(cross)<1e-8)return b.a;
  const dx=b.a[0]-a.a[0],dz=b.a[1]-a.a[1],t=(dx*b.d[1]-dz*b.d[0])/cross;
  return[a.a[0]+a.d[0]*t,a.a[1]+a.d[1]*t];
 });
}
