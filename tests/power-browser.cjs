const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const reports = [];
let phaser;
const enhanced = process.argv.includes('--enhanced');
const harness = enhanced ? fs.readFileSync(path.join(__dirname, 'enhanced-harness.js'), 'utf8') : `
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(v,m)=>{if(!v)throw Error(m);};
 const until=async fn=>{const start=Date.now();while(!fn()){if(Date.now()-start>25000)throw Error('timeout');await wait(30);}};
 try{
  await until(()=>window.escapeGame.scene.isActive('StartScene'));
  const Original=PowerPuzzle;PowerPuzzle=class extends Original{constructor(...args){super(...args);window.testPower=this;}};
  const game=window.escapeGame,state=window.gameState;
  state.reset();state.currentRoom='정비실';state.solvePuzzle('상자');state.solvePuzzle('정비실 통로');
  game.scene.getScene('StartScene').scene.start('GameScene');
  await until(()=>game.scene.isActive('GameScene'));
  const scene=game.scene.getScene('GameScene');scene.pausedForMenu=true;
  let panel=scene.investigationPanel;
  const click=label=>{
   const text=scene.children.list.find(e=>e.active&&e.visible&&e.text===label);
   check(!!text,'label '+label);
   if(text.input)text.emit('pointerdown');
   else scene.children.list.find(e=>e.input&&e.visible&&e.depth===text.depth&&Math.abs(e.x-text.x)<=4&&e.y===text.y).emit('pointerdown');
  };
  click('전력반');check(panel.message.text.includes('작업일지')&&panel.message.text.includes('손전등'),'missing clues');click('닫기');
  click('작업일지');check(panel.title.text.includes('1/2')&&panel.message.text.includes('작은 볼트'),'journal page one');
  click('›');check(panel.message.text.includes('감시 장치는 다시 켜지 마라'),'journal page two');
  check(panel.message.getBounds().bottom<panel.closeButton.getBounds().top,'journal layout');
  click('‹');check(panel.message.text.includes('작은 볼트'),'page back');click('닫기');
  click('작업일지');click('닫기');check(state.notes.length===2&&state.clueIds.length===1,'journal dedup');
  click('어두운 벽면');check(!state.clueIds.includes('equipment-labels'),'no flashlight no clue');click('닫기');
  click('볼트 조사');click('닫기');
  click('공구함');for(const symbol of ['△','⬡','□'])click(symbol);click('확인');
  check(state.items.filter(i=>i==='배터리').length===1,'toolbox reward');
  click('열린 공구함');click('닫기');check(state.items.filter(i=>i==='배터리').length===1,'no duplicate battery');
  state.addItem('손전등');state.selectItem('손전등');click('어두운 벽면');
  check(state.clueIds.includes('equipment-labels')&&state.notes.some(n=>n.includes('A→2')),'both wall clues');
  check(!state.isSolved('통제실 통로'),'flashlight must not open passage');
  const count=state.notes.length;click('어두운 벽면');check(state.notes.length===count,'wall dedup');
  panel.hide();scene.feedback.cue?.setVisible(false);scene.cameras.main.resetFX();
  click('전력반');window.testPower.toggle(0);click('닫기');click('전력반');
  check(window.testPower.switches.every(v=>!v),'close reset');window.testPower.destroy();
  const before=JSON.stringify({items:state.items,time:state.timeRemaining});
  const errors=['환기가','조명이','감시','전력 부족','환기가',null,'감시','전력 부족'];
  for(let bits=0;bits<8;bits++){
   let successes=0;const puzzle=new PowerPuzzle(scene,()=>successes++);
   for(let i=0;i<3;i++)if(bits&(1<<i))puzzle.toggle(i);
   check(successes===0,'must confirm');
   const selection=puzzle.switches.join();puzzle.check();
   check(successes===(bits===5?1:0),'combination '+bits);
   if(bits!==5){check(puzzle.message.text.includes(errors[bits]),'error priority '+bits);check(puzzle.switches.join()===selection,'keep wrong switches');puzzle.destroy();}
  }
  check(before===JSON.stringify({items:state.items,time:state.timeRemaining}),'no penalty');
  click('전력반');window.testPower.toggle(0);window.testPower.toggle(2);click('확인');
  check(state.isSolved('전력 배분')&&state.isSolved('통제실 통로'),'room success and passage');
  check(scene.feedback.cue.text.includes('환기와 통로 조명이'),'success feedback');
  state.save();state.reset();state.load();check(state.isSolved('전력 배분'),'saved completion');
  click('전력반');check(panel.message.text.includes('완료'),'no repeat puzzle');click('닫기');
  scene.memoPanel.show();scene.memoPanel.page=1;scene.memoPanel.render();scene.memoPanel.contents.emit('pointerdown');
  check(panel.message.text.includes('감시 전력을 끊었다'),'memo story');click('닫기');
  const puzzle=new PowerPuzzle(scene,()=>{});puzzle.toggle(0);puzzle.toggle(2);
  const buttons=puzzle.elements.filter(e=>e.input&&e.depth===200);
  for(const button of buttons){const b=button.getBounds();check(b.left>=0&&b.right<=scene.scale.width&&b.top>=0&&b.bottom<=scene.scale.height,'bounds');check(b.width>=44&&b.height>=44,'minimum touch target');}
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)check(!Phaser.Geom.Intersects.RectangleToRectangle(buttons[i].getBounds(),buttons[j].getBounds()),'overlap');
  puzzle.destroy();scene.memoPanel.hide();
  scene.moveToNextRoom();await wait(100);check(state.currentRoom==='통제실','travel after power');
  panel=scene.investigationPanel;
  scene.pausedForMenu=true;
  const control=new ControlRoom(scene,panel,state,scene.feedback);
  control.openDoor();check(panel.message.text.includes('전원을 복구'),'door requires wiring');panel.hide();
  state.solvePuzzle('배선');control.openDoor();check(panel.message.text.includes('실험 기록'),'door requires documents');panel.hide();
  const pages=state.discoverDocument('incident-records');
  for(let page=0;page<3;page++){
    panel.showPages('실험 기록',pages,page);
    check(panel.message.getBounds().bottom<panel.closeButton.getBounds().top,'record layout '+page);
    check(panel.message.getBounds().left>=0&&panel.message.getBounds().right<=scene.scale.width,'record width');
  }
  panel.hide();state.discoverDocument('facility-map');
  const notes=state.notes.join();state.discoverDocument('incident-records');state.discoverDocument('facility-map');check(notes===state.notes.join(),'document dedup');
  control.openDoor();for(const symbol of ['눈','달','톱니'])click(symbol);click('확인');check(!state.isSolved('비상문'),'reject old answer');
  click('톱니');click('닫기');control.openDoor();
  for(const symbol of ['톱니','달','눈'])click(symbol);
  check(!state.isSolved('비상문'),'door must confirm');click('확인');check(state.isSolved('비상문'),'new answer');
  state.save();state.reset();state.load();check(state.isSolved('비상문'),'saved open door');
  let escaped=false;const start=scene.scene.start;scene.scene.start=()=>{escaped=true;};control.openDoor();scene.scene.start=start;check(escaped,'exit after restore');
  panel.showPages('실험 기록',pages,2);
  fetch('/report',{method:'POST',body:JSON.stringify({ok:true,width:scene.scale.width,combinations:8})});
 }catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,error:error.stack})});}
})();`;
const mock = `
window.sdkCalls=['sdk-before-phaser'];
if(window.Phaser)throw Error('Phaser loaded before SDK');
window.sdkEvents={};
export function createSDK(){return {
 on(name,fn){window.sdkCalls.push('on:'+name);window.sdkEvents[name]=fn;},
 onBackPressed(fn){window.sdkCalls.push('back');},
 async initializeAsync(){
  window.sdkCalls.push('init');
  const mode=location.search.slice(1);
  if(mode==='init-fail')throw Error('init test');
  if(mode==='unsupported')return {err:'Platform Not Supported'};
  if(mode==='early-pause')window.sdkEvents.pause({reason:'background'});
  return {ringerSilent:false,safeArea:{top:8,bottom:8,left:0,right:0}};
 },
 setLoadingProgress(p){window.sdkCalls.push(p);},
 async startGameAsync(){
  window.sdkCalls.push('start');
  if(location.search.includes('start-fail'))throw Error('start test');
  return {};
 }
};}
`;
const server = http.createServer((req,res)=>{
 if(req.url==='/test-phaser.js'){res.setHeader('Content-Type','text/javascript');res.end(phaser);return;}
 if(req.url==='/test-sdk.js'){res.setHeader('Content-Type','text/javascript');res.end(mock);return;}
 if(req.url==='/report'){let body='';req.on('data',d=>body+=d);req.on('end',()=>{reports.push(JSON.parse(body));console.log(body);res.end('ok');});return;}
 let name=decodeURIComponent(req.url.split('?')[0]);if(name==='/')name='/index.html';
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try {
  let data=fs.readFileSync(file);
  if(name==='/index.html')data=data.toString().replace('https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js','/test-phaser.js').replace('https://h5sdk.onestore.net/lib/v1.2.0/onestore-h5-sdk.min.js', req.url.includes('real-browser')?'https://h5sdk.onestore.net/lib/v1.2.0/onestore-h5-sdk.min.js':req.url.includes('import-fail')?'/missing-sdk.js':'/test-sdk.js');
  if(name==='/js/main.js')data=data.toString()+'\n'+harness;
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'})[path.extname(file)]||'text/plain');res.end(data);
 }catch{res.writeHead(404).end();}
});
server.listen(0,'127.0.0.1',async()=>{
 try {
  const response=await fetch('https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js');
  if(!response.ok)throw Error('Phaser download failed');
  phaser=Buffer.from(await response.arrayBuffer());
  for(const [width,view] of [[960,'unsupported'],[320,'unsupported'],[390,'unsupported']]) {
   const profile=fs.mkdtempSync(path.join(os.tmpdir(),'escape-toolbox-'));
   await new Promise((resolve,reject)=>{
    const child=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--autoplay-policy=no-user-gesture-required','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size='+width+',780','about:blank'],{windowsHide:true,stdio:'ignore'});
    const timeout=setTimeout(()=>{child.kill();reject(Error('Browser timed out'));},90000);
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
     fs.writeFileSync(path.join(root,'tests',(enhanced?'enhanced':view)+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
     if(enhanced){
      await send('Runtime.evaluate',{expression:"window.escapeGame.scene.getScene('GameScene').investigationPanel.hide()"});
      await new Promise(r=>setTimeout(r,100));
      const roomShot=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(root,'tests','enhanced-room-'+width+'.png'),Buffer.from(roomShot.data,'base64'));
     }
     socket.close();child.kill();clearTimeout(timeout);resolve();
    })().catch(error=>{child.kill();clearTimeout(timeout);reject(error);});
   });
  }
  if(reports.length!==3||reports.some(r=>!r.ok))process.exitCode=1;
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});



