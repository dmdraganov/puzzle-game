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

const images = [
  "src/assets/images/autumn.jpg",
  "src/assets/images/beach.jpg",
  "src/assets/images/desert.jpg",
  "src/assets/images/desktop.jpg",
  "src/assets/images/forest.jpg",
  "src/assets/images/kozel.jpg",
  "src/assets/images/street.jpg",
  "src/assets/images/files.jpg",
];

const game = new Game(images);
const view = new View(game, uiIds);
