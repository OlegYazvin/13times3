import test from "node:test";
import assert from "node:assert/strict";
import { GalleryControls } from "../client/explore/controls.mjs";

function environment(t) {
  class Surface extends EventTarget {
    setPointerCapture() {}
    querySelector() { return { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) }; }
  }
  const originals = Object.fromEntries(["window", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const window = new EventTarget(), document = new EventTarget();
  Object.assign(globalThis, { window, document });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const canvas = new Surface(), joystick = new Surface();
  const controls = new GalleryControls(canvas, joystick, { style: {} });
  controls.setEnabled(true);
  function dispatch(target, type, fields) {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, fields);
    target.dispatchEvent(event);
  }
  const pointer = (type, x, y, pointerType = "mouse", target = canvas) =>
    dispatch(target, type, { clientX: x, clientY: y, pointerType, pointerId: 1 });
  return { controls, pointer, key: (type, code) => dispatch(window, type, { code }), joystick };
}

test("reversing mouse look changes horizontal direction without a camera jump or vertical change", t => {
  const { controls, pointer } = environment(t);
  const drag = () => {
    pointer("pointerdown", 100, 100);
    pointer("pointermove", 180, 130);
    pointer("pointerup", 180, 130);
    return { yaw: controls.yaw, pitch: controls.pitch };
  };
  assert.equal(controls.reverseLookX, false);
  const normal = drag();
  assert.ok(normal.yaw > 0 && normal.pitch < 0);
  controls.setReverseLookX(true);
  assert.equal(controls.yaw, normal.yaw, "Changing the option itself must not rotate the view");
  controls.yaw = controls.pitch = 0;
  assert.deepEqual(drag(), { yaw: -normal.yaw, pitch: normal.pitch });
  controls.setEnabled(false);
  controls.setEnabled(true);
  assert.equal(controls.reverseLookX, true, "Opening help must preserve the choice");
  controls.setReverseLookX(false);
  controls.yaw = controls.pitch = 0;
  assert.deepEqual(drag(), normal);
});

test("reversed touch look keeps turning while held, preserves pitch, and stops on release", t => {
  const { controls, pointer } = environment(t);
  const hold = () => {
    pointer("pointerdown", 100, 100, "touch");
    pointer("pointermove", 170, 140, "touch");
    controls.updateLook(.1);
    const firstYaw = controls.yaw;
    controls.updateLook(.1);
    assert.ok(Math.abs(controls.yaw) > Math.abs(firstYaw), "A held look stick continues turning");
    pointer("pointerup", 170, 140, "touch");
    const stopped = { yaw: controls.yaw, pitch: controls.pitch };
    controls.updateLook(.1);
    assert.deepEqual({ yaw: controls.yaw, pitch: controls.pitch }, stopped);
    return stopped;
  };
  const normal = hold();
  assert.ok(normal.yaw > 0 && normal.pitch < 0);
  controls.setReverseLookX(true);
  controls.yaw = controls.pitch = 0;
  assert.deepEqual(hold(), { yaw: -normal.yaw, pitch: normal.pitch });
});

test("horizontal look preference leaves keyboard and movement joystick directions unchanged", t => {
  const { controls, pointer, key, joystick } = environment(t);
  key("keydown", "KeyW");
  key("keydown", "ArrowRight");
  const keyboard = controls.getMovement();
  assert.ok(keyboard.forward > 0 && keyboard.strafe > 0);
  controls.setReverseLookX(true);
  assert.deepEqual(controls.getMovement(), keyboard);
  key("keyup", "KeyW");
  key("keyup", "ArrowRight");
  pointer("pointerdown", 80, 30, "touch", joystick);
  const touch = controls.getMovement();
  assert.ok(touch.forward > 0 && touch.strafe > 0);
  controls.setReverseLookX(false);
  assert.deepEqual(controls.getMovement(), touch);
  pointer("pointerup", 80, 30, "touch", joystick);
  assert.deepEqual(controls.getMovement(), { forward: 0, strafe: 0 });
});
