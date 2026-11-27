const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const reports = [];
let phaser;
const harness = `
const maintenanceCreate = MaintenanceRoom.prototype.create;
MaintenanceRoom.prototype.create = function(){this.scene.testMaintenance=this;maintenanceCreate.call(this);};
const originalCreate = GameScene.prototype.create;
GameScene.prototype.create = async function() {
 originalCreate.call(this);
 try {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  const audioContext = new AudioContext();
  for(const [file,duration] of [['bolts-rattle',1.8],['wall-knock',1.2],['cable-connect',1.2]]) {
   const response=await fetch('/js/audio/effects/'+file+(file==='cable-connect'?'.wav':'.mp3'));check(response.ok,'audio HTTP '+file);
   const buffer=await audioContext.decodeAudioData(await response.arrayBuffer());
   const samples=buffer.getChannelData(0);let energy=0;
   const length=Math.min(samples.length,Math.floor(buffer.sampleRate*duration));
   for(let i=0;i<length;i++)energy+=samples[i]*samples[i];
   check(buffer.duration>=duration&&Math.sqrt(energy/length)>0.001,'silent inspection marker '+file+' first audible: '+samples.findIndex(value=>Math.abs(value)>0.03)/buffer.sampleRate);
  }
  await audioContext.close();
  if(location.search.includes('audio')) {
   const decoder=new AudioContext();
   const paths=[];GameScene.prototype.preload.call({load:{image(){},audio(key,file){paths.push(file);}}});
   const audit=[];
   for(const file of paths) {
    const response=await fetch('/'+file);check(response.ok,'audio HTTP '+file);
    const buffer=await decoder.decodeAudioData(await response.arrayBuffer());
    let sum=0,peak=0,count=0;
    for(let ch=0;ch<buffer.numberOfChannels;ch++)for(const sample of buffer.getChannelData(ch)){sum+=sample*sample;peak=Math.max(peak,Math.abs(sample));count++;}
    check(Math.sqrt(sum/count)>0.0001&&Number.isFinite(peak),'silent/invalid '+file);
    audit.push({file,seconds:+buffer.duration.toFixed(2),rms:+Math.sqrt(sum/count).toFixed(4),peak:+peak.toFixed(4)});
   }
   console.log(JSON.stringify(audit));
   await fetch('/audio-audit',{method:'POST',body:JSON.stringify(audit)});
   await decoder.close();
  }
  const click = label => {
   const text = this.children.list.find(e => e.text === label && e.active && e.visible);
   const button = this.children.list.find(e => e.input && e.visible && e.depth === text.depth && Math.abs(e.x - text.x) <= 4 && e.y === text.y);
   check(!!button, 'missing button: '+label); button.emit('pointerdown');
  };
  check(this.toolbarControls.length===6,'toolbar count');
  check(!this.children.list.some(e=>e.text==='조사'||e.text==='피드백'),'removed controls');
  const toolbar=this.toolbarControls.map(c=>c.button.getBounds());
  for(const b of toolbar)check(b.left>=0&&b.right<=this.scale.width&&b.bottom<this.layout.stage.y,'toolbar bounds');
  for(let i=0;i<toolbar.length;i++)for(let j=i+1;j<toolbar.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(toolbar[i],toolbar[j]),'toolbar overlap');
  click('일시정지');check(this.pausedForMenu,'pause');click('계속하기');check(!this.pausedForMenu,'resume');
  click('일시정지');
  const audio=window.audioManager;
  const plus=this.children.list.filter(e=>e.text==='+'&&e.active);
  const minus=this.children.list.filter(e=>e.text==='−'&&e.active);
  const press=text=>this.children.list.find(e=>e.input&&e.visible&&e.x===text.x&&e.y===text.y).emit('pointerdown');
  press(minus[0]);check(audio.settings.music===0.6,'music minus');
  press(plus[1]);check(audio.settings.effects===0.9,'effect plus');
  click('전체 음소거: 꺼짐');await new Promise(resolve=>setTimeout(resolve,100));check(audio.settings.muted&&audio.background.volume===0,'mute background');
  click('전체 음소거: 켜짐');check(!audio.settings.muted,'unmute');
  const restored=new AudioManager();check(restored.settings.music===0.6&&restored.settings.effects===0.9,'settings persistence');
  click('효과음 듣기');click('계속하기');
  audio.setSetting('music',0.7);audio.setSetting('effects',0.8);
  click('도움말');check(this.pausedForMenu,'help');click('계속하기');
  click('힌트 (0)');check(this.state.hintUses===0&&this.investigationPanel.background.visible,'free hint opening');click('첫 힌트 공개 (+1회)');check(this.state.hintUses===1,'explicit hint');click('닫기');
  const effectCalls=[];const playEffect=window.audioManager.playEffect.bind(window.audioManager);
  window.audioManager.playEffect=type=>{effectCalls.push(type);playEffect(type);};
  click('작업일지');check(effectCalls.at(-1)==='paper','journal sound'); this.investigationPanel.hide();
  click('볼트 조사');check(effectCalls.at(-1)==='bolts','bolt sound'); click('닫기');
  check(this.state.notes.length === 3, 'clue notes');
  this.memoPanel.show();click('›');check(this.memoPanel.page===1,'memo next');
  this.memoPanel.contents.emit('pointerdown');check(this.investigationPanel.message.text===this.state.notes[1],'memo full clue');
  this.investigationPanel.hide();click('‹');check(this.memoPanel.page===0,'memo previous');this.memoPanel.hide();
  click('작업일지');this.investigationPanel.hide();check(this.state.notes.length===3,'duplicate note');
  const room = this.testMaintenance;
  click('손전등 본체');check(effectCalls.at(-1)==='flashlight','body sound');this.investigationPanel.hide();
  click('어두운 벽면');check(effectCalls.at(-1)==='wall','wall sound');this.investigationPanel.hide();
  room.openToolbox();check(effectCalls.at(-1)==='metal','toolbox sound');click('□');click('확인');check(!this.state.hasItem('배터리'),'wrong reward');
  click('△');click('닫기');room.openToolbox();
  click('△');click('⬡');click('□');check(!this.state.hasItem('배터리'),'early reward');click('확인');
  check(this.state.hasItem('배터리') && this.state.isSolved('공구함'),'reward missing');
  check(room.background.texture.key==='maintenanceToolboxOpen','toolbox visual update');
  room.collectPart('손전등 본체');this.state.combiningItem='손전등 본체';this.finishCombine('배터리');
  room.useFlashlight();check(!this.state.isSolved('통제실 통로'),'flashlight opens passage too early');
  check(effectCalls.at(-1)==='flashlight','lit wall sound');
  room.openPowerPuzzle();
  const switches=this.children.list.filter(e=>e.input&&e.depth===200&&e.width===116);
  switches[0].emit('pointerdown');switches[2].emit('pointerdown');click('확인');
  check(this.state.isSolved('통제실 통로')&&effectCalls.at(-1)==='powerRestore','power passage and sound');
  room.openToolbox();check(!this.state.hasItem('배터리'),'duplicate battery');this.investigationPanel.hide();
  const control = new ControlRoom(this,this.investigationPanel,this.state,this.feedback);
  control.createBackground=()=>{};
  const beforeControl=this.children.list.length;control.create();
  const objects=this.children.list.slice(beforeControl).filter(e=>e.type==='Rectangle');
  for(const index of [0,2,3]){objects[index].emit('pointerdown');check(effectCalls.at(-1)==='paper','document sound');this.investigationPanel.hide();}
  objects[1].emit('pointerdown');check(effectCalls.at(-1)==='cable','inspect wires');
  click('1');check(effectCalls.at(-1)==='error','terminal without wire');
  click('A');check(effectCalls.at(-1)==='click','wire select');click('2');check(effectCalls.at(-1)==='cable','wire connect');
  click('확인');check(effectCalls.at(-1)==='error','wrong wires');
  click('B');click('3');click('C');click('1');click('확인');check(effectCalls.at(-1)==='powerRestore','power restored');
  objects[1].emit('pointerdown');check(effectCalls.at(-1)==='cable','no power replay');this.investigationPanel.hide();
  objects[4].emit('pointerdown');check(effectCalls.at(-1)==='click','door panel');
  click('달');click('확인');check(effectCalls.at(-1)==='error','wrong door');
  click('톱니');click('달');click('눈');check(effectCalls.at(-1)==='click','door input');
  const delayedCall=this.time.delayedCall;this.time.delayedCall=()=>{};
  click('확인');this.time.delayedCall=delayedCall;check(effectCalls.at(-1)==='doorOpen','door unlocked');
  const startScene=this.scene.start;let escaped=false;this.scene.start=()=>{escaped=true;};
  const effectCount=effectCalls.length;objects[4].emit('pointerdown');this.scene.start=startScene;
  check(escaped&&effectCalls.length===effectCount,'no unlock replay on exit');this.investigationPanel.hide();
  objects.forEach(object=>object.destroy());
  this.children.list.filter(e=>e.depth===100&&e.type==='Text').forEach(e=>e.setVisible(false));
  this.cameras.main.resetFX();
  this.feedback.cue?.setVisible(false);
  const puzzle = location.search.includes('ui-code') ? new CodePuzzle(this,'427',()=>{}) : location.search.includes('ui-wire') ? new WirePuzzle(this,()=>{}) : location.search.includes('ui-sequence') ? new SequencePuzzle(this,['눈','달','톱니'],()=>{}) : new ToolboxPuzzle(this,['△','⬡','□'],()=>{});
  const buttons=puzzle.elements.filter(e=>e.input&&e.depth===200);
  for(const button of buttons){const b=button.getBounds();check(b.left>=0&&b.right<=this.scale.width&&b.top>=0&&b.bottom<=this.scale.height,'bounds');}
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(buttons[i].getBounds(),buttons[j].getBounds()),'overlap');
  if(location.search.includes('bolts')) {puzzle.destroy();ToolboxPuzzle.showBolts(this);}
  if(location.search.includes('hud')) {puzzle.destroy();this.inventoryPanel.show();}
  if(location.search.includes('audio')) {
   puzzle.destroy();this.showMenu(false);
   const controls=this.children.list.filter(e=>e.input&&e.depth===500);
   for(const control of controls){const b=control.getBounds();check(b.left>=0&&b.right<=this.scale.width&&b.top>=0&&b.bottom<=this.scale.height,'settings bounds');}
   for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(controls[i].getBounds(),controls[j].getBounds()),'settings overlap');
  }
  if(location.search.includes('visual')) {
   puzzle.destroy();this.children.removeAll(true);
   const panel={show(){},hide(){}}, feedback={play(){}};
   this.state.reset();this.state.solvePuzzle('상자');this.state.addItem('드라이버');this.state.selectItem('드라이버');
   const prison=new PrisonRoom(this,panel,this.state,feedback);prison.create();
   check(prison.background.texture.key==='prisonBoxOpen','box open and vent initially closed');
   this.state.save();this.state.reset();this.state.load();
   check(this.state.isSolved('상자')&&!this.state.isSolved('정비실 통로'),'saved box only');
   this.state.selectItem('드라이버');
   click('벽 낙서');click('바닥 쪽지');check(this.state.notes.length===2,'prison clue labels');
   click('환풍구 덮개');
   check(prison.background.texture.key==='prisonBoxVentOpen','box and vent open immediately');
   this.state.save();this.state.reset();this.state.load();
   this.children.removeAll(true);const prisonReload=new PrisonRoom(this,panel,this.state,feedback);prisonReload.create();
   check(prisonReload.background.texture.key==='prisonBoxVentOpen','saved box and vent');
   if(!location.search.includes('vent')) {
    this.children.removeAll(true);this.state.reset();
    const visualControl=new ControlRoom(this,panel,this.state,feedback);visualControl.create();
    check(visualControl.powerLabel.text==='전원 차단'&&visualControl.doorTag.text==='비상문','control initially off');
    this.state.solvePuzzle('배선');visualControl.refreshVisuals();
    check(visualControl.powerLabel.text==='전원 복구'&&visualControl.doorTag.text==='비상문'&&visualControl.background.texture.key==='controlPowered','power without open door');
    if(location.search.includes('door')) {
     this.state.solvePuzzle('비상문');visualControl.refreshVisuals();
     check(visualControl.background.texture.key==='controlDoorOpen'&&visualControl.doorTag.text==='열린 비상문','door opens');
    }
    this.state.save();const expectedKey=visualControl.background.texture.key;this.state.reset();this.state.load();
    this.children.removeAll(true);const loadedControl=new ControlRoom(this,panel,this.state,feedback);loadedControl.create();
    check(loadedControl.background.texture.key===expectedKey&&loadedControl.powerLabel.text==='전원 복구','saved control visuals');
    this.state.reset();loadedControl.refreshVisuals();check(loadedControl.background.texture.key==='controlBackground'&&loadedControl.doorTag.text==='비상문','new game visual reset');
    this.state.load();loadedControl.refreshVisuals();
   }
  }
  window.audioManager.playEffect=playEffect;
  fetch('/report',{method:'POST',body:JSON.stringify({ok:true,width:this.scale.width,notes:this.state.notes.length,passage:this.state.isSolved('통제실 통로')})});
 } catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,error:error.stack})});}
};
window.gameState.reset();window.gameState.currentRoom='정비실';
window.gameState.solvePuzzle('상자');window.gameState.solvePuzzle('정비실 통로');
config.scene=[GameScene];config.audio={disableWebAudio:false};window.escapeGame=new Phaser.Game(config);window.oneStore.started=true;window.oneStore.attach(window.escapeGame);
`;
const server = http.createServer((req,res)=>{
 if(req.url==='/audio-audit'){let body='';req.on('data',d=>body+=d);req.on('end',()=>{fs.writeFileSync(path.join(root,'tests/audio-audit.json'),body);res.end('ok');});return;}
 if(req.url==='/test-phaser.js'){res.setHeader('Content-Type','text/javascript');res.end(phaser);return;}
 if(req.url==='/test-sdk.js'){res.setHeader('Content-Type','text/javascript');res.end('export function createSDK(){return {on(){},onBackPressed(){},async initializeAsync(){return {err:"Platform Not Supported"}}}}');return;}
 if(req.url==='/report'){let body='';req.on('data',d=>body+=d);req.on('end',()=>{reports.push(JSON.parse(body));console.log(body);res.end('ok');});return;}
 let name=decodeURIComponent(req.url.split('?')[0]);if(name==='/')name='/index.html';
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try {
  let data=fs.readFileSync(file);
  if(name==='/index.html')data=data.toString().replace('https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js','/test-phaser.js').replace('https://h5sdk.onestore.net/lib/v1.2.0/onestore-h5-sdk.min.js','/test-sdk.js');
  if(name==='/js/main.js')data=data.toString().replace(/window.escapeGame = new Phaser.Game\(config\);\s*window.oneStore.attach\(window.escapeGame\);/,harness);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'text/plain');res.end(data);
 }catch{res.writeHead(404).end();}
});
server.listen(0,'127.0.0.1',async()=>{
 try {
  const response=await fetch('https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js');
  if(!response.ok)throw Error('Phaser download failed');
  phaser=Buffer.from(await response.arrayBuffer());
  for(const [width,view] of [[960,'audio'],[320,'audio'],[390,'hud'],[320,'ui-sequence'],[960,'visual-vent'],[390,'visual-vent'],[960,'visual-door']]) {
   const profile=fs.mkdtempSync(path.join(os.tmpdir(),'escape-toolbox-'));
   await new Promise((resolve,reject)=>{
    const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size='+width+',780','about:blank'],{windowsHide:true,stdio:'ignore'});
    const timeout=setTimeout(()=>{child.kill();reject(Error('Browser timed out'));},45000);
    child.on('error',reject);
    (async()=>{
     const pause=()=>new Promise(r=>setTimeout(r,100));
     const portFile=path.join(profile,'DevToolsActivePort');
     while(!fs.existsSync(portFile))await pause();
     const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
     const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
     const socket=new WebSocket(tabs[0].webSocketDebuggerUrl);
     await new Promise(r=>socket.addEventListener('open',r,{once:true}));
     let id=0;const pending=new Map();
     socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){pending.get(data.id)?.(data.result);pending.delete(data.id);}});
     const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);socket.send(JSON.stringify({id,method,params}));});
     await send('Emulation.setDeviceMetricsOverride',{width,height:780,deviceScaleFactor:1,mobile:false});
     const before=reports.length;
     await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/?'+view});
     while(reports.length===before)await pause();
     await new Promise(r=>setTimeout(r,500));
     const shot=await send('Page.captureScreenshot',{format:'png'});
     fs.writeFileSync(path.join(root,'tests',view+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
     socket.close();child.kill();clearTimeout(timeout);resolve();
    })().catch(error=>{child.kill();clearTimeout(timeout);reject(error);});
   });
  }
  if(reports.length!==7||reports.some(r=>!r.ok))process.exitCode=1;
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});
