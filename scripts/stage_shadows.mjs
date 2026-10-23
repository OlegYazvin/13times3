import * as THREE from "three";

// A soft painted contact shadow keeps each volumetric figure attached to its
// world without expensive shadow maps on phones. It is floor detail, never a
// character cutout. One texture is shared by every figure in an author scene.
let material;
function shadowMaterial() {
  if (material) return material;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const context = canvas.getContext("2d");
  const wash = context.createRadialGradient(48, 48, 4, 48, 48, 47);
  wash.addColorStop(0, "rgba(28,37,45,.55)");
  wash.addColorStop(.45, "rgba(34,45,53,.27)");
  wash.addColorStop(1, "rgba(34,45,53,0)");
  context.fillStyle = wash;
  context.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.mimeType = "image/png";
  material = new THREE.MeshBasicMaterial({ map: texture, transparent: true,
    depthWrite: false, side: THREE.DoubleSide });
  return material;
}

export function addContactShadow(parent, stature = 1.7, scale = 1) {
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(.94, .68), shadowMaterial());
  shadow.name = "soft contact shadow anchoring the sculpted figure";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .002;
  shadow.scale.setScalar((stature < 1.3 ? .72 : 1) * scale);
  parent.add(shadow);
  return shadow;
}
