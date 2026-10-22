import * as THREE from "three";

// The still painting and its walkable room use the same lights. Keeping this
// in one module prevents a bright preview from darkening at the threshold.
export function addRoomLighting(parent) {
  parent.add(new THREE.AmbientLight(0xffffff, .45));
  const key = new THREE.DirectionalLight(0xffdfab, 2.1);
  key.position.set(1.6, 3.2, 1.8);
  parent.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xb7c7ff, .7);
  fill.position.set(-2, 2, -1);
  parent.add(fill, fill.target);
}
