class HintPanel {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
  }

  showHint() {
    const key = this.getTask();
    const stage = this.state.hintStages[key] ?? 0;
    this.buttonLabel.setText(`힌트 (${this.state.hintUses})`);
    const action = stage < 3 ? {
      label: stage === 0 ? "첫 힌트 공개 (+1회)" : "다음 힌트 공개 (+1회)",
      onClick: () => {
        if ((this.state.hintStages[key] ?? 0) !== stage) return;
        this.state.hintStages[key] = stage + 1;
        this.state.hintUses += 1;
        this.state.save();
        this.showHint();
      },
    } : null;
    const pages = stage ? Array.from({ length: stage }, (_, index) => this.getHint(index + 1))
      : ["아직 공개한 힌트가 없습니다.\n새 힌트는 사용 횟수가 1회 늘어납니다.\n이미 공개한 내용은 무료로 다시 읽습니다."];
    this.scene.investigationPanel.showPages(`${key} 힌트`, pages, Math.max(0, stage - 1), action);
  }

  getTask() {
    if (!this.state.isSolved("상자")) return "상자";
    if (!this.state.isSolved("정비실 통로")) return "환풍구";
    if (!this.state.isSolved("공구함")) return "공구함";
    if (!this.state.isSolved("배선도")) return "손전등";
    if (!this.state.isSolved("전력 배분")) return "전력 배분";
    if (!this.state.isSolved("배선")) return "배선";
    return "비상문";
  }

  getHint(stage) {
    const hints = {
      상자: ["벽 낙서와 바닥 쪽지를 조사하세요.", "기호의 순서와 쪽지의 값을 비교하세요.", "삼각형·원·사각형은 427입니다."],
      환풍구: ["열린 상자 안을 조사하세요.", "드라이버를 획득하고 보관함에서 선택하세요.", "드라이버를 선택한 채 환풍구 덮개를 누르세요."],
      공구함: ["작업대의 작업일지와 볼트를 조사하세요.", "볼트를 작은 것부터 나열해 새겨진 기호를 읽으세요.", "삼각형 → 육각형 → 사각형 순서로 입력하세요."],
      손전등: ["정비실 작업대에서 손전등 본체를 챙기세요.", "손전등 본체와 배터리를 조합하세요.", "손전등을 선택해 어두운 벽을 비추세요."],
      "전력 배분": ["정비실 작업일지와 빛을 비춘 벽의 장비 표시를 비교하세요.", "3칸 안에서 환기와 조명을 켜고 감시는 꺼야 합니다.", "I 켜짐·II 꺼짐·III 켜짐으로 맞추고 확인하세요."],
      배선: ["통제실 전선을 조사하세요.", "메모장 배선도대로 연결하고 확인하세요.", "A→2, B→3, C→1입니다."],
      비상문: ["시설 지도와 실험 기록의 두 조각을 비교하세요.", "사고 → 감금실 폐쇄 → 통제실 봉쇄의 순서를 지도 기호로 바꾸세요.", "톱니 → 달 → 눈을 누르고 확인한 뒤 열린 문으로 나가세요."],
    };
    return hints[this.getTask()]?.[stage - 1] ?? "새 힌트가 없습니다.";
  }
}

window.HintPanel = HintPanel;
