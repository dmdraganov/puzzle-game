import { clamp } from "../utils/utils.js";
import Timer from "../utils/timer.js";
import storage from "../utils/storage.js";
import AudioPlayer from "../utils/audio.js";

class PieceView {
  constructor(piece, size, image) {
    this.piece = piece;
    this.size = size;
    this.image = image;
    this.posX = 0;
    this.posY = 0;
    this.element = null;
  }
}

export default class View {
  dragging = new Map();
  pieceViewData = new Map();
  pieceSize = 0;
  boardSize = 0;
  audioPlayer = new AudioPlayer();

  constructor(game, uiIds) {
    this.game = game;
    this.ui = View.#getUiElements(uiIds);
    this.ui.winText = this.ui.win.querySelector("#win-text");
    this.timer = new Timer(
      (time) => this.updateTime(time),
      () => this.showGameOver(),
    );

    window.addEventListener("resize", () => this.handleRecalculate());
    this.ui.newGame.addEventListener("click", () =>
      this.start(this.ui.difficulty.value, true),
    );

    const handleSettingsChange = () => {
      if (!this.ui.win.classList.contains("show")) {
        this.start(this.ui.difficulty.value, true);
      }
    };

    this.ui.difficulty.addEventListener("change", handleSettingsChange);
    this.ui.gameMode.addEventListener("change", handleSettingsChange);
    this.ui.hint.addEventListener("click", () => this.showHint());
    this.ui.newGameButton.addEventListener("click", () =>
      this.start(this.ui.difficulty.value, true),
    );

    this.initDragEvents();
    this.loadState() || this.start(this.ui.difficulty.value, true);
  }

  static #getUiElements(uiIds) {
    const ui = {};
    for (const key in uiIds) {
      if (Object.hasOwn(uiIds, key))
        ui[key] = document.getElementById(uiIds[key]);
    }
    return ui;
  }

  start(gridValue, isNewGame = false) {
    if (isNewGame) storage.save(null);
    const grid = parseInt(gridValue);
    this.boardSize = this.ui.board.clientWidth;
    this.pieceSize = this.boardSize / grid;
    this.ui.board.style.setProperty("--grid-size", grid);
    this.timer.reset();
    this.hideWin();
    const pieces = this.game.start(grid);
    this.updateScore(this.game.getScore());
    this.updateHints(this.game.getHintsRemaining());
    this.pieceViewData.clear();
    for (const piece of pieces) {
      const pieceView = new PieceView(piece, this.pieceSize, this.game.image);
      this.pieceViewData.set(piece.id, pieceView);
      pieceView.posY = this.boardSize + 50 + Math.random() * 100;
      pieceView.posX = Math.random() * (this.boardSize - pieceView.size);
    }
    this.render();

    if (this.ui.gameMode.value === "time") {
      const startTime = grid * grid * 5;
      this.timer.start(startTime);
    } else {
      this.timer.start();
    }
  }

  saveState() {
    const viewState = [];
    for (const pieceView of this.pieceViewData.values()) {
      viewState.push({
        id: pieceView.piece.id,
        posX: pieceView.posX,
        posY: pieceView.posY,
      });
    }
    const gameMode = this.ui.gameMode.value;
    storage.save({
      gameState: this.game.getState(),
      viewState,
      time: this.timer.time,
      gameMode,
    });
  }

  loadState() {
    const savedState = storage.load();
    if (
      !savedState ||
      !savedState.gameState ||
      !savedState.gameState.image ||
      Array.isArray(savedState)
    ) {
      storage.save(null);
      return false;
    }
    const { gameState, viewState, time, isTimeTrial, gameMode } = savedState;
    this.ui.difficulty.value = gameState.grid;

    const mode = gameMode || (isTimeTrial ? "time" : "free");
    this.ui.gameMode.value = mode;

    this.boardSize = this.ui.board.clientWidth;
    this.pieceSize = this.boardSize / gameState.grid;
    this.ui.board.style.setProperty("--grid-size", gameState.grid);
    this.hideWin();
    const pieces = this.game.start(
      gameState.grid,
      gameState.pieces,
      gameState,
      gameState.image,
    );
    this.updateScore(this.game.getScore());
    this.updateHints(this.game.getHintsRemaining());
    this.pieceViewData.clear();
    for (const piece of pieces) {
      const pieceView = new PieceView(piece, this.pieceSize, this.game.image);
      const savedView = viewState.find((v) => v.id === piece.id);
      if (savedView) {
        pieceView.posX = savedView.posX;
        pieceView.posY = savedView.posY;
      }
      this.pieceViewData.set(piece.id, pieceView);
    }
    this.render();
    this.timer.reset();

    if (mode === "time") {
      this.timer.start(time);
    } else {
      this.timer.time = time;
      this.timer.start();
    }
    return true;
  }

  handleRecalculate() {
    const grid = this.game.grid;
    this.boardSize = this.ui.board.clientWidth;
    this.pieceSize = this.boardSize / grid;
    this.ui.board.style.setProperty("--grid-size", grid);
    for (const pieceView of this.pieceViewData.values()) {
      pieceView.size = this.pieceSize;
      if (pieceView.piece.correct) {
        pieceView.posX = pieceView.piece.position.x * this.pieceSize;
        pieceView.posY = pieceView.piece.position.y * this.pieceSize;
      }
    }
    this.render();
  }

  handleDrop(pieceId) {
    const pieceView = this.pieceViewData.get(pieceId);
    if (!pieceView || pieceView.piece.correct) return;
    const pieceCenterX = pieceView.posX + pieceView.size / 2;
    const pieceCenterY = pieceView.posY + pieceView.size / 2;

    if (
      pieceCenterX > 0 &&
      pieceCenterX < this.boardSize &&
      pieceCenterY > 0 &&
      pieceCenterY < this.boardSize
    ) {
      const gridX = Math.round(pieceView.posX / this.pieceSize);
      const gridY = Math.round(pieceView.posY / this.pieceSize);

      if (this.game.isPositionOccupied(gridX, gridY)) {
        this.saveState();
        return;
      }

      pieceView.posX = gridX * this.pieceSize;
      pieceView.posY = gridY * this.pieceSize;
      this.updateElementPosition(pieceView);
      if (this.game.isCorrectPosition(pieceId, gridX, gridY)) {
        this.game.setPieceCorrect(pieceId, true);
        this.updateScore(this.game.getScore());
        this.animateCorrectPlacement(pieceView);
        this.audioPlayer.playCorrect();
        if (navigator.vibrate) navigator.vibrate(40);
        if (this.game.checkWin()) {
          this.timer.stop();
          this.showWin();
        }
      } else {
        this.game.setPieceCorrect(pieceId, false);
      }
      this.saveState();
    } else {
      this.saveState();
    }
  }

  initDragEvents() {
    document.body.addEventListener("mousedown", (e) => {
      const pieceEl = e.target.closest(".piece");
      if (!pieceEl) return;
      const pieceId = parseInt(pieceEl.dataset.id);
      const pieceView = this.pieceViewData.get(pieceId);
      if (pieceView && !pieceView.piece.correct) {
        pieceView.element.style.zIndex = 100;
        const boardRect = this.ui.board.getBoundingClientRect();
        const mouseX = e.clientX - boardRect.left;
        const mouseY = e.clientY - boardRect.top;
        this.dragging.set("mouse", {
          pieceView,
          offsetX: mouseX - pieceView.posX,
          offsetY: mouseY - pieceView.posY,
          isSnapped: false,
        });
      }
    });

    document.body.addEventListener(
      "touchstart",
      (e) => {
        const pieceEl = e.target.closest(".piece");
        if (!pieceEl) return;

        const pieceId = parseInt(pieceEl.dataset.id);
        const pieceView = this.pieceViewData.get(pieceId);

        if (pieceView && !pieceView.piece.correct) {
          pieceView.element.style.zIndex = 100;
          const boardRect = this.ui.board.getBoundingClientRect();

          for (const touch of e.changedTouches) {
            const mouseX = touch.clientX - boardRect.left;
            const mouseY = touch.clientY - boardRect.top;
            this.dragging.set(touch.identifier, {
              pieceView,
              offsetX: mouseX - pieceView.posX,
              offsetY: mouseY - pieceView.posY,
              isSnapped: false,
            });
          }
        }
      },
      { passive: false },
    );

    window.addEventListener("mousemove", (e) => {
      if (!this.dragging.has("mouse")) return;

      const boardRect = this.ui.board.getBoundingClientRect();
      const mouseX = e.clientX - boardRect.left;
      const mouseY = e.clientY - boardRect.top;
      const dragState = this.dragging.get("mouse");
      this.updateDragPosition(dragState, mouseX, mouseY);
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        const boardRect = this.ui.board.getBoundingClientRect();
        for (const touch of e.changedTouches) {
          if (!this.dragging.has(touch.identifier)) continue;
          const mouseX = touch.clientX - boardRect.left;
          const mouseY = touch.clientY - boardRect.top;
          const dragState = this.dragging.get(touch.identifier);
          this.updateDragPosition(dragState, mouseX, mouseY);
        }
      },
      { passive: false },
    );

    window.addEventListener("mouseup", (e) => {
      if (!this.dragging.has("mouse")) return;
      const { pieceView } = this.dragging.get("mouse");
      pieceView.element.style.zIndex = pieceView.piece.correct ? 1 : 10;
      this.dragging.delete("mouse");
      this.handleDrop(pieceView.piece.id);
    });

    window.addEventListener("touchend", (e) => {
      for (const touch of e.changedTouches) {
        if (!this.dragging.has(touch.identifier)) continue;
        const { pieceView } = this.dragging.get(touch.identifier);
        pieceView.element.style.zIndex = pieceView.piece.correct ? 1 : 10;
        this.dragging.delete(touch.identifier);
        this.handleDrop(pieceView.piece.id);
      }
    });
  }

  updateDragPosition(dragState, mouseX, mouseY) {
    const { pieceView, offsetX, offsetY } = dragState;
    const freeX = mouseX - offsetX;
    const freeY = mouseY - offsetY;
    const gridX = clamp(
      Math.round(freeX / this.pieceSize),
      0,
      this.game.grid - 1,
    );
    const gridY = clamp(
      Math.round(freeY / this.pieceSize),
      0,
      this.game.grid - 1,
    );
    const snapX = gridX * this.pieceSize;
    const snapY = gridY * this.pieceSize;
    const dist = Math.hypot(freeX - snapX, freeY - snapY);
    if (dragState.isSnapped) {
      const exitSnapZone = this.pieceSize * 0.4;
      if (dist > exitSnapZone) {
        dragState.isSnapped = false;
        pieceView.posX = freeX;
        pieceView.posY = freeY;
      } else {
        pieceView.posX = snapX;
        pieceView.posY = snapY;
      }
    } else {
      const enterSnapZone = this.pieceSize * 0.2;
      if (dist < enterSnapZone) {
        dragState.isSnapped = true;
        pieceView.posX = snapX;
        pieceView.posY = snapY;
      } else {
        pieceView.posX = freeX;
        pieceView.posY = freeY;
      }
    }
    this.updateElementPosition(pieceView);
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
    el.style.backgroundSize = `${this.boardSize}px ${this.boardSize}px`;
    el.style.backgroundPosition = `-${piece.position.x * size}px -${piece.position.y * size}px`;
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
  }

  hideWin() {
    this.ui.win.classList.remove("show");
  }

  showGameOver() {
    this.ui.win.classList.add("show");
    this.ui.winText.textContent = "Время вышло!";
  }

  showHint() {
    const hintPiece = this.game.getHint();
    if (!hintPiece) return;

    this.updateHints(this.game.getHintsRemaining());

    if (this.ui.gameMode.value === "time") {
      this.timer.time -= 5; // Penalty for time trial
    } else {
      this.timer.time += 10; // Penalty for normal mode
    }

    const pieceView = this.pieceViewData.get(hintPiece.id);
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
