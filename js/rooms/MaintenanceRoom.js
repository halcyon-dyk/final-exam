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
    this.createObject(stage.x + stage.width * 0.32, stage.y + stage.height * 0.38, 150, 90, this.state.isSolved("환풍구") ? "열린 환풍구" : "환풍구", this.ventMessage(), () => this.openVent());
    this.createObject(stage.x + stage.width * 0.7, stage.y + stage.height * 0.52, 110, 55, "배터리", "손전등에 쓸 배터리다.", () => this.collectPart("배터리"));

    if (this.state.isSolved("환풍구") && !this.state.hasItem("전구") && !this.state.isSolved("손전등")) {
      this.createObject(stage.x + stage.width * 0.32, stage.y + stage.height * 0.58, 90, 42, "전구", "환풍구 안에서 전구를 발견했다.", () => this.collectPart("전구"));
    }
  }

  ventMessage() {
    return this.state.isSolved("환풍구") ? "환풍구가 열려 있다." : "나사로 고정된 환풍구다.";
  }

  openVent() {
    if (this.state.isSolved("환풍구")) return;
    if (this.state.selectedItem !== "드라이버") {
      this.panel.show("환풍구", "드라이버가 필요하다.");
      return;
    }

    this.state.solvePuzzle("환풍구");
    this.feedback.play("나사가 풀리며 환풍구가 열렸다.");
    this.scene.time.delayedCall(300, () => this.scene.scene.restart());
  }

  collectPart(part) {
    if (this.state.isSolved("손전등")) return;
    this.state.addItem(part);
    this.tryCompleteFlashlight();
  }

  tryCompleteFlashlight() {
    if (!this.state.hasItem("배터리") || !this.state.hasItem("전구")) return;
    this.state.removeItem("배터리");
    this.state.removeItem("전구");
    this.state.addItem("손전등");
    this.state.solvePuzzle("손전등");
    this.state.solvePuzzle("통제실 통로");
    this.feedback.play("손전등이 완성되어 통제실 통로가 열렸다.");
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
