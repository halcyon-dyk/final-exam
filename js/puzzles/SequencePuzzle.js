class SequencePuzzle {
  constructor(scene, expected, onSuccess) {
    this.scene = scene;
    this.expected = expected;
    this.input = [];
    this.onSuccess = onSuccess;
    this.elements = [];
    this.create();
  }

  create() {
    const { width, height } = this.scene.scale;
    const panelWidth = Math.min(360, width - 20);
    this.add(this.scene.add.rectangle(width / 2, height / 2, panelWidth, 340, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.add(this.scene.add.text(width / 2, height / 2 - 130, "비상문 해제", { color: "#d79a32", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5));
    this.add(this.scene.add.rectangle(width / 2, height / 2 - 70, panelWidth - 32, 56, 0x30363a).setStrokeStyle(1, 0xd79a32));
    this.display = this.scene.add.text(width / 2, height / 2 - 70, "입력: ", { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 135, "", { color: "#b94343", fontFamily: "sans-serif", fontSize: "18px", align: "center", wordWrap: { width: panelWidth - 24 } }).setOrigin(0.5);
    this.add(this.message);
    ["눈", "달", "톱니"].forEach((symbol, index) => this.createButton(width / 2 - 90 + index * 90, height / 2, symbol));
    this.createButton(width / 2 - 64, height / 2 + 75, "닫기", () => this.destroy());
    this.createButton(width / 2 + 64, height / 2 + 75, "확인", () => this.check());
    window.fitDialog(this.scene, this.elements);
  }

  createButton(x, y, symbol, action) {
    const button = this.scene.add.rectangle(x, y, 80, 48, symbol === "확인" ? 0xd79a32 : 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, symbol, { color: symbol === "확인" ? "#111315" : "#d7d2c8", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    button.on("pointerdown", action || (() => this.select(symbol)));
    this.add(button);
    this.add(text);
  }

  select(symbol) {
    if (this.input.length < this.expected.length) {
      this.input.push(symbol);
      if (this.inputSound) window.audioManager.playEffect(this.inputSound);
    }
    this.message.setText("");
    this.update();
  }

  check() {
    if (this.input.join(",") !== this.expected.join(",")) {
      this.input = [];
      this.message.setText("순서가 맞지 않습니다.");
      window.audioManager.playEffect("error");
      this.update();
      return;
    }

    this.destroy();
    this.onSuccess();
  }

  update() { this.display.setText(`입력: ${this.input.join(" → ")}`); }
  add(element) { element.setDepth(200); this.elements.push(element); }
  destroy() { this.elements.forEach((element) => element.destroy()); }
}

window.SequencePuzzle = SequencePuzzle;
