class PowerPuzzle {
  constructor(scene, onSuccess) {
    this.scene = scene;
    this.onSuccess = onSuccess;
    this.switches = [false, false, false];
    this.elements = [];
    this.labels = [];
    const { width, height } = scene.scale;
    const x = width / 2, y = height / 2;
    const w = Math.min(380, width - 20);
    this.add(scene.add.rectangle(x, y, w, 460, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.text(x, y - 192, "전력 배분", 22, "#d79a32");
    this.usage = this.text(x, y - 147, "사용 전력: 0 / 3칸");
    ["I", "II", "III"].forEach((name, index) => {
      const by = y - 86 + index * 62;
      this.text(x - w / 2 + 68, by, `${name} · ${[2, 2, 1][index]}칸`);
      this.labels.push(this.button(x + w / 2 - 76, by, 116, "꺼짐", () => this.toggle(index)));
    });
    this.message = this.text(x, y + 105, "장비 표시와 작업일지를 비교하세요.", 18);
    this.message.setWordWrapWidth(w - 32);
    this.button(x - 64, y + 187, 104, "닫기", () => this.destroy());
    this.button(x + 64, y + 187, 104, "확인", () => this.check());
    window.fitDialog(scene, this.elements);
  }

  add(element) { element.setDepth(200); this.elements.push(element); return element; }
  text(x, y, text, size = 18, color = "#d7d2c8") {
    return this.add(this.scene.add.text(x, y, text, { fontFamily: "sans-serif", fontSize: `${size}px`, color, align: "center" }).setOrigin(0.5));
  }
  button(x, y, width, text, action) {
    this.add(this.scene.add.rectangle(x, y, width, 48, 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true })).on("pointerdown", action);
    return this.text(x, y, text);
  }
  usedPower() { return this.switches.reduce((sum, on, index) => sum + (on ? [2, 2, 1][index] : 0), 0); }
  toggle(index) {
    this.switches[index] = !this.switches[index];
    this.labels[index].setText(this.switches[index] ? "켜짐" : "꺼짐");
    this.labels[index].setColor(this.switches[index] ? "#d79a32" : "#d7d2c8");
    this.usage.setText(`사용 전력: ${this.usedPower()} / 3칸`);
    this.message.setText("");
    window.audioManager.playEffect("click");
  }
  check() {
    const error = this.usedPower() > 3 ? "전력 부족: 3칸을 초과했습니다."
      : this.switches[1] ? "감시 전력을 차단해야 한다."
      : !this.switches[0] ? "환기가 꺼져 통로 잠금이 해제되지 않는다."
      : !this.switches[2] ? "조명이 꺼져 통로를 확인할 수 없다." : null;
    if (error) {
      this.message.setText(error);
      window.audioManager.playEffect("error");
      return;
    }
    this.destroy();
    this.onSuccess();
  }
  destroy() { this.elements.forEach(element => element.destroy()); }
}

window.PowerPuzzle = PowerPuzzle;
