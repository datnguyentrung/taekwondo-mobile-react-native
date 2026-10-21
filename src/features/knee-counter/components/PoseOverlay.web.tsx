import { useEffect, useRef } from "react";

import { MOVENET_KEYPOINT } from "../domain/kneeSignal";
import type { BoundingBox, NormalizedPoint, ParticipantSlot } from "../types/kneeCounter.types";

const TARGET_KEYPOINTS = [
  MOVENET_KEYPOINT.leftHip,
  MOVENET_KEYPOINT.rightHip,
  MOVENET_KEYPOINT.leftKnee,
  MOVENET_KEYPOINT.rightKnee,
] as const;

const isVisible = (point: NormalizedPoint | undefined): point is NormalizedPoint =>
  Boolean(point && point.score >= 0.10);

function fallbackBounds(points: NormalizedPoint[]): BoundingBox | null {
  if (!points.length) return null;
  return {
    xMin: Math.min(...points.map((point) => point.x)),
    yMin: Math.min(...points.map((point) => point.y)),
    xMax: Math.max(...points.map((point) => point.x)),
    yMax: Math.max(...points.map((point) => point.y)),
  };
}

export function PoseOverlay({
  slots,
  width,
  height,
  thresholdPercent,
  mirrored,
}: {
  slots: ParticipantSlot[];
  width: number;
  height: number;
  thresholdPercent: number;
  mirrored: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointsRef = useRef(new Map<string, { point: NormalizedPoint; seenAt: number }>());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);

    const toX = (x: number) => (mirrored ? 1 - x : x) * width;
    const toY = (y: number) => y * height;
    const dotRadius = Math.max(7, Math.round(Math.min(width, height) * 0.012));

    slots.forEach((slot) => {
      const pose = slot.pose;
      if (!pose) return;
      const visiblePoints = pose.keypoints.filter(isVisible);
      const bounds = pose.boundingBox ?? fallbackBounds(visiblePoints);
      const leftShoulder = pose.keypoints[MOVENET_KEYPOINT.leftShoulder];
      const rightShoulder = pose.keypoints[MOVENET_KEYPOINT.rightShoulder];
      const leftHip = pose.keypoints[MOVENET_KEYPOINT.leftHip];
      const rightHip = pose.keypoints[MOVENET_KEYPOINT.rightHip];
      const hips = [leftHip, rightHip].filter(isVisible);

      // The threshold is the exact kneeY used by calculateKneeSignal:
      // kneeY = hipY - thresholdPercent * torsoHeight. At 0%, it is hip height.
      if (hips.length) {
        const hipY = hips.reduce((sum, point) => sum + point.y, 0) / hips.length;
        const torsoLengths = [
          isVisible(leftShoulder) && isVisible(leftHip) ? Math.hypot(leftShoulder.x - leftHip.x, leftShoulder.y - leftHip.y) : null,
          isVisible(rightShoulder) && isVisible(rightHip) ? Math.hypot(rightShoulder.x - rightHip.x, rightShoulder.y - rightHip.y) : null,
        ].filter((value): value is number => value !== null);
        const torsoHeight = torsoLengths.length
          ? torsoLengths.reduce((sum, value) => sum + value, 0) / torsoLengths.length
          : Math.max(0.05, (bounds?.yMax ?? hipY + 0.25) - (bounds?.yMin ?? hipY - 0.25));
        const kneeY = hipY - (thresholdPercent / 100) * torsoHeight;
        const horizontalPoints = [...hips, ...TARGET_KEYPOINTS
          .map((index) => pose.keypoints[index])
          .filter(isVisible)];
        const xMin = Math.max(0, Math.min(...horizontalPoints.map((point) => point.x)) - 0.08);
        const xMax = Math.min(1, Math.max(...horizontalPoints.map((point) => point.x)) + 0.08);
        const x1 = toX(xMin);
        const x2 = toX(xMax);
        const y = toY(Math.max(0, Math.min(1, kneeY)));

        context.lineCap = "round";
        context.strokeStyle = "rgba(255, 255, 255, 0.96)";
        context.lineWidth = 10;
        context.beginPath(); context.moveTo(Math.min(x1, x2), y); context.lineTo(Math.max(x1, x2), y); context.stroke();
        context.strokeStyle = "#111111";
        context.lineWidth = 5;
        context.beginPath(); context.moveTo(Math.min(x1, x2), y); context.lineTo(Math.max(x1, x2), y); context.stroke();
      }

      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 3;
      TARGET_KEYPOINTS.forEach((index) => {
        const point = pose.keypoints[index];
        const key = `${slot.participantId}:${index}`;
        const visible = point && point.score >= .25;
        if (!visible) {
          const last = lastPointsRef.current.get(key);
          if (!last || performance.now() - last.seenAt > 180) return;
          context.globalAlpha = .35;
          context.fillStyle = "#6B7280";
          context.beginPath(); context.arc(toX(last.point.x), toY(last.point.y), dotRadius, 0, Math.PI * 2); context.fill(); context.stroke(); context.globalAlpha = 1;
          return;
        }
        lastPointsRef.current.set(key, { point, seenAt: performance.now() });
        context.fillStyle = point.score >= .45 ? "#EF1B23" : "#F59E0B";
        context.beginPath();
        context.arc(toX(point.x), toY(point.y), dotRadius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      });

      if (!bounds) return;
      const x1 = toX(bounds.xMin);
      const x2 = toX(bounds.xMax);
      const labelX = mirrored ? Math.min(x1, x2) - 12 : Math.max(x1, x2) + 12;
      const labelY = Math.max(52, toY(bounds.yMin) + 44);
      context.fillStyle = "#FFFFFF";
      context.strokeStyle = "#111111";
      context.lineWidth = 6;
      context.font = "800 52px system-ui, sans-serif";
      context.textAlign = mirrored ? "right" : "left";
      const count = String(slot.leftReps + slot.rightReps);
      context.strokeText(count, labelX, labelY);
      context.fillText(count, labelX, labelY);
    });
  }, [height, mirrored, slots, thresholdPercent, width]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
