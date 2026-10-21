import * as THREE from "three";

const canopyMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true, side: THREE.DoubleSide, roughness: .98, metalness: 0,
});

// A broad, scalloped volume behind individual modeled leaves. Several lobes
// overlap on each tree, so branches and fruit grow out of a crown rather than
// appearing to carry isolated polygon confetti against an empty sky.
export function foliageLobe(parent, name, x, y, z, rx, ry, rz, color, seed = 0) {
  const profiles = [
    [-.9, .08], [-.69, .65], [-.4, .95], [-.07, 1.0],
    [.24, .92], [.57, .69], [.82, .28], [.92, .035],
  ];
  const sides = 20, points = [], colors = [], indices = [];
  const pigment = new THREE.Color(color);
  for (let row = 0; row < profiles.length; row++) {
    const [height, width] = profiles[row];
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      const scallop = 1 + .10 * Math.sin(angle * 7 + seed * 1.3 + row * .29) +
        .055 * Math.sin(angle * 11 - seed * .7 + row * .41);
      points.push(Math.cos(angle) * rx * width * scallop,
        height * ry + Math.sin(angle * 5 + seed + row * .4) * ry * .035,
        Math.sin(angle) * rz * width * scallop);
      const shade = pigment.clone().offsetHSL(
        .012 * Math.sin(seed + side * .6), -.055 + .04 * Math.cos(row + seed),
        -.09 + row * .022 + .035 * Math.sin(side * 1.7 + row * .4 + seed));
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  for (let row = 0; row < profiles.length - 1; row++) {
    for (let side = 0; side < sides; side++) {
      const next = (side + 1) % sides;
      const a = row * sides + side, b = row * sides + next;
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, canopyMaterial);
  mesh.name = name; mesh.position.set(x, y, z); parent.add(mesh);
  return mesh;
}
