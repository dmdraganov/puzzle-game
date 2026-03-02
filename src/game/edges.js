export class Edges {
  #top;
  #right;
  #bottom;
  #left;

  constructor(top, right, bottom, left) {
    this.#top = top;
    this.#right = right;
    this.#bottom = bottom;
    this.#left = left;
  }

  get top() {
    return this.#top;
  }
  get right() {
    return this.#right;
  }
  get bottom() {
    return this.#bottom;
  }
  get left() {
    return this.#left;
  }
  get all() {
    return [this.#top, this.#right, this.#bottom, this.#left];
  }
}
