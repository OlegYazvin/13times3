import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { nearestFrame, PLAYER_RADIUS, isWalkable, portalOpening } from "./layout.mjs";

const LOAD_DISTANCE = 12;
const UNLOAD_DISTANCE = 14;
const REVEAL_START = 4;
const REVEAL_END = 1.2;

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
  room.group.parent?.remove(room.group);
  disposeScene(room.group);
}

export class RoomManager {
  constructor({ gallery, player, announce, assetBase, assetVersion, onModeChange }) {
    Object.assign(this, { gallery, player, announce, assetBase, assetVersion, onModeChange });
    this.mode = "hall";
    this.active = null;
    this.loadingFrame = null;
    this.generation = 0;
    this.failedFrames = new Set();
    this.loader = new GLTFLoader();
    this.readyFrames = gallery.layout.frames.filter(roomIsReady);
  }

  assetUrl(path) {
    return this.assetBase + path.replace(/^\//, "") + (this.assetVersion ? `?v=${this.assetVersion}` : "");
  }

  get scene() {
    return this.gallery.scene;
  }

  update() {
    const nearest = nearestFrame(this.player, this.readyFrames, LOAD_DISTANCE);
    if (this.mode === "hall" && this.active &&
      Math.hypot(this.player.x - this.active.frame.center.x, this.player.z - this.active.frame.center.z) > UNLOAD_DISTANCE) {
      this.clearActive();
    }
    if (this.mode === "hall" && this.loadingFrame && !nearest) {
      this.generation += 1;
      this.loadingFrame = null;
    }
    if (!nearest && this.mode === "hall") this.failedFrames.clear();
    if (this.mode === "hall" && nearest && this.active && this.active.frame.id !== nearest.frame.id) {
      this.clearActive();
    }
    if (nearest && !this.active && this.loadingFrame !== nearest.frame.id && !this.failedFrames.has(nearest.frame.id)) {
      this.load(nearest.frame);
    }
    if (!this.active) return;
    const distance = Math.hypot(this.player.x - this.active.frame.center.x,
      this.player.z - this.active.frame.center.z);
    const t = Math.max(0, Math.min(1, (distance - REVEAL_END) / (REVEAL_START - REVEAL_END)));
    const smooth = t * t * (3 - 2 * t);
    this.gallery.frameMeshes.get(this.active.frame.id).surface.material.opacity = .45 + .55 * smooth;
    this.active.group.visible = smooth < 1 || this.mode === "room";
    const local = this.worldToRoom(this.player);
    const nextMode = local.z < this.active.frame.room.dimensionsM[2] / 2 ? "room" : "hall";
    if (nextMode !== this.mode) {
      this.mode = nextMode;
      this.onModeChange(nextMode, this.active.frame);
    }
  }

  async load(frame) {
    const generation = ++this.generation;
    this.loadingFrame = frame.id;
    try {
      const gltf = await this.loader.loadAsync(this.assetUrl(frame.room.modelUrl));
      if (generation !== this.generation) {
        disposeScene(gltf.scene);
        return;
      }
      const group = new THREE.Group();
      group.name = `room ${frame.id} behind its gallery frame`;
      const outward = {
        x: frame.sectionData.right.x * frame.sideSign,
        z: frame.sectionData.right.z * frame.sideSign,
      };
      group.position.set(frame.center.x + outward.x * frame.room.dimensionsM[2] / 2,
        0, frame.center.z + outward.z * frame.room.dimensionsM[2] / 2);
      group.rotation.y = Math.atan2(-outward.x, -outward.z);
      group.add(gltf.scene);
      group.add(new THREE.AmbientLight(0xffffff, .45));
      const key = new THREE.DirectionalLight(0xffdfab, 2.1);
      key.position.set(1.6, 3.2, 1.8);
      group.add(key, key.target);
      const fill = new THREE.DirectionalLight(0xb7c7ff, .7);
      fill.position.set(-2, 2, -1);
      group.add(fill, fill.target);
      const modelColliders = collidersFromScene(gltf.scene);
      const driftingFish = [];
      if (frame.id === "11") gltf.scene.traverse(object => {
        if (typeof object.userData?.driftPhase === "number") {
          driftingFish.push({ object, y: object.position.y,
            yaw: object.rotation.y, phase: object.userData.driftPhase,
            amplitude: object.userData.driftAmplitude || .05 });
        }
      });
      this.gallery.scene.add(group);
      this.active = {
        frame, group,
        colliders: modelColliders.length ? modelColliders : frame.room.colliders,
        modelColliderCount: modelColliders.length,
        driftingFish,
      };
      this.loadingFrame = null;
    } catch (error) {
      if (generation === this.generation) {
        this.loadingFrame = null;
        this.failedFrames.add(frame.id);
        this.announce(`Room ${frame.label} could not be loaded. Please try again later.`);
      }
      console.error("Room load failed", error);
    }
  }

  worldToRoom(position) {
    const { group } = this.active;
    const dx = position.x - group.position.x;
    const dz = position.z - group.position.z;
    const sin = Math.sin(group.rotation.y);
    const cos = Math.cos(group.rotation.y);
    return { x: cos * dx - sin * dz, z: sin * dx + cos * dz };
  }

  roomToWorld(position) {
    const { group } = this.active;
    const sin = Math.sin(group.rotation.y);
    const cos = Math.cos(group.rotation.y);
    return {
      x: group.position.x + cos * position.x + sin * position.z,
      z: group.position.z - sin * position.x + cos * position.z,
    };
  }

  canStand(position) {
    if (isWalkable(position, this.gallery.layout)) return true;
    if (!this.active) return false;
    const local = this.worldToRoom(position);
    const { frame, colliders } = this.active;
    const halfX = frame.room.dimensionsM[0] / 2;
    const halfZ = frame.room.dimensionsM[2] / 2;
    const opening = portalOpening(frame);
    if (Math.abs(local.x) > halfX - PLAYER_RADIUS ||
      local.z < -halfZ + PLAYER_RADIUS || local.z > halfZ + PLAYER_RADIUS) return false;
    if (local.z > halfZ - PLAYER_RADIUS &&
      Math.abs(local.x) > opening.width / 2 - PLAYER_RADIUS) return false;
    return !hitsObstacle(local.x, local.z, colliders);
  }

  move(intended) {
    const start = { x: this.player.x, z: this.player.z };
    let next = { ...start };
    const steps = Math.max(1, Math.ceil(Math.hypot(intended.x - start.x, intended.z - start.z) / .075));
    for (let step = 1; step <= steps; step++) {
      const candidate = {
        x: start.x + (intended.x - start.x) * step / steps,
        z: start.z + (intended.z - start.z) * step / steps,
      };
      if (this.canStand({ x: candidate.x, z: next.z })) next.x = candidate.x;
      if (this.canStand({ x: next.x, z: candidate.z })) next.z = candidate.z;
    }
    this.player.x = next.x;
    this.player.z = next.z;
  }

  animate(time, reduceMotion = false) {
    if (!this.active?.driftingFish?.length) return;
    for (const fish of this.active.driftingFish) {
      const motion = reduceMotion ? 0 : Math.sin(time * .62 + fish.phase);
      fish.object.position.y = fish.y + fish.amplitude * motion;
      fish.object.rotation.y = fish.yaw + motion * .065;
    }
  }

  clearActive() {
    if (!this.active) return;
    this.gallery.frameMeshes.get(this.active.frame.id).surface.material.opacity = 1;
    disposeRoom(this.active);
    this.active = null;
  }
}
