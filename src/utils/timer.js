export default class Timer {
  constructor(onTick, onEnd) {
    this.time = 0;
    this.interval = null;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.isCountdown = false;
  }

  #run() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      if (this.isCountdown) {
        this.time--;
        if (this.time < 0) {
          this.time = 0;
          this.stop();
          if (this.onEnd) this.onEnd();
        }
      } else {
        this.time++;
      }
      if (this.onTick) this.onTick(this.#format(this.time));
    }, 1000);
  }

  startCountdown(startTime) {
    this.stop();
    this.time = startTime;
    this.isCountdown = true;
    if (this.onTick) this.onTick(this.#format(this.time));
    this.#run();
  }

  startStopwatch(startTime = 0) {
    this.stop();
    this.time = startTime;
    this.isCountdown = false;
    if (this.onTick) this.onTick(this.#format(this.time));
    this.#run();
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }

  resume() {
    this.#run();
  }

  reset() {
    this.stop();
    this.time = 0;
  }

  #format(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
}
