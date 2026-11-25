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

  show(title, message) {
    this.title.setText(title);
    this.message.setText(message);
    this.elements.forEach((element) => element.setVisible(true));
  }

  hide() {
    this.elements.forEach((element) => element.setVisible(false));
  }
}

window.InvestigationPanel = InvestigationPanel;
