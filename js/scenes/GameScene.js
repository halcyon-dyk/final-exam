class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("prisonBackground", "js/images/%EA%B0%90%EA%B8%88%EC%8B%A4.png");
    this.load.image("maintenanceBackground", "js/images/%EC%A0%95%EB%B9%84%EC%8B%A4-%EC%A0%81%EC%9A%A9.png");
    this.load.image("controlBackground", "js/images/%ED%86%B5%EC%A0%9C%EC%8B%A4-%EC%A0%81%EC%9A%A9.png");
    this.load.audio("scribbleSound", "js/audio/effects/pencil-writing.mp3");
    this.load.audio("paperSound", "js/audio/effects/paper-rustle.mp3");
    this.load.audio("metalSound", "js/audio/effects/metal-knock.mp3");
    this.load.audio("unlockSound", "js/audio/effects/padlock-open.mp3");
    this.load.audio("screwdriverSound", "js/audio/effects/ratchet-screwdriver.mp3");
    this.load.audio("flashlightSound", "js/audio/effects/flashlight-switch.mp3");
    this.load.audio("powerRestoreSound", "js/audio/effects/power-restore.mp3");
    this.load.audio("doorOpenSound", "js/audio/effects/security-door-open.mp3");
    this.load.audio("prisonAmbience", "js/audio/background/prison-drone.mp3");
    this.load.audio("maintenanceAmbience", "js/audio/background/maintenance-machinery.mp3");
    this.load.audio("controlAmbience", "js/audio/background/control-computers.mp3");
  }

  create() {
    window.watchResize(this);
    this.pausedForMenu = false;
    const { width, height } = this.scale;
    this.state = window.gameState;
    this.layout = new Layout(width, height);
    window.audioManager.setSoundManager(this.sound);
    window.audioManager.setRoom(this.state.currentRoom);

    const isDarkRoom = ["감금실", "정비실", "통제실"].includes(this.state.currentRoom);
    this.cameras.main.setBackgroundColor(isDarkRoom ? "#111315" : "#f3f6fb");
    this.add.text(24, 20, this.state.currentRoom, {
      color: isDarkRoom ? "#d7d2c8" : "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "28px",
    }).setDepth(20);
    this.previousArrow = this.add.text(24, height - 48, "◀", { color: isDarkRoom ? "#d7d2c8" : "#374151", fontSize: "32px" })
      .setOrigin(0, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.previousArrow.on("pointerdown", () => { window.audioManager.playEffect("click"); this.moveToPreviousRoom(); });
    this.nextArrow = this.add.text(width - 24, height - 48, "▶", { color: isDarkRoom ? "#d7d2c8" : "#374151", fontSize: "32px" })
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.nextArrow.on("pointerdown", () => { window.audioManager.playEffect("click"); this.moveToNextRoom(); });

    this.investigationPanel = new InvestigationPanel(this);
    this.inventoryPanel = new InventoryPanel(this, this.state, this.layout, (item) => this.finishCombine(item));
    this.memoPanel = new MemoPanel(this, this.state, this.layout);
    this.timerDisplay = new TimerDisplay(this, this.state, () => this.scene.start("ResultScene", { success: false }));
    this.hintPanel = new HintPanel(this, this.state);
    this.feedback = new Feedback(this);
    this.createRoom();

    this.createToolbar(width);
    this.createControl(62, 112, 88, "일시정지", "14px", () => this.showMenu(false));
    this.createControl(158, 112, 88, "도움말", "14px", () => this.showMenu(true));
  }

  showMenu(help) {
    if (this.pausedForMenu) return;
    this.pausedForMenu = true;
    const {width, height} = this.scale;
    const elements = [];
    const add = e => { e.setDepth(500); elements.push(e); return e; };
    add(this.add.rectangle(width / 2, height / 2, 350, 280, 0x30363a));
    add(this.add.text(width / 2, height / 2 - 100, help ? "사물 조사 → 도구 선택 → 사용\n조합: 도구 선택 → 조합 → 다른 도구\n메모장과 힌트에서 단서를 확인하세요.\n이 화면에서는 시간이 멈춥니다." : "일시정지\n시간이 멈췄습니다.", {fontSize:"18px",color:"#d7d2c8",align:"center",wordWrap:{width:320}}).setOrigin(0.5,0));
    const toggle = add(this.add.text(width / 2, height / 2 + 55, "", {fontSize:"18px",color:"#d79a32"}).setOrigin(0.5).setInteractive({useHandCursor:true}));
    const refresh = () => toggle.setText(`깜빡임: ${localStorage.getItem("escapeDisableFlash") === "true" ? "꺼짐" : "켜짐"}`);
    refresh();
    toggle.on("pointerdown", () => {localStorage.setItem("escapeDisableFlash", String(localStorage.getItem("escapeDisableFlash") !== "true"));refresh();});
    add(this.add.text(width / 2, height / 2 + 105, "계속하기", {fontSize:"22px",color:"#d7d2c8"}).setOrigin(0.5).setInteractive({useHandCursor:true})).on("pointerdown", () => {elements.forEach(e=>e.destroy());this.pausedForMenu=false;});
    window.fitDialog(this,elements);
  }

  createRoom() {
    const rooms = {
      감금실: PrisonRoom,
      정비실: MaintenanceRoom,
      통제실: ControlRoom,
    };
    new rooms[this.state.currentRoom](this, this.investigationPanel, this.state, this.feedback).create();
  }

  moveToNextRoom() {
    const nextRooms = {
      감금실: ["정비실", "정비실 통로"],
      정비실: ["통제실", "통제실 통로"],
    };
    const nextRoom = nextRooms[this.state.currentRoom];
    if (!nextRoom) {
      this.investigationPanel.show("이동", "더 이상 이동할 통로가 없다.");
      return;
    }
    if (!this.state.isSolved(nextRoom[1])) {
      this.investigationPanel.show("이동", "통로가 아직 열리지 않았다.");
      return;
    }

    this.state.setRoom(nextRoom[0]);
    this.scene.restart();
  }

  moveToPreviousRoom() {
    const previousRooms = { 정비실: "감금실", 통제실: "정비실" };
    const previousRoom = previousRooms[this.state.currentRoom];
    if (!previousRoom) {
      this.investigationPanel.show("이동", "이전 공간이 없다.");
      return;
    }
    this.state.setRoom(previousRoom);
    this.scene.restart();
  }

  beginCombine() {
    if (!this.state.selectedItem) {
      this.investigationPanel.show("조합", "보관함에서 먼저 조합할 아이템을 선택하세요.");
      return;
    }
    this.state.combiningItem = this.state.selectedItem;
    this.investigationPanel.show("조합", "다른 아이템을 선택하세요.");
  }

  finishCombine(item) {
    const first = this.state.combiningItem;
    if (!first || first === item) return;
    this.state.combiningItem = null;
    if ([first, item].includes("손전등 본체") && [first, item].includes("배터리")) {
      this.state.removeItem("손전등 본체");
      this.state.removeItem("배터리");
      this.state.addItem("손전등");
      this.state.selectItem("손전등");
      this.feedback.play("손전등이 완성되었다.", "flashlight");
      this.inventoryPanel.render();
      return;
    }
    this.investigationPanel.show("조합", "조합할 수 없는 아이템입니다.");
  }

  createToolbar(screenWidth) {
    const controls = [
      ["조사", () => this.investigationPanel.show("조사", "조사할 사물을 선택하세요.")],
      ["보관함", () => { this.memoPanel.hide(); this.inventoryPanel.toggle(); }],
      ["메모장", () => { this.inventoryPanel.hide(); this.memoPanel.toggle(); }],
      ["피드백", () => this.feedback.play("경고음이 울린다.")],
      ["조합", () => this.beginCombine()],
    ];
    const gap = 6;
    const toolbarWidth = Math.min(screenWidth - 24, 600);
    const buttonWidth = (toolbarWidth - gap * (controls.length - 1)) / controls.length;
    const startX = (screenWidth - toolbarWidth) / 2 + buttonWidth / 2;
    const fontSize = screenWidth < 600 ? "14px" : "16px";

    controls.forEach(([label, onClick], index) => {
      this.createControl(startX + index * (buttonWidth + gap), 76, buttonWidth, label, fontSize, onClick);
    });
  }

  createControl(x, y, width, label, fontSize, onClick) {
    const control = this.add.rectangle(x, y, width, 40, 0x30363a).setStrokeStyle(2, 0xd79a32).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      color: "#d7d2c8",
      fontFamily: "sans-serif",
      fontSize,
    }).setOrigin(0.5);
    control.on("pointerdown", () => {
      window.audioManager.playEffect("click");
      onClick();
    });
  }
}

window.GameScene = GameScene;
