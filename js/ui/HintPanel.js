class HintPanel {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
    const { width } = scene.scale;

    this.button = scene.add.rectangle(width - 78, 112, 108, 36, 0xffffff).setInteractive({ useHandCursor: true });
    this.buttonLabel = scene.add.text(width - 78, 112, "힌트 (0)", {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "18px",
    }).setOrigin(0.5);
    this.message = scene.add.text(24, 145, "", {
      color: "#374151",
      fontFamily: "sans-serif",
      fontSize: "18px",
      wordWrap: { width: Math.max(width - 48, 220) },
    }).setDepth(20);

    this.button.on("pointerdown", () => this.showHint());
  }

  showHint() {
    const stage = this.state.hintStages[this.state.currentRoom] ?? 0;
    if (stage < 3) {
      this.state.hintStages[this.state.currentRoom] = stage + 1;
      this.state.hintUses += 1;
      this.state.save();
    }
    this.buttonLabel.setText(`힌트 (${this.state.hintUses})`);
    this.message.setText(`힌트: ${this.getHint(this.state.hintStages[this.state.currentRoom] ?? 1)}`);
  }

  getHint(stage) {
    const hints = {
      감금실: ["벽과 침대 아래를 조사하세요.", "기호의 순서와 쪽지의 값을 비교하세요.", "삼각형·원·사각형은 427입니다."],
      정비실: ["작업대와 공구함을 조사하세요.", "손전등 본체와 배터리를 조합하세요.", "손전등으로 어두운 벽을 비추세요."],
      통제실: ["배선도와 전선을 조사하세요.", "전선과 단자를 연결한 뒤 확인하세요.", "A→2, B→3, C→1입니다."],
    };
    return hints[this.state.currentRoom]?.[stage - 1] ?? "새 힌트가 없습니다.";
  }
}

window.HintPanel = HintPanel;
