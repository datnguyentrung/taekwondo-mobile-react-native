import type * as PoseDetection from "@tensorflow-models/pose-detection";

import { inputSizeForProfile } from "../config/kneeCounterConfig";
import type { ComputeBackend, KneeCounterProfile, PersonPose } from "../types/kneeCounter.types";
import { initializeBackend } from "./backendSelector.web";

export async function createMoveNetDetector(backend: ComputeBackend, profile: KneeCounterProfile) {
  const tf = await initializeBackend(backend);
  const poseDetection = await import("@tensorflow-models/pose-detection");
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
    enableTracking: true,
    enableSmoothing: true,
    trackerType: poseDetection.TrackerType.BoundingBox,
    multiPoseMaxDimension: inputSizeForProfile(profile),
    minPoseScore: 0.25,
  });
  return { detector, tf };
}

export async function estimatePersonPoses(detector: PoseDetection.PoseDetector, video: HTMLVideoElement, timestamp: number): Promise<PersonPose[]> {
  const poses = await detector.estimatePoses(video, { flipHorizontal: false });
  return poses.map((pose) => {
    const keypoints = pose.keypoints.map((point) => ({ x: point.x, y: point.y, score: point.score ?? 0 }));
    const box = pose.box;
    return {
      trackId: pose.id ?? null,
      detectedAtMs: timestamp,
      poseScore: pose.score ?? 0,
      keypoints,
      boundingBox: box ? { xMin: box.xMin, yMin: box.yMin, xMax: box.xMax, yMax: box.yMax } : null,
      centerX: box ? (box.xMin + box.xMax) / 2 : null,
    };
  });
}
