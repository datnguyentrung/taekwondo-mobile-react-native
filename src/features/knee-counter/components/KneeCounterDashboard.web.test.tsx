import { fireEvent, render } from "@testing-library/react-native";
import { KneeCounterDashboard } from "./KneeCounterDashboard.web";
import type { ParticipantSlot } from "../types/kneeCounter.types";

const slots: ParticipantSlot[] = Array.from({ length: 6 }, (_, index) => ({ participantId: `participant-${index + 1}`, label: `VĐV ${index + 1}`, slotIndex: index, trackId: index < 2 ? index + 1 : null, pose: null, leftEvaluation: "UNKNOWN", rightEvaluation: "UNKNOWN", leftReps: index, rightReps: index + 1, lastEventAtMs: null }));

describe("KneeCounterDashboard", () => {
  it("renders all six participant slots and preserves actions", async () => {
    const onReset = jest.fn();
    const onExport = jest.fn();
    const screen = await render(<KneeCounterDashboard slots={slots} detectedCount={2} passCount={1} groupPassCount={0} synchronizedGroupPass={false} mode="individual" status="running" onReset={onReset} onExport={onExport} />);
    expect(screen.getAllByText(/VĐV/)).toHaveLength(6);
    fireEvent.press(screen.getByLabelText("Đặt lại bộ đếm"));
    fireEvent.press(screen.getByLabelText("Xuất CSV"));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
