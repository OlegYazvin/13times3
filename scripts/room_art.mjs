import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { addOlegPortrait, addJanePortrait, addGPortrait,
  addZephrinePortrait, finishOlegPortraits } from "./oleg_portrait.mjs";
import { addOpenSky } from "./open_sky.mjs";
import { addContactShadow } from "./stage_shadows.mjs";
import { sculptSleevedArm } from "./sculpted_arm.mjs";
import { paintedFabric } from "./painted_fabric.mjs";
import { loadRiggedOlegBase, makeRiggedOleg } from "./rigged_oleg.mjs";
import { loadRiggedJaneBase, makeRiggedJane } from "./rigged_jane.mjs";

// Shared sculpting tools for independent storybook worlds. Each room supplies
// its own palette, architecture, composition and narrative details.
export function createRoomArt({ index, title, width, height, depth, colors, seed = 1 }) {
  const root = new THREE.Group(); root.name = title;
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d"), pixels = context.createImageData(64, 64);
  let state = seed >>> 0;
  const random = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = 226 + Math.floor(random() * 26);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const grain = new THREE.CanvasTexture(canvas); grain.colorSpace = THREE.SRGBColorSpace;
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color, map: grain, roughness: .93, metalness: 0, side: THREE.DoubleSide, ...extra,
  });
  const M = Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, material(value)]));
  const generic = new Map();
  const olegPeople = [];
  const janePeople = [];
  const asMaterial = (value) => {
    if (value?.isMaterial) return value;
    if (typeof value === "string" && M[value]) return M[value];
    const color = typeof value === "number" ? value : 0xffffff;
    if (!generic.has(color)) generic.set(color, material(color));
    return generic.get(color);
  };
  function add(parent, name, geometry, mat, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, asMaterial(mat));
    mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function box(parent, name, x, y, z, w, h, d, mat, solid = false) {
    const mesh = add(parent, name, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    if (solid) mesh.userData.solidFootprint = true;
    return mesh;
  }
  function beam(parent, name, a, b, r1, r2, mat, edges = 9) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const axis = end.clone().sub(start);
    const mesh = add(parent, name,
      new THREE.CylinderGeometry(r2, r1, axis.length(), edges), mat,
      ...start.clone().add(end).multiplyScalar(.5).toArray());
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    return mesh;
  }
  function curve(parent, name, points, radius, mat, segments = 22) {
    const sides = radius >= .045 ? 8 : 4;
    return add(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
      points.map(point => new THREE.Vector3(...point))), segments, radius, sides, false), mat);
  }
  function loft(parent, name, rings, mat, sides = 12, solid = false) {
    const vertices = [], uv = [], indices = [];
    for (let row = 0; row < rings.length; row++) for (let side = 0; side < sides; side++) {
      const [y, rx, rz, cx = 0, cz = 0] = rings[row];
      const angle = side * Math.PI * 2 / sides;
      vertices.push(cx + Math.cos(angle) * rx * (1 + .014 * Math.cos(angle * 7 + row)),
        y, cz + Math.sin(angle) * rz);
      uv.push(side / sides, row / (rings.length - 1));
    }
    for (let row = 0; row < rings.length - 1; row++) for (let side = 0; side < sides; side++) {
      const a = row * sides + side, b = row * sides + (side + 1) % sides;
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
    for (let side = 1; side < sides - 1; side++) {
      indices.push(0, side + 1, side);
      const top = (rings.length - 1) * sides;
      indices.push(top, top + side, top + side + 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = add(parent, name, geometry, mat);
    if (solid) mesh.userData.solidFootprint = true;
    return mesh;
  }
  function petal(parent, name, x, y, z, scale, mat, yaw = 0) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.bezierCurveTo(-.44, .23, -.5, .76, 0, 1);
    shape.bezierCurveTo(.5, .76, .44, .23, 0, 0);
    const mesh = add(parent, name, new THREE.ExtrudeGeometry(shape,
      { depth: .025, bevelEnabled: false, curveSegments: 3 }), mat, x, y, z);
    mesh.scale.setScalar(scale); mesh.rotation.set(.28, yaw, .17);
    mesh.userData.batchPetal = true;
    return mesh;
  }
  function wrapSky(color = colors.sky, openAir = false) {
    if (openAir) {
      addOpenSky(root, color, colors.ground || color);
      return;
    }
    const sky = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    function skyPanel(span, name, x, y, z, turn = 0) {
      const geometry = new THREE.PlaneGeometry(span, height);
      const mesh = add(root, name, geometry, sky, x, y, z);
      mesh.rotation.y = turn;
    }
    for (const x of [-width / 2 + .01, width / 2 - .01]) {
      skyPanel(depth, "world-wrapping side atmosphere", x, height / 2, 0, Math.PI / 2);
    }
    skyPanel(width, "far atmospheric wall", 0, height / 2, -depth / 2 + .01);
    const top = new THREE.PlaneGeometry(width, depth); top.rotateX(Math.PI / 2);
    add(root, "world-wrapping sky or ceiling", top, sky, 0, height - .01, 0);
  }
  function ground(color = colors.ground, colorAt = null) {
    const plane = new THREE.PlaneGeometry(width, depth, 34, 42);
    plane.rotateX(-Math.PI / 2);
    const shades = [];
    for (let i = 0; i < plane.attributes.position.count; i++) {
      const x = plane.attributes.position.getX(i), z = plane.attributes.position.getZ(i);
      plane.attributes.position.setY(i, .012 * Math.sin(x * 2.8 + z * 1.9));
      const shade = colorAt ? colorAt(x, z) : color;
      const pigment = new THREE.Color(shade);
      pigment.offsetHSL(0, 0, (random() - .5) * .043);
      shades.push(pigment.r, pigment.g, pigment.b);
    }
    plane.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    plane.computeVertexNormals();
    return add(root, "walkable painted ground", plane,
      material(0xffffff, { vertexColors: true }));
  }
  function sculptedChildSkirt(parent, hem, waist, cloth, trim) {
    const sides=28, rows=9, points=[],uv=[],indices=[];
    const foldCount=9;
    for(let row=0;row<=rows;row++) {
      const t=row/rows;
      const y=THREE.MathUtils.lerp(hem,waist,t);
      const base=THREE.MathUtils.lerp(.294,.177,t);
      for(let side=0;side<sides;side++) {
        const a=side*Math.PI*2/sides;
        const fold=.021*Math.sin(a*foldCount+.3*t)*(1-t*.78);
        const radius=base+fold;
        const flutedHem=row===0?.014*Math.sin(a*foldCount):0;
        points.push(Math.cos(a)*radius,y+flutedHem,
          Math.sin(a)*radius*.83);
        uv.push(side/sides,t);
        if(row<rows) {
          const n=row*sides+side,b=row*sides+(side+1)%sides;
          indices.push(n,b,n+sides,b,b+sides,n+sides);
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    add(parent,"fitted child skirt with formed cloth pleats and a fluted hem",
      geometry,cloth);
    const edge=[];
    for(let i=0;i<=sides;i++) {
      const a=i*Math.PI*2/sides;
      const radius=.294+.021*Math.sin(a*foldCount);
      edge.push([Math.cos(a)*radius,
        hem+.014*Math.sin(a*foldCount)+.006,
        Math.sin(a)*radius*.83]);
    }
    curve(parent,"stitched curved edge of the child's skirt",edge,
      .0065,trim,36);
  }
  function person(name, x, z, stature, options = {}) {
    const group = new THREE.Group(); group.name = `solid sculpted figure of ${name}`;
    group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
    addContactShadow(group, stature);
    const skin = asMaterial(options.skin || "skin"), hair = asMaterial(options.hair || "hair");
    const outfit = paintedFabric(asMaterial(options.outfit || "fabric"));
    const pants = paintedFabric(asMaterial(options.pants || "ink"));
    const trim = options.trim ? asMaterial(options.trim) :
      asMaterial(outfit.color.clone().offsetHSL(0, -.035, .09).getHex());
    // Adult legs carry roughly half the height. The earlier short legs and
    // oversized footwear made the recurring family look like toy figurines.
    const childFigure = stature <= 1.45;
    const leg = stature * (childFigure ? .44 : .49);
    const oleg = name.startsWith("Oleg");
    const jane = name.startsWith("Jane");
    const g = name.startsWith("G ");
    const zephrine = name.startsWith("Zephrine");
    const painted = oleg || jane || g || zephrine;
    if (oleg) olegPeople.push({ group, stature, options });
    if (jane && !options.dress) janePeople.push({ group, stature, options });
    for (const side of [-1, 1]) {
      loft(group, "tailored leg with ankle, knee and thigh contour",
        [[.07, .095, .105, side * .12], [.19, .11, .11, side * .12],
          [leg * .48, .118, .115, side * .125],
          [leg * .67, .109, .115, side * .12],
          [leg, .143, .135, side * .12],
          [leg + .08, .14, .12, side * .12]], pants, 12);
      loft(group, "formed walking shoe with distinct heel, instep and toe",
        [[.012, .088, .095, side * .12, .055],
          [.038, .104, .145, side * .12, .055],
          [.08, .115, .155, side * .12, .045],
          [.135, .09, .105, side * .12, -.005],
          [.16, .06, .073, side * .12, -.03]], options.shoes || "ink", 14);
      curve(group, "trouser crease", [[side * .12, .23, .1],
        [side * .13, leg * .56, .113], [side * .11, leg, .105]],
      .006, options.pants || "ink", 12);
      curve(group, "hem folded over walking shoe",
        [[side * .04, .18, .125], [side * .12, .17, .14],
          [side * .21, .18, .115]], .007, trim, 8);
    }
    const garmentRings = childFigure ?
      [[leg, .18, .135], [leg + .045, .2, .15],
        [stature - .51, .21, .155], [stature - .39, .16, .12]] :
      [[leg, .225, .16], [leg + .10, .245, .175],
        [leg + .18, .23, .165], [stature - .55, .275, .18],
        [stature - .41, .2, .13]];
    loft(group, "tailored solid clothing with waist and shoulder contours", garmentRings,
      outfit, 16, true);
    loft(group, "modeled neck above folded collar",
      [[stature - .435, .074, .071], [stature - .34, .069, .066],
        [stature - .31, .063, .06]], skin, 12);
    if (options.dress) sculptedChildSkirt(group,leg-.21,
      leg+.16,paintedFabric(asMaterial(options.skirt || outfit)),trim);
    for (const side of [-1, 1]) {
      const hand = options.hands?.[side] || [side * .31, stature - .95, .14];
      const elbow = [side * .315, (stature - .68 + hand[1]) / 2, hand[2] * .55];
      sculptSleevedArm(add, group, {
        shoulder: [side * (childFigure ? .17 : .218), stature - .43, .005], elbow, hand,
        outfit, skin, trim, size: Math.min(1, stature / 1.7),
      });
    }
    const headStart = group.children.length;
    const face = stature - .035;
    loft(group, "carved cheek and jaw portrait", [[face - .41, .06, .058],
      [face - .32, .14, .12], [face - .15, .17, .145],
      [face + .03, .15, .13], [face + .14, .02, .02]], skin, 14);
    if (oleg) addOlegPortrait(group, face,
      [[-.41, .06, .058], [-.32, .14, .12], [-.15, .17, .145],
        [.03, .15, .13], [.11, .07, .07]], skin);
    if (jane) addJanePortrait(group, face,
      [[-.41, .06, .058], [-.32, .14, .12], [-.15, .17, .145],
        [.03, .15, .13], [.11, .07, .07]], skin);
    if (g) addGPortrait(group, face,
      [[-.41, .06, .058], [-.32, .14, .12], [-.15, .17, .145],
        [.03, .15, .13], [.11, .07, .07]], skin);
    if (zephrine) addZephrinePortrait(group, face,
      [[-.41, .06, .058], [-.32, .14, .12], [-.15, .17, .145],
        [.03, .15, .13], [.11, .07, .07]], skin);
    for (const side of [-1, 1]) loft(group,
      "modeled ear and earlobe in profile",
      [[face - .28, .025, .027, side * .17, -.008],
        [face - .19, .038, .039, side * .17, -.008],
        [face - .09, .022, .023, side * .165, -.012]], skin, 10);
    for (const side of [-1, 1]) {
      if (!painted) {
        add(group, "small painted eye", new THREE.SphereGeometry(.021, 7, 6),
          options.eyeWhite || "paper", side * .068, face - .15, .143);
        add(group, "dark iris", new THREE.SphereGeometry(.012, 7, 5),
          options.iris || "ink", side * .068, face - .15, .163);
        curve(group, "fine eyebrow", [[side * .027, face - .093, .15],
          [side * .071, face - .084, .157], [side * .111, face - .101, .14]],
          .008, hair);
      }
    }
    if (!painted) loft(group, "sculpted nose", [[face - .26, .016, .018, 0, .152],
      [face - .16, .025, .029, 0, .173],
      [face - .145, .008, .009, 0, .154]], skin, 8);
    if (!painted) curve(group, "gentle expression", [[-.047, face - .3, .119],
      [0, face - .315, .133], [.047, face - .3, .119]],
      .009, options.lips || "rose");
    if (!oleg) loft(group, "layered hair following the painted hairline",
      zephrine ? [[face + .015, .09, .08],
        [face + .08, .153, .13, 0, -.018],
        [face + .16, .125, .105, 0, -.03],
        [face + .195, .018, .018, 0, -.035]] :
        [[face + .035, .095, .08],
          [face + .11, .17, .14, 0, -.02],
          [face + .2, .13, .11, 0, -.03],
          [face + .25, .02, .02, 0, -.03]], hair, 18);
    if (options.bun) loft(group, "high tied hair", [[face + .18, .05, .04, 0, -.07],
      [face + .29, .13, .11, 0, -.07], [face + .4, .07, .06, 0, -.07],
      [face + .44, .01, .01, 0, -.07]], hair, 12);
    if (jane) for (const side of [-1, 1]) curve(group,
      "dark hair combed back toward Jane's bun",
      [[side * .08, face + .07, .12],
        [side * .155, face + .17, .08],
        [side * .07, face + .31, -.07]], .012, hair, 13);
    if ((options.curls || options.longHair) && !oleg) for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      curve(group, "individual waved hair strand", [[side * (.12 + i * .018),
        face + .08, -.035], [side * (.19 + i * .02), face - .14, -.025],
        [side * (.15 + i * .02), face - (options.longHair ? .5 : .3), .02]],
        .022 - i * .0025, hair, 15);
    }
    if (options.beard && !oleg) for (const side of [-1, 1]) curve(group, "short beard",
      [[side * .13, face - .27, .08], [side * .09, face - .36, .115],
        [0, face - .42, .1]], .028, hair);
    if (options.glasses && !oleg) for (const side of [-1, 1]) curve(group,
      "dark rectangular glasses", [[side * .015, face - .12, .18],
        [side * .12, face - .12, .17], [side * .12, face - .21, .16],
        [side * .015, face - .21, .18], [side * .015, face - .12, .18]],
      .01, options.glassesColor || "ink");
    // The original life-size portrait was stretched over a storybook head
    // almost half as tall as an adult torso. Scale the entire modeled head,
    // not just its texture, around the jaw so hair and glasses stay seated.
    if (painted) {
      const head = new THREE.Group();
      head.name = `proportioned sculpted ${name} head and painted likeness`;
      for (const child of group.children.slice(headStart)) head.add(child);
      const horizontal = oleg ? .86 : zephrine ? .9 : .85;
      const vertical = oleg ? .72 : zephrine ? .78 : .66;
      head.scale.set(horizontal, vertical, horizontal * .94);
      head.position.y = (stature - .445) * (1 - vertical);
      group.add(head);
    }
    if (childFigure) {
      // The child dress already has a formed waist and stitched fluted hem.
      // Adult-length loose chest and side lines become floating loops at this
      // scale, especially when the child is on Oleg's shoulders.
      curve(group,"short sewn collar on child clothing",
        [[-.1,stature-.405,.125],[0,stature-.435,.145],
          [.1,stature-.405,.125]],.0065,trim,12);
    } else {
      curve(group, "stitched neckline", [[-.14, stature - .42, .13],
        [0, stature - .48, .17], [.14, stature - .42, .13]],
        .012, trim);
      curve(group, "soft chest fold shaped by the garment",
        [[-.16, stature - .61, .166],
          [-.02, stature - .67, .183],
        [.17, stature - .63, .16]], .009, trim, 12);
      curve(group, "tailored waist seam and fabric drape",
        [[-.22, leg + .2, .155], [0, leg + .15, .2],
          [.22, leg + .22, .155]], .008,
        trim, 13);
      for (const side of [-1, 1]) curve(group, "tailored garment side seam",
        [[side * .23, leg + .04, .11], [side * .27, leg + .3, .15],
          [side * .22, stature - .48, .11]], .006,
        trim, 11);
    }
    return group;
  }
  async function exportRoom({ key = 0xffd9ae, fill = 0xa8d4dc,
    ambient = 1.6, keyPower = 2.1, batchStatic = false } = {}) {
    if (janePeople.length) {
      const template = await loadRiggedJaneBase();
      for (const { group, stature, options } of janePeople) {
        group.clear();
        addContactShadow(group, stature);
        group.add(makeRiggedJane(template, {
          height: stature, hands: options.hands,
          shirtColor: asMaterial(options.outfit || "fabric").color.getHex(),
          pantsColor: asMaterial(options.pants || "ink").color.getHex(),
        }));
      }
    }
    if (olegPeople.length) {
      const template = await loadRiggedOlegBase();
      for (const { group, stature, options } of olegPeople) {
        group.clear();
        addContactShadow(group, stature);
        group.add(makeRiggedOleg(template, {
          pose: "standing", height: stature, hands: options.hands,
          shirtColor: asMaterial(options.outfit || "fabric").color.getHex(),
          pantsColor: asMaterial(options.pants || "ink").color.getHex(),
        }));
      }
    }
    await finishOlegPortraits(root);
    root.updateMatrixWorld(true);
    const groups = new Map();
    root.traverse(object => {
      if (!object.userData.batchPetal) return;
      const parentGroups = groups.get(object.parent) || new Map();
      const list = parentGroups.get(object.material) || [];
      list.push(object); parentGroups.set(object.material, list);
      groups.set(object.parent, parentGroups);
    });
    for (const [parent, materials] of groups) for (const [mat, objects] of materials) {
      const geometry = mergeGeometries(objects.map(object =>
        object.geometry.clone().applyMatrix4(object.matrix)), false);
      if (!geometry) throw new Error("Could not merge room petals");
      for (const object of objects) parent.remove(object);
      add(parent, "batched sculpted foliage and paper details", geometry, mat);
    }
    if (batchStatic) {
      // Keep each animated fish as its own group while combining the many
      // curves, fins, and etched marks within it. Also combine non-colliding
      // architecture by material. This cuts draw calls on mobile without
      // flattening the room or combining its independent people and fish.
      const parents = [];
      root.traverse(object => { if (object.isGroup) parents.push(object); });
      for (const parent of parents) {
        const groups = new Map();
        for (const mesh of parent.children) {
          if (!mesh.isMesh || mesh.isSkinnedMesh || mesh.userData.solidFootprint ||
            mesh.name.includes("painted likeness")) continue;
          const attributes = Object.entries(mesh.geometry.attributes)
            .map(([name, attribute]) => `${name}:${attribute.itemSize}`).sort().join("|");
          const signature = `${mesh.material.uuid}|${mesh.geometry.index ? 1 : 0}|${attributes}`;
          const list = groups.get(signature) || [];
          list.push(mesh); groups.set(signature, list);
        }
        for (const meshes of groups.values()) {
          if (meshes.length < 2) continue;
          const geometry = mergeGeometries(meshes.map(mesh =>
            mesh.geometry.clone().applyMatrix4(mesh.matrix)), false);
          if (!geometry) continue;
          const name = `${meshes[0].name} — batched sculpted details`;
          const material = meshes[0].material;
          for (const mesh of meshes) parent.remove(mesh);
          add(parent, name, geometry, material);
        }
      }
      const fishMaterial = material(0xffffff, { vertexColors: true });
      for (const parent of parents) {
        if (typeof parent.userData.driftPhase !== "number" ||
          parent.userData.preserveMaterials) continue;
        const byTopology = new Map();
        for (const mesh of parent.children) {
          if (!mesh.isMesh || mesh.isSkinnedMesh || !mesh.material.color) continue;
          const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix);
          const count = geometry.attributes.position.count;
          const shade = mesh.material.color;
          const colors = new Float32Array(count * 3);
          const painted = geometry.attributes.color;
          for (let i = 0; i < count; i++) colors.set([
            shade.r * (painted ? painted.getX(i) : 1),
            shade.g * (painted ? painted.getY(i) : 1),
            shade.b * (painted ? painted.getZ(i) : 1),
          ], i * 3);
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          const signature = `${geometry.index ? 1 : 0}|${Object.keys(geometry.attributes).sort().join("|")}`;
          const list = byTopology.get(signature) || [];
          list.push({ mesh, geometry }); byTopology.set(signature, list);
        }
        for (const objects of byTopology.values()) {
          if (objects.length < 2) continue;
          const merged = mergeGeometries(objects.map(({ geometry }) => geometry), false);
          if (!merged) continue;
          for (const { mesh } of objects) parent.remove(mesh);
          add(parent, "one painted three-dimensional fish", merged, fishMaterial);
        }
      }
    }
    const scene = new THREE.Scene(); scene.background = new THREE.Color(colors.sky);
    scene.add(new THREE.AmbientLight(0xffffff, ambient));
    const keyLight = new THREE.DirectionalLight(key, keyPower);
    keyLight.position.set(-3, 6, 4); scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(fill, .95);
    fillLight.position.set(4, 4, -3); scene.add(fillLight);
    scene.add(root);
    const view = gallery.frames[index].room.previewCamera;
    const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 120);
    camera.position.fromArray(view.position); camera.lookAt(...view.target);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(1); renderer.setSize(735, Math.round(735 * FRAME_HEIGHT / FRAME_WIDTH));
    document.body.append(renderer.domElement);
    renderer.render(scene, camera);
    const preview = renderer.domElement.toDataURL("image/webp", .86);
    const exporter = new GLTFExporter();
    const glb = await exporter.parseAsync(root, { binary: true, maxTextureSize: 1024 });
    renderer.dispose();
    const glbData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); reader.onerror = reject;
      reader.readAsDataURL(new Blob([glb], { type: "model/gltf-binary" }));
    });
    return { preview, glb: glbData, objects: root.children.length };
  }
  return { root, colors, M, random, material, asMaterial, add, box, beam, curve,
    loft, petal, wrapSky, ground, person, exportRoom };
}
