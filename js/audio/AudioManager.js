class AudioManager {
  constructor() {
    this.context = null;
    this.background = null;
    this.room = null;
    this.soundManager = null;
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
  }

  unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.context) this.context = new AudioContext();
    return this.context;
  }

  runAfterUnlock(callback) {
    const context = this.unlock();
    if (!context) return;
    if (context.state === "running") {
      callback();
      return;
    }
    context.resume().then(callback).catch(() => {});
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
    this.background = this.soundManager.add(sound.key, { loop: true, volume: sound.volume });
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
    if (this.soundManager && (type === "bolts" || type === "wall")) {
      const sound = type === "bolts" ? this.boltsSound : this.wallSound;
      sound.stop();
      sound.play("inspect", { volume: type === "bolts" ? 0.85 : 0.55 });
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
        this.screwdriverSound.play("turn", { volume: 1 });
        return;
      }
      this.soundManager.stopByKey(soundKey);
      this.soundManager.play(soundKey, { volume: 1 });
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
    oscillator.connect(gain).connect(this.context.destination);
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
    source.connect(filter).connect(gain).connect(this.context.destination);
    source.start(start);
  }
}

window.audioManager = new AudioManager();
