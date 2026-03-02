export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}
