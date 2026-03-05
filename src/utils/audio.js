export default class AudioPlayer {
  correctSound = new Audio("/src/assets/correct.mp3");
  winSound = new Audio("/src/assets/win.mp3");

  constructor() {}

  playCorrect() {
    this.correctSound.volume = 0.2;
    return this.correctSound.play();
  }

  playWin() {
    this.winSound.volume = 0.5;
    return this.winSound.play();
  }
}
