class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.4, "지하 시설 탈출", {
        color: "#1f2937",
        fontFamily: "sans-serif",
        fontSize: "48px",
      })
      .setOrigin(0.5);

    const startButton = this.add
      .rectangle(width / 2, height * 0.6, 220, 64, 0x2563eb)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height * 0.6, "시작", {
        color: "#ffffff",
        fontFamily: "sans-serif",
        fontSize: "28px",
      })
      .setOrigin(0.5);

    startButton.on("pointerdown", () => {
      window.gameState.reset();
      this.scene.start("GameScene");
    });
  }
}

window.StartScene = StartScene;
