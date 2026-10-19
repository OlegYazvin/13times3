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
  room.liveMaterial?.dispose();
  room.target?.dispose();
  room.liveSurface?.parent?.remove(room.liveSurface);
  room.nearTarget?.dispose();
  room.nearQuad?.geometry?.dispose();
  room.nearQuad?.material?.dispose();
}

export class RoomManager {
  constructor({ renderer, gallery, camera, controls, player, glow, announce, assetBase, assetVersion, roomFov, onModeChange }) {
    Object.assign(this, { renderer, gallery, camera, controls, player, glow, announce, assetBase, assetVersion, roomFov, onModeChange });
    this.mode = "hall";
    this.active = null;
    this.loadingFrame = null;
    this.generation = 0;
    this.pendingEntry = null;
    this.hallPose = null;
    this.suppressFrameId = null;
    this.nearOpacity = 0;
    this.loader = new GLTFLoader();
    this.readyFrames = gallery.layout.frames.filter(roomIsReady);
  }

  assetUrl(path) {
    return this.assetBase + path.replace(/^\//, "") + (this.assetVersion ? `?v=${this.assetVersion}` : "");
  }

  get scene() {
    return this.mode === "room" || this.mode === "entering" || this.mode === "leaving"
      ? this.active?.scene : this.gallery.scene;
  }

  updateHall(time) {
    if (this.mode !== "hall") return;
    const nearest = nearestFrame(this.player, this.readyFrames, 12);
    if (this.suppressFrameId) {
      if (nearest?.frame.id === this.suppressFrameId && nearest.distance < 3.5) {
        this.nearOpacity = 0;
        if (this.active) this.clearActive();
        return;
      }
      this.suppressFrameId = null;
    }
    if (!nearest || !roomIsReady(nearest.frame)) {
      this.nearOpacity = 0;
      if (this.active) this.clearActive();
      if (this.loadingFrame) this.generation += 1;
      this.loadingFrame = null;
      return;
    }
    const frame = nearest.frame;
    if (this.active?.frame.id !== frame.id && this.loadingFrame !== frame.id) this.load(frame);
    if (!this.active || this.active.frame.id !== frame.id) {
      this.nearOpacity = 0;
      return;
    }

    // Fill the entire frame from a comfortable viewing distance; the stored
    // painting remains visible while the GLB is loading or has been released.
    const strength = Math.max(0, Math.min(1, (12 - nearest.distance) / 2));
    this.active.liveMaterial.opacity = strength;
    const { forward } = frame.sectionData;
    const along = (this.player.x - frame.center.x) * forward.x +
      (this.player.z - frame.center.z) * forward.z;
    // Preserve the hallway parallax until the last steps, then land on the
    // room entry camera so the scene is already composed before crossing.
    const handoff = Math.max(0, Math.min(1, (nearest.distance - .25) / 1.4));
    const blend = handoff * handoff * (3 - 2 * handoff);
    const offset = Math.max(-1.4, Math.min(1.4, -frame.sideSign * along)) * blend;
    const depth = Math.max(-.35, Math.min(.28, (nearest.distance - 3) * .15)) * blend;
    const facingX = Math.sin(this.controls.yaw);
    const facingZ = -Math.cos(this.controls.yaw);
    const dx = frame.center.x - this.player.x;
    const dz = frame.center.z - this.player.z;
    const facing = (facingX * dx + facingZ * dz) / Math.max(.001, Math.hypot(dx, dz));
    // Keep the dissolve to a short physical step: a long overlap exposes two
    // differently projected copies of the same room.
    const close = Math.max(0, Math.min(1, (1.4 - nearest.distance) / .25));
    const centered = Math.max(0, Math.min(1, (facing - .45) / .3));
    const reveal = close * close * (3 - 2 * close);
    this.nearOpacity = reveal * centered;
    const view = frame.room.previewCamera;
    this.active.previewCamera.position.set(view.position[0] + offset * .56, view.position[1], view.position[2] + depth);
    this.active.previewCamera.lookAt(...view.target);
    this.active.nearCamera.position.copy(this.active.previewCamera.position);
    this.active.nearCamera.quaternion.copy(this.active.previewCamera.quaternion);
    const changed = !this.active.hasLiveRender ||
      Math.abs(offset - this.active.lastOffset) > .055 ||
      Math.abs(depth - this.active.lastDepth) > .045;
    if (strength > 0 && changed && (!this.active.hasLiveRender || time - this.active.lastRenderTime > 1 / 12)) {
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

  renderNearFull() {
    if (this.mode !== "hall" || this.nearOpacity < .999 || !this.active) return false;
    this.renderer.render(this.active.scene, this.active.nearCamera);
    return true;
  }

  renderNearOverlay() {
    if (this.mode !== "hall" || this.nearOpacity <= 0 || !this.active) return;
    const active = this.active;
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    if (active.nearTarget.width !== size.x || active.nearTarget.height !== size.y) {
      active.nearTarget.setSize(size.x, size.y);
    }
    const previousTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(active.nearTarget);
    this.renderer.render(active.scene, active.nearCamera);
    this.renderer.setRenderTarget(previousTarget);
    active.nearQuad.material.opacity = this.nearOpacity;
    this.renderer.autoClear = false;
    this.renderer.clearDepth();
    this.renderer.render(active.nearScene, active.nearScreenCamera);
    this.renderer.autoClear = true;
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

      const view = frame.room.previewCamera;
      const previewCamera = new THREE.PerspectiveCamera(view.fov || 65, FRAME_WIDTH / FRAME_HEIGHT, .05, 40);
      previewCamera.position.fromArray(view.position);
      previewCamera.lookAt(...view.target);
      const previewWidth = Math.max(640, Math.min(1024,
        Math.round(this.renderer.domElement.clientWidth * this.renderer.getPixelRatio() * .85)));
      const target = new THREE.WebGLRenderTarget(previewWidth, Math.round(previewWidth * FRAME_HEIGHT / FRAME_WIDTH), { depthBuffer: true });
      const liveMaterial = new THREE.MeshBasicMaterial({ map: target.texture, transparent: true, opacity: 0, depthWrite: false });
      const frameMesh = this.gallery.frameMeshes.get(frame.id);
      const liveSurface = new THREE.Mesh(frameMesh.surface.geometry, liveMaterial);
      liveSurface.position.z = .105;
      frameMesh.root.add(liveSurface);
      const nearCamera = new THREE.PerspectiveCamera(this.roomFov(frame), this.camera.aspect, .05, 40);
      nearCamera.position.fromArray(view.position);
      nearCamera.lookAt(...view.target);
      const nearSize = this.renderer.getDrawingBufferSize(new THREE.Vector2());
      const nearTarget = new THREE.WebGLRenderTarget(nearSize.x, nearSize.y, { depthBuffer: true });
      const nearQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: nearTarget.texture, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
      const nearScene = new THREE.Scene();
      nearScene.add(nearQuad);
      const nearScreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.active = {
        frame, scene, previewCamera, target, liveMaterial, liveSurface, nearCamera, nearTarget,
        nearQuad, nearScene, nearScreenCamera, hasLiveRender: false,
        colliders: modelColliders.length ? modelColliders : frame.room.colliders,
        modelColliderCount: modelColliders.length,
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
    const pose = this.active.frame.room.entryPose;
    this.player.x = pose.position[0];
    this.player.y = pose.position[1];
    this.player.z = pose.position[2];
    this.controls.yaw = pose.yaw || 0;
    this.controls.pitch = pose.pitch || 0;
    await wait(75);
    this.mode = "room";
    this.onModeChange("room", this.active.frame);
    await wait(80);
    this.glow.classList.remove("active");
    this.controls.setEnabled(true);
  }

  moveInRoom(intended) {
    const next = moveWithinRoom(this.player, intended, this.active.frame.room, this.active.colliders);
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
    await wait(95);
    Object.assign(this.player, { x: this.hallPose.x, y: this.hallPose.y, z: this.hallPose.z });
    this.controls.yaw = this.hallPose.yaw;
    this.controls.pitch = this.hallPose.pitch;
    this.suppressFrameId = this.active.frame.id;
    this.mode = "hall";
    this.onModeChange("hall", this.active.frame);
    await wait(110);
    this.glow.classList.remove("active");
    this.clearActive();
    this.controls.setEnabled(true);
  }

  clearActive() {
    if (!this.active) return;
    disposeRoom(this.active);
    this.active = null;
    this.nearOpacity = 0;
  }
}
