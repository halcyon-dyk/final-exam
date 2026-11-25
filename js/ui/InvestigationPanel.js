class InvestigationPanel {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.background = scene.add.rectangle(width / 2, height / 2, 360, 260, 0x111315, 1).setStrokeStyle(1, 0xd79a32);
    this.title = scene.add.text(width / 2, height / 2 - 90, "", {
      color: "#d79a32",
      fontFamily: "sans-serif",
      fontSize: "22px",
    }).setOrigin(0.5);
    this.message = scene.add.text(width / 2, height / 2 - 10, "", {
      align: "center",
      color: "#d7d2c8",
      fontFamily: "sans-serif",
      fontSize: "18px",
      wordWrap: { width: 300 },
    }).setOrigin(0.5);
    this.closeButton = scene.add.rectangle(width / 2, height / 2 + 90, 100, 48, 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true });
    this.closeLabel = scene.add.text(width / 2, height / 2 + 90, "닫기", {
      color: "#d7d2c8",
      fontFamily: "sans-serif",
      fontSize: "18px",
    }).setOrigin(0.5);

    this.closeButton.on("pointerdown", () => this.hide());
    this.elements = [this.background, this.title, this.message, this.closeButton, this.closeLabel];
    this.elements.forEach((element) => element.setDepth(100));
    window.fitDialog(scene, this.elements);
    this.hide();
  }

  show(title, message, action = null) {
    this.pageControls?.forEach(element => element.destroy());
    this.pageControls = [];
    const { width, height } = this.scene.scale;
    const panelWidth = Math.min(360, width - 20);
    this.elements.forEach(element => element.setScale(1));
    this.title.setText(title);
    this.message.setWordWrapWidth(panelWidth - 40);
    this.message.setText(message);
    const panelHeight = this.message.height + 154 + (action ? 60 : 0);
    const top = height / 2 - panelHeight / 2;
    this.background.setPosition(width / 2, height / 2);
    this.title.setPosition(width / 2, top + 32);
    this.message.setPosition(width / 2, top + 70 + this.message.height / 2);
    this.closeButton.setPosition(width / 2, top + panelHeight - 40);
    this.closeLabel.setPosition(this.closeButton.x, this.closeButton.y);
    const scale = Math.min(1, (height - 16) / panelHeight);
    this.elements.slice(0, 5).forEach(element => {
      element.setPosition(width / 2 + (element.x - width / 2) * scale, height / 2 + (element.y - height / 2) * scale).setScale(scale);
    });
    this.background.setDisplaySize(panelWidth * scale, panelHeight * scale);
    this.elements.forEach((element) => element.setVisible(true));
    if (action) {
      const y = this.closeButton.y - 60 * scale;
      const button = this.scene.add.rectangle(width / 2, y, panelWidth - 40, 48, 0x30363a).setStrokeStyle(1, 0xd79a32).setDepth(100).setScale(scale).setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(width / 2, y, action.label, { color: "#d79a32", fontFamily: "sans-serif", fontSize: "18px" }).setOrigin(0.5).setDepth(100).setScale(scale);
      button.on("pointerdown", action.onClick);
      this.pageControls.push(button, label);
    }
  }

  hide() {
    this.pageControls?.forEach(element => element.destroy());
    this.pageControls = [];
    this.elements.forEach((element) => element.setVisible(false));
  }

  showPages(title, pages, page = 0, action = null) {
    this.show(`${title} (${page + 1}/${pages.length})`, pages[page], action);
    [-1, 1].forEach(direction => {
      const next = page + direction;
      if (next < 0 || next >= pages.length) return;
      const x = this.closeButton.x + direction * 112 * this.closeButton.scaleX;
      const y = this.closeButton.y;
      const button = this.scene.add.rectangle(x, y, 44, 48, 0x30363a).setStrokeStyle(1, 0xd79a32).setDepth(100).setScale(this.closeButton.scaleX).setInteractive({ useHandCursor: true });
      const label = this.scene.add.text(x, y, direction < 0 ? "‹" : "›", { color: "#d7d2c8", fontSize: "22px" }).setOrigin(0.5).setDepth(100).setScale(this.closeButton.scaleX);
      button.on("pointerdown", () => this.showPages(title, pages, next, action));
      this.pageControls.push(button, label);
    });
  }
}

window.InvestigationPanel = InvestigationPanel;
