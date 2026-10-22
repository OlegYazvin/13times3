import * as THREE from "three";
import { paintedSkyTexture } from "./painted_sky.mjs";

// Outdoor memories are independent worlds. Their atmosphere can extend well
// beyond the walkable bounds without ever occupying another gallery room.
export function addOpenSky(root, skyColor, groundColor) {
  const sky = new THREE.Color(skyColor);
  const zenith = sky.clone().offsetHSL(-.025, .015, -.025);
  const horizon = sky.clone().offsetHSL(.012, -.025, .075);
  // Keep the visible horizon far beyond the authored walkable area. Portal
  // worlds do not share a render scene, so this sky may extend through the
  // neighboring room's coordinates without appearing there.
  const skyRadius = 72;
  const dome = new THREE.SphereGeometry(skyRadius, 48, 24, 0, Math.PI * 2,
    0, Math.PI / 2 + .17);
  const shades = [];
  for (let i = 0; i < dome.attributes.position.count; i++) {
    const t = THREE.MathUtils.clamp(dome.attributes.position.getY(i) / skyRadius, 0, 1);
    const color = horizon.clone().lerp(zenith, Math.pow(t, .72));
    shades.push(color.r, color.g, color.b);
  }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
  const atmosphere = new THREE.Mesh(dome, new THREE.MeshBasicMaterial({
    map: paintedSkyTexture(skyColor), vertexColors: true,
    side: THREE.DoubleSide, depthWrite: false,
  }));
  atmosphere.name = "continuous watercolor sky dome without a roof seam";
  atmosphere.position.y = -4.5;
  root.add(atmosphere);

  // The authored walkable floor remains in front. This broad, dimmer terrain
  // catches low viewing angles beyond it, avoiding a sudden floor-to-sky gap.
  const distant = new THREE.PlaneGeometry(144, 144, 24, 24);
  distant.rotateX(-Math.PI / 2);
  const ground = new THREE.Color(groundColor);
  const far = ground.clone().lerp(horizon, .57);
  const floorShades = [];
  for (let i = 0; i < distant.attributes.position.count; i++) {
    const x = distant.attributes.position.getX(i);
    const z = distant.attributes.position.getZ(i);
    const r = Math.hypot(x, z);
    const color = ground.clone().lerp(far,
      THREE.MathUtils.smoothstep(r, 8, 66));
    color.offsetHSL(0, 0, .009 * Math.sin(x * .22 + z * .11));
    floorShades.push(color.r, color.g, color.b);
  }
  distant.setAttribute("color", new THREE.Float32BufferAttribute(floorShades, 3));
  const terrain = new THREE.Mesh(distant, new THREE.MeshBasicMaterial({
    color: 0xffffff, vertexColors: true, side: THREE.DoubleSide,
  }));
  terrain.name = "distant ground beyond the walkable scene";
  terrain.position.y = -.095;
  root.add(terrain);
  return { atmosphere, terrain };
}
