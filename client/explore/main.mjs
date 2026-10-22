import * as THREE from "three";
import { GalleryControls } from "./controls.mjs";
import { createGalleryScene } from "./gallery-scene.mjs";
import { GalleryMusic } from "./music.mjs";
import {
  EYE_HEIGHT, nearestSection,
} from "./layout.mjs";
import { RoomManager } from "./rooms.mjs";

const sceneHost = document.getElementById("scene");
const welcome = document.getElementById("welcome");
const fallback = document.getElementById("fallback");
const beginButton = document.getElementById("begin-button");
const helpButton = document.getElementById("help-button");
const musicButton = document.getElementById("music-button");
const status = document.getElementById("section-status");
const roomTitle = document.getElementById("room-title");
const announcement = document.getElementById("announcement");
const experience = document.getElementById("experience");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let galleryMusic;

function showFallback(message) {
  galleryMusic?.stop();
  fallback.hidden = false;
  welcome.hidden = true;
  musicButton.hidden = true;
  document.getElementById("joystick").hidden = true;
  document.getElementById("look-hint").hidden = true;
  announcement.textContent = message;
}

try {
  galleryMusic = new GalleryMusic(musicButton, experience.dataset.musicUrl);
  const manifest = JSON.parse(document.getElementById("gallery-data").textContent);
  const gallery = createGalleryScene(manifest, experience.dataset.basePath, experience.dataset.roomVersion);
  const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true,
    powerPreference: "high-performance" });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
  sceneHost.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(75, 1, .05, 120);
  const player = { x: 0, y: EYE_HEIGHT, z: -1.1 };
  const controls = new GalleryControls(
    renderer.domElement,
    document.getElementById("joystick"),
    document.getElementById("joystick-knob"),
  );
  // Frame 01 should greet Jane immediately, including on a narrow phone view.
  controls.yaw = -.67;
  const rooms = new RoomManager({
    gallery, player,
    assetBase: experience.dataset.basePath,
    assetVersion: experience.dataset.roomVersion,
    announce(message) { announcement.textContent = message; },
    onModeChange(mode, frame) {
      galleryMusic.setInHall(mode === "hall");
      roomTitle.hidden = mode !== "room";
      roomTitle.textContent = mode === "room" ? frame.room.title || `Room ${frame.label}` : "";
      status.textContent = mode === "room"
        ? `Room ${frame.label}`
        : `Gallery ${nearestSection(player, gallery.layout.sections).section.index + 1} / 5`;
    },
  });
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    window.__galleryDebug = () => ({
      x: player.x, z: player.z, yaw: controls.yaw,
      section: nearestSection(player, gallery.layout.sections).section.index + 1,
      mode: rooms.mode,
      activeRoom: rooms.active?.frame.id || null,
      activeRoomIsolated: rooms.active?.group.parent === rooms.roomScene,
      loadedWorldCount: rooms.roomScene.children.length,
      roomLocal: rooms.active ? rooms.worldToRoom(player) : null,
      paintingOpacity: gallery.frameMeshes.get("01").surface.material.opacity,
      cameraFov: camera.fov,
      modelColliderCount: rooms.active?.modelColliderCount ?? 0,
      driftingFishCount: rooms.active?.driftingFish?.length ?? 0,
      firstFishY: rooms.active?.driftingFish?.[0]?.object.position.y ?? null,
      fishProbeY: rooms.active?.driftingFish?.slice(0, 12)
        .map(fish => fish.object.position.y) ?? [],
      roomColliders: rooms.active?.colliders ?? [],
      frame01Painting: Boolean(gallery.frameMeshes.get("01").surface.material.map?.image?.width),
      frameCount: gallery.layout.frames.length,
      music: {
        started: galleryMusic.started,
        enabled: galleryMusic.enabled,
        playing: !galleryMusic.audio.paused,
        time: galleryMusic.audio.currentTime,
        level: galleryMusic.gain?.gain.value ?? galleryMusic.audio.volume,
      },
    });
    window.__galleryTestPose = (x, z, yaw) => {
      Object.assign(player, { x, z });
      controls.yaw = yaw;
      rooms.setMode("hall");
    };
    window.__galleryTestRoomPose = (x, z, yaw, pitch = 0) => {
      if (!rooms.active) return;
      Object.assign(player, rooms.roomToWorld({ x, z }));
      controls.yaw = yaw;
      controls.pitch = pitch;
      rooms.setMode("room");
    };
    window.__galleryTestRoomCanStand = (x, z) =>
      rooms.canStand(rooms.roomToWorld({ x, z }), "room");
    window.__galleryTestWorldMove = (x, z) =>
      rooms.move({ x, z });
    window.__galleryTestRoomMove = (x, z) =>
      rooms.move(rooms.roomToWorld({ x, z }));
    // A synchronous render/readback avoids judging a stale compositor buffer
    // after resizing or repositioning a software-rendered review camera.
    const hallTestColors = new Map();
    window.__galleryTestHallTint = (value = null) => {
      for (const material of rooms.hallMaterials) if (material.color) {
        if (value === null) {
          const color = hallTestColors.get(material);
          if (color) material.color.copy(color);
        } else {
          if (!hallTestColors.has(material)) hallTestColors.set(material, material.color.clone());
          material.color.setHex(value);
        }
      }
    };
    window.__galleryTestSnapshot = () => {
      resize();
      camera.position.set(player.x, player.y, player.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = -controls.yaw;
      camera.rotation.x = controls.pitch;
      rooms.update();
      rooms.render(renderer, camera);
      return renderer.domElement.toDataURL("image/png");
    };
  }

  function resize() {
    const width = sceneHost.clientWidth;
    const height = sceneHost.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < .7 ? 100 : 75;
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
    const dt = Math.min(elapsed, .2);
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
      rooms.move(desired);
    }

    rooms.update();
    if (rooms.mode === "hall") {
      const current = nearestSection(player, gallery.layout.sections).section.index + 1;
      if (current !== sectionNumber) {
        sectionNumber = current;
        status.textContent = `Gallery ${current} / 5`;
        announcement.textContent = `Gallery section ${current} of 5.`;
      }
    }

    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = -controls.yaw;
    camera.rotation.x = controls.pitch;
    gallery.animate(now / 1000, reducedMotion.matches);
    rooms.animate(now / 1000, reducedMotion.matches);
    roomTitle.hidden = rooms.mode !== "room";
    if (rooms.mode === "room") {
      status.textContent = `Room ${rooms.active.frame.label}`;
    }
    rooms.render(renderer, camera);
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
    galleryMusic.begin();
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
