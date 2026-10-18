import { useEffect, useRef } from "react";

import type { ParticipantSlot } from "../types/kneeCounter.types";

const SKELETON_EDGES: [number, number][] = [[5, 6], [5, 11], [6, 12], [11, 12], [11, 13], [13, 15], [12, 14], [14, 16]];

export function PoseOverlay({ slots, width, height }: { slots: ParticipantSlot[]; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    slots.forEach((slot) => {
      const pose = slot.pose;
      if (!pose) return;
      const color = slot.leftEvaluation === "PASS" || slot.rightEvaluation === "PASS" ? "#16A34A" : "#D71113";
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = 3;
      SKELETON_EDGES.forEach(([from, to]) => {
        const start = pose.keypoints[from];
        const end = pose.keypoints[to];
        if (!start || !end || start.score < 0.6 || end.score < 0.6) return;
        context.beginPath(); context.moveTo(start.x, start.y); context.lineTo(end.x, end.y); context.stroke();
      });
      pose.keypoints.forEach((point) => { if (point.score >= 0.6) { context.beginPath(); context.arc(point.x, point.y, 4, 0, Math.PI * 2); context.fill(); } });
      if (pose.boundingBox) {
        context.strokeRect(pose.boundingBox.xMin, pose.boundingBox.yMin, pose.boundingBox.xMax - pose.boundingBox.xMin, pose.boundingBox.yMax - pose.boundingBox.yMin);
        context.font = "600 16px Roboto, sans-serif";
        context.fillText(slot.label, pose.boundingBox.xMin, Math.max(18, pose.boundingBox.yMin - 8));
      }
    });
  }, [height, slots, width]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
