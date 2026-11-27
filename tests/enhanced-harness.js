// Loaded only by the isolated Chrome test runner; never by the game.
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = (value, message) => { if (!value) throw Error(message); };
  const until = async fn => { const start = Date.now(); while (!fn()) { if (Date.now() - start > 25000) throw Error('timeout'); await wait(30); } };
  try {
    await until(() => window.escapeGame?.scene.isActive('StartScene'));
    const game = window.escapeGame, state = window.gameState;
    const phase = sessionStorage.getItem('testPhase') || 'new';
    let scene;
    const active = () => game.scene.getScenes(true)[0];
    const click = label => {
      const current = active();
      const text = current.children.list.find(e => e.active && e.visible && e.text === label)
        || current.inventoryPanel?.itemTexts.find(e => e.active && e.visible && label.startsWith('• ') && e.text === label.slice(2));
      check(text, 'missing button: ' + label);
      const target = text.input ? text : current.children.list.find(e => e.input && e.visible && e.depth === text.depth && Math.abs(e.x - text.x) < 4 && e.y === text.y);
      check(target, 'missing input: ' + label); target.emit('pointerdown');
    };
    const settle = async () => { await wait(400); scene = game.scene.getScene('GameScene'); scene.pausedForMenu = true; };
    const checkpoint = next => { state.save(); sessionStorage.setItem('testPhase', next); location.reload(); };
    const bounds = element => {
      const b = element.getBounds();
      check(b.left >= -1 && b.top >= -1 && b.right <= scene.scale.width + 1 && b.bottom <= scene.scale.height + 1, 'offscreen: ' + (element.text || element.type));
    };
    const dialog = () => {
      const panel = scene.investigationPanel;
      [panel.background, panel.title, panel.message, panel.closeButton, ...panel.pageControls].forEach(bounds);
      check(panel.title.getBounds().bottom < panel.message.getBounds().top, 'title overlaps text');
      const buttons = [panel.closeButton, ...panel.pageControls.filter(e => e.input)];
      for (const button of buttons) {
        check(button.displayWidth >= 44 && button.displayHeight >= 44, 'small dialog control');
        check(panel.message.getBounds().bottom < button.getBounds().top, 'text overlaps control');
      }
      for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) check(!Phaser.Geom.Intersects.RectangleToRectangle(buttons[i].getBounds(), buttons[j].getBounds()), 'dialog buttons overlap');
    };
    const room = () => new (state.currentRoom === '정비실' ? MaintenanceRoom : ControlRoom)(scene, scene.investigationPanel, state, scene.feedback);
    const Power = PowerPuzzle; PowerPuzzle = class extends Power { constructor(...args) { super(...args); window.testPower = this; } };
    const Sequence = SequencePuzzle; SequencePuzzle = class extends Sequence { constructor(...args) { super(...args); window.testSequence = this; } };
    if (phase === 'new') {
      check(!state.hasActiveSave(), 'unexpected save');
      game.scene.getScene('StartScene').startNewGame(); await settle();
      window.audioManager.setSetting('muted', true);
      localStorage.setItem('escapeDisableFlash', 'true');
      click('바닥 쪽지'); dialog(); click('닫기'); click('벽 낙서'); click('닫기');
      click('잠긴 상자'); for (const digit of ['4', '2', '7']) click(digit); click('확인'); await settle();
      await until(() => scene.children.list.some(e => e.active && e.visible && e.text === '드라이버'));
      click('드라이버'); scene.investigationPanel.hide();
      scene.inventoryPanel.show(); click('• 드라이버'); click('환풍구 덮개');
      check(state.isSolved('정비실 통로'), 'vent'); scene.moveToNextRoom(); await settle();
      click('작업일지'); dialog(); click('›'); dialog(); click('‹'); click('닫기');
      const beforeReading = state.timeRemaining; scene.pausedForMenu = false; click('작업일지'); scene.timerDisplay.tick(); check(state.timeRemaining === beforeReading - 1, 'reading pauses timer'); click('닫기'); scene.pausedForMenu = true;
      click('볼트 조사'); click('닫기'); click('공구함');
      for (const symbol of ['△', '⬡', '□']) click(symbol); click('확인');
      click('손전등 본체'); scene.investigationPanel.hide();
      scene.inventoryPanel.show(); click('• 손전등 본체'); click('조합'); click('• 배터리');
      check(state.hasItem('손전등') && !state.hasItem('배터리'), 'flashlight combination');
      click('어두운 벽면'); check(!state.isSolved('통제실 통로'), 'early passage');
      check(scene.hintPanel.getTask() === '전력 배분', 'power hint task');
      scene.hintPanel.showHint(); dialog(); check(state.hintUses === 0, 'opening charged');
      click('첫 힌트 공개 (+1회)'); dialog(); check(state.hintUses === 1, 'first reveal');
      click('닫기'); scene.hintPanel.showHint(); check(state.hintUses === 1, 'reread charged');
      click('다음 힌트 공개 (+1회)'); click('‹'); check(state.hintUses === 2, 'page charged'); dialog(); click('닫기');
      const oldTime = state.timeRemaining; scene.pausedForMenu = false; scene.showMenu(false); scene.timerDisplay.tick(); check(state.timeRemaining === oldTime, 'pause timer'); click('계속하기');
      scene.pausedForMenu = true;
      // Resize restarts the room; labels and documents must remain usable.
      const width = scene.scale.width, height = scene.scale.height;
      scene.pausedForMenu = false;
      game.scale.resize(width === 960 ? 390 : 960, height); await settle();
      click('작업일지'); dialog(); click('닫기');
      scene.pausedForMenu = false;
      game.scale.resize(width, height); await settle();
      const tags = scene.children.list.filter(e => e.type === 'Text' && e.depth === 1 && e.input);
      tags.forEach(bounds);
      for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) check(!Phaser.Geom.Intersects.RectangleToRectangle(tags[i].getBounds(), tags[j].getBounds()), 'room labels overlap: ' + tags[i].text + '/' + tags[j].text);
      room().openPowerPuzzle(); window.testPower.toggle(0); checkpoint('power-input'); return;
    }
    // Use the actual Continue button after a real page reload.
    const start = game.scene.getScene('StartScene');
    const continueButton = start.children.list.filter(e => e.input)[1];
    check(continueButton, 'continue unavailable'); continueButton.emit('pointerdown'); await settle();
    check(window.audioManager.settings.muted && window.audioManager.level('effects') === 0, 'mute lost on reload');
    if (phase === 'power-input') {
      check(!state.isSolved('전력 배분') && !state.isSolved('통제실 통로'), 'unconfirmed power saved');
      check(state.hintUses === 2 && state.hintStages['전력 배분'] === 2, 'hints lost');
      scene.hintPanel.showHint(); dialog(); click('‹'); check(state.hintUses === 2, 'restored reread charged'); click('닫기');
      room().openPowerPuzzle(); check(window.testPower.switches.every(value => !value), 'switches survived reload');
      window.testPower.toggle(0); window.testPower.toggle(2); click('확인');
      check(state.isSolved('전력 배분') && state.isSolved('통제실 통로'), 'power completion'); checkpoint('power-solved'); return;
    }
    if (phase === 'power-solved') {
      check(state.isSolved('전력 배분') && state.isSolved('통제실 통로'), 'completed power lost');
      room().openPowerPuzzle(); check(scene.investigationPanel.message.text.includes('완료'), 'completed power reopened'); click('닫기');
      scene.moveToNextRoom(); await settle();
      const control = room();
      const stage = scene.layout.stage;
      const inspect = (x, y) => {
        const target = scene.children.list.find(e => e.input && e.type === 'Rectangle' && Math.abs(e.x - (stage.x + stage.width * x)) < 1 && Math.abs(e.y - (stage.y + stage.height * y)) < 1);
        check(target, 'control object'); target.emit('pointerdown');
      };
      inspect(.18, .57); dialog(); click('›'); dialog(); click('›'); dialog(); click('닫기');
      inspect(.7, .86); dialog(); click('닫기');
      scene.memoPanel.show(); scene.memoPanel.page = state.notes.findIndex(n => n.startsWith('실험 기록 B')); scene.memoPanel.render(); scene.memoPanel.contents.emit('pointerdown'); dialog(); click('닫기'); scene.memoPanel.hide();
      control.openWirePuzzle(); for (const label of ['A', '2', 'B', '3', 'C', '1']) click(label); click('확인');
      check(state.isSolved('배선'), 'wiring');
      control.openDoor(); click('톱니'); checkpoint('door-input'); return;
    }
    if (phase === 'door-input') {
      check(!state.isSolved('비상문'), 'unconfirmed door saved');
      room().openDoor(); check(window.testSequence.input.length === 0, 'sequence survived reload');
      for (const label of ['눈', '달', '톱니']) click(label); click('확인'); check(!state.isSolved('비상문'), 'old answer accepted');
      for (const label of ['톱니', '달', '눈']) click(label); click('확인'); checkpoint('door-solved'); return;
    }
    check(phase === 'door-solved' && state.isSolved('비상문'), 'completed door lost');
    const score = Math.max(0, 1000 + state.timeRemaining * 5 - state.hintUses * 100);
    room().openDoor(); await until(() => game.scene.isActive('ResultScene'));
    let result = game.scene.getScene('ResultScene');
    check(result.success && !state.hasActiveSave(), 'success did not clear save');
    check(result.children.list.some(e => e.text === String(score)), 'hint score');
    result.children.list.find(e => e.input).emit('pointerdown'); await settle();
    check(state.saveVersion === 2 && !state.isSolved('전력 배분') && !state.clueIds.length && !state.items.length && state.hintUses === 0, 'success restart reset');
    state.timeRemaining = 1; scene.pausedForMenu = false; scene.timerDisplay.tick();
    await until(() => game.scene.isActive('ResultScene')); result = game.scene.getScene('ResultScene');
    check(!result.success && !state.hasActiveSave(), 'failure save');
    result.children.list.find(e => e.input).emit('pointerdown'); await settle();
    check(state.timeRemaining === 1200 && !state.clueIds.length && !state.isSolved('비상문'), 'failure restart');
    check(window.audioManager.settings.muted && localStorage.getItem('escapeDisableFlash') === 'true', 'preferences reset');
    for (const invalid of ['broken', '{}', '{"timeRemaining":0}']) { localStorage.setItem('escapeGameState', invalid); check(!state.hasActiveSave() && !state.load(), 'invalid continue'); }
    state.clearSave(); check(!state.hasActiveSave(), 'no save');
    state.addItem('드라이버'); state.solvePuzzle('전력 배분');
    scene.scene.start('StartScene'); await until(() => game.scene.isActive('StartScene'));
    const newStart = game.scene.getScene('StartScene'); newStart.confirmNewGame(); click('취소'); check(state.hasItem('드라이버'), 'cancel new game lost progress');
    newStart.confirmNewGame(); click('새 게임'); await settle();
    check(state.currentRoom === '감금실' && !state.items.length && !state.clueIds.length && !state.isSolved('전력 배분') && state.hintUses === 0, 'new game reset');
    state.currentRoom = '정비실'; for (const key of ['상자', '정비실 통로', '공구함', '배선도']) state.solvedPuzzles[key] = true;
    scene.scene.restart(); await settle(); scene.hintPanel.showHint(); click('첫 힌트 공개 (+1회)'); dialog();
    fetch('/report', {method:'POST',body:JSON.stringify({ok:true,width:scene.scale.width,realReloads:4,fullEscape:true,successFailureReset:true})});
  } catch (error) { fetch('/report', {method:'POST',body:JSON.stringify({ok:false,phase:sessionStorage.getItem('testPhase'),error:error.stack})}); }
})();
