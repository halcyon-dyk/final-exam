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
    const panelWidth = Math.min(400, width - 20);
    this.add(this.scene.add.rectangle(width / 2, height / 2, panelWidth, 460, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.add(this.scene.add.text(width / 2, height / 2 - 195, "배선 연결", { color: "#d79a32", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5));
    this.add(this.scene.add.rectangle(width / 2, height / 2 - 112, panelWidth - 32, 112, 0x30363a).setStrokeStyle(1, 0xd79a32));
    this.display = this.scene.add.text(width / 2, height / 2 - 112, "A → -\nB → -\nC → -", { align: "center", color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "22px", lineSpacing: 8 }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(width / 2, height / 2 + 192, "전선을 선택한 뒤 단자를 선택하세요.", { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "18px", align: "center", wordWrap: { width: panelWidth - 24 } }).setOrigin(0.5);
    this.add(this.message);

    ["A", "B", "C"].forEach((wire, index) => this.createButton(width / 2 - 90, height / 2 - 25 + index * 54, wire, () => this.selectWire(wire)));
    ["1", "2", "3"].forEach((terminal, index) => this.createButton(width / 2 + 90, height / 2 - 25 + index * 54, terminal, () => this.connect(terminal)));
    this.createButton(width / 2 - 64, height / 2 + 140, "닫기", () => this.destroy(), 104);
    this.createButton(width / 2 + 64, height / 2 + 140, "확인", () => this.check(), 104);
    window.fitDialog(this.scene, this.elements);
  }

  createButton(x, y, label, onClick, buttonWidth = 56) {
    const button = this.scene.add.rectangle(x, y, buttonWidth, 44, label === "확인" ? 0xd79a32 : 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, label, { color: label === "확인" ? "#111315" : "#d7d2c8", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    button.on("pointerdown", onClick);
    this.add(button);
    this.add(text);
  }

  selectWire(wire) {
    window.audioManager.playEffect("click");
    this.selectedWire = wire;
    this.message.setText(`${wire} 전선을 선택했습니다. 단자를 선택하세요.`);
  }

  connect(terminal) {
    if (!this.selectedWire) {
      window.audioManager.playEffect("error");
      this.message.setText("먼저 전선을 선택하세요.");
      return;
    }
    this.connections[this.selectedWire] = terminal;
    window.audioManager.playEffect("cable");
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
