export type ComputeBackend = "webgl" | "webgpu" | "wasm";
export type BackendPreference = "auto" | ComputeBackend;
export type SessionStatus = "idle" | "opening-camera" | "loading-model" | "benchmarking" | "aligning" | "countdown" | "running" | "paused" | "stopped" | "error";
export type CounterMode = "individual" | "current-group-pass" | "synchronized-group";
export type Leg = "left" | "right";
export type LegPhase = "NEEDS_DOWN" | "READY" | "ABOVE";
export type LaneStatus = "EMPTY" | "ALIGNING" | "READY" | "ACTIVE" | "MISSING" | "CONFLICT";

export type Point = { x: number; y: number; score: number; name?: string };
export type BoundingBox = { xMin: number; yMin: number; xMax: number; yMax: number };
export type NormalizedPoint = Point;
export type NormalizedPose = { detectorTrackId: string | null; poseScore: number; detectedAtMs: number; boundingBox: BoundingBox | null; keypoints: NormalizedPoint[] };
/** UI-facing pose; all positions use normalized coordinates (0..1). */
export type PersonPose = NormalizedPose & { trackId: string | null; centerX: number | null; normalizedBoundingBox?: BoundingBox | null };
export type LaneDefinition = { laneId: string; label: string; index: number; left: number; right: number; centerX: number };
export type KneeSignalReason = "VALID" | "POSE_LOW_CONFIDENCE" | "SHOULDER_LOW_CONFIDENCE" | "HIP_LOW_CONFIDENCE" | "KNEE_LOW_CONFIDENCE" | "TORSO_TOO_SMALL" | "MISSING_FRAME";
export type KneeSignal = { valid: boolean; leg: Leg; ratio: number | null; enterThreshold: number; exitThreshold: number; confidence: number; timestampMs: number; reason: KneeSignalReason };
export type LegCounterState = { phase: LegPhase; reps: number; lastValidAtMs: number | null; lastRepAtMs: number | null; crossedAtMs: number | null; peakRatio: number | null; peakConfidence: number; droppedSamples: number; sequence: number };
export type ParticipantSlot = { participantId: string; label: string; slotIndex: number; laneId: string; status: LaneStatus; trackId: string | null; pose: PersonPose | null; leftReps: number; rightReps: number; leftPhase: LegPhase; rightPhase: LegPhase; leftRatio: number | null; rightRatio: number | null; confidence: number | null; stableFrames: number; lastSeenAtMs: number | null };
export type RepEvent = { id: string; sessionStartedAt: string; laneId: string; participantId: string; detectorTrackId: string | null; leg: Leg; crossedAtMs: number; completedAtMs: number; peakRatio: number; confidence: number; thresholdPercent: number; backend: ComputeBackend | null; inputSize: 320 | 384 | null; engine: "movenet-multipose-lightning"; result: "CONFIRMED" };
export type RuntimeMetrics = { cameraFps: number | null; inferenceFps: number | null; averageLatencyMs: number | null; p50LatencyMs: number | null; p95LatencyMs: number | null; processedFrames: number; droppedFrames: number; invalidSignalRate: number | null; idSwitches: number; laneConflicts: number };
export type SessionMetrics = RuntimeMetrics;
export type KneeCounterSessionConfig = { participantCount: 2 | 3 | 4 | 5 | 6; thresholdPercent: number; minPoseScore: number; minKeypointScore: number; hysteresisRatio: number; minRepIntervalMs: number; maxSignalGapMs: number; laneMissingMs: number; readyStableFrames: number; synchronizedWindowMs: number; backendPreference: BackendPreference; mode: CounterMode; flipHorizontal: boolean };
export type ComputeCapabilities = { webglSupported: boolean; webgpuSupported: boolean; webgpuAdapterAvailable: boolean; gpuVendor: string | null; gpuRenderer: string | null; cudaStatus: "NOT_DETECTABLE_IN_BROWSER"; hardwareAccelerationVerified: boolean | null; selectedBackend: ComputeBackend | null; inferenceFps: number | null; p50LatencyMs: number | null; p95LatencyMs: number | null; modelInputSize: 320 | 384 | null; runtime: "worker" | "main-thread" | null };
