// Lifecycle order follows the ONE store H5 SDK sample; no ads or purchases.
export class OneStoreBridge {
  constructor(sdk) {
    this.sdk = sdk;
    this.enabled = false;
    this.paused = false;
    this.ringerSilent = false;
    this.started = false;
  }

  async initialize() {
    if (!this.sdk) return;
    this.sdk.on("pause", () => this.setPaused(true));
    this.sdk.on("resume", (event = {}) => {
      if (typeof event.ringerSilent === "boolean") this.ringerSilent = event.ringerSilent;
      this.setPaused(false);
    });
    this.sdk.on("exit", () => {
      // Do not overwrite a saved run from the title, or recreate a completed run.
      if (this.game?.scene.isActive("GameScene")) window.gameState.save();
    });
    this.sdk.onBackPressed(() => false);
    try {
      const info = await this.sdk.initializeAsync();
      if (info.err) {
        this.useBrowserMode();
        return;
      }
      this.enabled = true;
      this.ringerSilent = info.ringerSilent === true;
      if (info.safeArea) {
        for (const side of ["top", "bottom", "left", "right"]) {
          const inset = Math.max(0, Number(info.safeArea[side]) || 0);
          document.documentElement.style.setProperty(`--safe-${side}`, `${inset}px`);
        }
      }
    } catch (error) {
      console.warn("ONE store initialization failed", error.reason || error.message);
      this.useBrowserMode();
    }
  }

  useBrowserMode() {
    this.enabled = false;
    this.paused = false;
    this.ringerSilent = false;
  }

  progress(value) {
    const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));
    document.getElementById("boot-status").textContent = `시설을 불러오는 중… ${percentage}%`;
    if (this.enabled) this.sdk.setLoadingProgress(percentage);
  }

  async finishLoading() {
    this.progress(1);
    if (this.enabled) {
      try {
        const info = await this.sdk.startGameAsync();
        if (info?.err) this.useBrowserMode();
      } catch (error) {
        console.warn("ONE store start failed", error.reason || error.message);
        this.useBrowserMode();
      }
    }
    this.started = true;
    document.getElementById("boot-status").hidden = true;
    this.applyLifecycle();
  }

  attach(game) {
    this.game = game;
    this.applyLifecycle();
  }

  setPaused(paused) {
    this.paused = paused;
    this.applyLifecycle();
  }

  applyLifecycle() {
    if (!this.game) return;
    window.audioManager.setPlatformState(this.paused, this.ringerSilent);
    if (!this.started) return;
    this.game.input.enabled = !this.paused;
    if (this.appliedPause === this.paused) return;
    this.appliedPause = this.paused;
    if (this.paused) {
      this.game.sound.pauseAll();
      this.game.loop.sleep();
    } else {
      this.game.sound.resumeAll();
      this.game.loop.wake();
    }
  }
}
