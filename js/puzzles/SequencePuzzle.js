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
    this.add(this.scene.add.rectangle(width / 2, height / 2, 360, 250, 0xffffff));
    this.add(this.scene.add.text(width / 2, height / 2 - 82, "비상문 해제", { color: "#1f2937", fontFamily: "sans-serif", fontSize: "26px" }).setOrigin(0.5));
    this.display = this.scene.add.text(width / 2, height / 2 - 35, "입력: ", { color: "#374151", fontFamily: "sans-serif", fontSize: "20px" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 82, "", { color: "#dc2626", fontFamily: "sans-serif", fontSize: "16px" }).setOrigin(0.5);
    this.add(this.message);
    [1, 2, 3, 4].forEach((number, index) => this.createButton(width / 2 - 105 + index * 70, height / 2 + 20, number));
  }

  createButton(x, y, number) {
    const button = this.scene.add.rectangle(x, y, 52, 48, 0x2563eb).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, String(number), { color: "#ffffff", fontFamily: "sans-serif", fontSize: "20px" }).setOrigin(0.5);
    button.on("pointerdown", () => this.select(number));
    this.add(button);
    this.add(text);
  }

  select(number) {
    if (number !== this.expected[this.input.length]) {
      this.input = [];
      this.message.setText("순서가 맞지 않습니다.");
      this.update();
      return;
    }

    this.input.push(number);
    this.update();
    if (this.input.length === this.expected.length) {
      this.destroy();
      this.onSuccess();
    }
  }

  update() { this.display.setText(`입력: ${this.input.join(" → ")}`); }
  add(element) { element.setDepth(200); this.elements.push(element); }
  destroy() { this.elements.forEach((element) => element.destroy()); }
}

window.SequencePuzzle = SequencePuzzle;
