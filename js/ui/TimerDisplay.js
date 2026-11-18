class TimerDisplay {
  constructor(scene, state, onTimeExpired) {
    this.scene = scene;
    this.state = state;
    this.onTimeExpired = onTimeExpired;
    this.finished = false;
    const { width } = scene.scale;

    this.label = scene.add.text(width - 24, 20, "", {
      color: "#1f2937",
      fontFamily: "sans-serif",
      fontSize: "24px",
    }).setOrigin(1, 0).setDepth(20);
    this.update();

    scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tick(),
    });
  }

  tick() {
    if (this.state.timeRemaining > 0) {
      this.state.timeRemaining -= 1;
      this.update();
    }

    if (this.state.timeRemaining === 0 && !this.finished) {
      this.finished = true;
      this.onTimeExpired?.();
    }
  }

  update() {
    const minutes = Math.floor(this.state.timeRemaining / 60);
    const seconds = String(this.state.timeRemaining % 60).padStart(2, "0");
    this.label.setText(`${minutes}:${seconds}`);
  }
}

window.TimerDisplay = TimerDisplay;
