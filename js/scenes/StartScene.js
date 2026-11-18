class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  preload() {
    this.load.image("startBackground", "js/images/starting%20page.png");
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "startBackground").setDisplaySize(width, height);

    this.addButtonArea(width / 2, height * 0.526, width * 0.23, height * 0.082, () => {
      window.gameState.reset();
      window.gameState.save();
      this.scene.start("GameScene");
    });

    if (localStorage.getItem("escapeGameState") !== null) {
      this.addButtonArea(width / 2, height * 0.631, width * 0.23, height * 0.082, () => {
        window.gameState.load();
        this.scene.start("GameScene");
      });
    }
  }

  addButtonArea(x, y, width, height, onClick) {
    this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onClick);
  }
}

window.StartScene = StartScene;
