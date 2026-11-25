const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 960,
  height: 640,
  backgroundColor: "#ffffff",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StartScene, GameScene, ResultScene],
};

window.escapeGame = new Phaser.Game(config);
window.oneStore.attach(window.escapeGame);
