class Layout {
  constructor(width, height) {
    this.isMobile = width < 600;
    this.headerY = 20;

    if (this.isMobile) {
      this.stage = { x: 16, y: 150, width: width - 32, height: height - 310 };
      this.panel = { x: 16, y: height - 140, width: width - 32, height: 110 };
    } else {
      const stageWidth = Math.floor(width * 0.68) - 24;
      this.stage = { x: 16, y: 120, width: stageWidth, height: height - 150 };
      this.panel = { x: stageWidth + 32, y: 120, width: width - stageWidth - 48, height: height - 150 };
    }
  }
}

window.Layout = Layout;
