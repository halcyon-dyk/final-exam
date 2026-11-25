const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const storage = new Map();
const context = { window: {}, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
vm.createContext(context);
const source = fs.readFileSync('js/audio/AudioManager.js', 'utf8');
vm.runInContext(source, context);
const audio = context.window.audioManager;
const sounds = [];
const manager = { add(key, config = {}) {
  const sound = { key, volume: config.volume ?? 1, calls: 0, markers: [],
    addMarker(marker) { this.markers.push(marker); },
    play(marker, options) { this.calls++; this.setVolume((options || marker)?.volume ?? this.volume); },
    setVolume(volume) { this.volume = volume; }, stop() { this.stopped = true; }, destroy() { this.destroyed = true; } };
  sounds.push(sound); return sound;
} };
audio.setSoundManager(manager);
audio.setRoom('감금실');assert.equal(audio.background.volume, 0.35);
audio.playEffect('paper');const paper = sounds.find(s => s.key === 'paperSound');assert.equal(paper.volume, 0.8);
audio.playEffect('paper');assert.equal(paper.calls, 2);assert.equal(sounds.filter(s => s.key === 'paperSound').length, 1);
audio.setSetting('effects', 0.3);assert.equal(paper.volume, 0.3);assert.equal(audio.background.volume, 0.35);
audio.context = {currentTime: 0};audio.effectsGain = {gain: {setValueAtTime(value) {this.value = value;}}};
audio.setSetting('muted', true);assert.equal(audio.background.volume, 0);assert.equal(paper.volume, 0);assert.equal(audio.effectsGain.gain.value, 0);
audio.playEffect('paper');assert.equal(paper.calls, 2);
audio.setRoom('통제실');assert.equal(audio.background.volume, 0);
audio.setSetting('muted', false);assert.equal(audio.background.volume, 0.7);assert.equal(paper.volume, 0.3);
audio.playEffect('screwdriver');const driver = sounds.find(s => s.key === 'screwdriverSound');audio.playEffect('screwdriver');assert(driver.stopped);assert.equal(driver.calls, 2);
audio.playEffect('powerRestore');assert.equal(sounds.find(s=>s.key==='powerRestoreSound').volume, 0.12);
audio.setSetting('music', 5);assert.equal(audio.settings.music, 1);
audio.setSetting('effects', -1);assert.equal(audio.settings.effects, 0);
vm.runInContext('window.restored = new AudioManager()', context);assert.equal(context.window.restored.settings.effects, 0);assert.equal(context.window.restored.settings.music, 1);
storage.set('escapeAudioSettings', '{broken');vm.runInContext('window.restored = new AudioManager()', context);assert.equal(context.window.restored.settings.effects, 0.8);
console.log('PASS: independent levels, active effects, synthetic gain, mute, room changes, persistence, clamp, corrupt save and repeated effects.');
