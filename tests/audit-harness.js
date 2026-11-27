// Regression checks for actual canvas hit areas and UI transitions.
(async () => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async fn => { const start=Date.now(); while(!fn()){if(Date.now()-start>25000)throw Error('timeout');await wait(30);} };
  const check=(value,message)=>{if(!value)throw Error(message);};
  try {
    await until(()=>window.escapeGame?.scene.isActive('StartScene'));
    const game=window.escapeGame,state=window.gameState;
    const start=game.scene.getScene('StartScene');
    const startSize=start.children.list.filter(e=>e.input).map(e=>({width:e.displayWidth,height:e.displayHeight}));
    start.startNewGame();await until(()=>game.scene.isActive('GameScene'));await wait(200);
    const scene=game.scene.getScene('GameScene');
    const pointerClick=async(x,y)=>{
      const canvas=game.canvas,b=canvas.getBoundingClientRect();
      const options={clientX:b.left+x*b.width/scene.scale.width,clientY:b.top+y*b.height/scene.scale.height,bubbles:true,button:0};
      canvas.dispatchEvent(new MouseEvent('mousemove',options));
      canvas.dispatchEvent(new MouseEvent('mousedown',{...options,buttons:1}));
      canvas.dispatchEvent(new MouseEvent('mouseup',options));await wait(80);
    };
    state.items=['드라이버','손전등 본체','배터리'];state.selectedItem='손전등 본체';
    scene.inventoryPanel.show();scene.beginCombine();
    await wait(100);
    const panelBounds=scene.inventoryPanel.background.getBounds();
    const itemBounds=scene.inventoryPanel.itemTexts.map(e=>e.getBounds());
    for(const b of itemBounds)check(b.width>=44&&b.height>=44&&b.left>=panelBounds.left&&b.right<=panelBounds.right&&b.bottom<=panelBounds.bottom,'item touch bounds');
    for(let i=0;i<itemBounds.length;i++)for(let j=i+1;j<itemBounds.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(itemBounds[i],itemBounds[j]),'items overlap');
    check(scene.hintPanel.getHint(1).includes('바닥 쪽지'),'hint location');
    const battery=scene.inventoryPanel.itemTexts.find(e=>e.text.includes('배터리'));
    await pointerClick(battery.x+battery.width-5,battery.y+battery.height-5);
    const combinationBlocked=state.hasItem('배터리')&&scene.investigationPanel.background.visible;
    check(!combinationBlocked&&state.hasItem('손전등')&&!state.hasItem('손전등 본체'),'combine without closing modal');
    const itemSizes=scene.inventoryPanel.itemTexts.map(e=>({text:e.text,height:e.height}));
    scene.investigationPanel.hide();
    const clickLabel=async label=>{
      const text=scene.children.list.find(e=>e.visible&&e.active&&e.text===label);
      check(text,'missing '+label);await pointerClick(text.x,text.y);
    };
    scene.showMenu(false);const beforePause=scene.pausedForMenu;
    const beforeTime=state.timeRemaining;
    const width=scene.scale.width,height=scene.scale.height;
    game.scale.resize(width-1,height);await wait(600);
    const pauseLost=beforePause&&!scene.pausedForMenu;
    check(!pauseLost&&state.timeRemaining===beforeTime,'pause lost on resize');
    check(scene.children.list.some(e=>e.text==='일시정지 · 음향 설정'),'pause menu lost');
    game.scale.resize(width,height);await wait(600);
    check(scene.pausedForMenu&&state.timeRemaining===beforeTime,'pause lost on repeated resize');
    await clickLabel('계속하기');check(!scene.pausedForMenu,'cannot resume');
    scene.timerDisplay.tick();check(state.timeRemaining===beforeTime-1,'timer did not resume');
    scene.showMenu(true);game.scale.resize(width-1,height);await wait(600);
    check(scene.pausedForMenu&&scene.menuHelp,'help did not restore');
    await clickLabel('계속하기');game.scale.resize(width,height);await wait(600);
    check(!scene.pausedForMenu,'closed menu reappeared');
    state.currentRoom='통제실';scene.scene.restart();await wait(400);
    const stage=scene.layout.stage;
    await pointerClick(stage.x+stage.width*.55,stage.y+stage.height*.68);
    const lowerWireClick=scene.children.list.some(e=>e.depth===200&&e.visible&&e.text==='A');
    check(lowerWireClick,'wire click did not open wiring puzzle');
    await clickLabel('닫기');
    await pointerClick(stage.x+stage.width*.7,stage.y+stage.height*.86);
    check(scene.investigationPanel.title.text==='시설 지도 (1/1)','map click failed');
    scene.investigationPanel.hide();
    state.items=['드라이버','손전등 본체','배터리'];state.selectedItem='손전등 본체';
    scene.inventoryPanel.show();
    fetch('/report',{method:'POST',body:JSON.stringify({ok:true,width,combinationBlocked,pauseLost,lowerWireClick,startSize,itemSizes})});
  }catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,error:error.stack})});}
})();
