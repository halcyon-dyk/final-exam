class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  preload() {
    this.load.image("startBackground", "js/images/starting%20page.png");
  }

  create() {
    window.watchResize(this);
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "startBackground").setDisplaySize(width, height);

    this.addButtonArea(width / 2, height * 0.526, width * 0.23, height * 0.082, () => {
      if (window.gameState.hasActiveSave() && !window.confirm("진행 중인 기록을 지우고 새 게임을 시작할까요?")) return;
      window.audioManager.playEffect("click");
      window.gameState.reset();
      window.gameState.save();
      this.scene.start("GameScene");
    });

    if (window.gameState.hasActiveSave()) {
      this.addButtonArea(width / 2, height * 0.631, width * 0.23, height * 0.082, () => {
        if (!window.gameState.load()) return;
        window.audioManager.playEffect("click");
        this.scene.start("GameScene");
      });
    } else {
      this.add.rectangle(width / 2, height * 0.631, width * 0.23, height * 0.082, 0x111315, 0.65);
    }
  }

  addButtonArea(x, y, width, height, onClick) {
    this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onClick);
  }
}

window.StartScene = StartScene;
