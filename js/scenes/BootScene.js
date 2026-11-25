class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    this.failed = false;
    window.oneStore.progress(0);
    this.load.on("progress", value => window.oneStore.progress(value));
    this.load.on("loaderror", () => { this.failed = true; });
    // One real loading phase, covering all three scenes before SDK start.
    StartScene.prototype.preload.call(this);
    GameScene.prototype.preload.call(this);
    ResultScene.prototype.preload.call(this);
  }

  async create() {
    if (this.failed) {
      document.getElementById("boot-status").textContent = "게임 파일을 불러오지 못했습니다. 새로고침해 주세요.";
      return;
    }
    await window.oneStore.finishLoading();
    this.scene.start("StartScene");
  }
}

window.BootScene = BootScene;
