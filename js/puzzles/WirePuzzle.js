class WirePuzzle {
  constructor(scene, onSuccess) {
    this.scene = scene;
    this.expected = ["빨강", "파랑", "노랑"];
    this.input = [];
    this.onSuccess = onSuccess;
    this.elements = [];
    this.create();
  }

  create() {
    const { width, height } = this.scene.scale;
    this.add(this.scene.add.rectangle(width / 2, height / 2, 380, 260, 0xffffff));
    this.add(this.scene.add.text(width / 2, height / 2 - 90, "배선 연결", { color: "#1f2937", fontFamily: "sans-serif", fontSize: "26px" }).setOrigin(0.5));
    this.display = this.scene.add.text(width / 2, height / 2 - 45, "순서: ", { color: "#374151", fontFamily: "sans-serif", fontSize: "20px" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 90, "", { color: "#dc2626", fontFamily: "sans-serif", fontSize: "16px" }).setOrigin(0.5);
    this.add(this.message);
    ["빨강", "파랑", "노랑"].forEach((color, index) => this.createButton(width / 2 - 110 + index * 110, height / 2 + 20, color));
  }

  createButton(x, y, label) {
    const button = this.scene.add.rectangle(x, y, 90, 48, 0x2563eb).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    button.on("pointerdown", () => this.select(label));
    this.add(button);
    this.add(text);
  }

  select(color) {
    if (color !== this.expected[this.input.length]) {
      this.input = [];
      this.message.setText("연결이 끊겼습니다. 처음부터 다시 연결하세요.");
      this.update();
      return;
    }

    this.input.push(color);
    this.update();
    if (this.input.length === this.expected.length) {
      this.destroy();
      this.onSuccess();
    }
  }

  update() {
    this.display.setText(`순서: ${this.input.join(" → ")}`);
  }

  add(element) { element.setDepth(200); this.elements.push(element); }
  destroy() { this.elements.forEach((element) => element.destroy()); }
}

window.WirePuzzle = WirePuzzle;
