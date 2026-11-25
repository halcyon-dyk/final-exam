class AudioManager {
  constructor() {
    this.context = null;
    this.background = null;
    this.room = null;
    this.soundManager = null;
    this.settings = { music: 0.7, effects: 0.8, muted: false };
    this.effectSounds = new Map();
    try {
      const saved = JSON.parse(localStorage.getItem("escapeAudioSettings"));
      for (const key of ["music", "effects"]) {
        if (typeof saved?.[key] === "number" && Number.isFinite(saved[key])) this.settings[key] = Math.max(0, Math.min(1, saved[key]));
      }
      if (typeof saved?.muted === "boolean") this.settings.muted = saved.muted;
    } catch {}
  }

  setSetting(key, value) {
    if (key === "muted") this.settings.muted = Boolean(value);
    else if (["music", "effects"].includes(key) && Number.isFinite(value)) this.settings[key] = Math.max(0, Math.min(1, Math.round(value * 10) / 10));
    else return;
    try { localStorage.setItem("escapeAudioSettings", JSON.stringify(this.settings)); } catch {}
    this.applySettings();
  }

  level(category) { return this.settings.muted || this.platformPaused || this.ringerSilent ? 0 : this.settings[category]; }

  setPlatformState(paused, ringerSilent) {
    const changed = this.platformPaused !== paused;
    this.platformPaused = paused;
    this.ringerSilent = ringerSilent;
    this.applySettings();
    if (!this.context || !changed) return;
    if (paused) {
      this.resumeSynth = this.context.state === "running";
      this.context.suspend().catch(() => {});
    } else if (this.resumeSynth) {
      this.context.resume().catch(() => {});
      this.resumeSynth = false;
    }
  }

  applySettings() {
    if (this.background) this.background.setVolume(this.backgroundBase * this.level("music"));
    for (const { sound, volume } of this.effectSounds.values()) sound.setVolume(volume * this.level("effects"));
    if (this.effectsGain) this.effectsGain.gain.setValueAtTime(this.level("effects"), this.context.currentTime);
  }

  recordedEffect(key, volume = 1, marker) {
    let entry = this.effectSounds.get(key);
    if (!entry) {
      entry = { sound: this.soundManager.add(key), volume };
      this.effectSounds.set(key, entry);
    }
    entry.volume = volume;
    entry.sound.stop();
    const config = { volume: volume * this.level("effects") };
    if (marker) entry.sound.play(marker, config);
    else entry.sound.play(config);
  }

  setSoundManager(soundManager) {
    if (this.soundManager === soundManager) return;
    this.soundManager = soundManager;
    this.screwdriverSound = soundManager.add("screwdriverSound");
    this.screwdriverSound.addMarker({ name: "turn", start: 0, duration: 2.5 });
    this.boltsSound = soundManager.add("boltsSound");
    this.boltsSound.addMarker({ name: "inspect", start: 0, duration: 1.8 });
    this.wallSound = soundManager.add("wallSound");
    this.wallSound.addMarker({ name: "inspect", start: 0, duration: 1.2 });
    this.cableSound = soundManager.add("cableSound");
    this.cableSound.addMarker({ name: "connect", start: 0, duration: 1.2 });
    this.effectSounds = new Map([
      ["screwdriverSound", { sound: this.screwdriverSound, volume: 1 }],
      ["boltsSound", { sound: this.boltsSound, volume: 0.85 }],
      ["wallSound", { sound: this.wallSound, volume: 0.55 }],
      ["cableSound", { sound: this.cableSound, volume: 0.8 }],
    ]);
  }

  unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.context) {
      this.context = new AudioContext();
      this.effectsGain = this.context.createGain();
      this.effectsGain.gain.value = this.level("effects");
      this.effectsGain.connect(this.context.destination);
    }
    return this.context;
  }

  runAfterUnlock(callback) {
    if (this.platformPaused) return;
    const context = this.unlock();
    if (!context) return;
    if (context.state === "running") {
      callback();
      return;
    }
    context.resume().then(() => { if (!this.platformPaused) callback(); }).catch(() => {});
  }

  setRoom(room) {
    if (!this.soundManager || this.room === room) return;
    this.stopBackground();
    const sounds = {
      감금실: { key: "prisonAmbience", volume: 0.5 },
      정비실: { key: "maintenanceAmbience", volume: 0.8 },
      통제실: { key: "controlAmbience", volume: 1 },
    };
    const sound = sounds[room];
    if (!sound) return;
    this.room = room;
    this.backgroundBase = sound.volume;
    this.background = this.soundManager.add(sound.key, { loop: true, volume: sound.volume * this.level("music") });
    this.background.play();
  }

  stopBackground() {
    if (this.background) {
      this.background.stop();
      this.background.destroy();
      this.background = null;
    }
    this.room = null;
  }

  playEffect(type) {
    if (this.level("effects") === 0) return;
    if (this.soundManager && type === "cable") {
      this.recordedEffect("cableSound", 0.8, "connect");
      return;
    }
    if (this.soundManager && (type === "bolts" || type === "wall")) {
      this.recordedEffect(type === "bolts" ? "boltsSound" : "wallSound", type === "bolts" ? 0.85 : 0.55, "inspect");
      return;
    }
    const soundKeys = {
      scribble: "scribbleSound",
      paper: "paperSound",
      metal: "metalSound",
      unlock: "unlockSound",
      screwdriver: "screwdriverSound",
      flashlight: "flashlightSound",
      powerRestore: "powerRestoreSound",
      doorOpen: "doorOpenSound",
    };
    const soundKey = soundKeys[type];
    if (soundKey && this.soundManager) {
      if (type === "screwdriver") {
        this.recordedEffect("screwdriverSound", 1, "turn");
        return;
      }
      this.recordedEffect(soundKey, type === "powerRestore" ? 0.4 : 1);
      return;
    }
    this.runAfterUnlock(() => this.playUnlockedEffect(type));
  }

  playUnlockedEffect(type) {
    if (type === "scribble") {
      [0, 0.07, 0.14].forEach((delay) => this.noise(0.05, 0.025, delay, 2400));
      return;
    }
    if (type === "paper") {
      [0, 0.08].forEach((delay) => this.noise(0.12, 0.035, delay, 900));
      return;
    }
    if (type === "metal") {
      this.tone(440, 0.12, "sine", 0.06, 0);
      this.tone(660, 0.1, "sine", 0.04, 0.08);
      return;
    }
    if (type === "unlock") {
      this.tone(392, 0.1, "triangle", 0.06, 0);
      this.tone(523, 0.16, "sine", 0.055, 0.08);
      return;
    }
    if (type === "screwdriver") {
      [0, 0.09, 0.18].forEach((delay, index) => {
        this.tone(210 + index * 20, 0.07, "sawtooth", 0.025, delay);
        this.noise(0.07, 0.018, delay, 1300);
      });
      return;
    }
    const effects = {
      click: [[210, 0.05, "triangle", 0.035]],
      feedback: [[660, 0.14, "sine", 0.04]],
      success: [[440, 0.12, "sine", 0.05], [660, 0.2, "sine", 0.04, 0.1]],
      error: [[130, 0.18, "sawtooth", 0.04]],
      failure: [[180, 0.3, "sawtooth", 0.05]],
    };
    (effects[type] || effects.click).forEach(([frequency, duration, wave, volume, delay = 0]) => {
      this.tone(frequency, duration, wave, volume, delay);
    });
  }

  tone(frequency, duration, wave, volume, delay) {
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.effectsGain);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  noise(duration, volume, delay, cutoff) {
    const start = this.context.currentTime + delay;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(this.effectsGain);
    source.start(start);
  }
}

window.audioManager = new AudioManager();
