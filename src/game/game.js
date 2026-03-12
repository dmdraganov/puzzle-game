import Piece from "./piece.js";

export default class Game {
  constructor() {
    this.pieces = [];
    this.grid = 3;
    this.score = 0;
    this.image = null;
    this.hintsUsed = 0;
    this.maxHints = 3;
    this.images = [
      "src/assets/images/autumn.jpg",
      "src/assets/images/beach.jpg",
      "src/assets/images/desert.jpg",
      "src/assets/images/desktop.jpg",
      "src/assets/images/forest.jpg",
      "src/assets/images/kozel.jpg",
      "src/assets/images/street.jpg",
      "src/assets/images/files.jpg",
    ];
  }

  start(
    grid,
    savedPieces = null,
    savedState = { score: 0, hintsUsed: 0 },
    savedImage = null,
  ) {
    this.grid = grid;
    this.score = savedState.score;
    this.hintsUsed = savedState.hintsUsed;

    if (savedPieces) {
      this.image = savedImage || this.images[0];
      this.pieces = savedPieces.map((p) => {
        const piece = new Piece(p.position, p.id);
        piece.correct = p.correct;
        return piece;
      });
    } else {
      this.score = 0; // Reset score only on a new game
      this.hintsUsed = 0;
      this.image = this.images[Math.floor(Math.random() * this.images.length)];
      this.createPieces();
    }
    return this.pieces;
  }

  createPieces() {
    this.pieces = [];
    for (let y = 0; y < this.grid; y++) {
      for (let x = 0; x < this.grid; x++) {
        const id = y * this.grid + x;
        const piece = new Piece({ x, y }, id);
        this.pieces.push(piece);
      }
    }
  }

  setPieceCorrect(pieceId, isCorrect) {
    const piece = this.pieces.find((p) => p.id === pieceId);
    if (piece && piece.correct !== isCorrect) {
      piece.correct = isCorrect;
      if (isCorrect) {
        this.score += 10;
      }
    }
  }

  isCorrectPosition(pieceId, gridX, gridY) {
    const piece = this.pieces.find((p) => p.id === pieceId);
    if (!piece) return false;
    return piece.position.x === gridX && piece.position.y === gridY;
  }

  isPositionOccupied(gridX, gridY) {
    return this.pieces.some(
      (p) => p.correct && p.position.x === gridX && p.position.y === gridY,
    );
  }

  checkWin() {
    if (this.pieces.length === 0) return false;
    return this.pieces.every((p) => p.correct);
  }

  useHint() {
    if (this.hintsUsed >= this.maxHints) {
      return null;
    }
    const incorrectPiece = this.pieces.find((p) => !p.correct);
    if (incorrectPiece) {
      this.hintsUsed++;
      this.score -= 10;
    }
    return incorrectPiece;
  }

  getHintsRemaining() {
    return this.maxHints - this.hintsUsed;
  }

  getPieces() {
    return this.pieces;
  }

  getScore() {
    return this.score;
  }

  getState() {
    return {
      grid: this.grid,
      pieces: this.pieces,
      score: this.score,
      image: this.image,
      hintsUsed: this.hintsUsed,
    };
  }
}
