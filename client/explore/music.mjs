const HALL_VOLUME = 0.42;

export class GalleryMusic {
  constructor(button, url, sceneMusic = null) {
    this.button = button;
    this.audio = new Audio();
    this.audio.preload = "none";
    this.audio.loop = true;
    this.audio.src = url;
    this.context = null;
    this.gain = null;
    this.started = false;
    this.enabled = false;
    this.inHall = true;
    this.sceneId = null;
    this.sceneMusic = sceneMusic;
    this.pageVisible = !document.hidden;
    this.fallbackFade = 0;
    this.button.addEventListener("click", () => this.toggle());
    this.audio.addEventListener("error", () => this.unavailable());
    this.updateButton();
  }

  updateButton() {
    const on = this.enabled;
    this.button.textContent = on ? "Sound on" : "Sound off";
    this.button.setAttribute("aria-pressed", String(on));
    this.button.setAttribute("aria-label", on ? "Turn music off" : "Turn music on");
  }

  prepareOutput() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.audio.volume = 0;
      return;
    }
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.gain.gain.value = 0;
    this.context.createMediaElementSource(this.audio).connect(this.gain).connect(this.context.destination);
  }

  fadeTo(target, seconds) {
    if (this.gain) {
      const level = this.gain.gain;
      const now = this.context.currentTime;
      if (typeof level.cancelAndHoldAtTime === "function") level.cancelAndHoldAtTime(now);
      else {
        const current = level.value;
        level.cancelScheduledValues(now);
        level.setValueAtTime(current, now);
      }
      level.linearRampToValueAtTime(target, now + seconds);
      return;
    }
    cancelAnimationFrame(this.fallbackFade);
    const initial = this.audio.volume;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / (seconds * 1000));
      this.audio.volume = initial + (target - initial) * progress;
      if (progress < 1) this.fallbackFade = requestAnimationFrame(animate);
    };
    this.fallbackFade = requestAnimationFrame(animate);
  }

  async playWithFade(seconds) {
    try {
      // Resume and play are both initiated inside the user's click handler.
      this.prepareOutput();
      const resumed = this.context?.resume();
      const playing = this.audio.play();
      await Promise.all([resumed, playing]);
      if (!this.enabled) return;
      this.fadeTo(this.inHall && this.pageVisible ? HALL_VOLUME : 0, seconds);
      this.updateButton();
    } catch (error) {
      console.warn("Gallery music could not start", error);
      this.unavailable();
    }
  }

  begin() {
    if (this.started) return;
    this.started = true;
    this.enabled = true;
    this.syncScene();
    void this.playWithFade(4);
  }

  toggle() {
    if (!this.started || !this.enabled) {
      this.started = true;
      this.enabled = true;
      this.syncScene();
      void this.playWithFade(1.8);
    } else {
      this.enabled = false;
      this.syncScene();
      this.fadeTo(0, .45);
      this.updateButton();
      window.setTimeout(() => {
        if (!this.enabled) this.audio.pause();
      }, 550);
    }
  }

  syncScene() {
    this.sceneMusic?.setActive(this.enabled && this.pageVisible && this.sceneId === "01");
  }

  setLocation(mode, frameId) {
    this.inHall = mode === "hall";
    this.sceneId = this.inHall ? null : frameId;
    this.syncScene();
    if (this.enabled && !this.audio.paused) {
      this.fadeTo(this.inHall && this.pageVisible ? HALL_VOLUME : 0, 1.25);
    }
  }

  setPageVisible(visible) {
    this.pageVisible = visible;
    this.syncScene();
    if (!visible) {
      this.fadeTo(0, .1);
      this.audio.pause();
    } else if (this.enabled) void this.playWithFade(1.25);
  }

  unavailable() {
    // A failed hallway MP3 must not disable the independent scene recording.
    this.audio.pause();
    this.updateButton();
  }

  stop() {
    this.enabled = false;
    this.syncScene();
    this.audio.pause();
    if (this.gain) this.gain.gain.value = 0;
    this.updateButton();
  }
}
