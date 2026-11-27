class InventoryPanel {
  constructor(scene, state, layout, onItemSelected) {
    this.scene = scene;
    this.state = state;
    this.layout = layout;
    this.onItemSelected = onItemSelected;
    const { x, y, width, height } = layout.panel;

    this.background = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x30363a, 0.65).setStrokeStyle(1, 0xd79a32, 0.4);
    this.title = scene.add.text(x + 16, y + 16, "보관함", {
      color: "#d79a32",
      fontFamily: "sans-serif",
      fontSize: "22px",
    });
    this.contents = scene.add.text(x + 16, y + 52, "", {
      color: "#d7d2c8",
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
    const columns = this.layout.isMobile ? Math.min(3, this.state.items.length) : 1;
    const itemWidth = (this.layout.panel.width - 32 - (columns - 1) * 8) / columns;
    const itemHeight = this.layout.isMobile ? 64 : 48;
    this.state.items.forEach((item, index) => {
      const selected = this.state.selectedItem === item;
      const prefix = this.layout.isMobile ? "" : selected ? "▶ " : "• ";
      const itemText = this.scene.add.text(this.contents.x + (index % columns) * (itemWidth + 8), this.contents.y + Math.floor(index / columns) * (itemHeight + 8), `${prefix}${item}`, {
        color: this.state.selectedItem === item ? "#d79a32" : "#d7d2c8",
        backgroundColor: selected ? "#30363a" : "#111315",
        fontFamily: "sans-serif",
        fontSize: "18px",
        fixedWidth: itemWidth,
        fixedHeight: itemHeight,
        padding: { left: 4, right: 4, top: 8, bottom: 8 },
        wordWrap: { width: itemWidth - 8, useAdvancedWrap: true },
      }).setInteractive({ useHandCursor: true });

      itemText.on("pointerdown", () => {
        this.state.selectItem(item);
        this.render();
        this.onItemSelected?.(item);
      });
      this.itemTexts.push(itemText);
    });
  }
}

window.InventoryPanel = InventoryPanel;
