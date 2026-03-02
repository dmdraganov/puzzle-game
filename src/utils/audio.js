export default class Audio {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
  }

  _play(freq, type, duration) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  playPickUp() {
    this._play(200, 'square', 0.05);
  }

  playDrop() {
    this._play(150, 'square', 0.05);
  }

  playCorrect() {
    this._play(440, 'sine', 0.1);
  }

  playWin() {
    const notes = [261, 329, 392, 523]; // C4, E4, G4, C5
    notes.forEach((note, i) => {
      setTimeout(() => {
        this._play(note, 'triangle', 0.15);
      }, i * 100);
    });
  }
}
