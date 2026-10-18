import type { Evaluation, KneeEvaluation, Point } from "../types/kneeCounter.types";

export const MOVENET_KEYPOINT = {
  leftShoulder: 5,
  rightShoulder: 6,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
} as const;

function invalidPoint(point: Point | undefined, minScore: number) {
  return !point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.score < minScore;
}

export function checkKneeHeight(
  shoulder: Point | undefined,
  hip: Point | undefined,
  knee: Point | undefined,
  thresholdPercent: number,
  minScore: number,
): KneeEvaluation {
  const thresholdRatio = thresholdPercent / 100;
  if ([shoulder, hip, knee].some((point) => invalidPoint(point, minScore))) {
    return { evaluation: "UNKNOWN", ratio: null, thresholdRatio, confidence: 0 };
  }

  const torsoHeight = Math.abs((hip as Point).y - (shoulder as Point).y);
  if (torsoHeight < 1e-6) {
    return { evaluation: "UNKNOWN", ratio: null, thresholdRatio, confidence: 0 };
  }

  const ratio = ((hip as Point).y - (knee as Point).y) / torsoHeight;
  const evaluation: Evaluation = ratio >= thresholdRatio ? "PASS" : "FAIL";
  return {
    evaluation,
    ratio,
    thresholdRatio,
    confidence: Math.min((shoulder as Point).score, (hip as Point).score, (knee as Point).score),
  };
}

export function evaluateLeg(
  keypoints: Point[],
  leg: "left" | "right",
  thresholdPercent: number,
  minScore: number,
) {
  const shoulder = keypoints[leg === "left" ? MOVENET_KEYPOINT.leftShoulder : MOVENET_KEYPOINT.rightShoulder];
  const hip = keypoints[leg === "left" ? MOVENET_KEYPOINT.leftHip : MOVENET_KEYPOINT.rightHip];
  const knee = keypoints[leg === "left" ? MOVENET_KEYPOINT.leftKnee : MOVENET_KEYPOINT.rightKnee];
  const ankle = keypoints[leg === "left" ? MOVENET_KEYPOINT.leftAnkle : MOVENET_KEYPOINT.rightAnkle];
  if (invalidPoint(ankle, minScore)) return { ...checkKneeHeight(shoulder, hip, knee, thresholdPercent, minScore), ankleValid: false };
  return { ...checkKneeHeight(shoulder, hip, knee, thresholdPercent, minScore), ankleValid: true };
}
