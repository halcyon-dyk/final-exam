class MaintenanceRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;
    this.scene.add.rectangle(stage.x + stage.width / 2, stage.y + stage.height / 2, stage.width, stage.height, 0xb6c2cf);
    this.createObject(stage.x + stage.width * 0.32, stage.y + stage.height * 0.38, 150, 90, "손전등 본체", "작업대에 놓인 손전등 본체다.", () => this.collectPart("손전등 본체"));
    this.createObject(stage.x + stage.width * 0.7, stage.y + stage.height * 0.52, 110, 55, "배터리", "공구함 안에 든 배터리다.", () => this.collectPart("배터리"));
    this.createObject(stage.x + stage.width * 0.48, stage.y + stage.height * 0.66, 180, 70, "어두운 벽면", "빛을 비추면 무언가 드러날 것 같다.", () => this.useFlashlight());
  }

  collectPart(part) {
    if (this.state.hasItem(part)) return;
    this.state.addItem(part);
  }

  useFlashlight() {
    if (this.state.selectedItem !== "손전등") {
      this.panel.show("어두운 벽면", "완성된 손전등을 선택해 비춰 보세요.");
      return;
    }
    this.state.solvePuzzle("배선도");
    this.state.solvePuzzle("통제실 통로");
    this.state.addNote("숨겨진 배선도: A→2, B→3, C→1");
    this.feedback.play("숨겨진 배선도가 드러나 통제실 통로가 열렸다.");
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0x64748b).setInteractive({ useHandCursor: true });
    this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "21px" }).setOrigin(0.5);
    object.on("pointerdown", () => {
      onInspect?.();
      this.panel.show(label, message);
    });
  }
}

window.MaintenanceRoom = MaintenanceRoom;
