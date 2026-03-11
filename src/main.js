import Game from "./game/game.js";
import View from "./view/view.js";

const uiIds = {
  board: "board",
  timer: "timer",
  score: "score",
  win: "win",
  newGame: "newGame",
  hint: "hint",
  hintsRemaining: "hintsRemaining",
  gameMode: "gameMode",
  difficulty: "difficulty",
  newGameButton: "newGameButton",
};

const game = new Game();
const view = new View(game, uiIds);
