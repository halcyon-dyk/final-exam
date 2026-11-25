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
    this.add(this.scene.add.rectangle(width / 2, height / 2, 360, 360, 0xffffff));
    this.add(this.scene.add.text(width / 2, height / 2 - 140, "상자 비밀번호", { color: "#1f2937", fontFamily: "sans-serif", fontSize: "26px" }).setOrigin(0.5));
    this.display = this.scene.add.text(width / 2, height / 2 - 95, "_".repeat(this.code.length).split("").join(" "), { color: "#374151", fontFamily: "sans-serif", fontSize: "30px" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 135, "", { color: "#dc2626", fontFamily: "sans-serif", fontSize: "16px" }).setOrigin(0.5);
    this.add(this.message);

    for (let digit = 1; digit <= 9; digit += 1) {
      const index = digit - 1;
      this.createButton(width / 2 - 70 + (index % 3) * 70, height / 2 - 35 + Math.floor(index / 3) * 55, String(digit), () => this.append(String(digit)));
    }
    this.createButton(width / 2, height / 2 + 130 - 45, "0", () => this.append("0"));
    this.createButton(width / 2 - 105, height / 2 + 130 - 45, "삭제", () => this.remove(), 64);
    this.createButton(width / 2 + 105, height / 2 + 130 - 45, "확인", () => this.check(), 64);
    this.createButton(width / 2 + 135, height / 2 - 145, "닫기", () => this.destroy(), 64);
  }

  createButton(x, y, label, onClick, buttonWidth = 54) {
    const button = this.scene.add.rectangle(x, y, buttonWidth, 42, 0x2563eb).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "17px" }).setOrigin(0.5);
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
