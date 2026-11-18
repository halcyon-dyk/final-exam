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
    this.timeRemaining = 20 * 60;
    this.hintUses = 0;
  }

  setRoom(room) {
    this.currentRoom = room;
  }

  addItem(item) {
    if (!this.items.includes(item)) {
      this.items.push(item);
    }
  }

  removeItem(item) {
    this.items = this.items.filter((storedItem) => storedItem !== item);
    if (this.selectedItem === item) {
      this.selectedItem = null;
    }
  }

  hasItem(item) {
    return this.items.includes(item);
  }

  selectItem(item) {
    this.selectedItem = this.items.includes(item) ? item : null;
  }

  solvePuzzle(puzzle) {
    this.solvedPuzzles[puzzle] = true;
  }

  isSolved(puzzle) {
    return this.solvedPuzzles[puzzle] === true;
  }

  addNote(note) {
    if (!this.notes.includes(note)) {
      this.notes.push(note);
    }
  }
}

window.gameState = new GameState();
