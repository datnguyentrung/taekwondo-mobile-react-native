import { stabilizeOverlayLine, videoContainRect } from "./overlayGeometry";

it("aligns a 16:9 camera image in a taller fullscreen frame", () => {
  expect(videoContainRect(1080, 1920, 1280, 720)).toEqual({ x: 0, y: 656.25, width: 1080, height: 607.5 });
});

it("fills a frame with the same aspect ratio", () => {
  expect(videoContainRect(640, 360, 1280, 720)).toEqual({ x: 0, y: 0, width: 640, height: 360 });
});

it("limits visual guide movement while preserving its initial position", () => {
  const first = stabilizeOverlayLine(undefined, 0.5, 1000);
  const moved = stabilizeOverlayLine(first, 0.8, 1016);
  expect(first.y).toBe(0.5);
  expect(moved.y).toBeGreaterThan(0.5);
  expect(moved.y).toBeLessThan(0.51);
});
