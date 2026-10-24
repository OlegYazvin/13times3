import test from "node:test";
import assert from "node:assert/strict";
import { GalleryMusic } from "../client/explore/music.mjs";
import { SceneMusic } from "../client/explore/scene-music.mjs";

function environment(t) {
  const timers = [];
  const widgets = [];
  const events = Object.fromEntries(["READY", "PLAY", "PAUSE", "PLAY_PROGRESS", "FINISH", "ERROR"].map(x => [x, x]));
  function Widget(iframe) {
    const handlers = {};
    const widget = {
      iframe, handlers, plays: 0, pauses: 0,
      bind(name, fn) { handlers[name] = fn; },
      unbind() {},
      play() { this.plays++; }, pause() { this.pauses++; },
      seekTo(time) { this.seek = time; }, setVolume(volume) { this.volume = volume; },
    };
    widgets.push(widget);
    return widget;
  }
  Widget.Events = events;
  class Audio {
    paused = true;
    volume = 0;
    addEventListener() {}
    async play() { this.paused = false; }
    pause() { this.paused = true; }
  }
  class AudioContext {
    currentTime = 0;
    createGain() {
      return { gain: { value: 0, cancelAndHoldAtTime() {},
        linearRampToValueAtTime(value) { this.value = value; } }, connect() {} };
    }
    createMediaElementSource() { return { connect: gain => ({ connect() {} }) }; }
    async resume() {}
  }
  t.mock.method(globalThis, "setTimeout", fn => { timers.push(fn); return timers.length; });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const original = Object.fromEntries(["window", "document", "Audio"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, {
    Audio,
    window: { AudioContext, SC: { Widget }, setTimeout, clearTimeout },
    document: { hidden: false, createElement: () => ({}) },
  });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const mount = { children: [], append(iframe) { this.children.push(iframe); }, replaceChildren() { this.children = []; } };
  const status = { textContent: "" };
  const panel = { hidden: true, dataset: { trackUrl: "https://api.soundcloud.com/tracks/231167340" },
    querySelector: selector => selector.endsWith("player") ? mount : status };
  const scene = new SceneMusic(panel);
  const button = { textContent: "", setAttribute() {}, addEventListener() {} };
  const music = new GalleryMusic(button, "/hall.mp3", scene);
  return { music, scene, panel, mount, status, widgets, timers, button };
}

test("the piano is lazy and exclusive to entered room 01; returning restores the hall", async t => {
  const { music, scene, widgets, panel } = environment(t);
  music.begin();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(widgets.length, 0);
  music.setLocation("hall", "01"); // A nearby loaded model is not entry.
  assert.equal(scene.active, false);
  for (let id = 2; id <= 12; id++) {
    music.setLocation("room", String(id).padStart(2, "0"));
    assert.equal(scene.active, false);
  }
  music.setLocation("room", "01");
  await Promise.resolve();
  const widget = widgets[0];
  widget.handlers.READY(); widget.handlers.PLAY();
  assert.equal(scene.playing, true);
  assert.equal(widget.volume, 35);
  assert.equal(music.gain.gain.value, 0);
  music.setLocation("hall", "01");
  assert.equal(panel.hidden, true);
  assert.equal(scene.playing, false);
  assert.equal(music.gain.gain.value, .42);
  assert.ok(widget.pauses > 0);
});

test("Sound off survives portal transitions, and stale READY/FINISH cannot restart removed audio", async t => {
  const { music, scene, mount, widgets } = environment(t);
  music.begin();
  music.setLocation("room", "01");
  await Promise.resolve();
  const widget = widgets[0];
  music.toggle();
  music.setLocation("hall"); music.setLocation("room", "02"); music.setLocation("room", "01");
  widget.handlers.READY(); widget.handlers.FINISH();
  assert.equal(widget.plays, 0);
  assert.equal(mount.children.length, 0);
  assert.equal(scene.active, false);
  assert.equal(music.enabled, false);
  music.toggle();
  await Promise.resolve();
  assert.equal(widgets.length, 2);
  assert.equal(scene.active, true);
});

test("exiting while the widget API is pending never creates a late player", async t => {
  const { music, widgets, mount } = environment(t);
  music.begin(); music.setLocation("room", "01"); music.setLocation("hall");
  await Promise.resolve();
  assert.equal(widgets.length, 0);
  assert.equal(mount.children.length, 0);
});

test("backgrounding and fallback stop the piano; hallway audio failure does not disable it", async t => {
  const { music, scene, widgets, mount } = environment(t);
  music.begin(); music.setLocation("room", "01");
  await Promise.resolve();
  widgets[0].handlers.READY(); widgets[0].handlers.PLAY();
  music.unavailable();
  assert.equal(music.enabled, true);
  assert.equal(scene.playing, true);
  music.setPageVisible(false);
  assert.equal(scene.active, false);
  assert.equal(music.audio.paused, true);
  music.setPageVisible(true);
  await Promise.resolve();
  assert.equal(scene.active, true);
  music.stop();
  assert.equal(mount.children.length, 0);
  assert.equal(music.enabled, false);
});

test("a provider failure removes its media and records the credits source", async t => {
  const { music, widgets, mount, status } = environment(t);
  music.begin(); music.setLocation("room", "01");
  await Promise.resolve();
  const widget = widgets[0];
  widget.handlers.ERROR(); widget.handlers.READY();
  assert.equal(mount.children.length, 0);
  assert.equal(widget.plays, 0);
  assert.match(status.textContent, /unavailable/);
  music.setLocation("hall");
  assert.equal(music.enabled, true);
});

test("a blocked background player retries on a genuine gesture without claiming playback", async t => {
  const { music, scene, widgets, timers, status, mount } = environment(t);
  music.begin(); music.setLocation("room", "01");
  await Promise.resolve();
  widgets[0].handlers.READY();
  timers.at(-1)();
  assert.equal(scene.playing, false);
  assert.equal(mount.children.length, 1);
  assert.match(status.textContent, /next movement or touch/);
  const plays=widgets[0].plays;
  scene.resumeFromGesture();assert.equal(widgets[0].plays,plays+1);
  assert.equal(mount.children[0].tabIndex,-1,'The background provider cannot steal keyboard focus');
  widgets[0].handlers.PLAY();
  assert.equal(scene.playing, true);
  assert.equal(status.textContent, "");
});
