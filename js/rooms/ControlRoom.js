class ControlRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;
    this.scene.add.rectangle(stage.x + stage.width / 2, stage.y + stage.height / 2, stage.width, stage.height, 0xaebdca);
    this.createObject(stage.x + stage.width * 0.27, stage.y + stage.height * 0.33, 120, 70, "배선도", "배선 순서는 빨강, 파랑, 노랑이다.");
    this.createObject(stage.x + stage.width * 0.52, stage.y + stage.height * 0.48, 120, 70, "전선", "배선도를 보고 연결해야 한다.", () => this.openWirePuzzle());
    this.createObject(stage.x + stage.width * 0.28, stage.y + stage.height * 0.61, 130, 55, "실험 기록", "비상문 해제의 첫 번째 순서는 2다.", () => this.state.addNote("비상문 해제 첫 순서: 2"));
    this.createObject(stage.x + stage.width * 0.55, stage.y + stage.height * 0.61, 130, 55, "시설 지도", "비상문 해제의 다음 순서는 4, 1이다.", () => this.state.addNote("비상문 해제 다음 순서: 4 → 1"));
    this.createObject(stage.x + stage.width * 0.78, stage.y + stage.height * 0.43, 120, 130, this.state.isSolved("비상문") ? "열린 비상문" : "비상문", this.doorMessage(), () => this.openDoor());
  }

  openWirePuzzle() {
    if (this.state.isSolved("배선")) {
      this.panel.show("전선", "배선이 이미 연결되어 있다.");
      return;
    }
    new WirePuzzle(this.scene, () => {
      this.state.solvePuzzle("배선");
      this.feedback.play("전원이 복구되었다.");
    });
  }

  doorMessage() {
    return this.state.isSolved("비상문") ? "지상으로 이어지는 비상문이 열렸다." : "해제 순서를 입력해야 하는 비상문이다.";
  }

  openDoor() {
    if (this.state.isSolved("비상문")) {
      this.scene.scene.start("ResultScene", { success: true });
      return;
    }
    if (!this.state.isSolved("배선") || this.state.notes.length < 4) {
      this.panel.show("비상문", "전원을 복구하고 실험 기록과 시설 지도를 조사해야 한다.");
      return;
    }
    new SequencePuzzle(this.scene, [2, 4, 1], () => {
      this.state.solvePuzzle("비상문");
      this.feedback.play("비상문이 열렸다.");
      this.scene.time.delayedCall(300, () => this.scene.scene.restart());
    });
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0x475569).setInteractive({ useHandCursor: true });
    this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "20px" }).setOrigin(0.5);
    object.on("pointerdown", () => {
      onInspect?.();
      this.panel.show(label, message);
    });
  }
}

window.ControlRoom = ControlRoom;
