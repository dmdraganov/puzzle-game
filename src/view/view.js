import { clamp } from "../utils/utils.js";
import Timer from "../utils/timer.js";
import storage from "../utils/storage.js";
import AudioPlayer from "../utils/audio.js";
import Renderer, { PieceView } from "./renderer.js";
import DragAndDrop from "./drag-and-drop.js";

export default class View {
  pieceViewData = new Map();
  pieceSize = 0;
  boardSize = 0;
  previousBoardSize = 0;
  audioPlayer = new AudioPlayer();
  scaledImageWidth = 0;
  scaledImageHeight = 0;

  constructor(game, uiIds) {
    this.game = game;
    this.ui = View.#getUiElements(uiIds);
    this.ui.winText = this.ui.win.querySelector("#win-text");
    this.renderer = new Renderer(this.ui, this.audioPlayer);
    this.timer = new Timer(
      (time) => this.renderer.updateTime(time),
      () => this.renderer.showGameOver(),
    );

    const getPieceSize = () => this.pieceSize;
    this.dragAndDrop = new DragAndDrop(
      this.ui.board,
      this.pieceViewData,
      this.game,
      getPieceSize,
      (pieceId) => this.handleDrop(pieceId),
      (pieceView) => this.renderer.updateElementPosition(pieceView),
    );

    window.addEventListener("resize", () => this.handleRecalculate());
    this.ui.newGame.addEventListener("click", () =>
      this.start(this.ui.difficulty.value, true),
    );

    this.ui.hint.addEventListener("click", () => this.showHint());
    this.ui.newGameButton.addEventListener("click", () =>
      this.start(this.ui.difficulty.value, true),
    );
    this.ui.openMenuButton.addEventListener("click", () =>
      this.pauseGameAndShowMenu(),
    );
    this.ui.resumeGame.addEventListener("click", () => this.resumeGame());

    this.dragAndDrop.init();
    this.loadState().catch(() => this.showMenu());
  }

  static #getUiElements(uiIds) {
    const ui = {};
    for (const key in uiIds) {
      if (Object.hasOwn(uiIds, key))
        ui[key] = document.getElementById(uiIds[key]);
    }
    return ui;
  }

  pauseGameAndShowMenu() {
    this.timer.stop();
    this.showMenu();
  }

  resumeGame() {
    this.hideMenu();
    this.timer.start();
  }

  hideMenu() {
    this.ui.win.classList.remove("show", "menu-mode");
    this.ui.resumeGame.style.display = "none";
    document.body.style.overflow = "auto";
  }

  showMenu() {
    this.renderer.hideWin();
    this.ui.win.classList.add("menu-mode");
    this.ui.winText.style.display = "none";

    const isGameActive = this.game.getPieces().length > 0;

    if (isGameActive) {
      this.ui.resumeGame.style.display = "block";
      this.ui.resumeGame.style.background = "#00c853";
    } else {
      this.ui.resumeGame.style.display = "none";
    }

    this.ui.win.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  start(gridValue, isNewGame = false) {
    this.hideMenu();
    this.ui.winText.style.display = "block";
    return this.initGame(gridValue, isNewGame);
  }

  async initGame(gridValue, isNewGame, savedData = null) {
    this.renderer.clearHint();
    if (isNewGame) storage.save(null);

    const grid = parseInt(gridValue);
    const gameWrapper = document.getElementById("game-wrapper");
    const wrapperRect = gameWrapper.getBoundingClientRect();

    const prefersSides = wrapperRect.width > wrapperRect.height && wrapperRect.width > 700;

    if (prefersSides) {
      gameWrapper.style.alignItems = "center";
      const pieceAreaWidth = Math.min(wrapperRect.width * 0.4, 300);
      const maxBoardSizeFromHeight = wrapperRect.height - 20;
      const maxBoardSizeFromWidth = wrapperRect.width - pieceAreaWidth - 20;
      this.boardSize = Math.floor(
        Math.min(maxBoardSizeFromHeight, maxBoardSizeFromWidth),
      );
    } else {
      gameWrapper.style.alignItems = "flex-start";
      const pieceAreaHeight = Math.min(wrapperRect.height * 0.3, 150);
      const maxBoardSizeFromWidth = wrapperRect.width - 20;
      const maxBoardSizeFromHeight =
        wrapperRect.height - pieceAreaHeight - 20;
      this.boardSize = Math.floor(
        Math.min(maxBoardSizeFromWidth, maxBoardSizeFromHeight),
      );
    }

    this.ui.board.style.width = this.boardSize + "px";
    this.ui.board.style.height = this.boardSize + "px";
    this.pieceSize = this.boardSize / grid;
    this.ui.board.style.setProperty("--grid-size", grid);
    this.timer.reset();
    this.renderer.hideWin();

    const pieces = savedData
      ? this.game.loadGame(savedData.gameState)
      : this.game.startNewGame(grid);

    this.renderer.updateScore(this.game.getScore());
    this.renderer.updateHints(this.game.getHintsRemaining());

    const image = new Image();
    image.src = this.game.image;
    await new Promise((resolve) => (image.onload = resolve));

    const imgAR = image.naturalWidth / image.naturalHeight;

    if (imgAR > 1) {
      this.scaledImageHeight = this.boardSize;
      this.scaledImageWidth = this.scaledImageHeight * imgAR;
    } else {
      this.scaledImageWidth = this.boardSize;
      this.scaledImageHeight = this.scaledImageWidth / imgAR;
    }

    this.pieceViewData.clear();
    const boardRect = this.ui.board.getBoundingClientRect();
    const spaceBottom = wrapperRect.bottom - boardRect.bottom;
    const spaceLeft = boardRect.left - wrapperRect.left;
    const spaceRight = wrapperRect.right - boardRect.right;

    for (const piece of pieces) {
      const pieceView = new PieceView(piece, this.pieceSize, this.game.image);
      if (savedData) {
        const savedView = savedData.viewState.find((v) => v.id === piece.id);
        if (savedView) {
          pieceView.posX = savedView.posX;
          pieceView.posY = savedView.posY;
        }
      } else {
        if (prefersSides) {
          if (Math.random() < 0.5 && spaceLeft > this.pieceSize) {
            pieceView.posX =
              -spaceLeft + Math.random() * (spaceLeft - this.pieceSize);
            pieceView.posY = Math.random() * (this.boardSize - this.pieceSize);
          } else {
            pieceView.posX =
              this.boardSize + Math.random() * (spaceRight - this.pieceSize);
            pieceView.posY = Math.random() * (this.boardSize - this.pieceSize);
          }
        } else {
          pieceView.posX = Math.random() * (this.boardSize - this.pieceSize);
          if (spaceBottom > this.pieceSize) {
            pieceView.posY =
              this.boardSize + Math.random() * (spaceBottom - this.pieceSize);
          } else {
            pieceView.posY = Math.random() * (this.boardSize - this.pieceSize);
          }
        }
      }
      this.pieceViewData.set(piece.id, pieceView);
    }
    
    this.previousBoardSize = this.boardSize;
    this.renderer.setPieceViewData(this.pieceViewData);
    this.renderer.updateDimensions(
      this.boardSize,
      this.pieceSize,
      this.scaledImageWidth,
      this.scaledImageHeight,
    );
    this.renderer.render();

    if (this.ui.gameMode.value === "time") {
      const startTime = savedData ? savedData.time : grid * grid * 5;
      this.timer.start(startTime);
    } else {
      this.timer.time = savedData ? savedData.time : 0;
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

  async loadState() {
    const savedState = storage.load();
    if (
      !savedState ||
      !savedState.gameState ||
      !savedState.gameState.image ||
      Array.isArray(savedState)
    ) {
      storage.save(null);
      throw new Error("No saved state");
    }
    const { gameState, viewState, time, isTimeTrial, gameMode } = savedState;
    this.ui.difficulty.value = gameState.grid;

    const mode = gameMode || (isTimeTrial ? "time" : "free");
    this.ui.gameMode.value = mode;

    await this.initGame(gameState.grid, false, {
      gameState,
      viewState,
      time,
    });
    return true;
  }

  handleRecalculate() {
    const oldBoardSize = this.previousBoardSize;
    const grid = this.game.grid;
    const gameWrapper = document.getElementById("game-wrapper");
    const wrapperRect = gameWrapper.getBoundingClientRect();

    const prefersSides = wrapperRect.width > wrapperRect.height && wrapperRect.width > 700;

    if (prefersSides) {
      gameWrapper.style.alignItems = "center";
      const pieceAreaWidth = Math.min(wrapperRect.width * 0.4, 300);
      const maxBoardSizeFromHeight = wrapperRect.height - 20;
      const maxBoardSizeFromWidth = wrapperRect.width - pieceAreaWidth - 20;
      this.boardSize = Math.floor(
        Math.min(maxBoardSizeFromHeight, maxBoardSizeFromWidth),
      );
    } else {
      gameWrapper.style.alignItems = "flex-start";
      const pieceAreaHeight = Math.min(wrapperRect.height * 0.3, 150);
      const maxBoardSizeFromWidth = wrapperRect.width - 20;
      const maxBoardSizeFromHeight =
        wrapperRect.height - pieceAreaHeight - 20;
      this.boardSize = Math.floor(
        Math.min(maxBoardSizeFromWidth, maxBoardSizeFromHeight),
      );
    }

    this.ui.board.style.width = this.boardSize + "px";
    this.ui.board.style.height = this.boardSize + "px";
    
    const scaleFactor = oldBoardSize ? this.boardSize / oldBoardSize : 1;
    this.pieceSize = this.boardSize / grid;
    this.ui.board.style.setProperty("--grid-size", grid);

    const imgAR = this.scaledImageWidth / this.scaledImageHeight;
    if (imgAR > 1) {
      this.scaledImageHeight = this.boardSize;
      this.scaledImageWidth = this.scaledImageHeight * imgAR;
    } else {
      this.scaledImageWidth = this.boardSize;
      this.scaledImageHeight = this.scaledImageWidth / imgAR;
    }

    const boardRect = this.ui.board.getBoundingClientRect();
    const spaceBottom = wrapperRect.bottom - boardRect.bottom;
    const spaceLeft = boardRect.left - wrapperRect.left;
    const spaceRight = wrapperRect.right - boardRect.right;

    for (const pieceView of this.pieceViewData.values()) {
      pieceView.size = this.pieceSize;
      if (pieceView.piece.correct) {
        pieceView.posX = pieceView.piece.position.x * this.pieceSize;
        pieceView.posY = pieceView.piece.position.y * this.pieceSize;
      } else {
        pieceView.posX *= scaleFactor;
        pieceView.posY *= scaleFactor;

        if (prefersSides) {
            if (pieceView.posX < this.boardSize / 2) {
                pieceView.posX = clamp(pieceView.posX, -spaceLeft, -pieceView.size);
            } else {
                pieceView.posX = clamp(pieceView.posX, this.boardSize, this.boardSize + spaceRight - pieceView.size);
            }
            pieceView.posY = clamp(pieceView.posY, 0, this.boardSize-pieceView.size);
        } else {
            pieceView.posY = clamp(pieceView.posY, this.boardSize, this.boardSize + spaceBottom - pieceView.size);
            pieceView.posX = clamp(pieceView.posX, 0, this.boardSize - pieceView.size);
        }
      }
    }

    this.previousBoardSize = this.boardSize;
    this.renderer.updateDimensions(
      this.boardSize,
      this.pieceSize,
      this.scaledImageWidth,
      this.scaledImageHeight,
    );
    this.renderer.render();
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
      this.renderer.updateElementPosition(pieceView);
      if (this.game.isCorrectPosition(pieceId, gridX, gridY)) {
        this.game.setPieceCorrect(pieceId, true);
        this.renderer.updateScore(this.game.getScore());
        this.renderer.animateCorrectPlacement(pieceView);
        this.audioPlayer.playCorrect();
        if (navigator.vibrate) navigator.vibrate(40);
        if (this.game.checkWin()) {
          this.timer.stop();
          this.renderer.showWin();
        }
      } else {
        this.game.setPieceCorrect(pieceId, false);
      }
      this.saveState();
    } else {
      this.saveState();
    }
  }

  showHint() {
    const hintPiece = this.game.useHint();
    if (!hintPiece) return;

    this.renderer.updateHints(this.game.getHintsRemaining());
    this.renderer.updateScore(this.game.getScore());

    const pieceView = this.pieceViewData.get(hintPiece.id);
    this.renderer.showHint(hintPiece, pieceView);
  }
}
