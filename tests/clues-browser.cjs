const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const reports = [];
let phaser;
const harness = `
(async()=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const check=(v,m)=>{if(!v)throw Error(m);};
 const until=async fn=>{const start=Date.now();while(!fn()){if(Date.now()-start>25000)throw Error('timeout');await wait(30);}};
 try{
  await until(()=>window.escapeGame.scene.isActive('StartScene'));
  const game=window.escapeGame;game.scene.getScene('StartScene').startNewGame();
  await until(()=>game.scene.isActive('GameScene'));
  const scene=game.scene.getScene('GameScene'),state=window.gameState;
  scene.pausedForMenu=true;
  const click=label=>{
   const text=scene.children.list.find(e=>e.active&&e.visible&&e.text===label);
   check(!!text,'label '+label);
   if(text.input)text.emit('pointerdown');
   else scene.children.list.find(e=>e.input&&e.visible&&e.depth===text.depth&&Math.abs(e.x-text.x)<=4&&e.y===text.y).emit('pointerdown');
  };
  click('바닥 쪽지');
  const note=scene.investigationPanel.message.text;
  check(note.includes('— R')&&note.includes('원=2, 사각형=7, 삼각형=4'),'story and numbers');
  check(state.clueIds.join()==='prison-note','clue ID');
  const panel=scene.investigationPanel;
  const a=panel.title.getBounds(),b=panel.message.getBounds(),c=panel.closeButton.getBounds();
  check(a.bottom<b.top&&b.bottom<c.top,'note layout');
  check(panel.background.getBounds().left>=0&&panel.background.getBounds().bottom<=scene.scale.height,'dialog bounds');
  click('닫기');click('바닥 쪽지');check(state.notes.length===1&&state.clueIds.length===1,'no duplicate');
  click('닫기');click('메모장');
  scene.memoPanel.contents.emit('pointerdown');check(panel.message.text===note,'memo same story');
  click('닫기');click('벽 낙서');click('닫기');click('잠긴 상자');
  for(const digit of ['4','2','7'])click(digit);click('확인');
  check(state.isSolved('상자'),'427 unchanged');
  await wait(500);
  scene.pausedForMenu=true;
  state.save();const saved=JSON.parse(localStorage.getItem('escapeGameState'));
  check(saved.saveVersion===2&&saved.clueIds[0]==='prison-note','persist v2');
  state.reset();check(state.load()&&state.clueIds[0]==='prison-note','reload');
  click('바닥 쪽지');
  fetch('/report',{method:'POST',body:JSON.stringify({ok:true,width:scene.scale.width})});
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
  for(const [width,view] of [[960,'unsupported'],[320,'unsupported']]) {
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
  if(reports.length!==2||reports.some(r=>!r.ok))process.exitCode=1;
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});


