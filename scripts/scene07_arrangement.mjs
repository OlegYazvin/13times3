// One coupled arrangement shared by the author, character studio and review
// cameras. Contacts stay in world space while participants are fitted to them.
export const BLUEBERRY_TABLEAU_SHIFT_Z=2.2;
export const PICKED_BLUEBERRY=[-.13825,1.67485,2.88899];
const parentPosition=[-.58,0,3.12],parentYaw=-.14,childPosition=[-.58,1.149,2.88];
const childAnkles=[[-.20,.08,.45],[.20,.08,.45]];
function supportingPalm(ankle){
 const outer=ankle[0]<0?.045:.035;
 const x=childPosition[0]+ankle[0]+Math.sign(ankle[0])*outer-parentPosition[0],z=childPosition[2]+ankle[2]+(ankle[0]<0?.052:.050)-parentPosition[2];
 return [Math.cos(parentYaw)*x-Math.sin(parentYaw)*z,childPosition[1]+ankle[1]+.035,Math.sin(parentYaw)*x+Math.cos(parentYaw)*z];
}
function gripNormal(side){const x=-side/Math.SQRT2,z=-1/Math.SQRT2;return [Math.cos(parentYaw)*x-Math.sin(parentYaw)*z,0,Math.sin(parentYaw)*x+Math.cos(parentYaw)*z];}
export const BLUEBERRY_ACTORS={
 Oleg:{position:parentPosition,yaw:parentYaw,options:{height:1.76,shirt:0x587384,shoulderOffsets:{'-1':[0,.0196,0],'1':[0,.0196,0]},hands:{'-1':supportingPalm(childAnkles[0]),'1':supportingPalm(childAnkles[1])},elbows:{'-1':[-.43,1.10,.11],'1':[.43,1.10,.11]},handNormals:{'-1':gripNormal(-1),'1':gripNormal(1)},handAxes:{'-1':[.7664839537,.2818046726,.5771381769],'1':[-.5768403378,.2834850744,.7660884004]},grip:true,handCurl:.7,thumbTurn:-.30,headYaw:1.2,gazeX:.004,headPitch:-.04,headOrder:'YXZ'}},
 Zephrine:{position:childPosition,yaw:0,options:{height:1.04,seated:true,hipY:.40,hipSpread:.65,knees:[[-.23,.32,.38],[.23,.32,.38]],ankles:childAnkles,hands:{'-1':[-.24,.595,.08],'1':[.39,.525,0]},handStyles:{'1':'touch'},handPoints:{'1':{center:PICKED_BLUEBERRY.map((v,i)=>v-childPosition[i]),radius:.010}},shirt:0xc0918d,dress:false,pants:0x697f90,carried:true,headYaw:1.52,headPitch:.78,headOrder:'YXZ'}},
 G:{position:[.95,0,3.05],yaw:-.45,options:{height:1.62,shirt:0xc8bc9f,hands:{'-1':[-.477,1.709,-.069]},handStyles:{'-1':'cup'},handNormals:{'-1':[0,1,0]},headYaw:-1.3,headPitch:-.12,headOrder:'YXZ'}},
 Jane:{position:[-1.8,0,1.6],yaw:.60,options:{height:1.68,headYaw:.14,headPitch:-.18,headOrder:'YXZ'}},
};
