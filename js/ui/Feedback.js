class Feedback {
  constructor(scene) {
    this.scene = scene;
  }

  play(message) {
    const { width, height } = this.scene.scale;
    this.scene.cameras.main.flash(250, 255, 236, 153);
    const cue = this.scene.add.text(width / 2, height * 0.8, `🔊 ${message}`, {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "20px",
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: cue,
      alpha: 0,
      delay: 1200,
      duration: 500,
      onComplete: () => cue.destroy(),
    });
    this.playWarningTone();
  }

  playWarningTone() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.05, context.currentTime);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  }
}

window.Feedback = Feedback;
