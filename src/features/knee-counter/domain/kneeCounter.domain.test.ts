import { checkKneeHeight } from "./kneeGeometry";
import { exportRepEventsCsv, isSynchronizedGroup } from "./groupEvaluator";
import { advanceLegState, initialLegCounterState } from "./motionStateMachine";

const point = (x: number, y: number, score = 0.9) => ({ x, y, score });
const baseArgs = {
  leg: "left" as const,
  participantId: "participant-1",
  trackId: 7,
  sessionStartedAt: "2026-10-18T00:00:00.000Z",
  thresholdPercent: 0,
  profile: "balanced" as const,
  backend: "webgl" as const,
  ratio: 0.2,
  result: "CONFIRMED" as const,
  config: { minStableFrames: 2, minHoldMs: 50, minRepIntervalMs: 150, hysteresisRatio: 0.1 },
};

describe("knee counter domain", () => {
  it("returns PASS, FAIL and UNKNOWN from normalized knee height", () => {
    expect(checkKneeHeight(point(0, 0), point(0, 100), point(0, 90), 0, 0.6).evaluation).toBe("PASS");
    expect(checkKneeHeight(point(0, 0), point(0, 100), point(0, 110), 0, 0.6).evaluation).toBe("FAIL");
    expect(checkKneeHeight(point(0, 0), point(0, 100), point(0, 90, 0.2), 0, 0.6).evaluation).toBe("UNKNOWN");
  });

  it("counts one confirmed rep and waits for the knee to come down", () => {
    let state = initialLegCounterState();
    state = advanceLegState(state, { evaluation: "FAIL", ratio: -0.2, thresholdRatio: 0, confidence: 0.9 }, 0, baseArgs.leg, baseArgs.participantId, baseArgs.trackId, baseArgs.sessionStartedAt, baseArgs.thresholdPercent, baseArgs.profile, baseArgs.backend, baseArgs.config).state;
    state = advanceLegState(state, { evaluation: "PASS", ratio: 0.2, thresholdRatio: 0, confidence: 0.9 }, 10, baseArgs.leg, baseArgs.participantId, baseArgs.trackId, baseArgs.sessionStartedAt, baseArgs.thresholdPercent, baseArgs.profile, baseArgs.backend, baseArgs.config).state;
    const confirmed = advanceLegState(state, { evaluation: "PASS", ratio: 0.2, thresholdRatio: 0, confidence: 0.9 }, 70, baseArgs.leg, baseArgs.participantId, baseArgs.trackId, baseArgs.sessionStartedAt, baseArgs.thresholdPercent, baseArgs.profile, baseArgs.backend, baseArgs.config);
    expect(confirmed.event?.leg).toBe("left");
    expect(confirmed.state.reps).toBe(1);
    const held = advanceLegState(confirmed.state, { evaluation: "PASS", ratio: 0.2, thresholdRatio: 0, confidence: 0.9 }, 200, baseArgs.leg, baseArgs.participantId, baseArgs.trackId, baseArgs.sessionStartedAt, baseArgs.thresholdPercent, baseArgs.profile, baseArgs.backend, baseArgs.config);
    expect(held.event).toBeUndefined();
  });

  it("recognizes synchronized participants within the configured window", () => {
    const events = [
      { ...baseArgs, detectedAtMs: 1000, result: "CONFIRMED" as const },
      { ...baseArgs, participantId: "participant-2", detectedAtMs: 1200, result: "CONFIRMED" as const },
    ];
    expect(isSynchronizedGroup(events, ["participant-1", "participant-2"], 1300, 300, "left")).toBe(true);
    expect(isSynchronizedGroup(events, ["participant-1", "participant-2"], 1501, 300, "left")).toBe(false);
  });

  it("exports a local CSV without backend data", () => {
    const csv = exportRepEventsCsv([{ ...baseArgs, detectedAtMs: 100, ratio: 0.2 }]);
    expect(csv).toContain("participantId");
    expect(csv).toContain("participant-1");
    expect(csv).toContain("CONFIRMED");
  });
});
