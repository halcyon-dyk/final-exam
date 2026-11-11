class InvestigationPanel {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.background = scene.add.rectangle(width / 2, height / 2, 360, 220, 0xffffff, 1);
    this.title = scene.add.text(width / 2, height / 2 - 65, "", {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "24px",
    }).setOrigin(0.5);
    this.message = scene.add.text(width / 2, height / 2 - 10, "", {
      align: "center",
      color: "#374151",
      fontFamily: "sans-serif",
      fontSize: "18px",
      wordWrap: { width: 300 },
    }).setOrigin(0.5);
    this.closeButton = scene.add.rectangle(width / 2, height / 2 + 70, 100, 40, 0x2563eb).setInteractive({ useHandCursor: true });
    this.closeLabel = scene.add.text(width / 2, height / 2 + 70, "닫기", {
      color: "#ffffff",
      fontFamily: "sans-serif",
      fontSize: "18px",
    }).setOrigin(0.5);

    this.closeButton.on("pointerdown", () => this.hide());
    this.elements = [this.background, this.title, this.message, this.closeButton, this.closeLabel];
    this.elements.forEach((element) => element.setDepth(100));
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
