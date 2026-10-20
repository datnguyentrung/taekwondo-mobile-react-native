import type * as PoseDetection from "@tensorflow-models/pose-detection";
import type { ComputeBackend, KneeCounterSessionConfig, NormalizedPose } from "../types/kneeCounter.types";
import { initializeBackend } from "./backendSelector.web";

export type MoveNetRuntime = { backend: ComputeBackend; inputSize: 320 | 384; estimate: (input: HTMLVideoElement | ImageBitmap, timestampMs: number, width: number, height: number, maxPoses: number) => Promise<NormalizedPose[]>; dispose: () => void };
export async function createMoveNetRuntime(backend: ComputeBackend, inputSize: 320 | 384, _config: KneeCounterSessionConfig): Promise<MoveNetRuntime> {
  await initializeBackend(backend); const poseDetection = await import("@tensorflow-models/pose-detection");
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING, enableTracking: true, enableSmoothing: true, trackerType: poseDetection.TrackerType.BoundingBox, multiPoseMaxDimension: inputSize, minPoseScore: .25 });
  return { backend, inputSize, dispose: () => detector.dispose(), estimate: async (input, detectedAtMs, width, height, maxPoses) => {
    const poses = await detector.estimatePoses(input as unknown as HTMLVideoElement, { maxPoses, flipHorizontal: false });
    return poses.map((pose) => ({ detectorTrackId: pose.id == null ? null : String(pose.id), poseScore: pose.score ?? 0, detectedAtMs, keypoints: pose.keypoints.map((point) => ({ x: Math.max(0, Math.min(1, point.x / Math.max(1, width))), y: Math.max(0, Math.min(1, point.y / Math.max(1, height))), score: point.score ?? 0, name: point.name })), boundingBox: pose.box ? { xMin: pose.box.xMin / width, yMin: pose.box.yMin / height, xMax: pose.box.xMax / width, yMax: pose.box.yMax / height } : null }));
  }};
}
