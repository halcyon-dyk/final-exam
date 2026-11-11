class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#f3f6fb");
    this.add.text(24, 20, window.gameState.currentRoom, {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "28px",
    });

    this.add.text(24, height - 48, "◀", { color: "#374151", fontSize: "32px" }).setOrigin(0, 0.5);
    this.add.text(width - 24, height - 48, "▶", { color: "#374151", fontSize: "32px" }).setOrigin(1, 0.5);

    this.investigationPanel = new InvestigationPanel(this);
    this.inventoryPanel = new InventoryPanel(this, window.gameState);
    this.memoPanel = new MemoPanel(this, window.gameState);
    this.timerDisplay = new TimerDisplay(this, window.gameState);
    this.hintPanel = new HintPanel(this, window.gameState);
    this.feedback = new Feedback(this);
    this.prisonRoom = new PrisonRoom(this, this.investigationPanel, window.gameState);
    this.prisonRoom.create();

    this.createControl(24, 70, "조사", () => {
      this.investigationPanel.show("조사", "조사할 사물을 선택하세요.");
    });
    this.createControl(110, 70, "보관함", () => this.inventoryPanel.toggle());
    this.createControl(220, 70, "메모장", () => this.memoPanel.toggle());
    this.createControl(24, 112, "피드백", () => this.feedback.play("경고음이 울린다."));
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
