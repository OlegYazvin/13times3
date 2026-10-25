export const OFFICE_LEVEL = 3.2;
export const officeWalkSurfaces = [
 {id:'foyer',minX:-6.08,maxX:6.08,minZ:-.95,maxZ:8.9,y:0},
 {id:'reception',minX:-6.08,maxX:3.25,minZ:-6.35,maxZ:-.95,y:0},
 {id:'lower-flight',minX:3.25,maxX:5.05,minZ:-3.85,maxZ:-.95,y:0,slopeZ:-1.6/2.9,originZ:-.95},
 {id:'turning-landing',minX:3.25,maxX:5.05,minZ:-5.65,maxZ:-3.85,y:1.6},
 {id:'upper-flight',minX:.35,maxX:3.25,minZ:-5.65,maxZ:-3.85,y:1.6,slopeX:-1.6/2.9,originX:3.25},
 {id:'upper-landing',minX:-1.25,maxX:.35,minZ:-5.65,maxZ:-3.85,y:OFFICE_LEVEL},
 {id:'upper-corridor',minX:-1.25,maxX:3.85,minZ:-9.5,maxZ:-5.65,y:OFFICE_LEVEL},
 {id:'office',minX:-2.9,maxX:2.9,minZ:-13.9,maxZ:-9.5,y:OFFICE_LEVEL},
];
export const officeRoute = [[2,1],[4.15,-.4],[4.15,-2.4],[4.15,-4.75],[1.7,-4.75],[-.45,-4.75],[-.45,-6.7],[1.72,-6.7],[1.72,-8.6],[1.72,-9.9],[.35,-11.6],[.25,-13.0]];
