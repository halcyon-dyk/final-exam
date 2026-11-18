class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentRoom = "감금실";
    this.solvedPuzzles = {};
    this.items = [];
    this.notes = [];
    this.selectedItem = null;
    this.combiningItem = null;
    this.timeRemaining = 20 * 60;
    this.hintUses = 0;
    this.hintStages = {};
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

  save() {
    localStorage.setItem("escapeGameState", JSON.stringify({
      currentRoom: this.currentRoom, solvedPuzzles: this.solvedPuzzles, items: this.items,
      notes: this.notes, timeRemaining: this.timeRemaining, hintUses: this.hintUses, hintStages: this.hintStages,
    }));
  }

  load() {
    const saved = localStorage.getItem("escapeGameState");
    if (!saved) return false;
    Object.assign(this, JSON.parse(saved));
    this.selectedItem = null;
    this.combiningItem = null;
    return true;
  }

  clearSave() { localStorage.removeItem("escapeGameState"); }
}

window.gameState = new GameState();
