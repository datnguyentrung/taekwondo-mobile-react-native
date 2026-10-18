export type ComputeBackend = "webgl" | "webgpu" | "wasm";
export type BackendPreference = "auto" | ComputeBackend;
export type SessionStatus = "idle" | "starting" | "running" | "paused" | "stopped" | "error";
export type CounterMode = "individual" | "current-group-pass" | "synchronized-group";
export type Leg = "left" | "right";
export type Evaluation = "PASS" | "FAIL" | "UNKNOWN";
export type LegPhase = "WAITING" | "READY" | "UP_CANDIDATE" | "WAIT_DOWN" | "UNKNOWN";

export type Point = { x: number; y: number; score: number };

export type PersonPose = {
  trackId: number | null;
  detectedAtMs: number;
  poseScore: number;
  keypoints: Point[];
  boundingBox: { xMin: number; yMin: number; xMax: number; yMax: number } | null;
  centerX: number | null;
};

export type ParticipantSlot = {
  participantId: string;
  label: string;
  slotIndex: number;
  trackId: number | null;
  pose: PersonPose | null;
  leftEvaluation: Evaluation;
  rightEvaluation: Evaluation;
  leftReps: number;
  rightReps: number;
  lastEventAtMs: number | null;
};

export type KneeEvaluation = {
  evaluation: Evaluation;
  ratio: number | null;
  thresholdRatio: number;
  confidence: number;
};

export type LegCounterState = {
  phase: LegPhase;
  candidateFrames: number;
  candidateStartedAtMs: number | null;
  lastRepAtMs: number | null;
  reps: number;
};

export type RepEvent = {
  sessionStartedAt: string;
  detectedAtMs: number;
  participantId: string;
  trackId: number | null;
  leg: Leg;
  ratio: number | null;
  thresholdPercent: number;
  backend: ComputeBackend | null;
  profile: KneeCounterProfile;
  result: "CONFIRMED";
};

export type SessionMetrics = {
  cameraFps: number | null;
  inferenceFps: number | null;
  averageLatencyMs: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  detectionCompleteness: number | null;
  idSwitches: number;
};

export type KneeCounterProfile = "performance" | "balanced" | "quality";

export type KneeCounterSessionConfig = {
  maxPeople: number;
  participantCount: number;
  thresholdPercent: number;
  minKeypointScore: number;
  minStableFrames: number;
  minHoldMs: number;
  minRepIntervalMs: number;
  hysteresisRatio: number;
  lostTrackGraceMs: number;
  synchronizedWindowMs: number;
  backendPreference: BackendPreference;
  profile: KneeCounterProfile;
  mode: CounterMode;
};

export type ComputeCapabilities = {
  webglSupported: boolean;
  webgpuSupported: boolean;
  webgpuAdapterAvailable: boolean;
  gpuVendor: string | null;
  gpuRenderer: string | null;
  cudaStatus: "NOT_DETECTABLE_IN_BROWSER";
  hardwareAccelerationVerified: boolean | null;
  selectedBackend: ComputeBackend | null;
  inferenceFps: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  modelInputSize: number | null;
};
