class AudioSettingsPanel {
  constructor(scene) {
    this.scene = scene;
    this.elements = [];
    const { width, height } = scene.scale;
    const x = width / 2, y = height / 2;
    const panelWidth = Math.min(380, width - 20);
    this.add(scene.add.rectangle(x, y, panelWidth, 464, 0x111315).setStrokeStyle(2, 0xd79a32));
    this.text(x, y - 180, "일시정지 · 음향 설정", 22, "#d79a32");
    this.text(x, y - 145, "설정 중에는 시간이 멈춥니다.");
    const audio = window.audioManager;
    const labels = {};
    const refresh = () => {
      labels.music.setText(`배경음  ${Math.round(audio.settings.music * 100)}%`);
      labels.effects.setText(`효과음  ${Math.round(audio.settings.effects * 100)}%`);
      mute.setText(`전체 음소거: ${audio.settings.muted ? "켜짐" : "꺼짐"}`);
      flash.setText(`깜빡임: ${localStorage.getItem("escapeDisableFlash") === "true" ? "꺼짐" : "켜짐"}`);
    };
    ["music", "effects"].forEach((key, index) => {
      const rowY = y - 88 + index * 64;
      labels[key] = this.text(x, rowY, "");
      [-1, 1].forEach(direction => this.button(x + direction * (panelWidth / 2 - 34), rowY, 44, direction < 0 ? "−" : "+", () => {
        audio.setSetting(key, audio.settings[key] + direction * 0.1);
        refresh();
        if (key === "effects") audio.playEffect("click");
      }));
    });
    const mute = this.button(x, y + 40, panelWidth - 32, "", () => { audio.setSetting("muted", !audio.settings.muted); refresh(); });
    this.button(x, y + 96, 112, "효과음 듣기", () => audio.playEffect("paper"));
    const flash = this.button(x, y + 152, 132, "", () => {
      localStorage.setItem("escapeDisableFlash", String(localStorage.getItem("escapeDisableFlash") !== "true"));
      refresh();
    });
    this.button(x, y + 202, 132, "계속하기", () => { this.elements.forEach(e => e.destroy()); scene.pausedForMenu = false; });
    refresh();
    window.fitDialog(scene, this.elements);
  }

  add(element) { element.setDepth(500); this.elements.push(element); return element; }
  text(x, y, label, size = 18, color = "#d7d2c8") {
    return this.add(this.scene.add.text(x, y, label, { fontFamily: "sans-serif", fontSize: `${size}px`, color }).setOrigin(0.5));
  }
  button(x, y, width, label, action) {
    this.add(this.scene.add.rectangle(x, y, width, 44, 0x30363a).setStrokeStyle(1, 0xd79a32).setInteractive({ useHandCursor: true })).on("pointerdown", action);
    return this.text(x, y, label);
  }
}

window.AudioSettingsPanel = AudioSettingsPanel;
