class ToolboxPuzzle extends SequencePuzzle {
  create() {
    const { width, height } = this.scene.scale;
    const x = width / 2;
    const y = height / 2;
    const w = Math.min(400, width - 20);
    this.add(this.scene.add.rectangle(x, y, w, 320, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.add(this.scene.add.text(x, y - 120, "공구함", { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "44px" }).setOrigin(0.5));
    this.display = this.scene.add.text(x, y - 55, "입력: ", { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5);
    this.add(this.display);
    this.message = this.scene.add.text(x, y + 130, "", { color: "#b94343", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5);
    this.add(this.message);
    ["□", "△", "⬡"].forEach((symbol, index) => this.createButton(x + (index - 1) * (w - 24) / 3, y + 5, symbol));
    this.createButton(x - 64, y + 75, "닫기", () => this.destroy());
    this.createButton(x + 64, y + 75, "확인", () => this.check());
    window.fitDialog(this.scene, this.elements);
  }

  createButton(x, y, symbol, action) {
    const button = this.scene.add.rectangle(x, y, 80, 48, 0x30363a).setStrokeStyle(2, 0xd79a32).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, symbol, { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: "22px" }).setOrigin(0.5);
    button.on("pointerdown", action || (() => this.select(symbol)));
    this.add(button);
    this.add(label);
  }

  static showBolts(scene) {
    const { width, height } = scene.scale;
    const x = width / 2;
    const y = height / 2;
    const w = Math.min(400, width - 20);
    const elements = [];
    const add = object => { object.setDepth(200); elements.push(object); return object; };
    const text = (tx, ty, value, size = 22) => add(scene.add.text(tx, ty, value, { color: "#d7d2c8", fontFamily: "sans-serif", fontSize: `${size}px` }).setOrigin(0.5));
    add(scene.add.rectangle(x, y, w, 320, 0x111315).setStrokeStyle(2, 0xd79a32));
    text(x, y - 120, "작업대 볼트", 44);
    [["중간", "⬡", 28], ["큰", "□", 36], ["작은", "△", 20]].forEach(([size, symbol, radius], index) => {
      const bx = x + (index - 1) * (w - 24) / 3;
      const points = [];
      for (let i = 0; i < 6; i++) {
        points.push(radius + Math.cos(i * Math.PI / 3) * radius, radius + Math.sin(i * Math.PI / 3) * radius);
      }
      add(scene.add.polygon(bx, y - 20, points, 0x30363a).setStrokeStyle(2, 0xd79a32));
      text(bx, y - 20, symbol);
      text(bx, y + 40, size, 18);
    });
    const close = add(scene.add.rectangle(x, y + 110, 100, 48, 0x30363a).setStrokeStyle(2, 0xd79a32).setInteractive({ useHandCursor: true }));
    text(x, y + 110, "닫기", 18);
    close.on("pointerdown", () => elements.forEach(element => element.destroy()));
    window.fitDialog(scene, elements);
  }
}

window.ToolboxPuzzle = ToolboxPuzzle;
