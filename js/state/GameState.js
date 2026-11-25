class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.saveVersion = 2;
    this.clueIds = [];
    this.currentRoom = "감금실";
    this.solvedPuzzles = { "전력 배분": false };
    this.items = [];
    this.notes = [];
    this.selectedItem = null;
    this.combiningItem = null;
    this.timeRemaining = 20 * 60;
    this.hintUses = 0;
    this.hintStages = {};
    this.migrationNoticePending = false;
  }

  setRoom(room) {
    this.currentRoom = room;
    this.save();
  }

  addItem(item) {
    if (!this.items.includes(item)) {
      this.items.push(item);
      this.save();
    }
  }

  removeItem(item) {
    this.items = this.items.filter((storedItem) => storedItem !== item);
    if (this.selectedItem === item) {
      this.selectedItem = null;
    }
    this.save();
  }

  hasItem(item) {
    return this.items.includes(item);
  }

  selectItem(item) {
    this.selectedItem = this.items.includes(item) ? item : null;
  }

  solvePuzzle(puzzle) {
    this.solvedPuzzles[puzzle] = true;
    this.save();
  }

  isSolved(puzzle) {
    return this.solvedPuzzles[puzzle] === true;
  }

  addNote(note) {
    if (!this.notes.includes(note)) {
      this.notes.push(note);
      this.save();
    }
  }

  addClue(id, note, legacyNote) {
    const oldIndex = legacyNote ? this.notes.indexOf(legacyNote) : -1;
    let changed = false;
    if (!this.clueIds.includes(id)) {
      this.clueIds.push(id);
      changed = true;
    }
    if (oldIndex !== -1 && legacyNote !== note) {
      if (this.notes.includes(note)) this.notes.splice(oldIndex, 1);
      else this.notes[oldIndex] = note;
      changed = true;
    } else if (!this.notes.includes(note)) {
      this.notes.push(note);
      changed = true;
    }
    if (changed) this.save();
  }

  recordDocument(id) {
    const document = window.gameClues[id];
    const oldNotes = JSON.stringify(this.notes);
    const known = this.clueIds.includes(id);
    if (!known) this.clueIds.push(id);
    const index = this.notes.findIndex(note => note.startsWith(document.prefix) || document.pages.includes(note));
    this.notes = this.notes.filter(note => !note.startsWith(document.prefix) && !document.pages.includes(note));
    this.notes.splice(index < 0 ? this.notes.length : index, 0, ...document.pages);
    return !known || oldNotes !== JSON.stringify(this.notes);
  }

  discoverDocument(id) {
    if (this.recordDocument(id)) this.save();
    return window.gameClues[id].pages;
  }

  save() {
    localStorage.setItem("escapeGameState", JSON.stringify({
      saveVersion: this.saveVersion, clueIds: this.clueIds,
      currentRoom: this.currentRoom, solvedPuzzles: this.solvedPuzzles, items: this.items,
      notes: this.notes, timeRemaining: this.timeRemaining, hintUses: this.hintUses, hintStages: this.hintStages,
    }));
  }

  hasActiveSave() {
    try {
      const saved = JSON.parse(localStorage.getItem("escapeGameState"));
      return !!saved && Number.isFinite(saved.timeRemaining) && saved.timeRemaining > 0
        && ["감금실", "정비실", "통제실"].includes(saved.currentRoom)
        && [saved.items, saved.notes].every(values => Array.isArray(values) && values.every(value => typeof value === "string"))
        && !!saved.solvedPuzzles && !Array.isArray(saved.solvedPuzzles) && typeof saved.solvedPuzzles === "object"
        && Object.values(saved.solvedPuzzles).every(value => typeof value === "boolean")
        && (saved.saveVersion === undefined || [1, 2].includes(saved.saveVersion))
        && (saved.hintUses === undefined || Number.isInteger(saved.hintUses) && saved.hintUses >= 0)
        && (saved.hintStages === undefined || !!saved.hintStages && typeof saved.hintStages === "object" && !Array.isArray(saved.hintStages)
          && Object.values(saved.hintStages).every(value => Number.isInteger(value) && value >= 0 && value <= 3));
    } catch { return false; }
  }

  load() {
    if (!this.hasActiveSave()) return false;
    const saved = localStorage.getItem("escapeGameState");
    if (!saved) return false;
    const data = JSON.parse(saved);
    this.reset();
    for (const key of ["currentRoom", "solvedPuzzles", "items", "notes", "timeRemaining", "hintUses", "hintStages"]) {
      if (data[key] !== undefined) this[key] = data[key];
    }
    this.clueIds = Array.isArray(data.clueIds) ? [...new Set(data.clueIds.filter(id => typeof id === "string"))] : [];
    this.solvedPuzzles["전력 배분"] ??= false;
    let changed = false;
    if ((data.saveVersion ?? 1) === 1) {
      for (const [id, document] of Object.entries(window.gameClues)) {
        if (this.notes.some(note => note.startsWith(document.prefix))) this.recordDocument(id);
      }
      if (this.isSolved("통제실 통로") || this.currentRoom === "통제실" || this.isSolved("배선") || this.isSolved("비상문")) {
        this.solvedPuzzles["전력 배분"] = true;
        this.solvedPuzzles["통제실 통로"] = true;
        this.solvedPuzzles["배선도"] = true;
      }
      if (this.isSolved("배선도")) {
        this.recordDocument("equipment-labels");
        const wiring = "숨겨진 배선도: A→2, B→3, C→1";
        if (!this.notes.includes(wiring)) this.notes.push(wiring);
      }
      this.migrationNoticePending = !this.isSolved("비상문");
      changed = true;
    }
    if (this.hasItem("배터리") || this.hasItem("손전등") || this.isSolved("배선도")) {
      if (!this.isSolved("공구함")) changed = true;
      this.solvedPuzzles["공구함"] = true;
    }
    this.selectedItem = null;
    this.combiningItem = null;
    if (changed) this.save();
    return true;
  }

  clearSave() { localStorage.removeItem("escapeGameState"); }
}

window.gameState = new GameState();
