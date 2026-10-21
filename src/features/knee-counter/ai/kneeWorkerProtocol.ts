import type { BackendPreference, ComputeBackend, KneeCounterSessionConfig, KneeTraceSample, ParticipantSlot, RepEvent, RuntimeMetrics } from "../types/kneeCounter.types";

export type FramePurpose = "benchmark" | "preview" | "count";
export type KneeWorkerRequest =
  | {
      type: "init";
      sessionId: string;
      sessionStartedAt: string;
      config: KneeCounterSessionConfig;
      backendPreference: BackendPreference;
      capabilities?: { webglSupported: boolean; webgpuAdapterAvailable: boolean };
    }
  | { type: "frame"; frame: ImageBitmap; timestampMs: number; width: number; height: number; purpose: FramePurpose }
  | { type: "update-config"; config: KneeCounterSessionConfig }
  | { type: "pause" } | { type: "resume" } | { type: "reset"; sessionId: string; sessionStartedAt: string } | { type: "reset-pending-cycle" } | { type: "dispose" };
export type KneeWorkerResponse =
  | { type: "detector-ready"; backend: ComputeBackend; inputSize: 320 | 384 | 448; fallbackToCpu?: boolean }
  | { type: "runtime-ready"; backend: ComputeBackend; inputSize: 320 | 384 | 448; metrics: RuntimeMetrics; fallbackToCpu?: boolean }
  | { type: "frame-result"; timestampMs: number; lanes: ParticipantSlot[]; events: RepEvent[]; metrics: RuntimeMetrics; trace?: KneeTraceSample[] }
  | { type: "frame-complete" } | { type: "error"; code: string; message: string };
