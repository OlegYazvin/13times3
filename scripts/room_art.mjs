import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import gallery from "../src/_data/gallery.json";
import { FRAME_WIDTH, FRAME_HEIGHT } from "../client/explore/layout.mjs";
import { addOlegPortrait, finishOlegPortraits } from "./oleg_portrait.mjs";

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
    return add(parent, name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
      points.map(point => new THREE.Vector3(...point))), segments, radius, 7, false), mat);
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
    const sky = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const horizon = new THREE.Color(color);
    const zenith = horizon.clone().offsetHSL(-.025, -.07, .13);
    function skyPanel(span, name, x, y, z, turn = 0) {
      const geometry = new THREE.PlaneGeometry(span, height, 1, openAir ? 8 : 1);
      if (openAir) {
        const shades = [];
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          const t = (geometry.attributes.position.getY(i) + height / 2) / height;
          const pigment = horizon.clone().lerp(zenith, Math.pow(t, .68));
          shades.push(pigment.r, pigment.g, pigment.b);
        }
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
      }
      const mesh = add(root, name, geometry,
        openAir ? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }) : sky,
        x, y, z);
      mesh.rotation.y = turn;
    }
    for (const x of [-width / 2 + .01, width / 2 - .01]) {
      skyPanel(depth, "world-wrapping side atmosphere", x, height / 2, 0, Math.PI / 2);
    }
    skyPanel(width, "far atmospheric wall", 0, height / 2, -depth / 2 + .01);
    const top = new THREE.PlaneGeometry(width, depth); top.rotateX(Math.PI / 2);
    add(root, "world-wrapping sky or ceiling", top,
      openAir ? new THREE.MeshBasicMaterial({ color: zenith, side: THREE.DoubleSide }) : sky,
      0, height - .01, 0);
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
  function person(name, x, z, stature, options = {}) {
    const group = new THREE.Group(); group.name = `solid sculpted figure of ${name}`;
    group.position.set(x, 0, z); group.rotation.y = options.yaw || 0; root.add(group);
    const skin = asMaterial(options.skin || "skin"), hair = asMaterial(options.hair || "hair");
    const outfit = asMaterial(options.outfit || "fabric"), pants = asMaterial(options.pants || "ink");
    const leg = stature * .42;
    const oleg = name.startsWith("Oleg");
    for (const side of [-1, 1]) {
      loft(group, "shaped leg", [[.07, .1, .1, side * .12],
        [leg, .12, .1, side * .12], [leg + .08, .14, .12, side * .12]], pants, 9);
      loft(group, "formed walking shoe with heel and toe", [[.018, .10, .16, side * .12, .12],
        [.065, .135, .20, side * .12, .105], [.145, .11, .155, side * .12, .04],
        [.17, .07, .1, side * .12, .005]], options.shoes || "ink", 12);
      curve(group, "trouser crease", [[side * .12, .23, .1],
        [side * .13, leg * .56, .113], [side * .11, leg, .105]],
      .006, options.pants || "ink", 12);
    }
    loft(group, "folded solid clothing silhouette", [[leg, .24, .18],
      [leg + .15, .3, .19], [stature - .52, .25, .16],
      [stature - .41, .2, .13]], outfit, 13, true);
    if (options.dress) loft(group, "shaped dress or skirt",
      [[leg - .16, .38, .29], [leg, .33, .25], [leg + .16, .23, .18]],
      options.skirt || outfit, 14);
    for (const side of [-1, 1]) {
      const hand = options.hands?.[side] || [side * .31, stature - .95, .14];
      const elbow = [side * .32, (stature - .71 + hand[1]) / 2, hand[2] * .55];
      beam(group, "formed upper arm", [side * .21, stature - .43, 0],
        elbow, .085, .07, outfit);
      beam(group, "formed forearm", elbow, hand, .068, .048,
        options.bareArms ? skin : outfit);
      loft(group, "small formed hand", [[hand[1] - .052, .033, .033, hand[0], hand[2]],
        [hand[1], .045, .038, hand[0], hand[2]],
        [hand[1] + .02, .014, .015, hand[0], hand[2]]], skin, 8);
      for (let finger = -1; finger <= 1; finger++) curve(group, "individual finger",
        [[hand[0] + finger * .021, hand[1] - .01, hand[2] + .03],
          [hand[0] + finger * .022, hand[1] - .07, hand[2] + .045]],
        .006, skin, 5);
    }
    const face = stature - .035;
    loft(group, "carved cheek and jaw portrait", [[face - .41, .06, .058],
      [face - .32, .14, .12], [face - .15, .17, .145],
      [face + .03, .15, .13], [face + .14, .02, .02]], skin, 14);
    if (oleg) addOlegPortrait(group, face,
      [[-.41, .06, .058], [-.32, .14, .12], [-.15, .17, .145],
        [.03, .15, .13], [.11, .07, .07]], skin);
    for (const side of [-1, 1]) {
      if (!oleg) {
        add(group, "small painted eye", new THREE.SphereGeometry(.021, 7, 6),
          options.eyeWhite || "paper", side * .068, face - .15, .143);
        add(group, "dark iris", new THREE.SphereGeometry(.012, 7, 5),
          options.iris || "ink", side * .068, face - .15, .163);
        curve(group, "fine eyebrow", [[side * .027, face - .093, .15],
          [side * .071, face - .084, .157], [side * .111, face - .101, .14]],
          .008, hair);
      }
    }
    if (!oleg) loft(group, "sculpted nose", [[face - .26, .016, .018, 0, .152],
      [face - .16, .025, .029, 0, .173],
      [face - .145, .008, .009, 0, .154]], skin, 8);
    if (!oleg) curve(group, "gentle expression", [[-.047, face - .3, .119],
      [0, face - .315, .133], [.047, face - .3, .119]],
      .009, options.lips || "rose");
    loft(group, "layered hair rather than a round cap", [[face + .035, .095, .08],
      [face + .11, .17, .14, 0, -.02], [face + .2, .13, .11, 0, -.03],
      [face + .25, .02, .02, 0, -.03]], hair, 14);
    if (options.bun) loft(group, "high tied hair", [[face + .18, .05, .04, 0, -.07],
      [face + .29, .13, .11, 0, -.07], [face + .4, .07, .06, 0, -.07],
      [face + .44, .01, .01, 0, -.07]], hair, 12);
    if (options.curls || options.longHair) for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
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
    curve(group, "stitched neckline", [[-.14, stature - .42, .13],
      [0, stature - .48, .17], [.14, stature - .42, .13]],
      .012, options.trim || "paper");
    for (const side of [-1, 1]) curve(group, "tailored garment side seam",
      [[side * .23, leg + .04, .11], [side * .27, leg + .3, .15],
        [side * .22, stature - .48, .11]], .006,
      options.trim || "paper", 11);
    return group;
  }
  async function exportRoom({ key = 0xffd9ae, fill = 0xa8d4dc,
    ambient = 1.6, keyPower = 2.1 } = {}) {
    await finishOlegPortraits(root);
    root.updateMatrixWorld(true);
    const groups = new Map();
    root.traverse(object => {
      if (!object.userData.batchPetal) return;
      const list = groups.get(object.material) || [];
      list.push(object); groups.set(object.material, list);
    });
    for (const [mat, objects] of groups) {
      const geometry = mergeGeometries(objects.map(object =>
        object.geometry.clone().applyMatrix4(object.matrixWorld)), false);
      if (!geometry) throw new Error("Could not merge room petals");
      for (const object of objects) object.parent.remove(object);
      add(root, "batched sculpted foliage and paper details", geometry, mat);
    }
    const scene = new THREE.Scene(); scene.background = new THREE.Color(colors.sky);
    scene.add(new THREE.AmbientLight(0xffffff, ambient));
    const keyLight = new THREE.DirectionalLight(key, keyPower);
    keyLight.position.set(-3, 6, 4); scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(fill, .95);
    fillLight.position.set(4, 4, -3); scene.add(fillLight);
    scene.add(root);
    const view = gallery.frames[index].room.previewCamera;
    const camera = new THREE.PerspectiveCamera(view.fov, FRAME_WIDTH / FRAME_HEIGHT, .05, 50);
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
