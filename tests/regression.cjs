const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const store = new Map();
const ctx = {window: {}, localStorage: {getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{hidden:false},Phaser:{Scene:class{}},setTimeout,clearTimeout};
vm.createContext(ctx);
for(const file of ['state/GameState','ui/Layout','ui/HintPanel','ui/TimerDisplay','puzzles/CodePuzzle','puzzles/WirePuzzle','puzzles/SequencePuzzle','puzzles/ToolboxPuzzle','rooms/MaintenanceRoom','rooms/ControlRoom','scenes/GameScene']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),ctx);
const sounds=[];ctx.window.audioManager={playEffect:t=>sounds.push(t)};
const state=ctx.window.gameState;
assert.equal(state.hasActiveSave(),false);state.save();assert.equal(state.hasActiveSave(),true);
state.timeRemaining=0;state.save();assert.equal(state.hasActiveSave(),false);
store.set('escapeGameState','broken');assert.equal(state.load(),false);state.reset();
function shape(x,y,w=1,h=1){return {x,y,width:w,height:h,depth:0,scale:1,on(){return this},setStrokeStyle(){return this},setDepth(d){this.depth=d;return this},setInteractive(){return this},setOrigin(){return this},setY(y){this.y=y;return this},setText(t){this.text=t;return this},setPosition(x,y){this.x=x;this.y=y;return this},setScale(s){this.scale=s;return this},getBounds(){return {left:this.x-this.width*this.scale/2,right:this.x+this.width*this.scale/2,top:this.y-this.height*this.scale/2,bottom:this.y+this.height*this.scale/2}},destroy(){this.destroyed=true}};}
const scene={scale:{width:390,height:640},add:{rectangle:shape,text:(x,y,t)=>Object.assign(shape(x,y,40,24),{text:t})},inventoryPanel:{background:{visible:false}},time:{delayedCall(){},addEvent(){}},scene:{start(){}}};
const panel={show(){},hide(){}};const feedback={play(){}};
const maintenance=new ctx.window.MaintenanceRoom(scene,panel,state,feedback);
state.addItem('손전등');maintenance.collectPart('배터리');assert.equal(state.hasItem('배터리'),false);
const wire=new ctx.window.WirePuzzle(scene,()=>{});
assert(wire.elements[0].getBounds().left>=0);assert(wire.elements[0].getBounds().right<=390);
let successes=0;const seq=new ctx.window.SequencePuzzle(scene,['눈','달','톱니'],()=>successes++);
for(const s of ['눈','달','톱니'])seq.select(s);assert.equal(successes,0);seq.check();assert.equal(successes,1);
const bad=new ctx.window.SequencePuzzle(scene,['눈','달','톱니'],()=>successes++);bad.select('달');bad.check();assert.equal(successes,1);assert.equal(bad.input.length,0);
assert(bad.elements.some(e=>e.text==='닫기'));assert(bad.elements.some(e=>e.text==='확인'));
const code=new ctx.window.CodePuzzle(scene,'427',()=>{});
const eight=code.elements.find(e=>e.text==='8'),zero=code.elements.find(e=>e.text==='0');assert(zero.y-eight.y>42);
const control=new ctx.window.ControlRoom(scene,panel,state,feedback);
state.solvePuzzle('배선');state.addNote('해제 순서: 통제실 → 감금실 → 정비실');
let opened=0;vm.runInContext('SequencePuzzle = class {constructor(){window.opened=true}}',ctx);
control.openDoor();assert.equal(ctx.window.opened,undefined);
state.addNote('시설 기호: 감금실=달, 정비실=톱니, 통제실=눈');control.openDoor();assert.equal(ctx.window.opened,true);
state.reset();const hint=Object.create(ctx.window.HintPanel.prototype);hint.state=state;
assert.equal(hint.getTask(),'상자');state.solvePuzzle('상자');assert.equal(hint.getTask(),'환풍구');
state.solvePuzzle('정비실 통로');assert.equal(hint.getTask(),'공구함');state.solvePuzzle('공구함');assert.equal(hint.getTask(),'손전등');state.solvePuzzle('배선도');assert.equal(hint.getTask(),'배선');state.solvePuzzle('배선');assert.equal(hint.getTask(),'비상문');
const timer=Object.create(ctx.window.TimerDisplay.prototype);timer.state=state;timer.scene={pausedForMenu:true};timer.update=()=>{};
timer.tick();assert.equal(state.timeRemaining,1200);timer.scene.pausedForMenu=false;timer.tick();assert.equal(state.timeRemaining,1199);
// Capture the real puzzle opened by the room to exercise its reward callback.
vm.runInContext('ToolboxPuzzle = class extends ToolboxPuzzle {constructor(...args){super(...args);window.toolbox=this}}',ctx);
state.reset();maintenance.collectPart('배터리');assert.equal(state.hasItem('배터리'),false);
maintenance.openToolbox();let toolbox=ctx.window.toolbox;
toolbox.select('□');toolbox.check();assert.equal(state.isSolved('공구함'),false);assert.equal(toolbox.input.length,0);assert.equal(sounds.at(-1),'error');
toolbox.select('△');toolbox.destroy();maintenance.openToolbox();toolbox=ctx.window.toolbox;assert.equal(toolbox.input.length,0);
for(const symbol of ['△','⬡','□'])toolbox.select(symbol);
assert.equal(state.hasItem('배터리'),false);toolbox.check();assert.equal(state.isSolved('공구함'),true);assert.equal(state.items.filter(i=>i==='배터리').length,1);
maintenance.openToolbox();assert.equal(state.items.length,1);
state.reset();assert.equal(state.load(),true);assert.equal(state.isSolved('공구함'),true);assert.equal(state.hasItem('배터리'),true);
for(const legacy of ['배터리','손전등','배선도']) {
  state.reset();if(legacy==='배선도')state.solvePuzzle(legacy);else state.addItem(legacy);
  state.reset();state.load();assert.equal(state.isSolved('공구함'),true);
  const count=state.items.length;maintenance.openToolbox();assert.equal(state.items.length,count);
}
state.reset();state.solvePuzzle('상자');state.solvePuzzle('정비실 통로');
hint.buttonLabel={setText(){}};hint.scene={investigationPanel:{show(){}}};
for(let i=0;i<4;i++)hint.showHint();assert.equal(state.hintUses,3);assert.equal(state.hintStages['공구함'],3);
state.reset();state.load();assert.equal(state.hintStages['공구함'],3);assert.equal(hint.getTask(),'공구함');
state.solvePuzzle('공구함');assert.equal(hint.getTask(),'손전등');
state.reset();assert.equal(state.isSolved('공구함'),false);assert.equal(state.hintUses,0);
for(const width of [320,390,960]) {
  scene.scale.width=width;const puzzle=new ctx.window.ToolboxPuzzle(scene,['△','⬡','□'],()=>{});
  for(const element of puzzle.elements) {const b=element.getBounds();assert(b.left>=0&&b.right<=width&&b.top>=0&&b.bottom<=640);}
  const controls=puzzle.elements.filter(e=>e.width===80);
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++) {
    const a=controls[i].getBounds(),b=controls[j].getBounds();assert(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
  }
}
console.log('PASS: existing regression checks, toolbox confirmation/error/close/reward, locked battery, legacy saves, six hint stages, reset and 320/390/960 dialog bounds.');
