const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const store = new Map([['escapeAudioSettings', '{"music":0.4,"muted":true}']]);
const context = {window:{},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/state/Clues.js','utf8'), context);
vm.runInContext(fs.readFileSync('js/state/GameState.js','utf8'), context);
const state=context.window.gameState;
assert.equal(state.saveVersion,2);assert.equal(state.isSolved('전력 배분'),false);
const old='기호 값: 원=2, 사각형=7, 삼각형=4';
state.addNote(old);state.addClue('prison-note',old+'\nR',old);state.addClue('prison-note',old+'\nR',old);
assert.equal(state.notes.length,1);assert.equal(state.clueIds.length,1);
state.solvePuzzle('전력 배분');state.reset();assert(state.load());
assert.equal(state.saveVersion,2);assert.equal(state.clueIds[0],'prison-note');assert(state.isSolved('전력 배분'));
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/saves-v1.json','utf8')).cases;
for(const fixture of fixtures.filter(f=>f.save)){
  store.set('escapeGameState',JSON.stringify(fixture.save));
  assert(state.load());assert.equal(state.saveVersion,2);
  assert.equal(state.timeRemaining,fixture.save.timeRemaining);assert.equal(state.hintUses,fixture.save.hintUses);
  state.save();assert.equal(JSON.parse(store.get('escapeGameState')).saveVersion,2);
}
state.reset();assert.equal(state.saveVersion,2);assert.equal(state.clueIds.length,0);assert.equal(state.isSolved('전력 배분'),false);
assert.equal(store.get('escapeAudioSettings'),'{"music":0.4,"muted":true}');
console.log('PASS: v2 reset/persistence, clue deduplication/replacement, legacy conversion, no clue leakage, audio preferences preserved.');
