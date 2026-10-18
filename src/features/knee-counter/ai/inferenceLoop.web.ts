export type FrameCallback = (timestamp: number) => void | Promise<void>;

export function startInferenceLoop(video: HTMLVideoElement, callback: FrameCallback) {
  let stopped = false;
  let running = false;
  let animationFrame = 0;
  let videoFrameCallback = 0;
  const videoWithCallback = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: (now: number) => void) => number; cancelVideoFrameCallback?: (handle: number) => void };

  const tick = (timestamp: number) => {
    if (stopped) return;
    if (running) return;
    running = true;
    Promise.resolve().then(() => callback(timestamp)).finally(() => {
      running = false;
      if (stopped) return;
      if (videoWithCallback.requestVideoFrameCallback) videoFrameCallback = videoWithCallback.requestVideoFrameCallback((now) => tick(now));
      else animationFrame = requestAnimationFrame((now) => tick(now));
    });
  };
  tick(performance.now());
  return () => {
    stopped = true;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (videoFrameCallback && videoWithCallback.cancelVideoFrameCallback) videoWithCallback.cancelVideoFrameCallback(videoFrameCallback);
  };
}
