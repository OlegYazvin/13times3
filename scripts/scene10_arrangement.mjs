// Shared balance game: fit both pairs in world space, then express each grip
// in its participant's local coordinates. All bodies retain their own height.
export function playgroundGrips(role,origin){
 const grips=role==='Zephrine'?[
  [-1,[-.652,.7025,4.20],.4], [1,[.172,.6985,4.19],.6],
 ]:role==='left'?[[1,[-.688,.6985,4.168],.2]]:[[-1,[.208,.7185,4.23],.6]];
 const result={hands:{},handAxes:{},handNormals:{},handCurls:{},thumbTurns:{},handGrips:{'-1':false,'1':false}};
 for(const[side,point,curl]of grips){
  result.hands[side]=point.map((v,i)=>v-origin[i]);
  result.handAxes[side]=[side,-.2,0];result.handNormals[side]=[0,0,side];
  result.handCurls[side]=curl;result.thumbTurns[side]=-.2;result.handGrips[side]=true;
 }
 return result;
}
