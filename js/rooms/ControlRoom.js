class ControlRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;
    this.createBackground(stage);
    this.createObject(stage.x + stage.width * 0.17, stage.y + stage.height * 0.25, stage.width * 0.22, stage.height * 0.34, "배선도", "연결 관계는 A→2, B→3, C→1이다.");
    this.createObject(stage.x + stage.width * 0.55, stage.y + stage.height * 0.52, stage.width * 0.4, stage.height * 0.48, "전선", "배선도를 보고 연결해야 한다.", () => this.openWirePuzzle(), true);
    this.createObject(stage.x + stage.width * 0.18, stage.y + stage.height * 0.58, stage.width * 0.28, stage.height * 0.25, "실험 기록", "통제실 → 감금실 → 정비실 순서로 해제하라.", () => this.state.addNote("해제 순서: 통제실 → 감금실 → 정비실"));
    this.createObject(stage.x + stage.width * 0.7, stage.y + stage.height * 0.78, stage.width * 0.42, stage.height * 0.4, "시설 지도", "감금실=달, 정비실=톱니, 통제실=눈", () => this.state.addNote("시설 기호: 감금실=달, 정비실=톱니, 통제실=눈"));
    this.createObject(stage.x + stage.width * 0.9, stage.y + stage.height * 0.36, stage.width * 0.2, stage.height * 0.55, this.state.isSolved("비상문") ? "열린 비상문" : "비상문", this.doorMessage(), () => this.openDoor());
  }

  createBackground(stage) {
    const texture = this.scene.textures.get("controlBackground");
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
      "controlBackground",
      "roomView",
    ).setDisplaySize(stage.width, stage.height);
  }

  openWirePuzzle() {
    if (this.state.isSolved("배선")) {
      this.panel.show("전선", "배선이 이미 연결되어 있다.");
      return;
    }
    this.panel.hide();
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
    new SequencePuzzle(this.scene, ["눈", "달", "톱니"], () => {
      this.state.solvePuzzle("비상문");
      this.feedback.play("비상문이 열렸다.");
      this.scene.time.delayedCall(300, () => this.scene.scene.restart());
    });
  }

  createObject(x, y, width, height, label, message, onInspect, opensDialog = false) {
    const object = this.scene.add.rectangle(x, y, width, height, 0xd79a32, 0.01).setInteractive({ useHandCursor: true });
    object.on("pointerdown", () => {
      onInspect?.();
      if (!opensDialog) this.panel.show(label, message);
    });
  }
}

window.ControlRoom = ControlRoom;
