class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  init(data) {
    this.success = data.success === true;
  }

  create() {
    const { width, height } = this.scale;
    const state = window.gameState;
    const title = this.success ? "탈출 성공" : "탈출 실패";
    const detail = this.success
      ? `남은 시간: ${Math.floor(state.timeRemaining / 60)}:${String(state.timeRemaining % 60).padStart(2, "0")}\n힌트 사용: ${state.hintUses}회\n최종 점수: ${Math.max(0, state.timeRemaining - state.hintUses * 30)}`
      : "시설이 봉쇄되었습니다.";

    this.cameras.main.setBackgroundColor("#f3f6fb");
    this.add.text(width / 2, height * 0.35, title, {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "44px",
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.5, detail, {
      align: "center",
      color: "#374151",
      fontFamily: "sans-serif",
      fontSize: "22px",
      lineSpacing: 10,
    }).setOrigin(0.5);

    const restart = this.add.rectangle(width / 2, height * 0.68, 180, 56, 0x2563eb).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.68, "다시 하기", {
      color: "#ffffff",
      fontFamily: "sans-serif",
      fontSize: "24px",
    }).setOrigin(0.5);
    restart.on("pointerdown", () => {
      state.reset();
      this.scene.start("GameScene");
    });
  }
}

window.ResultScene = ResultScene;
