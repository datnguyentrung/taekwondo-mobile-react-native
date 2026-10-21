/** Coordinates of an object-fit: contain video inside the overlay canvas. */
export function videoContainRect(canvasWidth: number, canvasHeight: number, videoWidth: number, videoHeight: number) {
  const scale = Math.min(canvasWidth / Math.max(1, videoWidth), canvasHeight / Math.max(1, videoHeight));
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
}

export type StableOverlayLine = { y: number; updatedAtMs: number };

/** Smooth only the rendered guide. Counter geometry remains unfiltered. */
export function stabilizeOverlayLine(previous: StableOverlayLine | undefined, targetY: number, timestampMs: number): StableOverlayLine {
  if (!previous) return { y: targetY, updatedAtMs: timestampMs };
  const elapsedMs = Math.max(1, timestampMs - previous.updatedAtMs);
  const maxStep = Math.min(0.025, Math.max(0.004, elapsedMs * 0.00012));
  const nextY = previous.y + Math.max(-maxStep, Math.min(maxStep, (targetY - previous.y) * 0.18));
  return { y: nextY, updatedAtMs: timestampMs };
}
