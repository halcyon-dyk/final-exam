class InventoryPanel {
  constructor(scene, state) {
    this.scene = scene;
    this.state = state;
    const { width } = scene.scale;

    this.background = scene.add.rectangle(width - 145, 125, 240, 180, 0xffffff, 1);
    this.title = scene.add.text(width - 250, 52, "보관함", {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "22px",
    });
    this.contents = scene.add.text(width - 250, 88, "", {
      color: "#374151",
      fontFamily: "sans-serif",
      fontSize: "18px",
      lineSpacing: 10,
    });
    this.itemTexts = [];
    this.elements = [this.background, this.title, this.contents];
    this.hide();
  }

  show() {
    this.elements.forEach((element) => element.setVisible(true));
    this.render();
  }

  hide() {
    this.elements.forEach((element) => element.setVisible(false));
    this.itemTexts.forEach((itemText) => itemText.setVisible(false));
  }

  toggle() {
    if (this.background.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  render() {
    this.itemTexts.forEach((itemText) => itemText.destroy());
    this.itemTexts = [];

    if (this.state.items.length === 0) {
      this.contents.setText("보관한 도구가 없습니다.");
      this.contents.setVisible(true);
      return;
    }

    this.contents.setText("");
    this.contents.setVisible(false);
    this.state.items.forEach((item, index) => {
      const prefix = this.state.selectedItem === item ? "▶ " : "• ";
      const itemText = this.scene.add.text(this.contents.x, 88 + index * 32, `${prefix}${item}`, {
        color: "#374151",
        fontFamily: "sans-serif",
        fontSize: "18px",
      }).setInteractive({ useHandCursor: true });

      itemText.on("pointerdown", () => {
        this.state.selectItem(item);
        this.render();
      });
      this.itemTexts.push(itemText);
    });
  }
}

window.InventoryPanel = InventoryPanel;
