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
    // Metal button bounds in the 1548 × 1016 background image.
    const buttonX = width * 756 / 1548;
    const buttonWidth = width * 352 / 1548;
    const buttonHeight = height * 78 / 1016;
    const continueY = height * 651 / 1016;

    this.addButtonArea(buttonX, height * 541 / 1016, buttonWidth, buttonHeight, () => {
      if (window.gameState.hasActiveSave()) this.confirmNewGame();
      else this.startNewGame();
    });

    if (window.gameState.hasActiveSave()) {
      this.addButtonArea(buttonX, continueY, buttonWidth, buttonHeight, () => {
        if (!window.gameState.load()) return;
        window.audioManager.playEffect("click");
        this.scene.start("GameScene");
      });
    } else {
      this.add.rectangle(buttonX, continueY, buttonWidth, buttonHeight, 0x111315, 0.65);
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

  startNewGame() {
    window.audioManager.playEffect("click");
    window.gameState.reset();
    window.gameState.save();
    this.scene.start("GameScene");
  }

  confirmNewGame() {
    if (this.confirmElements?.length) return;
    const { width, height } = this.scale;
    const elements = this.confirmElements = [];
    const add = element => { elements.push(element.setDepth(500)); return element; };
    const close = () => { elements.forEach(element => element.destroy()); this.confirmElements = []; };
    add(this.add.rectangle(width / 2, height / 2, Math.min(360, width - 20), 220, 0x111315).setStrokeStyle(2, 0xd79a32));
    add(this.add.text(width / 2, height / 2 - 40, "진행 중인 기록을 지우고\n새 게임을 시작할까요?", { fontSize: "22px", color: "#d7d2c8", align: "center" }).setOrigin(0.5));
    [["취소", -65, close], ["새 게임", 65, () => { close(); this.startNewGame(); }]].forEach(([label, offset, action]) => {
      add(this.add.rectangle(width / 2 + offset, height / 2 + 55, 110, 44, 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true })).on("pointerdown", action);
      add(this.add.text(width / 2 + offset, height / 2 + 55, label, { fontSize: "18px", color: "#d7d2c8" }).setOrigin(0.5));
    });
    window.fitDialog(this, elements);
    this.events.once("shutdown", () => { this.confirmElements = []; });
  }
}

window.StartScene = StartScene;
