import * as THREE from "three";

// A high, softly graduated enclosure keeps outdoor scenes open from every
// walkable angle, without an abrupt low horizontal ceiling.
export function openSky(color, height) {
  const horizon = new THREE.Color(color);
  const zenith = horizon.clone().offsetHSL(-.025, -.07, .13);
  const sideMaterial = new THREE.MeshBasicMaterial({ vertexColors: true,
    side: THREE.DoubleSide });
  const topMaterial = new THREE.MeshBasicMaterial({ color: zenith,
    side: THREE.DoubleSide });
  function panel(width) {
    const geometry = new THREE.PlaneGeometry(width, height, 1, 8);
    const shades = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const t = (geometry.attributes.position.getY(i) + height / 2) / height;
      const c = horizon.clone().lerp(zenith, Math.pow(t, .68));
      shades.push(c.r, c.g, c.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
    return geometry;
  }
  function roof(width, depth) {
    const geometry = new THREE.PlaneGeometry(width, depth);
    geometry.rotateX(Math.PI / 2);
    return geometry;
  }
  return { panel, roof, sideMaterial, topMaterial };
}
