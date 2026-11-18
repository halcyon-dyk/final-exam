class PrisonRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;

    this.createBackground(stage);
    this.createObject(stage.x + stage.width * 0.67, stage.y + stage.height * 0.28, stage.width * 0.2, stage.height * 0.24, "벽 낙서", "삼각형 → 원 → 사각형 기호가 표시되어 있다.", () => {
      this.state.addNote("상자 기호 순서: 삼각형 → 원 → 사각형");
    });
    this.createObject(stage.x + stage.width * 0.5, stage.y + stage.height * 0.78, stage.width * 0.16, stage.height * 0.14, "바닥 쪽지", "원=2, 사각형=7, 삼각형=4라고 적혀 있다.", () => {
      this.state.addNote("기호 값: 원=2, 사각형=7, 삼각형=4");
    });

    if (this.state.isSolved("상자")) {
      this.createObject(stage.x + stage.width * 0.77, stage.y + stage.height * 0.62, stage.width * 0.25, stage.height * 0.4, "열린 상자", "상자 안에서 드라이버를 발견했다.");
      if (!this.state.hasItem("드라이버")) {
        this.createObject(stage.x + stage.width * 0.74, stage.y + stage.height * 0.72, stage.width * 0.14, stage.height * 0.1, "드라이버", "드라이버를 획득했다.", () => {
          this.state.addItem("드라이버");
          this.state.solvePuzzle("드라이버 획득");
          if (this.scene.inventoryPanel.background.visible) {
            this.scene.inventoryPanel.render();
          }
          this.feedback.play("드라이버를 획득했다. 환풍구에 사용해 보세요.");
        });
      }
      this.createObject(stage.x + stage.width * 0.18, stage.y + stage.height * 0.48, stage.width * 0.16, stage.height * 0.5, "환풍구 덮개", "드라이버로 나사를 풀 수 있다.", () => this.openVent());
      return;
    }

    this.createObject(stage.x + stage.width * 0.77, stage.y + stage.height * 0.62, stage.width * 0.25, stage.height * 0.4, "잠긴 상자", "비밀번호를 입력해야 열 수 있다.", () => {
      if (this.state.notes.length < 2) {
        this.panel.show("상자", "비밀번호 단서를 먼저 찾아야 한다.");
        return;
      }
      new CodePuzzle(this.scene, "427", () => {
        this.state.solvePuzzle("상자");
        this.feedback.play("상자가 열렸다.");
        this.scene.time.delayedCall(300, () => this.scene.scene.restart());
      });
    });
  }

  createBackground(stage) {
    const texture = this.scene.textures.get("prisonBackground");
    if (!texture.has("roomView")) {
      const source = texture.getSourceImage();
      const roomTop = Math.round(source.height * (164 / 768));
      texture.add("roomView", 0, 0, roomTop, source.width, source.height - roomTop);
    }
    this.scene.add.image(
      stage.x + stage.width / 2,
      stage.y + stage.height / 2,
      "prisonBackground",
      "roomView",
    ).setDisplaySize(stage.width, stage.height);
  }

  openVent() {
    if (this.state.isSolved("정비실 통로")) return;
    if (this.state.selectedItem !== "드라이버") {
      this.panel.show("환풍구", "보관함에서 드라이버를 선택한 뒤 사용하세요.");
      return;
    }
    this.state.solvePuzzle("정비실 통로");
    this.feedback.play("환풍구 덮개가 제거되어 정비실 통로가 열렸다.");
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0xd79a32, 0.01).setInteractive({ useHandCursor: true });
    const tag = this.scene.add.text(x, y - height / 2 - 8, label, {
      color: "#d7d2c8",
      backgroundColor: "#30363a",
      fontFamily: "sans-serif",
      fontSize: "16px",
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    }).setOrigin(0.5, 1).setAlpha(0.72);

    object.on("pointerover", () => tag.setAlpha(1));
    object.on("pointerout", () => tag.setAlpha(0.72));
    object.on("pointerdown", () => {
      onInspect?.();
      this.panel.show(label, message);
    });
  }
}

window.PrisonRoom = PrisonRoom;
