class Feedback {
  constructor(scene) {
    this.scene = scene;
  }

  play(message, soundType = "feedback", duration = 1200) {
    const { width, height } = this.scene.scale;
    if (localStorage.getItem("escapeDisableFlash") !== "true") this.scene.cameras.main.flash(250, 255, 236, 153);
    if (this.cue?.active) {
      this.scene.tweens.killTweensOf(this.cue);
      this.cue.destroy();
    }
    const cue = this.scene.add.text(width / 2, height - 88, message, {
      color: "#d7d2c8",
      backgroundColor: "#111315",
      fontFamily: "sans-serif",
      fontSize: "22px",
      align: "center",
      lineSpacing: 6,
      padding: { left: 16, right: 16, top: 12, bottom: 12 },
      wordWrap: { width: Math.min(width - 64, 560), useAdvancedWrap: true },
    }).setOrigin(0.5, 1).setDepth(150);
    this.cue = cue;

    this.scene.tweens.add({
      targets: cue,
      alpha: 0,
      delay: duration,
      duration: 500,
      onComplete: () => cue.destroy(),
    });
    if (soundType === "feedback") {
      this.playWarningTone();
    } else {
      window.audioManager.playEffect(soundType);
    }
  }

  playWarningTone() {
    if (window.audioManager) {
      window.audioManager.playEffect("feedback");
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.05, context.currentTime);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch {
      // 화면 효과와 소리 단서는 오디오 재생을 지원하지 않는 환경에서도 표시한다.
    }
  }
}

window.Feedback = Feedback;
