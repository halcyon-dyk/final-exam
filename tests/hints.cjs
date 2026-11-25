const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const store=new Map();let writes=0;
const ctx={window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{writes++;store.set(k,v);},removeItem:k=>store.delete(k)}};
vm.createContext(ctx);
for(const file of ['state/Clues','state/GameState','ui/HintPanel'])vm.runInContext(fs.readFileSync('js/'+file+'.js','utf8'),ctx);
const state=ctx.window.gameState;let shown;
const hint=new ctx.window.HintPanel({investigationPanel:{showPages(...args){shown=args;}}},state);
hint.buttonLabel={setText(){}};
const tasks=['상자','환풍구','공구함','손전등','전력 배분','배선','비상문'];
const keys=['상자','정비실 통로','공구함','배선도','전력 배분','배선','비상문'];
for(let task=0;task<7;task++){
  assert.equal(hint.getTask(),tasks[task]);
  hint.showHint();assert.equal(state.hintUses,task*3);
  for(let step=1;step<=3;step++){
    const oldAction=shown[3];oldAction.onClick();oldAction.onClick();
    assert.equal(state.hintUses,task*3+step,'one increment per explicit reveal');
    const before=writes;hint.showHint();assert.equal(writes,before,'open is free');
    assert.equal(shown[1].length,step);assert.equal(shown[2],step-1);
    state.save();state.reset();state.load();hint.showHint();assert.equal(state.hintUses,task*3+step);
  }
  assert.equal(shown[3],null);state.solvePuzzle(keys[task]);
}
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/saves-v1.json','utf8')).cases;
const legacy=fixtures.find(f=>f.save?.hintStages['비상문']===3).save;
store.set('escapeGameState',JSON.stringify(legacy));state.load();hint.showHint();
assert.equal(state.hintUses,legacy.hintUses);assert.equal(shown[1].length,3);assert(shown[1][2].includes('톱니 → 달 → 눈'));assert.equal(shown[3],null);
console.log('PASS: seven tasks, 21 explicit reveals, free reread/reload, stale click guard, migrated final hints and counts.');
