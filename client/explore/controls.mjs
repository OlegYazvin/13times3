const LOOK_SENSITIVITY = .0035;
const PITCH_LIMIT = Math.PI * .39;
const LOOK_DEAD_ZONE = 10;
const LOOK_TRAVEL = 80;
const MAX_TURN_SPEED = 2.4;
const MAX_PITCH_SPEED = 1.35;

function lookAxis(distance) {
  const travel = Math.max(0, Math.abs(distance) - LOOK_DEAD_ZONE);
  return Math.sign(distance) * Math.min(1, travel / LOOK_TRAVEL);
}

export class GalleryControls {
  constructor(canvas, joystick, knob) {
    this.canvas = canvas;
    this.joystick = joystick;
    this.knob = knob;
    this.enabled = false;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.joyPointer = null;
    this.lookPointer = null;
    this.lastLook = null;
    this.lookOrigin = null;
    this.lookOffset = { x: 0, y: 0 };

    window.addEventListener("keydown", (event) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        if (this.enabled) {
          event.preventDefault();
          this.keys.add(event.code);
        }
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.resetInputs());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.resetInputs();
    });

    joystick.addEventListener("pointerdown", (event) => {
      if (!this.enabled) return;
      event.preventDefault();
      this.joyPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      this.updateJoystick(event);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.joyPointer) this.updateJoystick(event);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
      joystick.addEventListener(name, (event) => {
        if (event.pointerId === this.joyPointer) this.clearJoystick();
      });
    }

    canvas.addEventListener("pointerdown", (event) => {
      if (!this.enabled || this.lookPointer !== null) return;
      const touchLook = event.pointerType === "touch";
      const bounds = canvas.getBoundingClientRect();
      if (touchLook && event.clientX < bounds.left + bounds.width / 2) return;
      event.preventDefault();
      this.lookPointer = event.pointerId;
      this.lookOrigin = touchLook ? { x: event.clientX, y: event.clientY } : null;
      this.lookOffset = { x: 0, y: 0 };
      this.lastLook = touchLook ? null : { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.lookPointer || !this.enabled) return;
      if (this.lookOrigin) {
        this.lookOffset = {
          x: event.clientX - this.lookOrigin.x,
          y: event.clientY - this.lookOrigin.y,
        };
        return;
      }
      const dx = event.clientX - this.lastLook.x;
      const dy = event.clientY - this.lastLook.y;
      this.yaw += dx * LOOK_SENSITIVITY;
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch - dy * LOOK_SENSITIVITY));
      this.lastLook = { x: event.clientX, y: event.clientY };
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(name, (event) => {
        if (event.pointerId === this.lookPointer) {
          this.lookPointer = null;
          this.lastLook = null;
          this.lookOrigin = null;
          this.lookOffset = { x: 0, y: 0 };
        }
      });
    }
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.resetInputs();
  }

  resetInputs() {
    this.keys.clear();
    this.clearJoystick();
    this.lookPointer = null;
    this.lastLook = null;
    this.lookOrigin = null;
    this.lookOffset = { x: 0, y: 0 };
  }

  updateLook(dt) {
    if (!this.enabled || !this.lookOrigin) return;
    this.yaw += lookAxis(this.lookOffset.x) * MAX_TURN_SPEED * dt;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT,
      this.pitch - lookAxis(this.lookOffset.y) * MAX_PITCH_SPEED * dt));
  }

  clearJoystick() {
    this.joyPointer = null;
    this.joy = { x: 0, y: 0 };
    this.knob.style.transform = "translate(0, 0)";
  }

  updateJoystick(event) {
    const box = this.joystick.querySelector(".joystick-ring").getBoundingClientRect();
    const radius = box.width * .34;
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    const length = Math.max(1, Math.hypot(x, y));
    const scale = Math.min(1, radius / length);
    const dx = x * scale;
    const dy = y * scale;
    this.joy = { x: dx / radius, y: dy / radius };
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  getMovement() {
    if (!this.enabled) return { forward: 0, strafe: 0 };
    const forward = -this.joy.y + Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) - Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
    const strafe = this.joy.x + Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const magnitude = Math.max(1, Math.hypot(forward, strafe));
    return { forward: forward / magnitude, strafe: strafe / magnitude };
  }
}
