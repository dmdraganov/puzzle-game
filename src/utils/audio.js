import { sounds } from "../config.js";

export default class AudioPlayer {
  constructor() {
    this.correctSound = new Audio(sounds.correct);
    this.winSound = new Audio(sounds.win);
  }

  playCorrect() {
    this.correctSound.volume = 0.2;
    return this.correctSound.play();
  }

  playWin() {
    this.winSound.volume = 0.5;
    return this.winSound.play();
  }
}
