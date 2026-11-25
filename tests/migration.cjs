const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const store = new Map();
let writes = 0;
const ctx = {window: {}, localStorage: {getItem:k=>store.get(k)??null, setItem:(k,v)=>{writes++;store.set(k,v);}, removeItem:k=>store.delete(k)}};
vm.createContext(ctx);
for (const file of ['Clues','GameState']) vm.runInContext(fs.readFileSync(`js/state/${file}.js`,'utf8'),ctx);
const state = ctx.window.gameState;
const plain = value => JSON.parse(JSON.stringify(value));
const fixtures = JSON.parse(fs.readFileSync('tests/fixtures/saves-v1.json','utf8')).cases;
for (const fixture of fixtures) {
  store.clear();state.reset();writes=0;
  if (!fixture.save) {assert.equal(state.load(),false);assert.equal(writes,0);continue;}
  const old = fixture.save;
  store.set('escapeGameState',JSON.stringify(old));
  assert(state.load(),fixture.id);
  assert.equal(state.saveVersion,2);assert.equal(writes,1);
  for (const key of ['currentRoom','timeRemaining','items','hintUses','hintStages']) assert.deepEqual(plain(state[key]),old[key],fixture.id+': '+key);
  const open = !!(old.solvedPuzzles['통제실 통로'] || old.currentRoom==='통제실' || old.solvedPuzzles['배선'] || old.solvedPuzzles['비상문']);
  assert.equal(state.isSolved('전력 배분'),open);
  if(open)assert(state.isSolved('통제실 통로'));
  for(const [key,value] of Object.entries(old.solvedPuzzles)) if(value) assert(state.isSolved(key));
  for(const [id,doc] of Object.entries(ctx.window.gameClues)) {
    const discovered = old.notes.some(note=>note.startsWith(doc.prefix)) || id==='equipment-labels' && (open || old.solvedPuzzles['배선도']);
    assert.equal(state.clueIds.includes(id),!!discovered,fixture.id+': '+id);
    if(discovered)for(const page of doc.pages)assert.equal(state.notes.filter(note=>note===page).length,1);
  }
  assert(!state.notes.some(note=>note.startsWith('해제 순서:')));
  assert.equal(state.migrationNoticePending,!old.solvedPuzzles['비상문']);
  const converted=store.get('escapeGameState');
  state.load();assert.equal(writes,1);assert.equal(state.migrationNoticePending,false);assert.equal(store.get('escapeGameState'),converted);
  for (const id of [...state.clueIds]) state.discoverDocument(id);
  assert.equal(writes,1,'reinvestigation must not duplicate or save unchanged documents');
}
const valid=fixtures.find(f=>f.save).save;
for(const invalid of [null,{}, {...valid,timeRemaining:0},{...valid,timeRemaining:'100'}, {...valid,solvedPuzzles:null}, {...valid,notes:[1]}, {...valid,hintStages:null}]) {
  store.set('escapeGameState',JSON.stringify(invalid));writes=0;assert.equal(state.load(),false);assert.equal(writes,0);
}
state.reset();state.currentRoom='통제실';state.save();state.load();assert.equal(state.isSolved('전력 배분'),false,'v2 must not run legacy grandfathering');
console.log('PASS: all legacy fixtures, one atomic write, preserved progression/hints/items, discovered-only documents, idempotency, invalid saves, v2 isolation.');
