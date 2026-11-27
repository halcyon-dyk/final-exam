class Layout {
  constructor(width, height) {
    this.isMobile = width < 600;
    this.headerY = 20;

    if (this.isMobile) {
      this.stage = { x: 16, y: 176, width: width - 32, height: height - 376 };
      this.panel = { x: 16, y: height - 188, width: width - 32, height: 128 };
    } else {
      const stageWidth = Math.floor(width * 0.68) - 24;
      this.stage = { x: 16, y: 132, width: stageWidth, height: height - 196 };
      this.panel = { x: stageWidth + 32, y: 132, width: width - stageWidth - 48, height: height - 196 };
    }
  }
}

window.Layout = Layout;

window.fitDialog = function(scene, elements) {
  const { width, height } = scene.scale;
  const bounds = elements.map(e => e.getBounds());
  const left = Math.min(...bounds.map(b => b.left));
  const right = Math.max(...bounds.map(b => b.right));
  const top = Math.min(...bounds.map(b => b.top));
  const bottom = Math.max(...bounds.map(b => b.bottom));
  const scale = Math.min(1, (width - 16) / (right - left), (height - 16) / (bottom - top));
  elements.forEach(e => { e.setPosition(width / 2 + (e.x - width / 2) * scale, height / 2 + (e.y - height / 2) * scale); e.setScale(scale); });
  const shield = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setInteractive().setDepth(elements[0].depth - 1);
  elements.push(shield);
};

window.watchResize = function(scene) {
  let pending;
  const resize = () => { clearTimeout(pending); pending = setTimeout(() => { if (scene.sys.isActive()) scene.scene.restart({ success: scene.success, restoreMenu: scene.pausedForMenu === true, menuHelp: scene.menuHelp }); }, 150); };
  scene.scale.on("resize", resize);
  scene.events.once("shutdown", () => { clearTimeout(pending); scene.scale.off("resize", resize); });
};
