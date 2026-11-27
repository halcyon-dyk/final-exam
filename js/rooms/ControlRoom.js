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
    this.createObject(stage.x + stage.width * 0.16, stage.y + stage.height * 0.31, stage.width * 0.23, stage.height * 0.28, "배선도", "연결 관계는 A→2, B→3, C→1이다.");
    this.createObject(stage.x + stage.width * 0.50, stage.y + stage.height * 0.43, stage.width * 0.40, stage.height * 0.58, "전선", "배선도를 보고 연결해야 한다.", () => this.openWirePuzzle(), true);
    this.createObject(stage.x + stage.width * 0.18, stage.y + stage.height * 0.57, stage.width * 0.24, stage.height * 0.24, "실험 기록", "", () => this.panel.showPages("실험 기록", this.state.discoverDocument("incident-records")), true);
    this.createObject(stage.x + stage.width * 0.7, stage.y + stage.height * 0.86, stage.width * 0.42, stage.height * 0.24, "시설 지도", "", () => this.panel.showPages("시설 지도", this.state.discoverDocument("facility-map")), true);
    this.doorTag = this.createObject(stage.x + stage.width * 0.9, stage.y + stage.height * 0.36, stage.width * 0.2, stage.height * 0.55, "비상문", this.doorMessage(), () => this.openDoor());
    this.refreshVisuals();
  }

  createBackground(stage) {
    this.background = this.scene.add.image(
      stage.x + stage.width / 2,
      stage.y + stage.height / 2,
      "controlBackground",
    ).setDisplaySize(stage.width, stage.height);
    this.scene.add.rectangle(stage.x + 72, stage.y + stage.height - 20, 128, 32, 0x111315, 0.9).setDepth(1);
    this.powerLamp = this.scene.add.circle(stage.x + 24, stage.y + stage.height - 20, 5, 0xb94343).setDepth(1);
    this.powerLabel = this.scene.add.text(stage.x + 82, stage.y + stage.height - 20, "", { color: "#d7d2c8", fontSize: "18px", fontFamily: "sans-serif" }).setOrigin(0.5).setDepth(1);
    this.refreshVisuals();
  }

  refreshVisuals() {
    if (!this.background) return;
    const powered = this.state.isSolved("배선");
    const open = this.state.isSolved("비상문");
    this.background.setTexture(open ? "controlDoorOpen" : powered ? "controlPowered" : "controlBackground").setDisplaySize(this.scene.layout.stage.width, this.scene.layout.stage.height);
    this.powerLamp.setFillStyle(powered ? 0xd79a32 : 0xb94343);
    this.powerLabel.setText(powered ? "전원 복구" : "전원 차단");
    if (this.doorTag) {
      this.doorTag.setText(open ? "열린 비상문" : "비상문");
      const stage = this.scene.layout.stage;
      this.doorTag.x = Math.min(stage.x + stage.width * 0.9, stage.x + stage.width - this.doorTag.width / 2);
    }
  }

  openWirePuzzle() {
    window.audioManager.playEffect("cable");
    if (this.state.isSolved("배선")) {
      this.panel.show("전선", "배선이 이미 연결되어 있다.");
      return;
    }
    this.panel.hide();
    new WirePuzzle(this.scene, () => {
      this.state.solvePuzzle("배선");
      this.refreshVisuals();
      this.feedback.play("전원이 복구되었다.", "powerRestore");
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
    if (!this.state.isSolved("배선") || !this.state.clueIds.includes("incident-records") || !this.state.clueIds.includes("facility-map")) {
      window.audioManager.playEffect("metal");
      this.panel.show("비상문", "전원을 복구하고 실험 기록과 시설 지도를 조사해야 한다.");
      return;
    }
    window.audioManager.playEffect("click");
    this.panel.hide();
    const puzzle = new SequencePuzzle(this.scene, ["톱니", "달", "눈"], () => {
      this.state.solvePuzzle("비상문");
      this.refreshVisuals();
      this.feedback.play("비상문이 열렸다.", "doorOpen");
    });
    puzzle.inputSound = "click";
  }

  createObject(x, y, width, height, label, message, onInspect, opensDialog = false) {
    const object = this.scene.add.rectangle(x, y, width, height, 0xd79a32, 0.01).setInteractive({ useHandCursor: true });
    const tag = this.scene.add.text(x, y - height / 2 - 4, label, {
      color: "#d7d2c8", backgroundColor: "#30363a", fontFamily: "sans-serif", fontSize: "18px",
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    }).setOrigin(0.5, 1).setAlpha(0.8).setDepth(1).setInteractive({ useHandCursor: true });
    const stage = this.scene.layout.stage;
    tag.x = Phaser.Math.Clamp(tag.x, stage.x + tag.width / 2, stage.x + stage.width - tag.width / 2);
    tag.y = Math.max(tag.y, stage.y + tag.height + 4);
    tag.on("pointerdown", () => object.emit("pointerdown"));
    [object, tag].forEach(target => {
      target.on("pointerover", () => tag.setAlpha(1));
      target.on("pointerout", () => tag.setAlpha(0.8));
    });
    object.on("pointerdown", () => {
      if (["배선도", "실험 기록", "시설 지도"].includes(label)) window.audioManager.playEffect("paper");
      if (!opensDialog) this.panel.show(label, message);
      onInspect?.();
    });
    return tag;
  }
}

window.ControlRoom = ControlRoom;
