export default class Timer {
  constructor(onTick, onEnd) {
    this.time = 0;
    this.interval = null;
    this.onTick = onTick;
    this.onEnd = onEnd;
    this.isCountdown = false;
  }

  start(startTime = null) {
    this.stop();
    
    if (startTime) {
        this.time = startTime;
        this.isCountdown = true;
    } else {
        this.time = 0;
        this.isCountdown = false;
    }

    if (this.onTick) this.onTick(this.time);

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

      if (this.onTick) {
        this.onTick(this.time);
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
  }

  reset() {
    this.time = 0;
    this.stop();
  }
}
