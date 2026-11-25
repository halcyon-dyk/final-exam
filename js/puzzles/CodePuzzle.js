class CodePuzzle {
  constructor(scene, code, onSuccess) {
    this.scene = scene;
    this.code = code;
    this.onSuccess = onSuccess;
    this.input = "";
    this.elements = [];
    this.create();
  }

  create() {
    const { width, height } = this.scene.scale;
    const panelWidth = Math.min(360, width - 20);
    this.add(this.scene.add.rectangle(width / 2, height / 2, panelWidth, 460, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.add(this.scene.add.text(width / 2, height / 2 - 195, "상자 비밀번호", { color: "#d79a32", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5));
    this.add(this.scene.add.rectangle(width / 2, height / 2 - 140, panelWidth - 40, 56, 0x30363a).setStrokeStyle(1, 0xd79a32));
    this.display = this.scene.add.text(width / 2, height / 2 - 140, "_".repeat(this.code.length).split("").join(" "), { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "22px", fontStyle: "bold" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 196, "", { color: "#b94343", fontFamily: "sans-serif", fontSize: "18px", align: "center", wordWrap: { width: panelWidth - 24 } }).setOrigin(0.5);
    this.add(this.message);

    for (let digit = 1; digit <= 9; digit += 1) {
      const index = digit - 1;
      this.createButton(width / 2 - 80 + (index % 3) * 80, height / 2 - 70 + Math.floor(index / 3) * 54, String(digit), () => this.append(String(digit)));
    }
    this.createButton(width / 2, height / 2 + 92, "0", () => this.append("0"));
    this.createButton(width / 2 - 80, height / 2 + 92, "삭제", () => this.remove(), 64);
    this.createButton(width / 2 - 64, height / 2 + 150, "닫기", () => this.destroy(), 104);
    this.createButton(width / 2 + 64, height / 2 + 150, "확인", () => this.check(), 104);
    window.fitDialog(this.scene, this.elements);
  }

  createButton(x, y, label, onClick, buttonWidth = 54) {
    const button = this.scene.add.rectangle(x, y, buttonWidth, 44, label === "확인" ? 0xd79a32 : 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { color: label === "확인" ? "#111315" : "#d7d2c8", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    button.on("pointerdown", onClick);
    this.add(button);
    this.add(text);
  }

  append(digit) {
    if (this.input.length < this.code.length) {
      this.input += digit;
      this.updateDisplay();
    }
  }

  remove() {
    this.input = this.input.slice(0, -1);
    this.updateDisplay();
  }

  updateDisplay() {
    this.display.setText(this.input.padEnd(this.code.length, "_").split("").join(" "));
    this.message.setText("");
  }

  check() {
    if (this.input === this.code) {
      this.destroy();
      this.onSuccess();
      return;
    }

    this.input = "";
    this.updateDisplay();
    this.message.setText("비밀번호가 맞지 않습니다.");
    window.audioManager.playEffect("error");
  }

  add(element) {
    element.setDepth(200);
    this.elements.push(element);
  }

  destroy() {
    this.elements.forEach((element) => element.destroy());
  }
}

window.CodePuzzle = CodePuzzle;
