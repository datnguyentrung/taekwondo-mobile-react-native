import { useEffect, useRef, useState } from "react";

import { legKneeReference, MOVENET_KEYPOINT } from "../domain/kneeSignal";
import type { BoundingBox, KneeCounterSessionConfig, NormalizedPoint, ParticipantSlot } from "../types/kneeCounter.types";
import { stabilizeOverlayLine, videoContainRect } from "./overlayGeometry";

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
  config,
  mirrored,
}: {
  slots: ParticipantSlot[];
  width: number;
  height: number;
  config: KneeCounterSessionConfig;
  mirrored: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointsRef = useRef(new Map<string, { point: NormalizedPoint; seenAt: number }>());
  const guideLinesRef = useRef(new Map<string, { y: number; updatedAtMs: number }>());
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setSize({ width: canvas.clientWidth, height: canvas.clientHeight }));
    observer.observe(canvas);
    setSize({ width: canvas.clientWidth, height: canvas.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasWidth = size.width || width;
    const canvasHeight = size.height || height;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const image = videoContainRect(canvasWidth, canvasHeight, width, height);
    const { width: imageWidth, height: imageHeight, x: offsetX, y: offsetY } = image;

    const toX = (x: number) => offsetX + (mirrored ? 1 - x : x) * imageWidth;
    const toY = (y: number) => offsetY + y * imageHeight;
    const dotRadius = Math.max(7, Math.round(Math.min(imageWidth, imageHeight) * 0.012));

    slots.forEach((slot) => {
      const pose = slot.pose;
      if (!pose) return;
      const visiblePoints = pose.keypoints.filter(isVisible);
      const bounds = pose.boundingBox ?? fallbackBounds(visiblePoints);
      const hips = [pose.keypoints[MOVENET_KEYPOINT.leftHip], pose.keypoints[MOVENET_KEYPOINT.rightHip]].filter(isVisible);

      const references = (["left", "right"] as const)
        .map((leg) => legKneeReference(pose, leg, config))
        .filter((reference): reference is { hip: NormalizedPoint; shoulder: NormalizedPoint | null; torsoHeight: number } =>
          reference.hip !== null && reference.torsoHeight !== null && reference.torsoHeight >= 0.05,
        );
      if (references.length) {
        // This is UI-only: the counter retains two independent leg thresholds.
        const targetY = references.reduce(
          (sum, reference) => sum + reference.hip.y - (config.thresholdPercent / 100) * reference.torsoHeight,
          0,
        ) / references.length;
        const guide = stabilizeOverlayLine(guideLinesRef.current.get(slot.participantId), targetY, performance.now());
        guideLinesRef.current.set(slot.participantId, guide);
        const horizontalPoints = [...hips, ...TARGET_KEYPOINTS.map((index) => pose.keypoints[index]).filter(isVisible)];
        if (horizontalPoints.length) {
        const xMin = Math.max(0, Math.min(...horizontalPoints.map((point) => point.x)) - 0.08);
        const xMax = Math.min(1, Math.max(...horizontalPoints.map((point) => point.x)) + 0.08);
        const x1 = toX(xMin);
        const x2 = toX(xMax);
        const y = toY(Math.max(0, Math.min(1, guide.y)));

        context.lineCap = "round";
        context.strokeStyle = "rgba(255, 255, 255, 0.96)";
        context.lineWidth = 10;
        context.beginPath(); context.moveTo(Math.min(x1, x2), y); context.lineTo(Math.max(x1, x2), y); context.stroke();
        context.strokeStyle = "#111111";
        context.lineWidth = 5;
        context.beginPath(); context.moveTo(Math.min(x1, x2), y); context.lineTo(Math.max(x1, x2), y); context.stroke();
        }
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
      const headCenterX = (x1 + x2) / 2;
      const fontSize = Math.max(72, Math.min(96, Math.round(Math.min(imageWidth, imageHeight) * 0.1)));
      const labelY = Math.max(fontSize + 8, toY(bounds.yMin) - 16);
      const count = String(slot.leftReps + slot.rightReps);
      const digitColors = ["#FACC15", "#38BDF8", "#4ADE80", "#FB923C", "#E879F9", "#34D399"];
      const digitColor = digitColors[slot.slotIndex % digitColors.length];

      context.font = `900 ${fontSize}px Roboto, system-ui, sans-serif`;
      context.textAlign = "center";
      context.lineJoin = "round";
      context.miterLimit = 2;
      context.strokeStyle = "#000000";
      context.lineWidth = 12;
      context.strokeText(count, headCenterX, labelY);
      context.fillStyle = digitColor;
      context.fillText(count, headCenterX, labelY);
    });
  }, [config, height, mirrored, size, slots, width]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
