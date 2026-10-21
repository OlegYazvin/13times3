import * as THREE from "three";

// Shared frozen-pose arm for the three independently authored figure builders.
// A continuous changing cross-section gives the sleeve, wrist, palm and thumb
// volume at every angle; no exposed cylinder ends meet at the elbow.
function sweep(add, parent, name, rings, material, sides = 14) {
  const centers = rings.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const vertices = [], uv = [], indices = [];
  for (let row = 0; row < rings.length; row++) {
    const [,,,, radius, depth = 1] = rings[row];
    const tangent = centers[Math.min(row + 1, rings.length - 1)]
      .clone().sub(centers[Math.max(0, row - 1)]).normalize();
    const across = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
    const front = tangent.clone().cross(across).normalize();
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      const point = centers[row].clone()
        .addScaledVector(across, Math.cos(angle) * radius)
        .addScaledVector(front, Math.sin(angle) * radius * depth);
      vertices.push(point.x, point.y, point.z);
      uv.push(side / sides, row / (rings.length - 1));
    }
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
  return add(parent, name, geometry, material);
}

export function sculptSleevedArm(add, parent, {
  shoulder, elbow, hand, outfit, skin, trim = outfit, size = 1,
}) {
  const between = (a, b, t) => a.map((value, i) => THREE.MathUtils.lerp(value, b[i], t));
  const side = Math.sign(shoulder[0]) || 1;
  const wrist = [hand[0], hand[1] + .055 * size, hand[2]];
  const upper = between(shoulder, elbow, .46);
  const lower = between(elbow, wrist, .48);
  const ring = (point, radius, depth = 1) => [...point, 0, radius * size, depth];
  sweep(add, parent, "continuous shaped sleeve from shoulder through elbow", [
    ring(shoulder, .086, 1.03), ring(upper, .092),
    ring(elbow, .078, .93), ring(lower, .066, .87),
    ring(wrist, .054, .88),
  ], outfit);
  sweep(add, parent, "tailored cuff following the actual wrist", [
    ring(between(lower, wrist, .82), .06, .92), ring(wrist, .06, .9),
  ], trim, 12);
  const tip = [hand[0] + side * .012 * size,
    hand[1] - .08 * size, hand[2] + .012 * size];
  sweep(add, parent, "sculpted palm and gathered fingers", [
    ring(wrist, .043, .78), ring(between(wrist, tip, .43), .05, .56),
    ring(between(wrist, tip, .83), .04, .45), ring(tip, .012, .65),
  ], skin, 12);
  const thumb = [hand[0] - side * .052 * size,
    hand[1] - .022 * size, hand[2] + .04 * size];
  sweep(add, parent, "separate modeled thumb", [
    ring(between(wrist, tip, .3), .019, .9), ring(thumb, .018, .85),
    ring([thumb[0] - side * .01 * size, thumb[1] - .022 * size,
      thumb[2] + .008 * size], .006, .8),
  ], skin, 9);
  for (let fold = 0; fold < 2; fold++) {
    const center = between(elbow, wrist, .2 + fold * .3);
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(center[0] - side * .032 * size,
        center[1] + .015 * size, center[2] + .037 * size),
      new THREE.Vector3(center[0], center[1], center[2] + .053 * size),
      new THREE.Vector3(center[0] + side * .034 * size,
        center[1] - .01 * size, center[2] + .035 * size),
    ]);
    add(parent, "cloth tension crease near the elbow",
      new THREE.TubeGeometry(path, 9, .005 * size, 5), trim);
  }
}
