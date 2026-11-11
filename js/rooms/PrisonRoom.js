class PrisonRoom {
  constructor(scene, panel, state) {
    this.scene = scene;
    this.panel = panel;
    this.state = state;
  }

  create() {
    const { width, height } = this.scene.scale;

    this.scene.add.rectangle(width / 2, height * 0.42, width - 80, height * 0.5, 0xd1d5db);
    this.createObject(width * 0.3, height * 0.32, 130, 90, "벽", "벽에 새겨진 숫자는 28이다.", () => {
      this.state.addNote("상자 비밀번호 앞 두 자리: 28");
    });
    this.createObject(width * 0.55, height * 0.54, 90, 50, "쪽지", "쪽지에는 비밀번호의 뒤 두 자리가 64라고 적혀 있다.", () => {
      this.state.addNote("상자 비밀번호 뒤 두 자리: 64");
    });
    this.createObject(width * 0.75, height * 0.45, 120, 100, "상자", "비밀번호로 잠긴 상자다.");
  }

  createObject(x, y, width, height, label, message, onInspect) {
    const object = this.scene.add.rectangle(x, y, width, height, 0x6b7280).setInteractive({ useHandCursor: true });
    this.scene.add.text(x, y, label, {
      color: "#ffffff",
      fontFamily: "sans-serif",
      fontSize: "22px",
    }).setOrigin(0.5);

    object.on("pointerdown", () => {
      onInspect?.();
      this.panel.show(label, message);
    });
  }
}

window.PrisonRoom = PrisonRoom;
