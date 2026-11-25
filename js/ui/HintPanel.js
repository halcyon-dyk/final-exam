class HintPanel {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
    const { width } = scene.scale;

    this.button = scene.add.rectangle(width - 78, 112, 108, 36, 0xffffff).setInteractive({ useHandCursor: true });
    this.buttonLabel = scene.add.text(width - 78, 112, `힌트 (${state.hintUses})`, {
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
    const key = this.getTask();
    const stage = this.state.hintStages[key] ?? 0;
    if (stage < 3) {
      this.state.hintStages[key] = stage + 1;
      this.state.hintUses += 1;
      this.state.save();
    }
    this.buttonLabel.setText(`힌트 (${this.state.hintUses})`);
    this.message.setText(`힌트: ${this.getHint(this.state.hintStages[key] ?? 1)}`);
  }

  getTask() {
    if (!this.state.isSolved("상자")) return "상자";
    if (!this.state.isSolved("정비실 통로")) return "환풍구";
    if (!this.state.isSolved("배선도")) return "손전등";
    if (!this.state.isSolved("배선")) return "배선";
    return "비상문";
  }

  getHint(stage) {
    const hints = {
      상자: ["벽과 침대 아래를 조사하세요.", "기호의 순서와 쪽지의 값을 비교하세요.", "삼각형·원·사각형은 427입니다."],
      환풍구: ["열린 상자 안을 조사하세요.", "드라이버를 획득하고 보관함에서 선택하세요.", "드라이버를 선택한 채 환풍구 덮개를 누르세요."],
      손전등: ["정비실 작업대와 공구함을 조사하세요.", "손전등 본체와 배터리를 조합하세요.", "손전등을 선택해 어두운 벽을 비추세요."],
      배선: ["통제실 전선을 조사하세요.", "메모장 배선도대로 연결하고 확인하세요.", "A→2, B→3, C→1입니다."],
      비상문: ["통제실 시설 지도와 실험 기록을 모두 조사하세요.", "기록의 방 순서를 지도 기호로 바꾸세요.", "눈 → 달 → 톱니를 누르고 확인하세요. 열린 문을 눌러 탈출하세요."],
    };
    return hints[this.getTask()]?.[stage - 1] ?? "새 힌트가 없습니다.";
  }
}

window.HintPanel = HintPanel;
