let widgetAPI;

function loadWidgetAPI() {
  if (window.SC?.Widget) return Promise.resolve(window.SC.Widget);
  if (widgetAPI) return widgetAPI;
  widgetAPI = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 12000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      widgetAPI = null;
      reject(new Error("The piano player could not load"));
    }
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.SC?.Widget) resolve(window.SC.Widget);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return widgetAPI;
}

// Stream through the artist's public player. No recording is copied into the
// site, and neither the widget nor its API is requested before room 01 entry.
export class SceneMusic {
  constructor(panel) {
    this.panel = panel;
    this.mount = panel.querySelector(".scene-music-player");
    this.status = panel.querySelector(".scene-music-status");
    this.active = false;
    this.ready = false;
    this.playing = false;
    this.position = 0;
    this.generation = 0;
    this.widget = null;
    this.loadTimeout = 0;
    this.playTimeout = 0;
  }

  removePlayer() {
    if (this.widget) {
      this.widget.pause();
      for (const event of Object.values(window.SC.Widget.Events)) this.widget.unbind(event);
    }
    // Removing the iframe also stops a pending or disconnected player, without
    // relying on an asynchronous pause message reaching a third-party iframe.
    this.mount.replaceChildren();
    this.widget = null;
  }

  setActive(active) {
    if (this.active === active) return;
    this.active = active;
    const generation = ++this.generation;
    window.clearTimeout(this.loadTimeout);
    window.clearTimeout(this.playTimeout);
    this.removePlayer();
    this.ready = false;
    this.playing = false;
    this.position = 0;
    this.panel.hidden = !active;
    if (!active) return;
    this.status.textContent = "Loading piano…";
    void this.load(generation);
  }

  async load(generation) {
    const current = () => this.active && generation === this.generation;
    try {
      const Widget = await loadWidgetAPI();
      if (!current()) return;
      const iframe = document.createElement("iframe");
      const params = new URLSearchParams({
        url: this.panel.dataset.trackUrl,
        auto_play: "false", visual: "false", show_artwork: "false",
        hide_related: "true", show_comments: "false", show_reposts: "false",
        show_playcount: "false", color: "#627c91",
      });
      iframe.src = `https://w.soundcloud.com/player/?${params}`;
      iframe.title = "Part of Your World — instrumental piano by Benny Martin";
      iframe.allow = "autoplay; encrypted-media";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.height = "166";
      this.mount.append(iframe);
      const widget = Widget(iframe);
      this.widget = widget;
      this.loadTimeout = window.setTimeout(() => {
        if (current()) this.unavailable();
      }, 60000);
      widget.bind(Widget.Events.READY, () => {
        if (!current()) return;
        window.clearTimeout(this.loadTimeout);
        this.ready = true;
        widget.setVolume(35);
        widget.play();
        this.status.textContent = "";
        this.playTimeout = window.setTimeout(() => {
          if (current() && !this.playing) this.status.textContent = "Tap Play for piano.";
        }, 3500);
      });
      widget.bind(Widget.Events.PLAY, () => {
        if (!current()) { widget.pause(); return; }
        this.playing = true;
        this.status.textContent = "";
        window.clearTimeout(this.playTimeout);
      });
      widget.bind(Widget.Events.PAUSE, () => {
        if (current()) this.playing = false;
      });
      widget.bind(Widget.Events.PLAY_PROGRESS, (event) => {
        if (current()) this.position = event.currentPosition / 1000;
      });
      widget.bind(Widget.Events.FINISH, () => {
        if (!current()) return;
        widget.seekTo(0);
        widget.play();
      });
      widget.bind(Widget.Events.ERROR, () => {
        if (current()) this.unavailable();
      });
    } catch (error) {
      if (current()) {
        console.warn("Scene piano could not start", error);
        this.unavailable();
      }
    }
  }

  unavailable() {
    window.clearTimeout(this.loadTimeout);
    window.clearTimeout(this.playTimeout);
    ++this.generation;
    this.removePlayer();
    this.ready = false;
    this.playing = false;
    this.status.textContent = "Piano unavailable here. Listen using the link above.";
  }
}
