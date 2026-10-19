import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { nearestFrame, PLAYER_RADIUS, FRAME_WIDTH } from "./layout.mjs";

const LOAD_DISTANCE = 12;
// Switch before a phone camera gets so close that the portrait fills and crops the screen.
const ENTER_DISTANCE = 2.4;
const EXIT_DISTANCE = 1.15;

export function roomIsReady(frame) {
  return Boolean(frame.room?.previewImage && frame.room?.modelUrl);
}

function hitsObstacle(x, z, colliders = []) {
  return colliders.some((collider) => {
    if (collider.shape === "circle") {
      return Math.hypot(x - collider.x, z - collider.z) < collider.radius + PLAYER_RADIUS;
    }
    return x > collider.minX - PLAYER_RADIUS && x < collider.maxX + PLAYER_RADIUS &&
      z > collider.minZ - PLAYER_RADIUS && z < collider.maxZ + PLAYER_RADIUS;
  });
}

export function moveWithinRoom(previous, intended, room, colliders = room.colliders) {
  const halfX = room.dimensionsM[0] / 2 - PLAYER_RADIUS;
  const halfZ = room.dimensionsM[2] / 2 - PLAYER_RADIUS;
  let nextX = previous.x;
  let nextZ = previous.z;
  // Sweep in small steps so a quick movement cannot jump through thin solids.
  const steps = Math.max(1, Math.ceil(Math.hypot(intended.x - previous.x, intended.z - previous.z) / .075));
  for (let step = 1; step <= steps; step++) {
    const x = Math.max(-halfX, Math.min(halfX, previous.x + (intended.x - previous.x) * step / steps));
    const z = Math.max(-halfZ, Math.min(halfZ, previous.z + (intended.z - previous.z) * step / steps));
    // The opening is centered in the +Z wall. Elsewhere it is a solid wall.
    if (previous.z + (intended.z - previous.z) * step / steps > halfZ && Math.abs(nextX) < .55) {
      return { x: nextX, z: nextZ, exit: true };
    }
    if (!hitsObstacle(x, nextZ, colliders)) nextX = x;
    if (!hitsObstacle(nextX, z, colliders)) nextZ = z;
  }
  return { x: nextX, z: nextZ, exit: false };
}

export function collidersFromScene(scene) {
  const colliders = [];
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (!object.userData?.solidFootprint) return;
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return;
    colliders.push({
      minX: bounds.min.x, maxX: bounds.max.x,
      minZ: bounds.min.z, maxZ: bounds.max.z,
    });
  });
  return colliders;
}

function disposeScene(scene) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const images = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material) materials.add(material);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) {
    texture.dispose();
    if (texture.image?.close) images.add(texture.image);
  }
  for (const image of images) image.close();
  for (const geometry of geometries) geometry.dispose();
}

export function disposeRoom(room) {
  if (!room) return;
  disposeScene(room.scene);
  room.returnTarget?.dispose();
}

export class RoomManager {
  constructor({ renderer, gallery, controls, player, announce, assetBase, assetVersion, onModeChange }) {
    Object.assign(this, { renderer, gallery, controls, player, announce, assetBase, assetVersion, onModeChange });
    this.mode = "hall";
    this.active = null;
    this.loadingFrame = null;
    this.generation = 0;
    this.pendingEntry = null;
    this.hallPose = null;
    this.suppressFrameId = null;
    this.loader = new GLTFLoader();
    this.readyFrames = gallery.layout.frames.filter(roomIsReady);
  }

  assetUrl(path) {
    return this.assetBase + path.replace(/^\//, "") + (this.assetVersion ? `?v=${this.assetVersion}` : "");
  }

  get scene() {
    return this.mode === "room" ? this.active?.scene : this.gallery.scene;
  }

  updateHall() {
    if (this.mode !== "hall") return;
    const nearest = nearestFrame(this.player, this.readyFrames, LOAD_DISTANCE);
    if (this.suppressFrameId) {
      if (nearest?.frame.id === this.suppressFrameId && nearest.distance < 3.5) return;
      this.suppressFrameId = null;
    }
    if (!nearest) {
      if (this.active) this.clearActive();
      if (this.loadingFrame) this.generation += 1;
      this.loadingFrame = null;
      return;
    }
    if (this.active?.frame.id !== nearest.frame.id && this.loadingFrame !== nearest.frame.id) {
      this.load(nearest.frame);
    }
  }

  async load(frame) {
    const generation = ++this.generation;
    this.loadingFrame = frame.id;
    if (this.active) this.clearActive();
    try {
      const gltf = await this.loader.loadAsync(this.assetUrl(frame.room.modelUrl));
      if (generation !== this.generation) {
        disposeScene(gltf.scene);
        return;
      }
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x211a30);
      scene.add(new THREE.AmbientLight(0xffffff, 1.65));
      const key = new THREE.DirectionalLight(0xffdfab, 2.1);
      key.position.set(1.6, 3.2, 1.8);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xb7c7ff, .7);
      fill.position.set(-2, 2, -1);
      scene.add(fill);
      scene.add(gltf.scene);
      const modelColliders = collidersFromScene(gltf.scene);

      const returnCamera = new THREE.PerspectiveCamera(75, 1.72 / 2.78, .05, 120);
      const returnTarget = new THREE.WebGLRenderTarget(640, 1034, { depthBuffer: true });
      const returnSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 2.78),
        new THREE.MeshBasicMaterial({ map: returnTarget.texture, side: THREE.DoubleSide }));
      returnSurface.position.set(0, 1.43, 2.68);
      returnSurface.rotation.y = Math.PI;
      scene.add(returnSurface);
      this.active = {
        frame, scene, returnCamera, returnTarget, returnSurface,
        returnImageReady: false, hallYaw: 0,
        colliders: modelColliders.length ? modelColliders : frame.room.colliders,
        modelColliderCount: modelColliders.length,
      };
      this.loadingFrame = null;
      if (this.pendingEntry === frame.id) {
        this.pendingEntry = null;
        this.enter();
      }
    } catch (error) {
      if (generation === this.generation) {
        this.loadingFrame = null;
        this.pendingEntry = null;
        this.announce(`Room ${frame.label} could not be loaded. Please try again later.`);
      }
      console.error("Room load failed", error);
    }
  }

  attemptPortal(previous, intended) {
    if (this.mode !== "hall") return false;
    const nearest = nearestFrame(intended, this.readyFrames, ENTER_DISTANCE + FRAME_WIDTH / 2);
    if (!nearest) return false;
    const frame = nearest.frame;
    const outward = {
      x: frame.sectionData.right.x * frame.sideSign,
      z: frame.sectionData.right.z * frame.sideSign,
    };
    const fromWall = -((intended.x - frame.center.x) * outward.x +
      (intended.z - frame.center.z) * outward.z);
    const along = Math.abs((intended.x - frame.center.x) * frame.sectionData.forward.x +
      (intended.z - frame.center.z) * frame.sectionData.forward.z);
    const toward = (intended.x - previous.x) * outward.x + (intended.z - previous.z) * outward.z;
    const facing = Math.sin(this.controls.yaw) * outward.x - Math.cos(this.controls.yaw) * outward.z;
    if (fromWall <= 0 || fromWall > ENTER_DISTANCE ||
      along > FRAME_WIDTH / 2 - PLAYER_RADIUS || toward <= 0 || facing < .45) return false;
    if (this.suppressFrameId === frame.id) this.suppressFrameId = null;
    if (this.active?.frame.id === nearest.frame.id) this.enter();
    else {
      this.pendingEntry = nearest.frame.id;
      this.announce(`Preparing room ${nearest.frame.label}.`);
      if (this.loadingFrame !== nearest.frame.id) this.load(nearest.frame);
    }
    return true;
  }

  enter() {
    if (!this.active || this.mode !== "hall") return;
    this.hallPose = { x: this.player.x, y: this.player.y, z: this.player.z, yaw: this.controls.yaw, pitch: this.controls.pitch };
    const { frame, returnCamera, returnTarget } = this.active;
    const inwardX = -frame.sectionData.right.x * frame.sideSign;
    const inwardZ = -frame.sectionData.right.z * frame.sideSign;
    const hallYaw = Math.atan2(inwardX + frame.sectionData.forward.x,
      -(inwardZ + frame.sectionData.forward.z));
    returnCamera.position.set(this.hallPose.x, this.hallPose.y, this.hallPose.z);
    returnCamera.rotation.set(0, -hallYaw, 0, "YXZ");
    const previousTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(returnTarget);
    this.renderer.render(this.gallery.scene, returnCamera);
    this.renderer.setRenderTarget(previousTarget);
    this.active.hallYaw = hallYaw;
    this.active.returnImageReady = true;
    const pose = this.active.frame.room.entryPose;
    this.player.x = pose.position[0];
    this.player.y = pose.position[1];
    this.player.z = pose.position[2];
    this.controls.yaw = pose.yaw || 0;
    this.controls.pitch = pose.pitch || 0;
    this.mode = "room";
    this.onModeChange("room", this.active.frame);
  }

  moveInRoom(intended) {
    const halfZ = this.active.frame.room.dimensionsM[2] / 2;
    if (intended.z >= halfZ - EXIT_DISTANCE && Math.abs(intended.x) < .55 &&
      intended.z > this.player.z && -Math.cos(this.controls.yaw) > .45) {
      this.leave();
      return;
    }
    const next = moveWithinRoom(this.player, intended, this.active.frame.room, this.active.colliders);
    if (next.exit) {
      this.leave();
      return;
    }
    this.player.x = next.x;
    this.player.z = next.z;
  }

  leave() {
    if (this.mode !== "room") return;
    Object.assign(this.player, { x: this.hallPose.x, y: this.hallPose.y, z: this.hallPose.z });
    this.controls.yaw = this.controls.yaw + this.active.hallYaw - Math.PI;
    this.controls.pitch = this.hallPose.pitch;
    const frame = this.active.frame;
    this.suppressFrameId = frame.id;
    this.mode = "hall";
    this.onModeChange("hall", frame);
    this.clearActive();
  }

  clearActive() {
    if (!this.active) return;
    disposeRoom(this.active);
    this.active = null;
  }
}
