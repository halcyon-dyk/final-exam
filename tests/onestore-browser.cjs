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
 const check=(value,message)=>{if(!value)throw Error(message);};
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const until=async fn=>{const start=Date.now();while(!fn()){if(Date.now()-start>25000)throw Error('timed out waiting for scene');await wait(30);}};
 const mode=location.search.slice(1);
 try {
  await until(()=>window.oneStore.started);
  if(mode==='early-pause') {
   check(window.oneStore.paused&&!window.escapeGame.loop.running,'early pause retained');
   window.sdkEvents.resume({});
  }
  await until(()=>window.escapeGame.scene.isActive('StartScene'));
  const game=window.escapeGame,bridge=window.oneStore,audio=window.audioManager;
  check(game.textures.exists('successBackground')&&game.textures.exists('prisonBackground'),'all scene assets loaded');
  check(document.getElementById('boot-status').hidden,'loading screen removed');
  if(window.sdkCalls) {
   check(window.sdkCalls[0]==='sdk-before-phaser','SDK imported before Phaser');
   check(window.sdkCalls.indexOf('on:exit')<window.sdkCalls.indexOf('init'),'listeners before init');
   const progress=window.sdkCalls.filter(v=>typeof v==='number');
   if(['supported','early-pause','start-fail'].includes(mode)){
    check(progress.length>2&&progress[0]===0&&progress.at(-1)===100,'actual asset progress');
    check(progress.every((p,i)=>i===0||p>=progress[i-1]),'monotonic progress');
    check(window.sdkCalls.indexOf('start')>window.sdkCalls.lastIndexOf(100),'start after load');
   }else check(!window.sdkCalls.includes('start'),'browser skips SDK start');
  }
  const start=game.scene.getScene('StartScene');
  window.gameState.reset();window.gameState.addNote('preserved');
  start.confirmNewGame();
  check(start.confirmElements.length>0,'in-game confirmation');
  const cancel=start.children.list.find(e=>e.text==='취소');
  start.children.list.find(e=>e.input&&e.depth===500&&e.x===cancel.x&&e.y===cancel.y).emit('pointerdown');
  check(window.gameState.notes.includes('preserved'),'cancel retains save');
  start.startNewGame();
  await until(()=>game.scene.isActive('GameScene'));
  const scene=game.scene.getScene('GameScene');
  if(bridge.enabled){
   audio.setSetting('music',0.6);audio.setSetting('effects',0.4);
   scene.showMenu(false);
   window.sdkEvents.pause({reason:'background'});window.sdkEvents.pause({reason:'background'});
   const time=window.gameState.timeRemaining;
   await wait(1100);
   check(time===window.gameState.timeRemaining&&!game.loop.running&&!game.input.enabled,'paused timer loop and input');
   check(audio.platformPaused&&audio.background.isPaused,'paused background');
   window.sdkEvents.resume({ringerSilent:true});window.sdkEvents.resume({});
   await wait(100);
   check(game.loop.running&&game.input.enabled&&scene.pausedForMenu,'resume preserves menu');
   check(audio.level('music')===0&&audio.settings.music===0.6,'device silent preserves preferences');
   window.sdkEvents.resume({ringerSilent:false});await wait(100);
   check(audio.level('music')===0.6,'device sound restored');
   scene.pausedForMenu=false;
   await wait(1200);check(window.gameState.timeRemaining<time,'timer resumed');
   window.gameState.notes.push('exit-saved');window.sdkEvents.exit();
   check(JSON.parse(localStorage.getItem('escapeGameState')).notes.includes('exit-saved'),'sync exit save');
   scene.scene.start('ResultScene',{success:true});
   await until(()=>game.scene.isActive('ResultScene'));await wait(50);
   window.sdkEvents.exit();check(!window.gameState.hasActiveSave(),'exit does not recreate completed save');
  }
  fetch('/report',{method:'POST',body:JSON.stringify({ok:true,mode,sdk:bridge.enabled})});
 }catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,mode,error:error.stack})});}
})();
`;
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
  for(const [width,view] of [[960,'supported'],[320,'early-pause'],[390,'unsupported'],[960,'init-fail'],[960,'start-fail'],[390,'import-fail'],[960,'real-browser']]) {
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

