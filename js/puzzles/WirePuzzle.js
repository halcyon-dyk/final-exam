class WirePuzzle {
  constructor(scene, onSuccess) {
    this.scene = scene;
    this.onSuccess = onSuccess;
    this.selectedWire = null;
    this.connections = {};
    this.elements = [];
    this.create();
  }

  create() {
    const { width, height } = this.scene.scale;
    this.add(this.scene.add.rectangle(width / 2, height / 2, 420, 410, 0xffffff));
    this.add(this.scene.add.text(width / 2, height / 2 - 165, "배선 연결", { color: "#1f2937", fontFamily: "sans-serif", fontSize: "26px" }).setOrigin(0.5));
    this.display = this.scene.add.text(width / 2, height / 2 - 115, "A → -\nB → -\nC → -", { align: "center", color: "#374151", fontFamily: "sans-serif", fontSize: "20px", lineSpacing: 8 }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 165, "전선을 선택한 뒤 단자를 선택하세요.", { color: "#374151", fontFamily: "sans-serif", fontSize: "16px" }).setOrigin(0.5);
    this.add(this.message);

    ["A", "B", "C"].forEach((wire, index) => this.createButton(width / 2 - 100, height / 2 - 35 + index * 45, wire, () => this.selectWire(wire)));
    ["1", "2", "3"].forEach((terminal, index) => this.createButton(width / 2 + 100, height / 2 - 35 + index * 45, terminal, () => this.connect(terminal)));
    this.createButton(width / 2 - 60, height / 2 + 105, "닫기", () => this.destroy(), 90);
    this.createButton(width / 2 + 60, height / 2 + 105, "확인", () => this.check(), 90);
  }

  createButton(x, y, label, onClick, buttonWidth = 56) {
    const button = this.scene.add.rectangle(x, y, buttonWidth, 38, 0x2563eb).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { color: "#ffffff", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    button.on("pointerdown", onClick);
    this.add(button);
    this.add(text);
  }

  selectWire(wire) {
    this.selectedWire = wire;
    this.message.setText(`${wire} 전선을 선택했습니다. 단자를 선택하세요.`);
  }

  connect(terminal) {
    if (!this.selectedWire) {
      this.message.setText("먼저 전선을 선택하세요.");
      return;
    }
    this.connections[this.selectedWire] = terminal;
    this.selectedWire = null;
    this.updateDisplay();
    this.message.setText("연결을 바꾸려면 전선을 다시 선택하세요.");
  }

  updateDisplay() {
    this.display.setText(["A", "B", "C"].map((wire) => `${wire} → ${this.connections[wire] ?? "-"}`).join("\n"));
  }

  check() {
    if (this.connections.A === "2" && this.connections.B === "3" && this.connections.C === "1") {
      this.destroy();
      this.onSuccess();
      return;
    }
    this.message.setText("연결이 맞지 않습니다. 수정한 뒤 다시 확인하세요.");
    window.audioManager.playEffect("error");
  }

  add(element) { element.setDepth(200); this.elements.push(element); }
  destroy() { this.elements.forEach((element) => element.destroy()); }
}

window.WirePuzzle = WirePuzzle;
