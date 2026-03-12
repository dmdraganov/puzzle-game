export class PieceView {
  constructor(piece, size, image) {
    this.piece = piece;
    this.size = size;
    this.image = image;
    this.posX = 0;
    this.posY = 0;
    this.element = null;
  }
}

export default class Renderer {
  constructor(ui, audioPlayer) {
    this.ui = ui;
    this.audioPlayer = audioPlayer;
    this.pieceSize = 0;
    this.boardSize = 0;
    this.scaledImageWidth = 0;
    this.scaledImageHeight = 0;
    this.pieceViewData = new Map();
  }

  updateDimensions(
    boardSize,
    pieceSize,
    scaledImageWidth,
    scaledImageHeight,
  ) {
    this.boardSize = boardSize;
    this.pieceSize = pieceSize;
    this.scaledImageWidth = scaledImageWidth;
    this.scaledImageHeight = scaledImageHeight;
  }

  setPieceViewData(pieceViewData) {
    this.pieceViewData = pieceViewData;
  }

  render() {
    this.ui.board.innerHTML = "";
    for (const pieceView of this.pieceViewData.values()) {
      const el = this.createPieceElement(pieceView);
      pieceView.element = el;
      this.ui.board.appendChild(el);
      this.updateElementPosition(pieceView);
    }
  }

  createPieceElement(pieceView) {
    const el = document.createElement("div");
    const { piece, size, image } = pieceView;
    el.dataset.id = piece.id;
    el.className = "piece";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.backgroundImage = `url(${image})`;

    el.style.backgroundSize = `${this.scaledImageWidth}px ${this.scaledImageHeight}px`;

    const offsetX = (this.scaledImageWidth - this.boardSize) / 2;
    const offsetY = (this.scaledImageHeight - this.boardSize) / 2;

    const bgX = piece.position.x * this.pieceSize + offsetX;
    const bgY = piece.position.y * this.pieceSize + offsetY;

    el.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    el.classList.toggle("correct", piece.correct);
    return el;
  }

  updateElementPosition(pieceView) {
    if (!pieceView.element) return;
    pieceView.element.style.left = pieceView.posX + "px";
    pieceView.element.style.top = pieceView.posY + "px";
  }

  updateTime(time) {
    this.ui.timer.textContent = time;
  }
  updateScore(score) {
    this.ui.score.textContent = score;
  }

  updateHints(count) {
    this.ui.hintsRemaining.textContent = count;
    this.ui.hint.disabled = count <= 0;
  }

  showWin() {
    this.audioPlayer.playWin();
    this.ui.win.classList.add("show");
    this.ui.winText.textContent = "Пазл собран!";
    this.ui.winText.style.color = "green";
  }

  hideWin() {
    this.ui.win.classList.remove("show");
    this.ui.winText.style.color = "";
  }

  showGameOver() {
    this.ui.win.classList.add("show");
    this.ui.winText.textContent = "Время вышло!";
    this.ui.winText.style.color = "red";
  }

  showHint(hintPiece, pieceView) {
    if (pieceView && pieceView.element) {
      pieceView.element.classList.add("hint-piece");
      pieceView.element.style.zIndex = 101;
    }

    const hintEl = document.createElement("div");
    hintEl.className = "piece hint";
    hintEl.style.width = this.pieceSize + "px";
    hintEl.style.height = this.pieceSize + "px";
    hintEl.style.left = hintPiece.position.x * this.pieceSize + "px";
    hintEl.style.top = hintPiece.position.y * this.pieceSize + "px";
    this.ui.board.appendChild(hintEl);

    setTimeout(() => {
      hintEl.remove();
      if (pieceView && pieceView.element) {
        pieceView.element.classList.remove("hint-piece");
        pieceView.element.style.zIndex = 10;
      }
    }, 2000);
  }

  animateCorrectPlacement(pieceView) {
    if (!pieceView.element) return;
    const el = pieceView.element;
    el.style.left = pieceView.posX + "px";
    el.style.top = pieceView.posY + "px";
    el.style.zIndex = 1;
    el.classList.add("correct");
    el.classList.add("snapped");
    el.addEventListener("animationend", () => el.classList.remove("snapped"), {
      once: true,
    });
  }
}
