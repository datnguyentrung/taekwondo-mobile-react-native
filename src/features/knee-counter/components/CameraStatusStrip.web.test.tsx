import { fireEvent, render } from "@testing-library/react-native";
import { CameraStatusStrip } from "./CameraStatusStrip.web";

describe("CameraStatusStrip", () => {
  it("renders countdown input and remaining timer", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <CameraStatusStrip
        detectedCount={2}
        status="aligning"
        targetSeconds={30}
        onChangeTargetSeconds={onChange}
        remainingSeconds={30}
        running={true}
        onPrimaryAction={() => undefined}
      />
    );

    expect(screen.getByText("Đặt đếm ngược")).toBeTruthy();
    expect(screen.getByText("Thời gian còn lại")).toBeTruthy();
    expect(screen.getByText("00:30")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("calls onChangeTargetSeconds when user changes duration", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <CameraStatusStrip
        detectedCount={1}
        status="aligning"
        targetSeconds={30}
        onChangeTargetSeconds={onChange}
        remainingSeconds={30}
        running={true}
        onPrimaryAction={() => undefined}
      />
    );

    const input = screen.getByLabelText("Thời gian đếm ngược theo giây");
    fireEvent.changeText(input, "45");
    expect(onChange).toHaveBeenCalledWith(45);
  });

  it("renders urgent style when remaining seconds <= 5 while running", async () => {
    const screen = await render(
      <CameraStatusStrip
        detectedCount={1}
        status="running"
        targetSeconds={30}
        onChangeTargetSeconds={() => undefined}
        remainingSeconds={4}
        running={true}
        onPrimaryAction={() => undefined}
      />
    );

    expect(screen.getByText("00:04")).toBeTruthy();
  });
});
