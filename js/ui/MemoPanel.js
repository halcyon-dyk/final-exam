class MemoPanel {
  constructor(scene, state, layout) {
    this.scene = scene;
    this.state = state;
    const { x, y, width, height } = layout.panel;

    this.background = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0xffffff, 1);
    this.title = scene.add.text(x + 16, y + 16, "메모장", {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "22px",
    });
    this.contents = scene.add.text(x + 16, y + 52, "", {
      color: "#374151",
      fontFamily: "sans-serif",
      fontSize: "18px",
      lineSpacing: 10,
      wordWrap: { width: width - 32 },
    });
    this.elements = [this.background, this.title, this.contents];
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
    this.contents.setText(this.state.notes.length === 0 ? "기록한 단서가 없습니다." : this.state.notes.map((note) => `• ${note}`).join("\n"));
  }
}

window.MemoPanel = MemoPanel;
