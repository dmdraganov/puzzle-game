import { clamp } from "../utils/utils.js";

export default class DragAndDrop {
  dragging = new Map();

  constructor(
    board,
    pieceViewData,
    game,
    getPieceSize,
    handleDrop,
    updateElementPosition,
  ) {
    this.board = board;
    this.pieceViewData = pieceViewData;
    this.game = game;
    this.getPieceSize = getPieceSize;
    this.handleDrop = handleDrop;
    this.updateElementPosition = updateElementPosition;
  }

  init() {
    document.body.addEventListener("mousedown", (e) => {
      const pieceEl = e.target.closest(".piece");
      if (!pieceEl) return;
      const pieceId = parseInt(pieceEl.dataset.id);
      const pieceView = this.pieceViewData.get(pieceId);
      if (pieceView && !pieceView.piece.correct) {
        pieceView.element.style.zIndex = 100;
        const boardRect = this.board.getBoundingClientRect();
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
          const boardRect = this.board.getBoundingClientRect();

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

      const boardRect = this.board.getBoundingClientRect();
      const mouseX = e.clientX - boardRect.left;
      const mouseY = e.clientY - boardRect.top;
      const dragState = this.dragging.get("mouse");
      this.updateDragPosition(dragState, mouseX, mouseY);
    });

    window.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        const boardRect = this.board.getBoundingClientRect();
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
    const pieceSize = pieceView.size; // Use pieceView.size
    let freeX = mouseX - offsetX;
    let freeY = mouseY - offsetY;

    const boardRect = this.board.getBoundingClientRect();

    // Clamp to viewport
    const minX = -boardRect.left;
    const maxX = window.innerWidth - boardRect.left - pieceSize;
    const minY = -boardRect.top;
    const maxY = window.innerHeight - boardRect.top - pieceSize;

    freeX = clamp(freeX, minX, maxX);
    freeY = clamp(freeY, minY, maxY);

    // The rest of the logic
    const gridX = clamp(Math.round(freeX / pieceSize), 0, this.game.grid - 1);
    const gridY = clamp(Math.round(freeY / pieceSize), 0, this.game.grid - 1);
    const snapX = gridX * pieceSize;
    const snapY = gridY * pieceSize;
    const dist = Math.hypot(freeX - snapX, freeY - snapY);
    if (dragState.isSnapped) {
      const exitSnapZone = pieceSize * 0.4;
      if (dist > exitSnapZone) {
        dragState.isSnapped = false;
        pieceView.posX = freeX;
        pieceView.posY = freeY;
      } else {
        pieceView.posX = snapX;
        pieceView.posY = snapY;
      }
    } else {
      const enterSnapZone = pieceSize * 0.2;
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
}
