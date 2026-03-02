import Game from "./game/game.js";
import View from "./view/view.js";

const uiIds = {
  board: "board",
  timer: "timer",
  score: "score",
  win: "win",
  newGame: "newGame",
  hint: "hint",
  timeTrial: "timeTrial",
  difficulty: "difficulty",
};

const game = new Game();
const view = new View(game, uiIds);
