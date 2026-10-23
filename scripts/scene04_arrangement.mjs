// The author's complete car scales to approximately the manufacturer's
// 0.864 × 0.483 × 1.156 m envelope, including its push handle. Seat, floor,
// steering and parent targets use that same arrangement.
export const TOY_CAR_SCALE=[.38,.58,.55];
export const TOY_CAR_Y=-.018;
export const BLUE_CAR_ACTORS={
 Zephrine:{position:[0,.007,3.88],yaw:0,options:{height:.8851,stature:1.04,seated:true,carried:true,hipY:.2923,shoeAnkle:true,shirt:0xd79b95,dress:false,pants:0x706580,knees:[[-.067,.36,.20],[.067,.36,.20]],ankles:[[-.062,.2055,.21],[.062,.2055,.21]],hands:{'-1':[-.0646,.5238,.2814],'1':[.0646,.5238,.2814]},handNormals:{'-1':[0,-.688,.725],'1':[0,-.688,.725]},handAxes:{'-1':[1,0,0],'1':[-1,0,0]},handCurl:.5,thumbTurn:-.20,headPitch:.08,headTilt:-.06,expression:'joy',grip:true}},
 Jane:{position:[.43,0,3.18],yaw:0,options:{height:1.65,stature:1.68,refinedGarment:true,leanZ:.04,hands:{'-1':[-.33,.8619,.2475]},handGrips:{'-1':true,'1':false},handCurls:{'-1':.2},thumbTurns:{'-1':-.60},handNormals:{'-1':[0,-1,0]},handAxes:{'-1':[0,0,1]},headPitch:.20,headYaw:-.14}},
 Oleg:{position:[-.43,0,3.18],yaw:0,options:{height:1.72,stature:1.76,refinedGarment:true,leanZ:.06,hands:{'1':[.33,.8619,.2375]},handGrips:{'1':true,'-1':false},handCurls:{'1':.4},thumbTurns:{'1':-.6},handNormals:{'1':[0,-1,0]},handAxes:{'1':[0,0,1]},headPitch:.20,headYaw:.14}},
};

export const BLUE_CAR_SHIFT_Z=1.50;
