import {subjectMeshesInRoot} from './subject-meshes.mjs';
import * as THREE from "three";
import { GalleryControls } from "./controls.mjs";
import { createGalleryScene } from "./gallery-scene.mjs";
import { GalleryMusic } from "./music.mjs";
import { SceneMusic } from "./scene-music.mjs";
import {FlameAudio} from './flame-audio.mjs';
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
let flameAudio;

function showFallback(message) {
  galleryMusic?.stop();
  flameAudio?.stop();
  fallback.hidden = false;
  welcome.hidden = true;
  musicButton.hidden = true;
  document.getElementById("joystick").hidden = true;
  document.getElementById("look-hint").hidden = true;
  announcement.textContent = message;
}

try {
  const sceneMusic = new SceneMusic(document.getElementById("scene-music"));
  galleryMusic = new GalleryMusic(musicButton, experience.dataset.musicUrl, sceneMusic);
  document.addEventListener("visibilitychange", () => {galleryMusic.setPageVisible(!document.hidden);if(document.hidden)flameAudio?.silence();});
  window.addEventListener("pagehide", () => {galleryMusic.stop();flameAudio?.stop();});
  const manifest = JSON.parse(document.getElementById("gallery-data").textContent);
  const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true,
    powerPreference: "high-performance" });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight);
  sceneHost.append(renderer.domElement);
  const gallery = createGalleryScene(manifest, experience.dataset.basePath, experience.dataset.roomVersion);
  flameAudio=new FlameAudio(galleryMusic,gallery.museum.sites);
  window.addEventListener('pageshow',event=>{if(event.persisted)flameAudio=new FlameAudio(galleryMusic,gallery.museum.sites);});

  const camera = new THREE.PerspectiveCamera(75, 1, .05, 120);
  const player = { x: 0, y: EYE_HEIGHT, z: -.8 };
  const controls = new GalleryControls(
    renderer.domElement,
    document.getElementById("joystick"),
    document.getElementById("joystick-knob"),
  );
  controls.yaw = 0;
  const rooms = new RoomManager({
    gallery, player,
    assetBase: experience.dataset.basePath,
    assetVersion: experience.dataset.roomVersion,
    announce(message) { announcement.textContent = message; },
    onModeChange(mode, frame) {
      galleryMusic.setLocation(mode, frame?.id);
      roomTitle.hidden = mode !== "room";
      roomTitle.textContent = mode === "room" ? frame.room.title || `Room ${frame.label}` : "";
      status.textContent = mode === "room"
        ? `Room ${frame.label}`
        : `Gallery ${nearestSection(player, gallery.layout.sections).section.index + 1} / ${gallery.layout.sections.length}`;
    },
  });
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    window.__galleryTestSubjectMeshes = () => rooms.active?subjectMeshesInRoot(rooms.active.group):[];
    window.__galleryDebug = () => ({
      x: player.x, y: player.y, z: player.z, yaw: controls.yaw,
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
      storedFrameCount: gallery.layout.storedFrameCount,
      exhibitedFrames: gallery.layout.frames.map(f=>f.id),
      museum:{...gallery.museum.state,flameCount:gallery.museum.sites.length,lights:gallery.museum.lights.map(l=>({position:l.position.toArray(),intensity:l.intensity})),fixtureLights:gallery.museum.fixtureLights.map(l=>({name:l.name,position:l.position.toArray(),intensity:l.intensity})),fixtures:gallery.museum.fixtures,colliders:gallery.colliders,audioLevels:flameAudio.levels,audioVoices:flameAudio.voices.length,drawCalls:renderer.info.render.calls},
      music: {
        started: galleryMusic.started,
        enabled: galleryMusic.enabled,
        playing: !galleryMusic.audio.paused,
        time: galleryMusic.audio.currentTime,
        level: galleryMusic.gain?.gain.value ?? galleryMusic.audio.volume,
        sceneId: galleryMusic.sceneId,
        sceneActive: sceneMusic.active,
        sceneReady: sceneMusic.ready,
        scenePlaying: sceneMusic.playing,
        sceneTime: sceneMusic.position,
      },
    });
    window.__galleryTestPose = (x, z, yaw,pitch=0) => {
      Object.assign(player, { x, z });
      controls.yaw = yaw;
      controls.pitch=pitch;
      rooms.setMode("hall");
    };
    window.__galleryTestRoomPose = (x, z, yaw, pitch = 0) => {
      if (!rooms.active) return;
      Object.assign(player, rooms.roomToWorld({ x, z }));
      controls.yaw = yaw;
      controls.pitch = pitch;
      rooms.setMode("room");
      rooms.syncElevation(true);
    };
    window.__galleryTestRoomCanStand = (x, z) =>
      rooms.canStand(rooms.roomToWorld({ x, z }), "room");
    window.__galleryTestWorldMove = (x, z) =>
      rooms.move({ x, z });
    window.__galleryTestHallCanStand=(x,z)=>rooms.canStand({x,z},'hall');
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
        status.textContent = `Gallery ${current} / ${gallery.layout.sections.length}`;
        announcement.textContent = `Gallery section ${current} of ${gallery.layout.sections.length}: ${gallery.layout.sections[current-1].title}.`;
      }
    }

    camera.position.set(player.x, player.y, player.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = -controls.yaw;
    camera.rotation.x = controls.pitch;
    gallery.animate(now / 1000, reducedMotion.matches,player);
    flameAudio.update(player,controls.yaw,rooms.mode==='hall',!document.hidden,now/1000);
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
    if(event.code==='Escape'&&fallback.hidden){if(welcome.hidden)openHelp();else closeHelp();}
  });
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label", "Jane's Year Exhibit. Use W A S D or arrow keys to move and drag to look. Help has full instructions.");
  // The exhibit opens directly in the architectural entrance. Audio unlocks
  // on the first genuine movement/look interaction, without a start overlay.
  const soundGesture=()=>{galleryMusic.begin();sceneMusic.resumeFromGesture();};
  renderer.domElement.addEventListener('pointerdown',soundGesture,{capture:true});
  document.getElementById('joystick').addEventListener('pointerdown',soundGesture,{capture:true});
  window.addEventListener('keydown',event=>{if(/^(Key[WASD]|Arrow(Up|Down|Left|Right))$/.test(event.code))soundGesture();});
  controls.setEnabled(true);
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
