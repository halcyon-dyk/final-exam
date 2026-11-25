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
 const until=async fn=>{const start=Date.now();while(!fn()){if(Date.now()-start>25000)throw Error('scene timeout');await wait(25);}};
 const id=location.search.slice(1);
 try{
  const data=await (await fetch('/tests/fixtures/saves-v1.json')).json();
  const fixture=data.cases.find(c=>c.id===id);
  await until(()=>window.escapeGame.scene.isActive('StartScene'));
  const title=window.escapeGame.scene.getScene('StartScene');
  const buttons=title.children.list.filter(e=>e.input);
  if(fixture.save===null){
   check(!window.gameState.hasActiveSave()&&buttons.length===1,'no-save disables continue');
   await fetch('/report',{method:'POST',body:JSON.stringify({ok:true,id,loaded:false,observed:null})});return;
  }
  check(buttons.length===2,'continue available');
  buttons[1].emit('pointerdown');
  await until(()=>window.escapeGame.scene.isActive('GameScene'));
  window.escapeGame.scene.getScene('GameScene').pausedForMenu=true;
  const state=window.gameState;
  const expected=JSON.parse(JSON.stringify(fixture.save));
  if(id==='legacy-battery')expected.solvedPuzzles['공구함']=true;
  const snapshot=()=>Object.fromEntries(Object.keys(expected).map(k=>[k,JSON.parse(JSON.stringify(state[k]))]));
  const observed=snapshot();
  check(JSON.stringify(observed)===JSON.stringify(expected),'saved values retained');
  state.save();state.reset();check(state.load(),'reload');check(JSON.stringify(snapshot())===JSON.stringify(observed),'idempotent reload');
  check(state.selectedItem===null&&state.combiningItem===null,'transient selection reset');
  await fetch('/report',{method:'POST',body:JSON.stringify({ok:true,id,loaded:true,observed})});
 }catch(error){fetch('/report',{method:'POST',body:JSON.stringify({ok:false,id,error:error.stack})});}
})();`;
const mock = `
export function createSDK(){return {
 on(){},onBackPressed(){},
 async initializeAsync(){
  const data=await (await fetch('/tests/fixtures/saves-v1.json')).json();
  const fixture=data.cases.find(c=>c.id===location.search.slice(1));
  if(fixture.save===null)localStorage.removeItem('escapeGameState');
  else localStorage.setItem('escapeGameState',JSON.stringify(fixture.save));
  return {err:'Platform Not Supported'};
 }
};}`;
const server = http.createServer((req,res)=>{
 if(req.url==='/test-phaser.js'){res.setHeader('Content-Type','text/javascript');res.end(phaser);return;}
 if(req.url==='/test-sdk.js'){res.setHeader('Content-Type','text/javascript');res.end(mock);return;}
 if(req.url==='/report'){let body='';req.on('data',d=>body+=d);req.on('end',()=>{reports.push(JSON.parse(body));console.log(JSON.stringify({id:reports.at(-1).id,ok:reports.at(-1).ok,error:reports.at(-1).error}));res.end('ok');});return;}
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
  for(const [width,view] of [[960,"prison"],[960,"maintenance-parts"],[960,"diagram-only"],[960,"passage-open"],[960,"control-entered"],[960,"door-unsolved"],[960,"door-open"],[960,"legacy-battery"],[960,"no-save"]]) {
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
  if(reports.length!==9||reports.some(r=>!r.ok))process.exitCode=1;
  else fs.writeFileSync(path.join(root,'tests/fixtures/baseline-v1.json'),JSON.stringify(reports,null,2)+'\n');
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});


