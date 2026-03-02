export default class Piece {
  correct = false;
  id = null;
  position = null; // Correct grid position {x, y}

  constructor(position, id) {
    this.position = position;
    this.id = id;
  }
}
