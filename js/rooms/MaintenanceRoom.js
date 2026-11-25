class MaintenanceRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;
    this.createBackground(stage);
    this.createObject(stage.x + stage.width * 0.27, stage.y + stage.height * 0.45, stage.width * 0.23, stage.height * 0.14, "손전등 본체", "작업대에 놓인 손전등 본체다.", () => this.collectPart("손전등 본체"));
    this.createObject(stage.x + stage.width * 0.84, stage.y + stage.height * 0.55, stage.width * 0.16, stage.height * 0.18, "배터리", "공구함 안에 든 배터리다.", () => this.collectPart("배터리"));
    this.createObject(stage.x + stage.width * 0.58, stage.y + stage.height * 0.76, stage.width * 0.42, stage.height * 0.28, "어두운 벽면", "빛을 비추면 무언가 드러날 것 같다.", () => this.useFlashlight());
  }

  createBackground(stage) {
    const texture = this.scene.textures.get("maintenanceBackground");
    if (!texture.has("roomView")) {
      const source = texture.getSourceImage();
      const roomLeft = Math.round(source.width * (78 / 1366));
      const roomTop = Math.round(source.height * (164 / 768));
      const roomWidth = Math.round(source.width * (840 / 1366));
      texture.add("roomView", 0, roomLeft, roomTop, roomWidth, source.height - roomTop);
    }
    this.scene.add.image(
      stage.x + stage.width / 2,
      stage.y + stage.height / 2,
      "maintenanceBackground",
      "roomView",
    ).setDisplaySize(stage.width, stage.height);
  }

  collectPart(part) {
    if (this.state.hasItem(part) || this.state.hasItem("손전등")) return;
    this.state.addItem(part);
    if (this.scene.inventoryPanel.background.visible) {
      this.scene.inventoryPanel.render();
    }
  }

  useFlashlight() {
    if (this.state.selectedItem !== "손전등") {
      this.panel.show("어두운 벽면", "완성된 손전등을 선택해 비춰 보세요.");
      return;
    }
    this.state.solvePuzzle("배선도");
    this.state.solvePuzzle("통제실 통로");
    this.state.addNote("숨겨진 배선도: A→2, B→3, C→1");
    this.feedback.play("숨겨진 배선도가 드러나 통제실 통로가 열렸다.", "flashlight");
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0xd79a32, 0.01).setInteractive({ useHandCursor: true });
    object.on("pointerdown", () => {
      this.panel.show(label, message);
      onInspect?.();
    });
  }
}

window.MaintenanceRoom = MaintenanceRoom;
