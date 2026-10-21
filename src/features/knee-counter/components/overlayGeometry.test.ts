import { videoContainRect } from "./overlayGeometry";

it("aligns a 16:9 camera image in a taller fullscreen frame", () => {
  expect(videoContainRect(1080, 1920, 1280, 720)).toEqual({ x: 0, y: 656.25, width: 1080, height: 607.5 });
});

it("fills a frame with the same aspect ratio", () => {
  expect(videoContainRect(640, 360, 1280, 720)).toEqual({ x: 0, y: 0, width: 640, height: 360 });
});
