class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;
    this.state = window.gameState;
    this.layout = new Layout(width, height);

    this.cameras.main.setBackgroundColor("#f3f6fb");
    this.add.text(24, 20, this.state.currentRoom, {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "28px",
    }).setDepth(20);
    this.add.text(24, height - 48, "◀", { color: "#9ca3af", fontSize: "32px" }).setOrigin(0, 0.5).setDepth(20);
    this.nextArrow = this.add.text(width - 24, height - 48, "▶", { color: "#374151", fontSize: "32px" })
      .setOrigin(1, 0.5)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });
    this.nextArrow.on("pointerdown", () => this.moveToNextRoom());

    this.investigationPanel = new InvestigationPanel(this);
    this.inventoryPanel = new InventoryPanel(this, this.state, this.layout);
    this.memoPanel = new MemoPanel(this, this.state, this.layout);
    this.timerDisplay = new TimerDisplay(this, this.state, () => this.scene.start("ResultScene", { success: false }));
    this.hintPanel = new HintPanel(this, this.state);
    this.feedback = new Feedback(this);
    this.createRoom();

    this.createControl(24, 70, "조사", () => this.investigationPanel.show("조사", "조사할 사물을 선택하세요."));
    this.createControl(110, 70, "보관함", () => { this.memoPanel.hide(); this.inventoryPanel.toggle(); });
    this.createControl(220, 70, "메모장", () => { this.inventoryPanel.hide(); this.memoPanel.toggle(); });
    this.createControl(24, 112, "피드백", () => this.feedback.play("경고음이 울린다."));
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

  createControl(x, y, label, onClick) {
    const width = label.length * 22 + 28;
    const control = this.add.rectangle(x + width / 2, y, width, 36, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y, label, {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "18px",
    }).setOrigin(0.5);
    control.on("pointerdown", onClick);
  }
}

window.GameScene = GameScene;
