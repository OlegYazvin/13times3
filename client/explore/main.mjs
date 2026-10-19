import * as THREE from "three";
import { GalleryControls } from "./controls.mjs";
import { createGalleryScene } from "./gallery-scene.mjs";
import {
  EYE_HEIGHT, moveWithCollision, nearestSection,
} from "./layout.mjs";
import { RoomManager } from "./rooms.mjs";

const sceneHost = document.getElementById("scene");
const welcome = document.getElementById("welcome");
const fallback = document.getElementById("fallback");
const beginButton = document.getElementById("begin-button");
const helpButton = document.getElementById("help-button");
const status = document.getElementById("section-status");
const roomTitle = document.getElementById("room-title");
const announcement = document.getElementById("announcement");
const glow = document.getElementById("portal-glow");
const experience = document.getElementById("experience");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function showFallback(message) {
  fallback.hidden = false;
  welcome.hidden = true;
  document.getElementById("joystick").hidden = true;
  document.getElementById("look-hint").hidden = true;
  announcement.textContent = message;
}

try {
  const manifest = JSON.parse(document.getElementById("gallery-data").textContent);
  const gallery = createGalleryScene(manifest, experience.dataset.basePath, experience.dataset.roomVersion);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
  sceneHost.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(75, 1, .05, 120);
  const roomFov = (frame) => camera.aspect < .7
    ? Math.min(110, frame.room.previewCamera.fov + 25)
    : frame.room.previewCamera.fov;
  const player = { x: 0, y: EYE_HEIGHT, z: -1.1 };
  const controls = new GalleryControls(
    renderer.domElement,
    document.getElementById("joystick"),
    document.getElementById("joystick-knob"),
  );
  // Frame 01 should greet Jane immediately, including on a narrow phone view.
  controls.yaw = -.67;
  const rooms = new RoomManager({
    renderer, gallery, camera, controls, player, glow,
    assetBase: experience.dataset.basePath,
    assetVersion: experience.dataset.roomVersion,
    announce(message) { announcement.textContent = message; },
    onModeChange(mode, frame) {
      camera.fov = mode === "room" ? roomFov(frame) : 75;
      camera.updateProjectionMatrix();
      roomTitle.hidden = mode !== "room";
      roomTitle.textContent = mode === "room" ? frame.room.title || `Room ${frame.label}` : "";
      status.textContent = mode === "room"
        ? `Room ${frame.label}`
        : mode === "hall"
          ? `Gallery ${nearestSection(player, gallery.layout.sections).section.index + 1} / 5`
          : "Passing through";
    },
  });
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    window.__galleryDebug = () => ({
      x: player.x, z: player.z, yaw: controls.yaw,
      section: nearestSection(player, gallery.layout.sections).section.index + 1,
      mode: rooms.mode,
      activeRoom: rooms.active?.frame.id || null,
      livePreviewOpacity: rooms.active?.liveMaterial.opacity || 0,
      liveViewX: rooms.active?.previewCamera.position.x ?? null,
      liveViewZ: rooms.active?.previewCamera.position.z ?? null,
      modelColliderCount: rooms.active?.modelColliderCount ?? 0,
      roomColliders: rooms.active?.colliders ?? [],
      frame01Painting: Boolean(gallery.frameMeshes.get("01").surface.material.map?.image?.width),
      frameCount: gallery.layout.frames.length,
    });
    window.__galleryTestPose = (x, z, yaw) => {
      Object.assign(player, { x, z });
      controls.yaw = yaw;
    };
  }

  function resize() {
    const width = sceneHost.clientWidth;
    const height = sceneHost.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = rooms.mode === "room" ? roomFov(rooms.active.frame) : 75;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(sceneHost);

  let sectionNumber = 0;
  let lastTime = performance.now();
  let running = true;
  let slowTime = 0;
  let frameSamples = 0;
  function tick(now) {
    if (!running) return;
    const elapsed = (now - lastTime) / 1000;
    const dt = Math.min(elapsed, .05);
    lastTime = now;
    if (controls.enabled && pixelRatio > 1) {
      slowTime += elapsed;
      frameSamples += 1;
      if (frameSamples >= 90) {
        if (slowTime / frameSamples > 1 / 30) {
          pixelRatio = Math.max(1, pixelRatio - .25);
          resize();
        }
        slowTime = 0;
        frameSamples = 0;
      }
    }
    controls.updateLook(dt);
    const movement = controls.getMovement();
    if (movement.forward || movement.strafe) {
      const sin = Math.sin(controls.yaw);
      const cos = Math.cos(controls.yaw);
      const desired = {
        x: player.x + (sin * movement.forward + cos * movement.strafe) * dt * 2.2,
        z: player.z + (-cos * movement.forward + sin * movement.strafe) * dt * 2.2,
      };
      if (rooms.mode === "hall") {
        if (!rooms.attemptPortal(player, desired)) Object.assign(player, moveWithCollision(player, desired, gallery.layout));
      } else if (rooms.mode === "room") rooms.moveInRoom(desired);
    }

    if (rooms.mode === "hall") {
      const current = nearestSection(player, gallery.layout.sections).section.index + 1;
      if (current !== sectionNumber) {
        sectionNumber = current;
        status.textContent = `Gallery ${current} / 5`;
        announcement.textContent = `Gallery section ${current} of 5.`;
      }
      rooms.updateHall(now / 1000);
    }

    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = -controls.yaw;
    camera.rotation.x = controls.pitch;
    gallery.animate(now / 1000, reducedMotion.matches);
    if (rooms.scene) renderer.render(rooms.scene, camera);
    requestAnimationFrame(tick);
  }

  function openHelp() {
    welcome.hidden = false;
    controls.setEnabled(false);
    beginButton.focus();
  }
  function closeHelp() {
    welcome.hidden = true;
    controls.setEnabled(true);
    renderer.domElement.focus();
  }
  beginButton.addEventListener("click", closeHelp);
  helpButton.addEventListener("click", openHelp);
  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && welcome.hidden && fallback.hidden) openHelp();
  });
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "First-person gallery view. Use W A S D or arrow keys to move and drag to look.");
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    running = false;
    controls.setEnabled(false);
    showFallback("The 3D view stopped responding. Reload the page to try again.");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => window.location.reload());
  requestAnimationFrame(tick);
} catch (error) {
  console.error("The gallery could not start", error);
  showFallback("The 3D gallery is unavailable in this browser.");
}
