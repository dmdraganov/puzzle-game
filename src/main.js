import Game from "./game/game.js";
import View from "./view/view.js";
import { images } from "./config.js";

const uiIds = {
  board: "board",
  timer: "timer",
  score: "score",
  win: "win",
  newGame: "newGame",
  hint: "hint",
  gameMode: "gameMode",
  difficulty: "difficulty",
  newGameButton: "newGameButton",
  openMenuButton: "openMenuButton",
  resumeGame: "resumeGame",
};

const game = new Game(images);
const view = new View(game, uiIds);
