import * as THREE from "three";
import { createRoomArt } from "./room_art.mjs";

// Jane's chosen Open House route is a single impossible city promenade. The
// order comes from the saved Pullman-first itinerary, not her preference rank.
const C = {
  sky: 0xd9d4ca, ground: 0x9b9997, street: 0xd3c2af,
  ink: 0x303949, brick: 0x9b5f59, warmBrick: 0xc37f67,
  limestone: 0xe6d8bd, arch: 0xbba9a3, bronze: 0xaa8455,
  glass: 0x526f78, paleGlass: 0xb2c5c3, night: 0x404f69,
  gold: 0xe9c78d, mint: 0x8caaa0, rose: 0xd3958b,
  skin: 0xd7a489, hair: 0x493b3b, cream: 0xf2e5d4,
  fabric: 0x78939d, paper: 0xf5ebd9,
};
const art = createRoomArt({ index: 7, title: "Jane's chosen city route",
  width: 13.2, height: 16.0, depth: 27.8, colors: C, seed: 80808 });
const { root, M, random, add, box, beam, curve, loft, petal,
  wrapSky, ground, person, exportRoom } = art;
function masonryTexture(courses, columns, stone = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = stone ? "#d0cbc3" : "#c3bcb3";
  ctx.fillRect(0, 0, 512, 512);
  const stepY = 512 / courses;
  for (let row = 0; row < courses; row++) {
    const stagger = row % 2 ? .5 : 0;
    for (let col = -1; col <= columns; col++) {
      const stepX = 512 / columns;
      const x = (col + stagger) * stepX + 2.5;
      const y = row * stepY + 2.5;
      const hash = (row * 79 + col * 137 + row * col * 17) >>> 0;
      const tone = (stone ? 225 : 218) + hash % 26;
      ctx.fillStyle = `rgb(${tone},${tone - 2},${tone - 4})`;
      ctx.fillRect(x, y, stepX - 5, stepY - 5);
      // Each laid course has a little pigment within the stone surface, not
      // just an outline drawn on top of an otherwise plain cuboid.
      ctx.strokeStyle = `rgba(100,91,85,${stone ? .05 : .06})`;
      ctx.lineWidth = 1.5;
      for (let mark = 0; mark < 4; mark++) {
        const yy = y + 5 + (hash * (mark + 3) % Math.max(7, stepY - 11));
        ctx.beginPath();
        ctx.moveTo(x + 5 + mark * 4, yy);
        ctx.lineTo(x + stepX * (.4 + mark * .11), yy + (mark % 2 ? 1 : -1));
        ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const brickBond = masonryTexture(14, 9);
const stoneCourses = masonryTexture(10, 5, true);
for (const material of [M.brick, M.warmBrick]) {
  material.map = brickBond;
  material.needsUpdate = true;
}
for (const material of [M.limestone, M.arch]) {
  material.map = stoneCourses;
  material.needsUpdate = true;
}
wrapSky(C.sky, true);
ground(C.street, (x, z) => new THREE.Color(C.ground).lerp(
  new THREE.Color(C.street), Math.exp(-Math.pow((x - .25 * Math.sin(z * .44)) / 1.7, 2)) * .84));
// Layered facades continue between the seven named stops. They make the route
// feel like a real piece of city fabric rather than objects on a blank plane.
for (const side of [-1,1]) for (let bay=0;bay<7;bay++) {
  const z=10.8-bay*3.55, x=side*(7.75+(bay%3)*.18);
  const height=2.65+(bay*5%4)*.43;
  const mat=bay%3===0?M.warmBrick:bay%3===1?M.arch:M.limestone;
  box(root,"solid layered Chicago streetscape facade",x,height/2,z,
    4.04,height,3.12,mat,true);
  box(root,"projecting civic cornice",side*5.7,height-.08,z,
    .26,.18,3.25,M.cream);
  for (let row=0;row<2;row++) for (let window=0;window<3;window++) {
    const wz=z-1.02+window*1.02,wy=.88+row*.98;
    box(root,"recessed city window",side*5.71,wy,wz,
      .035,.55,.37,M.night);
    box(root,"light stone window sill",side*5.65,wy-.34,wz,
      .13,.045,.47,M.cream);
  }
  if (bay%2===0) {
    box(root,"solid small city stoop",side*5.15,.2,z+.83,
      .55,.4,.7,M.limestone,true);
    for(let step=0;step<3;step++) box(root,"cut stone step",
      side*(5.18-step*.16),.08+step*.07,z+.83,
      .42,.16+step*.1,.65,M.pearl||M.cream);
  }
}

// An inlaid route bends through seven walkable architectural miniatures.
for (const side of []) curve(root, "thin brass edge of Jane's route",
  [[side * 1.4, .045, 13], [side * 1.28, .045, 8],
    [side * 1.57, .045, 3], [side * 1.22, .045, -2],
    [side * 1.5, .045, -8], [side * 1.15, .045, -13]],
  .025, M.gold, 72);
for (let z = -12; z <= 12; z += 2.6) {
  beam(root, "fine cut in stone pavement", [-1.34, .05, z],
    [1.34, .001, z + .07], .002, .002, M.limestone, 5);
}
function archedDoor(parent, x, z, y = 1.1, w = 1.55, h = 2.4, mat = M.ink) {
  box(parent, "deep doorway recess", x, y, z, w, h - .4, .12, mat, true);
  curve(parent, "formed lintel arch", [[x-w/2, h-.05, z+.1],
    [x-w*.3, h+.2, z+.1], [x, h+.35, z+.1],
    [x+w*.3, h+.2, z+.1], [x+w/2, h-.05, z+.1]], .085, M.limestone, 24);
}
function plaque(text, x, z, side) {
  const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 96;
  const c = canvas.getContext("2d");
  c.fillStyle = "#eee0c9"; c.fillRect(0, 0, 640, 96);
  c.strokeStyle = "#aa855e"; c.lineWidth = 5; c.strokeRect(4, 4, 632, 88);
  c.fillStyle = "#303949"; c.textAlign = "center";
  c.font = "600 37px Georgia, serif"; c.fillText(text, 320, 61);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const near = text === "Pullman";
  const px = near ? -2.35 : side * 2.95;
  const pz = near ? z + 1.15 : z + .48;
  const face = add(root, `route label ${text}`,
    new THREE.PlaneGeometry(1.05, .175), material,
    px, .51, pz);
  // Face both a visitor advancing along the route and one looking into the
  // stop. A near-forward plane vanished edge-on beside its new side facade.
  face.rotation.y = side < 0 ? .65 : -.65;
  box(root, "slim label stand", px, .25, pz - .01,
    .025, .48, .025, M.bronze);
}
function monument(name, z, side, material = M.brick, inset = 0, width = 3.7) {
  const x = side * (4.25 - inset);
  const base = box(root, `solid ${name} sculpted foundation`, x, .18, z,
    width, .36, 3.2, material, true);
  base.userData.solidFootprint = true;
  return x;
}
function pathFacingFacade(name, x, z, side, bodyWidth, treatment) {
  // A stop must explain itself from the promenade. The original miniature
  // fronts face the entry camera; without a second carved side the walker
  // sees only blank masonry after reaching the building.
  const facade = new THREE.Group();
  facade.name = `${name} path-facing dimensional facade`;
  facade.position.set(x - side * (bodyWidth / 2 + .018), 0, z);
  facade.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  root.add(facade);
  const face = (name, u, y, w, h, material, depth = .04) =>
    box(facade, name, u, y, .055, w, h, depth, material);
  const arch = (name, u, top, radius, material = M.limestone) =>
    curve(facade, name, [[u - radius, top - .18, .09],
      [u - radius * .72, top + .08, .09], [u, top + .19, .09],
      [u + radius * .72, top + .08, .09],
      [u + radius, top - .18, .09]], .027, material, 16);
  if (treatment === "pullman") {
    for (const u of [-.46, .46]) {
      face("deep industrial window on Pullman street side",u,1.45,.29,1.2,M.night);
      arch("formed brick window head",u,2.11,.18,M.limestone);
      face("projecting cut-stone sill",u,.83,.4,.055,M.limestone,.11);
    }
    for (const u of [-.7,0,.7]) face("raised brick pilaster",u,1.36,.075,2.3,M.warmBrick,.13);
    face("stone belt course under Pullman's tower",0,2.55,1.57,.1,M.limestone,.13);
  } else if (treatment === "avalon") {
    face("shadowed Avalon side arcade",0,1.53,.81,1.58,M.night);
    for(const u of [-.47,0,.47]) {
      arch("Moorish Revival horseshoe on the path side",u,2.22,.22,M.limestone);
      beam(facade,"slim arcade column",[u-.21,.52,.1],[u-.21,2.01,.1],.032,.032,M.gold);
    }
    face("receding gilt theater frieze",0,2.7,1.55,.11,M.gold,.13);
  } else if (treatment === "bank") {
    face("deep bank-side entry",0,1.34,.45,1.6,M.night);
    for(const u of [-.52,.52]) {
      beam(facade,"fluted arts-bank street column",[u,.38,.11],[u,2.61,.11],.085,.08,M.cream,12);
      face("carved capital facing the promenade",u,2.67,.25,.12,M.arch,.16);
    }
    face("projecting bank entablature facing the route",0,2.8,1.46,.14,M.arch,.18);
    const roof=new THREE.Shape();
    roof.moveTo(-.74,0);roof.lineTo(0,.38);roof.lineTo(.74,0);roof.closePath();
    add(facade,"formed bank pediment readable from the path",
      new THREE.ExtrudeGeometry(roof,{depth:.1,bevelEnabled:true,
        bevelThickness:.015,bevelSize:.012,bevelSegments:2}),M.limestone,
      0,2.91,.015);
  } else if (treatment === "bridge") {
    face("deep former congregation doorway",0,1.13,.46,1.38,M.night);
    arch("carved community doorway arch",0,1.86,.28,M.limestone);
    for(const u of [-.49,.49]) {
      face("colored meeting-window set into masonry",u,1.72,.25,1.06,
        u<0?M.glass:M.gold);
      arch("high former-congregation window crown",u,2.32,.18,M.limestone);
      for(const edge of [-1,1])face("recessed community window stone jamb",u+edge*.144,1.72,.038,1.14,M.limestone,.105);
      face("deep community window sill",u,1.17,.35,.065,M.limestone,.15);
      face("bronze meeting-window mullion",u,1.72,.015,1.03,M.bronze,.07);
      face("bronze meeting-window transom",u,1.73,.25,.016,M.bronze,.07);
    }
  } else if (treatment === "school") {
    for(const u of [-.48,0,.48]) {
      face("tall schoolhouse window on route side",u,1.65,.27,1.06,M.night);
      arch("molded school window lintel",u,2.3,.18,M.limestone);
      face("stone sill below schoolhouse window",u,1.07,.32,.045,M.cream,.1);
    }
    face("projecting school cornice facing promenade",0,2.99,1.56,.14,M.limestone,.15);
  }
}
// 1. Pullman's red-brick clock tower, neighborhood and labor story.
{
  const z = 7.05, x = monument("Pullman clock tower", z, -1, M.brick, .9, 2.9);
  box(root, "solid Pullman administration facade", x, 1.42, z,
    3.0, 2.25, 1.45, M.brick, true);
  box(root, "clock tower shaft", x, 3.34, z, .96, 2.25, 1.02, M.warmBrick, true);
  box(root, "stepped clock tower parapet", x, 4.65, z, 1.25, .28, 1.3, M.limestone);
  add(root, "round clock face", new THREE.CylinderGeometry(.29, .29, .03, 16),
    M.cream, x, 3.8, z + .54).rotation.x = Math.PI / 2;
  beam(root, "clock hand", [x, 3.8, z+.57], [x+.14, 3.94, z+.57], .012, .012, M.ink);
  for (const dx of [-1.02, 1.02]) {
    box(root, "Pullman tall window", x+dx, 1.65, z+.76, .37, .92, .04, M.night);
    curve(root, "arched Pullman window crown", [[x+dx-.23, 2.14, z+.8],
      [x+dx, 2.4, z+.8], [x+dx+.23, 2.14, z+.8]], .03, M.limestone);
  }
  pathFacingFacade("Pullman",x,z,-1,3.0,"pullman");
  plaque("Pullman", x, z, -1);
}
// 2. Avalon Regal: a minaret and an atmospheric star ceiling.
{
  const z = 5.8, x = monument("Avalon Regal Theater", z, 1, M.night);
  box(root, "solid layered theater facade", x, 1.48, z,
    3.2, 2.55, 1.6, M.rose, true);
  archedDoor(root, x, z+.87, 1.07, 1.38, 2.3, M.night);
  for(const dx of [-1.02,0,1.02]) {
    curve(root,"deep horseshoe arcade on Avalon Regal facade",
      [[x+dx-.33,.65,z+.84],[x+dx-.34,1.5,z+.84],
        [x+dx-.25,2.1,z+.84],[x+dx,2.29,z+.84],
        [x+dx+.25,2.1,z+.84],[x+dx+.34,1.5,z+.84],
        [x+dx+.33,.65,z+.84]],.052,M.limestone,28);
    if(dx!==0) {
      box(root,"recessed Avalon side arcade window",
        x+dx,1.39,z+.847,.36,.92,.035,M.night);
      for(let bar=0;bar<3;bar++) beam(root,"fine theater-window tracery",
        [x+dx-.15+bar*.15,.94,z+.875],
        [x+dx-.15+bar*.15,1.84,z+.875],.013,.011,M.gold);
    }
  }
  for(const yy of [2.52,2.69]) curve(root,"stepped gilded theater cornice",
    [[x-1.64,yy,z+.89],[x,yy+.025,z+.89],
      [x+1.64,yy,z+.89]],.025,yy>2.6?M.gold:M.limestone,18);
  const mx=x+1.25,mz=z-.25;
  loft(root, "ornate minaret silhouette", [[.38,.34,.34,mx,mz],
    [3.1,.26,.26,mx,mz],[4.25,.2,.2,mx,mz],
    [4.47,.29,.29,mx,mz],[4.64,.2,.2,mx,mz]],M.limestone,12,true);
  for(const yy of [2.97,4.24,4.49]) {
    const ring=[];
    for(let i=0;i<=20;i++) {
      const a=i*Math.PI/10;
      ring.push([mx+Math.sin(a)*.29,yy,mz+Math.cos(a)*.29]);
    }
    curve(root,"carved horizontal minaret gallery",ring,.024,M.gold,24);
  }
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    add(root,"arched opening in minaret lookout",
      new THREE.PlaneGeometry(.13,.22),M.night,
      mx+Math.sin(a)*.203,4.48,mz+Math.cos(a)*.203)
      .rotation.y=a;
  }
  add(root,"formed Avalon minaret crown",
    new THREE.ConeGeometry(.3,.45,12),M.gold,mx,4.86,mz);
  for (let i = 0; i < 11; i++) {
    const sx = x - 1.35 + random() * 2.7, sz = z - .5 + random() * 1.2;
    add(root, "small theater sky star", new THREE.OctahedronGeometry(.035, 0),
      M.gold, sx, 2.87, sz);
  }
  pathFacingFacade("Avalon Regal",x,z,1,3.2,"avalon");
  plaque("Avalon Regal", x, z, 1);
}
// 3. The revived Stony Island Arts Bank, a civic archive of art.
{
  const z = 2.1, x = monument("Stony Island Arts Bank", z, -1, M.limestone);
  box(root, "solid neoclassical arts bank body", x, 1.45, z,
    3.35, 2.4, 1.6, M.limestone, true);
  for (const dx of [-1.18, -.41, .41, 1.18]) {
    beam(root, "arts bank broad stone column", [x+dx, .35, z+.88],
      [x+dx, 2.85, z+.88], .115, .115, M.cream);
    box(root, "column capital", x+dx, 2.86, z+.9, .33, .16, .29, M.arch);
    for(const yy of [.48,.59,2.64,2.74]) {
      const band=add(root,"fine ring carved into arts bank column",
        new THREE.TorusGeometry(.124,.012,5,12),M.limestone,
        x+dx,yy,z+.88);
      band.rotation.x=Math.PI/2;
    }
  }
  box(root,"projecting arts bank entablature",x,2.98,z+.19,
    3.82,.2,1.95,M.arch);
  const pediment=new THREE.Shape();
  pediment.moveTo(-1.85,0);
  pediment.lineTo(0,.57);
  pediment.lineTo(1.85,0);
  pediment.closePath();
  add(root,"shaped triangular stone arts bank pediment",
    new THREE.ExtrudeGeometry(pediment,{depth:.16,bevelEnabled:true,
      bevelThickness:.035,bevelSize:.025,bevelSegments:2}),
    M.limestone,x,3.08,z+.9);
  curve(root,"carved pediment cornice",[[x-1.84,3.08,z+1.1],
    [x,3.65,z+1.1],[x+1.84,3.08,z+1.1]],.035,M.cream,22);
  add(root,"small circular arts-bank pediment relief",
    new THREE.TorusGeometry(.13,.023,7,20),M.bronze,x,3.28,z+1.105);
  box(root,"deep central arts bank entrance",x,1.23,z+.825,
    .67,1.65,.04,M.ink);
  for(const side of [-1,1]) {
    box(root,"tall inset arts bank window",x+side*.78,1.43,z+.824,
      .32,1.16,.04,M.night);
    for(const yy of [1.0,1.4,1.8])
      beam(root,"bronze arts bank window grille",
        [x+side*.78-.16,yy,z+.85],[x+side*.78+.16,yy,z+.85],
        .012,.012,M.bronze,6);
  }
  for(let step=0;step<3;step++)
    box(root,"broad worn bank entry step",x,.13+step*.08,
      z+1.05+step*.25,1.1-step*.08,.12, .29,M.arch,true);
  pathFacingFacade("Stony Island Arts Bank",x,z,-1,3.35,"bank");
  plaque("Stony Island Arts Bank", x, z, -1);
}
// 4. Narrow Bridge is a century-old community gathering space.
{
  const z = -1.65, x = monument("Narrow Bridge Arts Club", z, 1, M.brick);
  box(root, "solid former congregation building", x, 1.53, z,
    3.25, 2.55, 1.65, M.brick, true);
  archedDoor(root, x, z+.91, 1.15, 1.4, 2.45, M.night);
  for (const dx of [-1.14, 1.14]) {
    add(root, "colored meeting-window glass", new THREE.PlaneGeometry(.4, 1.28),
      new THREE.MeshBasicMaterial({ color: dx<0?C.glass:C.gold, side:THREE.DoubleSide }),
      x+dx, 1.91, z+.85);
    curve(root, "tall meeting-window tracery", [[x+dx-.22, 2.55, z+.88],
      [x+dx, 2.81, z+.88], [x+dx+.22, 2.55, z+.88]], .035, M.limestone);
  }
  pathFacingFacade("Narrow Bridge",x,z,1,3.25,"bridge");
  plaque("Narrow Bridge", x, z, 1);
}
// 5. Palmisano, a quarry transformed into water and meadow.
{
  const z = -5.4, x = monument("Palmisano quarry park", z, -1, M.mint);
  for (let i = 0; i < 4; i++) box(root, "stepped former quarry ledge",
    x - .6 + i*.38, .45+i*.34, z-.35,
    2.3-i*.36, .25, 1.9-i*.2, i%2?M.limestone:M.arch, true);
  const pond = add(root, "small blue quarry pond", new THREE.CircleGeometry(.75, 22),
    M.glass, x+.84, .405, z+.86); pond.rotation.x = -Math.PI/2;
  for (let i=0;i<13;i++) {
    const px = x-1.5+random()*3, pz=z-.9+random()*1.8;
    curve(root, "park meadow grass", [[px,.28,pz],[px+.05,.66+random()*.3,pz]],
      .018, i%3?M.mint:M.gold, 7);
  }
  plaque("Palmisano Park", x, z, -1);
}
// 6. Saint Ignatius, an echo of masonry, arches and learning.
{
  const z = -9.15, x = monument("Saint Ignatius College Prep", z, 1, M.brick);
  box(root, "solid broad school masonry", x, 1.55, z, 3.35, 2.63, 1.55, M.brick, true);
  box(root, "layered school cornice", x, 3.02, z, 3.65, .22, 1.8, M.limestone);
  for (const dx of [-1.0, 0, 1.0]) {
    box(root, "recessed vertical school window", x+dx, 1.88, z+.81,
      .43, 1.08, .08, M.night);
    curve(root, "light arched school window", [[x+dx-.25,2.45,z+.85],
      [x+dx,2.76,z+.85],[x+dx+.25,2.45,z+.85]],.04,M.limestone);
  }
  pathFacingFacade("Saint Ignatius",x,z,1,3.35,"school");
  plaque("Saint Ignatius", x, z, 1);
}
// 7. A quiet temple gate concludes the otherwise bustling city ribbon.
{
  const z = -12.05, x = monument("Zen Buddhist Temple", z, -1, M.mint);
  for (const dx of [-1.17, 1.17]) beam(root, "timber temple gate post",
    [x+dx,.36,z+.3],[x+dx,3.4,z+.3],.11,.11,M.bronze);
  box(root, "tiered temple gate roof", x, 3.5, z+.3, 3.1, .19, 1.4, M.ink);
  box(root, "upper timber eave", x, 3.82, z+.3, 2.48, .11, 1.03, M.bronze);
  curve(root, "quiet gate lintel rise", [[x-1.65,3.58,z+.45],
    [x,3.98,z+.45],[x+1.65,3.58,z+.45]],.055,M.gold);
  for (let i=0;i<17;i++) petal(root,"single quiet courtyard leaf",
    x-1.2+random()*2.4,.6+random()*2.9,z-.5+random()*1.5,
    .2,M.mint,random()*6.28);
  plaque("Zen Buddhist Temple", x, z, -1);
}

// These are small, walk-around architectural worlds. Preserve the street
// elevations while carrying each building back into a real volume.
const deeperBodies = new Map([
  ['solid Pullman administration facade',[1.45,2.90]],
  ['solid layered theater facade',[1.60,3.05]],
  ['solid neoclassical arts bank body',[1.60,2.95]],
  ['solid former congregation building',[1.65,3.05]],
  ['solid broad school masonry',[1.55,2.95]],
]);
root.traverse(o=>{
  const sizes=deeperBodies.get(o.name);if(!sizes)return;
  o.scale.z*=sizes[1]/sizes[0];o.position.z-=(sizes[1]-sizes[0])/2;
});
function pitchedRoof(name,x,z,w,d,y,rise,material){
  const profile=new THREE.Shape();profile.moveTo(-w/2,0);
  profile.lineTo(0,rise);profile.lineTo(w/2,0);profile.closePath();
  return add(root,name,new THREE.ExtrudeGeometry(profile,{depth:d,
    bevelEnabled:false}),material,x,y,z-d/2);
}
pitchedRoof('joined pitched roof over Pullman administration wings',-3.35,6.34,3.12,2.95,2.55,.30,M.night);
pitchedRoof('deep auditorium roof behind the Avalon minaret',4.25,5.10,3.35,3.08,2.82,.39,M.rose);
box(root,'whole bank roof behind its carved pediment',-4.25,3.02,1.40,3.55,.17,3.0,M.arch);
pitchedRoof('continuous roof over the former congregation hall',4.25,-2.35,3.4,3.07,2.83,.67,M.night);
pitchedRoof('deep red schoolhouse roof',4.25,-9.85,3.53,3.0,3.12,.53,M.brick);
// Return windows and courses articulate the depth from either direction.
for(const [x,z,h,half]of[[-3.35,6.34,2.3,1.5],[4.25,5.10,2.55,1.6],[-4.25,1.4,2.4,1.675],[4.25,-2.35,2.55,1.625],[4.25,-9.85,2.63,1.675]]){
  for(const side of[-1,1])for(const dz of[-.92,0,.92]){
    box(root,'recessed window in a complete building return',x+side*(half+.014),1.62,z+dz,.035,.87,.31,M.night);
    box(root,'projecting stone sill on a building return',x+side*(half+.05),1.15,z+dz,.12,.055,.40,M.limestone);
  }
  box(root,'continuous cornice over a deep architectural volume',x,h+.29,z,half*2+.17,.10,3.05,M.limestone);
}
// The Lakeview temple is in a former lodge hall. A quiet masonry hall and
// planted forecourt replace the generic floating leaves and pagoda-like gate.
root.traverse(o=>{if(/temple gate|upper timber eave|quiet gate lintel|quiet courtyard leaf/.test(o.name))o.visible=false;});
const tx=-4.25,tz=-12.3;
box(root,'solid masonry hall at the quiet end of the route',tx,1.52,tz-.25,3.1,2.72,2.85,M.warmBrick,true);
box(root,'restrained lodge-hall stone parapet',tx,2.96,tz-.25,3.28,.18,2.98,M.limestone);
box(root,'temple hall recessed timber entry',tx,.99,tz+1.19,.62,1.42,.06,M.bronze);
for(const dx of[-1,0,1]){
  box(root,'tall quiet temple-hall window',tx+dx,2.21,tz+1.195,.42,.63,.045,M.paleGlass);
  box(root,'temple-hall stone window surround',tx+dx,2.58,tz+1.21,.55,.07,.12,M.limestone);
}
for(const dx of[-1.33,1.33])loft(root,'rooted planting in the temple forecourt',[[.36,.18,.18,tx+dx,tz+1.31],[.50,.21,.20,tx+dx,tz+1.31],[.85,.14,.12,tx+dx,tz+1.31],[1.10,.04,.03,tx+dx,tz+1.31]],M.mint,16);

// Jane and Oleg become fellow travelers, not invented actors at any stop.
person("Jane walking the chosen route", 1.1, -3.2, 1.68,
  { skin:M.skin, hair:M.hair, outfit:M.rose, pants:M.ink, bun:true, yaw:.2 });
person("Oleg walking the chosen route", 1.65, -4.5, 1.78,
  { skin:M.skin, hair:M.hair, outfit:M.fabric, pants:M.ink,
    longHair:true, glasses:true, beard:true, yaw:.15 });
// The connective rhythm is rooted in the promenade. The earlier hanging map
// panes and disconnected polygon fragments turned the open sky into stage
// rigging, so ornamental lamps and paving mark the route instead.
for(const [n,z] of [7.68,3.96,.22,-3.54,-7.28,-10.62].entries()) {
  const side=n%2===0?-1:1,x=side*3.03;
  const post=loft(root,"solid fluted route lantern post",
    [[.08,.13,.13,x,z],[.24,.09,.09,x,z],
      [2.85,.055,.055,x,z],[3.04,.09,.09,x,z]],M.ink,10,true);
  post.userData.solidFootprint=true;
  for(let f=0;f<4;f++) {
    const a=f*Math.PI/2;
    curve(root,"carved lamppost flute",[[x+Math.cos(a)*.072,.27,z+Math.sin(a)*.072],
      [x+Math.cos(a)*.054,2.8,z+Math.sin(a)*.054]],.01,M.bronze,9);
  }
  box(root,"square metal foot of route lantern",x,3.07,z,
    .37,.06,.37,M.bronze);
  const pane=add(root,"warm frosted glass enclosed by lantern frame",
    new THREE.BoxGeometry(.26,.3,.26),
    new THREE.MeshBasicMaterial({color:0xf4d9af,transparent:true,
      opacity:.67,side:THREE.DoubleSide}),x,3.25,z);
  pane.userData.solidFootprint=false;
  for(const dx of [-.14,.14]) for(const dz of [-.14,.14])
    beam(root,"four slender route-lantern corner rails",
      [x+dx,3.09,z+dz],[x+dx,3.42,z+dz],.015,.013,M.ink);
  box(root,"formed lantern cap cornice",x,3.44,z,.39,.055,.39,M.bronze);
  add(root,"pitched lantern hood",new THREE.ConeGeometry(.29,.18,4),
    M.ink,x,3.54,z).rotation.y=Math.PI/4;
  add(root,"contained amber light within route lantern",
    new THREE.SphereGeometry(.095,10,8),
    new THREE.MeshBasicMaterial({color:0xf6ddb0}),x,3.28,z);
}
// Distinct roof silhouettes finish the far view without closing the sky.
const cityWindowShape=new THREE.Shape();
cityWindowShape.moveTo(-.055,-.08);cityWindowShape.lineTo(.055,-.08);
cityWindowShape.lineTo(.055,.055);
cityWindowShape.quadraticCurveTo(0,.12,-.055,.055);
cityWindowShape.closePath();
const cityWindow=new THREE.ExtrudeGeometry(cityWindowShape,
  {depth:.012,bevelEnabled:false,curveSegments:5});
for(let i=0;i<12;i++) {
  const x=-6.05+i*1.08,h=1.8+(i*7%5)*.43,w=.9;
  const outline=new THREE.Shape();
  outline.moveTo(-w/2,0);outline.lineTo(w/2,0);
  if(i%3===0) {
    outline.lineTo(w/2,h-.25);outline.lineTo(w*.27,h-.25);
    outline.lineTo(w*.27,h);outline.lineTo(-w*.27,h);
    outline.lineTo(-w*.27,h-.25);outline.lineTo(-w/2,h-.25);
  } else if(i%3===1) {
    outline.lineTo(w/2,h-.16);outline.lineTo(0,h);
    outline.lineTo(-w/2,h-.16);
  } else {
    outline.lineTo(w/2,h-.18);
    outline.quadraticCurveTo(0,h+.08,-w/2,h-.18);
  }
  outline.closePath();
  const silhouette=add(root,"shaped distant city building beyond Jane's route",
    new THREE.ExtrudeGeometry(outline,{depth:.16,bevelEnabled:false,
      curveSegments:6}),i%3?M.arch:M.night,x,0,-13.74);
  silhouette.userData.solidFootprint=true;
  for(const yy of [.45,.94,1.43]) for(const offset of [-.2,.2]) {
    if(yy>h-.22) continue;
    add(root,"arched window on distant street building",cityWindow,M.paleGlass,
      x+offset,yy,-13.561);
  }
}

window.__authorRoom = () => exportRoom();
