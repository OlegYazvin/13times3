import * as THREE from 'three';
import {createRoomArt} from './room_art.mjs';
import {composeOfficeWorld} from './scene05_office.mjs';
const colors={sky:0xb9cdd0,ground:0xa9b4a2,ink:0x344347,paper:0xf1e8d6,brass:0xb89a61,
 brick:0x986b5b,brickLight:0xb7947a,mortar:0xd9cbb3,glass:0xb9d5d3,
 skin:0xd8a487,hair:0x3e3033,fabric:0x4e7d7a,navy:0x394b61,zephHair:0x6f5145,pink:0xd6a0a0,rose:0xb47d88,olive:0x84947b};
const art=createRoomArt({index:4,title:'Jane held her ground — the way up to her own office',width:12.6,height:9,depth:34,colors,seed:505505});
composeOfficeWorld(art);
art.person('Jane standing up for her family',0,5.05,1.75,{skin:art.M.skin,hair:art.M.hair,outfit:art.M.fabric,pants:art.M.navy,bun:true,yaw:0});
art.person('Oleg beside Jane during the move',-1.08,4.35,1.73,{skin:art.M.skin,hair:art.M.hair,outfit:0xe5d8c4,pants:art.M.ink,glasses:true,beard:true,longHair:true,yaw:.25});
art.person('Zephrine kept close to her parents',-.54,4.91,1.05,{skin:art.M.skin,hair:art.M.zephHair,outfit:art.M.pink,skirt:art.M.rose,pants:art.M.olive,dress:true,curls:true,yaw:0});
window.__authorRoom=()=>art.exportRoom({batchStatic:true,afterCompose(root){root.traverse(o=>{if(o.userData.solidFootprint)o.userData.heightAwareCollision=true;});root.userData.officeRevision='Second-floor real office, corrected left/right, October 24';}});
