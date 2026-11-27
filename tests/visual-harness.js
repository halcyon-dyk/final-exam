// Inspect all room visual states in a fresh profile, including save restoration.
(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const check=(v,m)=>{if(!v)throw Error(m);};
  const until=async fn=>{const start=Date.now();while(!fn()){if(Date.now()-start>25000)throw Error('timeout');await wait(30);}};
  try{
    await until(()=>window.escapeGame?.scene.isActive('StartScene'));
    const game=window.escapeGame,state=window.gameState;
    game.scene.getScene('StartScene').startNewGame();await until(()=>game.scene.isActive('GameScene'));
    const scene=game.scene.getScene('GameScene');scene.pausedForMenu=true;
    const panel={show(){},hide(){},showPages(){}},feedback={play(){}};
    const cases=[
      ['prison-closed','감금실',PrisonRoom,[],'prisonBackground'],
      ['prison-box-open','감금실',PrisonRoom,['상자'],'prisonBoxOpen'],
      ['prison-vent-open','감금실',PrisonRoom,['상자','정비실 통로'],'prisonBoxVentOpen'],
      ['maintenance-closed','정비실',MaintenanceRoom,[],'maintenanceBackground'],
      ['maintenance-open','정비실',MaintenanceRoom,['공구함'],'maintenanceToolboxOpen'],
      ['maintenance-powered','정비실',MaintenanceRoom,['공구함','전력 배분','통제실 통로'],'maintenancePowered'],
      ['control-off','통제실',ControlRoom,[],'controlBackground'],
      ['control-on','통제실',ControlRoom,['배선'],'controlPowered'],
      ['control-open','통제실',ControlRoom,['배선','비상문'],'controlDoorOpen'],
    ];
    for(const [name,room,Room,keys,texture] of cases){
      scene.children.removeAll(true);state.reset();state.currentRoom=room;
      for(const key of keys)state.solvedPuzzles[key]=true;
      const view=new Room(scene,panel,state,feedback);view.create();
      check(view.background.texture.key===texture,name+' texture');
      check(view.background.texture.key!=='__MISSING',name+' missing');
      if(room==='통제실'){
        const tags=scene.children.list.filter(e=>e.type==='Text'&&e.input);
        check(tags.length===5,'five runtime labels');
        for(const tag of tags){const b=tag.getBounds();check(b.left>=0&&b.right<=scene.scale.width&&b.top>=0&&b.bottom<=scene.scale.height,name+' label bounds');}
        for(let i=0;i<tags.length;i++)for(let j=i+1;j<tags.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(tags[i].getBounds(),tags[j].getBounds()),name+' label overlap');
      }
      state.save();state.reset();state.load();
      scene.children.removeAll(true);
      const restored=new Room(scene,panel,state,feedback);restored.create();
      check(restored.background.texture.key===texture,name+' restored');
      window.visualCapture=name;await until(()=>window.visualCapture===null);
    }
    state.reset();scene.children.removeAll(true);
    const reset=new ControlRoom(scene,panel,state,feedback);reset.create();check(reset.background.texture.key==='controlBackground','reset closed/off');
    state.currentRoom='통제실';state.solvedPuzzles['배선']=true;state.solvedPuzzles['비상문']=true;
    scene.scene.restart();await wait(300);
    fetch('/report',{method:'POST',body:JSON.stringify({ok:true,width:scene.scale.width,visualStates:cases.length,saveRestore:true})});
  }catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,error:error.stack})});}
})();
