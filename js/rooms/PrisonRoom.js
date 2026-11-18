class PrisonRoom {
  constructor(scene, panel, state, feedback) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
    this.feedback = feedback;
  }

  create() {
    const stage = this.scene.layout.stage;

    this.scene.add.rectangle(stage.x + stage.width / 2, stage.y + stage.height / 2, stage.width, stage.height, 0xd1d5db);
    this.createObject(stage.x + stage.width * 0.3, stage.y + stage.height * 0.32, 130, 90, "벽", "벽에 새겨진 숫자는 28이다.", () => {
      this.state.addNote("상자 비밀번호 앞 두 자리: 28");
    });
    this.createObject(stage.x + stage.width * 0.55, stage.y + stage.height * 0.54, 90, 50, "쪽지", "쪽지에는 비밀번호의 뒤 두 자리가 64라고 적혀 있다.", () => {
      this.state.addNote("상자 비밀번호 뒤 두 자리: 64");
    });

    if (this.state.isSolved("상자")) {
      this.createObject(stage.x + stage.width * 0.75, stage.y + stage.height * 0.45, 120, 100, "열린 상자", "상자 안에서 드라이버를 발견했다.");
      if (!this.state.hasItem("드라이버")) {
        this.createObject(stage.x + stage.width * 0.75, stage.y + stage.height * 0.63, 100, 40, "드라이버", "드라이버를 획득했다.", () => {
          this.state.addItem("드라이버");
          this.state.solvePuzzle("드라이버 획득");
          this.state.solvePuzzle("정비실 통로");
          this.feedback.play("정비실로 가는 통로가 열렸다.");
        });
      }
      return;
    }

    this.createObject(stage.x + stage.width * 0.75, stage.y + stage.height * 0.45, 120, 100, "상자", "비밀번호를 입력해야 열 수 있다.", () => {
      if (this.state.notes.length < 2) {
        this.panel.show("상자", "비밀번호 단서를 먼저 찾아야 한다.");
        return;
      }
      new CodePuzzle(this.scene, "2864", () => {
        this.state.solvePuzzle("상자");
        this.feedback.play("상자가 열렸다.");
        this.scene.time.delayedCall(300, () => this.scene.scene.restart());
      });
    });
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0x6b7280).setInteractive({ useHandCursor: true });
    this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5);
    object.on("pointerdown", () => {
      onInspect?.();
      this.panel.show(label, message);
    });
  }
}

window.PrisonRoom = PrisonRoom;
