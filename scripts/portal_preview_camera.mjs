import * as THREE from 'three';
import {portalCanvas,EYE_HEIGHT} from '../client/explore/layout.mjs';

// Project the still through the same physical rectangle seen from the hall.
// An ordinary camera aimed down into a scene magnifies and shifts its people
// relative to the live view exposed by a cutout in that still.
export function portalPreviewCamera(room) {
  const portal=room.portalZ??room.dimensionsM[2]/2;
  const distance=room.previewCamera.hallDistanceM??3;
  const {width,height,bottom}=portalCanvas(room);
  const camera=new THREE.PerspectiveCamera();camera.near=.05;camera.far=120;
  camera.position.set(0,EYE_HEIGHT,portal+distance);
  // frameMesh puts the surface .14 + .09 m in front of the crossing plane;
  // its bottom is .08 m above the floor.
  const planeDistance=distance-.23;
  camera.fov=THREE.MathUtils.radToDeg(Math.atan((height+bottom-EYE_HEIGHT)/planeDistance)+Math.atan((EYE_HEIGHT-bottom)/planeDistance));
  camera.aspect=width/height;
  const scale=camera.near/planeDistance;
  camera.projectionMatrix.makePerspective(-width/2*scale,width/2*scale,
    (height+bottom-EYE_HEIGHT)*scale,(bottom-EYE_HEIGHT)*scale,camera.near,camera.far);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return camera;
}
