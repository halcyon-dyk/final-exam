class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  preload() {
    this.load.image("successBackground", "js/images/%ED%83%88%EC%B6%9C%EC%84%B1%EA%B3%B5-%EC%A0%81%EC%9A%A9.png");
    this.load.image("failureBackground", "js/images/%ED%83%88%EC%B6%9C%EC%8B%A4%ED%8C%A8-%EC%A0%81%EC%9A%A9.png");
  }

  init(data) {
    this.success = data.success === true;
  }

  create() {
    const { width, height } = this.scale;
    const state = window.gameState;
    const score = this.success ? Math.max(0, 1000 + state.timeRemaining * 5 - state.hintUses * 100) : 0;

    if (this.success) {
      window.audioManager.stopBackground();
      window.audioManager.playEffect("success");
      this.cameras.main.setBackgroundColor("#111315");
      this.add.image(width / 2, height / 2, "successBackground").setDisplaySize(width, height);

      const valueStyle = { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "24px" };
      this.add.text(width * 0.564, height * 0.442, `${Math.floor(state.timeRemaining / 60)}:${String(state.timeRemaining % 60).padStart(2, "0")}`, valueStyle).setOrigin(0.5);
      this.add.text(width * 0.564, height * 0.531, String(state.hintUses), valueStyle).setOrigin(0.5);
      this.add.text(width * 0.564, height * 0.615, String(score), valueStyle).setOrigin(0.5);

      const restart = this.add.rectangle(width * 0.501, height * 0.754, width * 0.22, height * 0.08, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      restart.on("pointerdown", () => this.restartGame(state));
      return;
    }

    window.audioManager.stopBackground();
    window.audioManager.playEffect("failure");
    this.cameras.main.setBackgroundColor("#111315");
    this.add.image(width / 2, height / 2, "failureBackground").setDisplaySize(width, height);
    this.add.text(width * 0.564, height * 0.531, String(state.hintUses), {
      color: "#d7d2c8",
      fontFamily: "sans-serif",
      fontSize: "24px",
    }).setOrigin(0.5);

    const restart = this.add.rectangle(width * 0.501, height * 0.754, width * 0.22, height * 0.08, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    restart.on("pointerdown", () => this.restartGame(state));
  }

  restartGame(state) {
    state.reset();
    state.clearSave();
    this.scene.start("GameScene");
  }
}

window.ResultScene = ResultScene;
