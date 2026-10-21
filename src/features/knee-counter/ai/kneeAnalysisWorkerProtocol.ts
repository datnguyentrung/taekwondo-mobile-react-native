import type {
  ComputeBackend,
  KneeCounterSessionConfig,
  KneeTraceSample,
  NormalizedPose,
  ParticipantSlot,
  RepEvent,
  RuntimeMetrics,
} from "../types/kneeCounter.types";
import type { FramePurpose } from "./kneeWorkerProtocol";

export type AnalysisFrame = {
  frameId: number;
  timestampMs: number;
  captureTimestampMs: number;
  mediaTime: number | null;
  purpose: FramePurpose;
  poses: NormalizedPose[];
  backend: ComputeBackend;
  inputSize: 320 | 384 | 448;
  metrics: RuntimeMetrics;
};

export type KneeAnalysisWorkerRequest =
  | { type: "init"; sessionId: string; sessionStartedAt: string; config: KneeCounterSessionConfig }
  | { type: "poses"; frame: AnalysisFrame }
  | { type: "update-config"; config: KneeCounterSessionConfig }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset"; sessionId: string; sessionStartedAt: string }
  | { type: "reset-pending-cycle" }
  | { type: "dispose" };

export type KneeAnalysisWorkerResponse =
  | { type: "analysis-ready" }
  | { type: "frame-result"; frameId: number; timestampMs: number; lanes: ParticipantSlot[]; events: RepEvent[]; metrics: RuntimeMetrics; trace: KneeTraceSample[] }
  | { type: "error"; code: string; message: string };
