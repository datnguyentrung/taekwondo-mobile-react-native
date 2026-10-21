/** Coordinates of an object-fit: contain video inside the overlay canvas. */
export function videoContainRect(canvasWidth: number, canvasHeight: number, videoWidth: number, videoHeight: number) {
  const scale = Math.min(canvasWidth / Math.max(1, videoWidth), canvasHeight / Math.max(1, videoHeight));
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
}
