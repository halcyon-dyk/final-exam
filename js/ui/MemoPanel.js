class MemoPanel {
  constructor(scene, state, layout) {
    this.scene = scene;
    this.state = state;
    this.page = 0;
    this.isMobile = layout.isMobile;
    const { x, y, width, height } = layout.panel;

    this.background = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x30363a, 0.65).setStrokeStyle(1, 0xd79a32, 0.4);
    this.title = scene.add.text(x + 16, y + 16, "메모장", {
      color: "#d79a32",
      fontFamily: "sans-serif",
      fontSize: "22px",
    });
    this.contents = scene.add.text(x + 16, y + 52, "", {
      color: "#d7d2c8",
      fontFamily: "sans-serif",
      fontSize: "18px",
      lineSpacing: 10,
      wordWrap: { width: width - 32 },
    });
    this.contents.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
      const note = this.state.notes[this.page];
      if (note) this.scene.investigationPanel.show("기록한 단서", note);
    });
    this.elements = [this.background, this.title, this.contents];
    [-1, 1].forEach((direction, index) => {
      const bx = x + width - 78 + index * 50;
      const button = scene.add.rectangle(bx, y + 24, 44, 44, 0x30363a).setInteractive({ useHandCursor: true });
      const label = scene.add.text(bx, y + 24, direction < 0 ? "‹" : "›", { color: "#d7d2c8", fontSize: "22px" }).setOrigin(0.5);
      button.on("pointerdown", () => {
        this.page = Math.max(0, Math.min(this.state.notes.length - 1, this.page + direction));
        this.render();
      });
      this.elements.push(button, label);
    });
    this.hide();
  }

  show() {
    this.render();
    this.elements.forEach((element) => element.setVisible(true));
  }

  hide() {
    this.elements.forEach((element) => element.setVisible(false));
  }

  toggle() {
    if (this.background.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  render() {
    const count = this.state.notes.length;
    this.page = Math.max(0, Math.min(this.page, count - 1));
    this.title.setText(`메모 ${count ? this.page + 1 : 0}/${count}`);
    const note = this.state.notes[this.page];
    this.contents.setText(!note ? "기록한 단서가 없습니다." : this.isMobile ? `${note.slice(0, 12)}…\n눌러서 전체 보기` : note);
    if (note && !this.isMobile && this.contents.height > this.background.height - 64) {
      this.contents.setText(`${note.slice(0, 12)}…\n눌러서 전체 보기`);
    }
  }
}

window.MemoPanel = MemoPanel;
