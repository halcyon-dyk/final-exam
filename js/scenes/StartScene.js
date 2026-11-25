class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  preload() {
    this.load.image("startBackground", "js/images/start-background.png");
  }

  create() {
    const { width, height } = this.scale;
    if (!this.textures.exists("startBackground")) {
      this.add.text(width / 2, height / 2, "시작 화면 이미지를 불러오지 못했습니다.\n새로고침해 다시 시도해 주세요.", {fontFamily:"sans-serif",fontSize:"20px",color:"#d7d2c8",backgroundColor:"#111315",align:"center",wordWrap:{width:width-32}}).setOrigin(0.5);
      return;
    }
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
    const placements = this.children.list.map(object => ({object, x:object.x/width, y:object.y/height, w:object.displayWidth/width, h:object.displayHeight/height}));
    const resize = ({width, height}) => {
      placements.forEach(({object,x,y,w,h}) => object.setPosition(x*width,y*height).setDisplaySize(w*width,h*height));
    };
    this.scale.on("resize", resize);
    this.events.once("shutdown", () => this.scale.off("resize", resize));
  }

  addButtonArea(x, y, width, height, onClick) {
    this.add.rectangle(x, y, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onClick);
  }
}

window.StartScene = StartScene;
