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
    this.state.hintUses += 1;
    this.buttonLabel.setText(`힌트 (${this.state.hintUses})`);
    this.message.setText(`힌트: ${this.getHint()}`);
  }

  getHint() {
    const hints = {
      감금실: "벽과 쪽지를 자세히 조사해 보세요.",
      정비실: "환풍구의 나사를 풀 수 있는 도구를 찾아보세요.",
      통제실: "배선도와 전선의 연결 순서를 비교해 보세요.",
    };

    return hints[this.state.currentRoom] ?? "주변의 단서와 도구를 다시 확인해 보세요.";
  }
}

window.HintPanel = HintPanel;
