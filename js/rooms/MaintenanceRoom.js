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
    this.createObject(stage.x + stage.width * 0.18, stage.y + stage.height * 0.72, stage.width * 0.25, stage.height * 0.14, "손전등 본체", "작업대 아래에 놓인 손전등 본체다.", () => {
      window.audioManager.playEffect("flashlight");
      this.collectPart("손전등 본체");
    });
    this.toolboxTag = this.createObject(stage.x + stage.width * 0.84, stage.y + stage.height * 0.50, stage.width * 0.23, stage.height * 0.16, "공구함", "배터리가 보관된 공구함이다. 기호 잠금장치가 달려 있다.", () => this.openToolbox());
    this.createObject(stage.x + stage.width * 0.18, stage.y + stage.height * 0.55, stage.width * 0.18, stage.height * 0.13, "작업일지", "낡은 정비 작업일지다.", () => {
      window.audioManager.playEffect("paper");
      this.panel.showPages("작업일지", this.state.discoverDocument("maintenance-journal"));
    });
    this.createObject(stage.x + stage.width * 0.51, stage.y + stage.height * 0.53, stage.width * 0.23, stage.height * 0.13, "볼트 조사", "크기가 다른 볼트 세 개가 놓여 있다.", () => {
      window.audioManager.playEffect("bolts");
      this.state.addNote("작업대 볼트 (왼쪽부터): 중간=⬡ 육각형, 큰=□ 사각형, 작은=△ 삼각형");
      this.panel.hide();
      ToolboxPuzzle.showBolts(this.scene);
    });
    this.createObject(stage.x + stage.width * 0.63, stage.y + stage.height * 0.28, stage.width * 0.32, stage.height * 0.22, "어두운 벽면", "빛을 비추면 무언가 드러날 것 같다.", () => this.useFlashlight());
    this.createObject(stage.x + stage.width * 0.325, stage.y + stage.height * 0.267, stage.width * 0.10, stage.height * 0.18, "전력반", "통로 장비의 전력을 배분하는 장치다.", () => this.openPowerPuzzle());
    this.refreshVisuals();
  }

  createBackground(stage) {
    this.background = this.scene.add.image(
      stage.x + stage.width / 2,
      stage.y + stage.height / 2,
      "maintenanceBackground",
    ).setDisplaySize(stage.width, stage.height);
    this.powerStatus = this.scene.add.text(stage.x + 8, stage.y + stage.height - 34, "", {
      fontSize: "18px", fontFamily: "sans-serif", color: "#d79a32", backgroundColor: "#111315",
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
    }).setDepth(1);
  }

  refreshVisuals() {
    const open = this.state.isSolved("공구함");
    this.powerStatus?.setText(this.state.isSolved("전력 배분") ? "환기 작동 · 통로 조명 켜짐" : "환기 정지 · 통로 조명 꺼짐");
    this.background?.setTexture(this.state.isSolved("전력 배분") && open ? "maintenancePowered" : open ? "maintenanceToolboxOpen" : "maintenanceBackground");
    if (this.background) this.background.setDisplaySize(this.scene.layout.stage.width, this.scene.layout.stage.height);
    this.toolboxTag?.setText(open ? "열린 공구함" : "공구함");
    if (this.toolboxTag) {
      const stage = this.scene.layout.stage;
      this.toolboxTag.y = stage.y + stage.height * (open ? (this.scene.layout.isMobile ? 0.34 : 0.25) : 0.42) - 4;
      this.toolboxTag.x = Math.min(stage.x + stage.width * 0.84, stage.x + stage.width - this.toolboxTag.width / 2);
    }
  }

  collectPart(part) {
    if (part === "배터리" && !this.state.isSolved("공구함")) return;
    if (this.state.hasItem(part) || this.state.hasItem("손전등")) return;
    this.state.addItem(part);
    if (this.scene.inventoryPanel.background.visible) {
      this.scene.inventoryPanel.render();
    }
  }

  openToolbox() {
    window.audioManager.playEffect("metal");
    if (this.state.isSolved("공구함")) {
      this.panel.show("공구함", "열린 공구함이다. 배터리는 이미 꺼냈다.");
      return;
    }
    this.panel.hide();
    new ToolboxPuzzle(this.scene, ["△", "⬡", "□"], () => {
      this.state.solvePuzzle("공구함");
      this.collectPart("배터리");
      this.refreshVisuals();
      this.feedback.play("공구함이 열렸다. 배터리를 획득했다.", "unlock");
    });
  }

  useFlashlight() {
    if (this.state.selectedItem !== "손전등") {
      window.audioManager.playEffect("wall");
      this.panel.show("어두운 벽면", "완성된 손전등을 선택해 비춰 보세요.");
      return;
    }
    this.state.solvePuzzle("배선도");
    this.state.addNote("숨겨진 배선도: A→2, B→3, C→1");
    this.state.discoverDocument("equipment-labels");
    this.panel.hide();
    this.feedback.play("배선도와 장비 대응표를 메모장에 기록했다.\n전력반에서 통로 전력을 복구하자.", "flashlight", 5000);
  }

  openPowerPuzzle() {
    if (this.state.isSolved("전력 배분")) {
      this.panel.show("전력반", "전력 배분이 완료되어 있다.\nI 켜짐 · II 꺼짐 · III 켜짐");
      return;
    }
    const missing = [];
    if (!this.state.clueIds.includes("maintenance-journal")) missing.push("작업대의 작업일지를 조사하세요.");
    if (!this.state.clueIds.includes("equipment-labels")) missing.push("손전등으로 어두운 벽의 장비 표시를 확인하세요.");
    if (missing.length) {
      this.panel.show("전력반", missing.join("\n"));
      return;
    }
    this.panel.hide();
    new PowerPuzzle(this.scene, () => {
      this.state.solvedPuzzles["전력 배분"] = true;
      this.state.solvedPuzzles["통제실 통로"] = true;
      this.state.save();
      this.refreshVisuals();
      this.feedback.play("환기와 통로 조명이 복구되었다.\n통제실로 가는 통로가 열렸다.", "powerRestore", 5000);
    });
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0xd79a32, 0.01).setInteractive({ useHandCursor: true });
    const tag = this.scene.add.text(x, y - height / 2 - 4, label, {
      color: "#d7d2c8",
      backgroundColor: "#30363a",
      fontFamily: "sans-serif",
      fontSize: "18px",
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    }).setOrigin(0.5, 1).setAlpha(0.8).setDepth(1).setInteractive({ useHandCursor: true });
    const stage = this.scene.layout.stage;
    tag.x = Phaser.Math.Clamp(tag.x, stage.x + tag.width / 2, stage.x + stage.width - tag.width / 2);
    tag.on("pointerdown", () => object.emit("pointerdown"));
    [object, tag].forEach(target => {
      target.on("pointerover", () => tag.setAlpha(1));
      target.on("pointerout", () => tag.setAlpha(0.8));
    });
    object.on("pointerdown", () => {
      this.panel.show(label, message);
      onInspect?.();
    });
    return tag;
  }
}

window.MaintenanceRoom = MaintenanceRoom;
