import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { crossesPortal, nearestFrame, PLAYER_RADIUS, FRAME_WIDTH, FRAME_HEIGHT } from "./layout.mjs";

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

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

export function moveWithinRoom(previous, intended, room) {
  const halfX = room.dimensionsM[0] / 2 - PLAYER_RADIUS;
  const halfZ = room.dimensionsM[2] / 2 - PLAYER_RADIUS;
  const x = Math.max(-halfX, Math.min(halfX, intended.x));
  const z = Math.max(-halfZ, Math.min(halfZ, intended.z));
  // The opening is centered in the +Z wall. Elsewhere it is a solid wall.
  if (intended.z > halfZ && Math.abs(previous.x) < .55) return { ...previous, exit: true };
  let nextX = previous.x;
  let nextZ = previous.z;
  if (!hitsObstacle(x, nextZ, room.colliders)) nextX = x;
  if (!hitsObstacle(nextX, z, room.colliders)) nextZ = z;
  return { x: nextX, z: nextZ, exit: false };
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
  room.liveMaterial?.dispose();
  room.target?.dispose();
  room.liveSurface?.parent?.remove(room.liveSurface);
}

export class RoomManager {
  constructor({ renderer, gallery, camera, controls, player, glow, announce, assetBase, onModeChange }) {
    Object.assign(this, { renderer, gallery, camera, controls, player, glow, announce, assetBase, onModeChange });
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
    return this.assetBase + path.replace(/^\//, "");
  }

  get scene() {
    return this.mode === "room" || this.mode === "leaving" ? this.active?.scene : this.gallery.scene;
  }

  updateHall(time) {
    if (this.mode !== "hall") return;
    const nearest = nearestFrame(this.player, this.readyFrames, 8);
    if (this.suppressFrameId) {
      if (nearest?.frame.id === this.suppressFrameId && nearest.distance < 3.5) {
        if (this.active) this.clearActive();
        return;
      }
      this.suppressFrameId = null;
    }
    if (!nearest || !roomIsReady(nearest.frame)) {
      if (this.active) this.clearActive();
      if (this.loadingFrame) this.generation += 1;
      this.loadingFrame = null;
      return;
    }
    const frame = nearest.frame;
    if (this.active?.frame.id !== frame.id && this.loadingFrame !== frame.id) this.load(frame);
    if (!this.active || this.active.frame.id !== frame.id) return;

    // Fill the entire frame from a comfortable viewing distance; the stored
    // painting remains visible while the GLB is loading or has been released.
    const strength = Math.max(0, Math.min(1, (8 - nearest.distance) / 1.5));
    this.active.liveMaterial.opacity = strength;
    const { forward } = frame.sectionData;
    const along = (this.player.x - frame.center.x) * forward.x +
      (this.player.z - frame.center.z) * forward.z;
    const offset = Math.max(-1.2, Math.min(1.2, -frame.sideSign * along));
    const depth = Math.max(-.16, Math.min(.16, (nearest.distance - 3) * .055));
    const changed = !this.active.hasLiveRender ||
      Math.abs(offset - this.active.lastOffset) > .18 ||
      Math.abs(depth - this.active.lastDepth) > .055;
    if (strength > 0 && changed && (!this.active.hasLiveRender || time - this.active.lastRenderTime > 1 / 6)) {
      const view = frame.room.previewCamera;
      this.active.previewCamera.position.set(view.position[0] + offset * .18, view.position[1], view.position[2] + depth);
      this.active.previewCamera.lookAt(view.target[0] + offset * .04, view.target[1], view.target[2]);
      const previousTarget = this.renderer.getRenderTarget();
      this.renderer.setRenderTarget(this.active.target);
      this.renderer.render(this.active.scene, this.active.previewCamera);
      this.renderer.setRenderTarget(previousTarget);
      this.active.hasLiveRender = true;
      this.active.lastOffset = offset;
      this.active.lastDepth = depth;
      this.active.lastRenderTime = time;
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

      const view = frame.room.previewCamera;
      const previewCamera = new THREE.PerspectiveCamera(view.fov || 65, FRAME_WIDTH / FRAME_HEIGHT, .05, 40);
      previewCamera.position.fromArray(view.position);
      previewCamera.lookAt(...view.target);
      const previewWidth = Math.max(384, Math.min(640, Math.round(this.renderer.domElement.clientWidth * .75)));
      const target = new THREE.WebGLRenderTarget(previewWidth, Math.round(previewWidth * FRAME_HEIGHT / FRAME_WIDTH), { depthBuffer: true });
      const liveMaterial = new THREE.MeshBasicMaterial({ map: target.texture, transparent: true, opacity: 0, depthWrite: false });
      const frameMesh = this.gallery.frameMeshes.get(frame.id);
      const liveSurface = new THREE.Mesh(frameMesh.surface.geometry, liveMaterial);
      liveSurface.position.z = .105;
      frameMesh.root.add(liveSurface);
      this.active = {
        frame, scene, previewCamera, target, liveMaterial, liveSurface, hasLiveRender: false,
        lastOffset: 0, lastDepth: 0, lastRenderTime: 0,
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
    const nearest = nearestFrame(previous, this.gallery.layout.frames, 2.2);
    if (!nearest || !roomIsReady(nearest.frame) || !crossesPortal(previous, intended, nearest.frame)) return false;
    if (this.active?.frame.id === nearest.frame.id) this.enter();
    else {
      this.pendingEntry = nearest.frame.id;
      this.announce(`Preparing room ${nearest.frame.label}.`);
      if (this.loadingFrame !== nearest.frame.id) this.load(nearest.frame);
    }
    return true;
  }

  async enter() {
    if (!this.active || this.mode !== "hall") return;
    this.mode = "entering";
    this.hallPose = { x: this.player.x, y: this.player.y, z: this.player.z, yaw: this.controls.yaw, pitch: this.controls.pitch };
    this.controls.setEnabled(false);
    this.glow.classList.add("active");
    this.onModeChange("entering", this.active.frame);
    await wait(360);
    const pose = this.active.frame.room.entryPose;
    this.player.x = pose.position[0];
    this.player.y = pose.position[1];
    this.player.z = pose.position[2];
    this.controls.yaw = pose.yaw || 0;
    this.controls.pitch = pose.pitch || 0;
    this.mode = "room";
    this.onModeChange("room", this.active.frame);
    await wait(380);
    this.glow.classList.remove("active");
    this.controls.setEnabled(true);
  }

  moveInRoom(intended) {
    const next = moveWithinRoom(this.player, intended, this.active.frame.room);
    if (next.exit) {
      this.leave();
      return;
    }
    this.player.x = next.x;
    this.player.z = next.z;
  }

  async leave() {
    if (this.mode !== "room") return;
    this.mode = "leaving";
    this.controls.setEnabled(false);
    this.glow.classList.add("active");
    this.onModeChange("leaving", this.active.frame);
    await wait(360);
    Object.assign(this.player, { x: this.hallPose.x, y: this.hallPose.y, z: this.hallPose.z });
    this.controls.yaw = this.hallPose.yaw;
    this.controls.pitch = this.hallPose.pitch;
    this.suppressFrameId = this.active.frame.id;
    this.mode = "hall";
    this.onModeChange("hall", this.active.frame);
    await wait(380);
    this.glow.classList.remove("active");
    this.clearActive();
    this.controls.setEnabled(true);
  }

  clearActive() {
    if (!this.active) return;
    disposeRoom(this.active);
    this.active = null;
  }
}
