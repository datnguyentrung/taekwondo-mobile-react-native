/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";

import CheckInScreen from "./CheckInScreen";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRequestPermission = jest.fn();
const mockHandlePermissionAction = jest.fn();
const mockRefreshPermission = jest.fn();
const mockUseCheckInCamera = jest.fn();
const mockUseContinuousFaceScan = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    router: {
      replace: (...args: unknown[]) => mockReplace(...args),
      back: (...args: unknown[]) => mockBack(...args),
      canGoBack: () => true,
    },
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useLayoutEffect(effect, [effect]);
    },
  };
});

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View: NativeView } = require("react-native");

  return {
    CameraView: (props: object) =>
      React.createElement(NativeView, {
        ...props,
        accessibilityLabel: "Camera preview",
      }),
  };
});

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 20, left: 0 }),
}));

jest.mock("../hooks/useCheckInCamera", () => ({
  useCheckInCamera: () => mockUseCheckInCamera(),
}));

jest.mock("../hooks/useContinuousFaceScan", () => ({
  useContinuousFaceScan: (enabled: boolean) =>
    mockUseContinuousFaceScan(enabled),
}));

jest.mock("../components/CheckInHeader", () => {
  const React = require("react");
  const { Pressable } = require("react-native");

  return {
    CheckInHeader: ({ onBack }: { onBack: () => void }) =>
      React.createElement(Pressable, {
        accessibilityLabel: "Check-in back",
        accessibilityRole: "button",
        onPress: onBack,
      }),
  };
});
jest.mock("../components/CheckInViewfinder", () => {
  const React = require("react");
  const { View: NativeView } = require("react-native");

  return {
    CheckInViewfinder: () =>
      React.createElement(NativeView, {
        accessibilityLabel: "Check-in viewfinder",
      }),
  };
});
jest.mock("../components/CheckInSideControls", () => {
  const React = require("react");
  const { View: NativeView } = require("react-native");

  return {
    CheckInSideControls: () =>
      React.createElement(NativeView, {
        accessibilityLabel: "Check-in controls",
      }),
  };
});
jest.mock("../components/CheckInResultSheet", () => ({
  CheckInResultSheet: () => null,
}));
jest.mock("../components/CheckInSessionHistorySheet", () => ({
  CheckInSessionHistorySheet: () => null,
}));

const scanState = {
  scanState: "scanning",
  currentResult: null,
  sessionHistory: [],
  isResultSheetVisible: false,
  isHistorySheetVisible: false,
  handleNextScan: jest.fn(),
  closeResultSheet: jest.fn(),
  openHistorySheet: jest.fn(),
  closeHistorySheet: jest.fn(),
};

function cameraState(overrides: Record<string, unknown> = {}) {
  return {
    requestPermission: mockRequestPermission,
    handlePermissionAction: mockHandlePermissionAction,
    refreshPermission: mockRefreshPermission,
    isPermissionLoading: false,
    isPermissionGranted: false,
    isPermissionDenied: true,
    isPermissionUndetermined: false,
    canAskAgain: true,
    isRequestingPermission: false,
    isPermissionActionPending: false,
    permissionError: null,
    facing: "front",
    torch: false,
    isTorchAvailable: false,
    toggleFacing: jest.fn(),
    toggleTorch: jest.fn(),
    ...overrides,
  };
}

describe("CheckInScreen camera permission flow", () => {
  let appStateListener: ((state: string) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPermission.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: "denied",
    });
    mockHandlePermissionAction.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      status: "denied",
    });
    mockRefreshPermission.mockResolvedValue(undefined);
    mockUseCheckInCamera.mockReturnValue(cameraState());
    mockUseContinuousFaceScan.mockReturnValue(scanState);
    jest.spyOn(AppState, "addEventListener").mockImplementation(
      (_type, listener) => {
        appStateListener = listener as (state: string) => void;
        return { remove: jest.fn() };
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("waits for the permission state without mounting camera or requesting access", async () => {
    mockUseCheckInCamera.mockReturnValue(
      cameraState({ isPermissionLoading: true }),
    );
    const screen = await render(<CheckInScreen />);

    expect(screen.queryByText("Cho phép sử dụng Camera")).toBeNull();
    expect(screen.queryByLabelText("Camera preview")).toBeNull();
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows the default permission copy while permission is undetermined", async () => {
    mockUseCheckInCamera.mockReturnValue(
      cameraState({
        isPermissionDenied: false,
        isPermissionUndetermined: true,
      }),
    );
    const screen = await render(<CheckInScreen />);

    expect(await screen.findByText("Cho phép sử dụng Camera")).toBeTruthy();
    expect(
      screen.getByText(
        "Camera được dùng để nhận diện khuôn mặt và điểm danh học viên/HLV.",
      ),
    ).toBeTruthy();
    expect(mockHandlePermissionAction).not.toHaveBeenCalled();
  });

  it("shows denied copy and runs the permission action when allowed", async () => {
    const screen = await render(<CheckInScreen />);

    expect(await screen.findByText("Cho phép sử dụng Camera")).toBeTruthy();
    expect(
      screen.getByText(
        "Bạn đã từ chối quyền Camera. Vui lòng cho phép để tiếp tục điểm danh.",
      ),
    ).toBeTruthy();
    expect(mockHandlePermissionAction).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Camera preview")).toBeNull();

    await fireEvent.press(screen.getByText("Cho phép"));

    await waitFor(() => {
      expect(mockHandlePermissionAction).toHaveBeenCalledTimes(1);
    });
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByText("Cho phép sử dụng Camera")).toBeTruthy();
    expect(screen.queryByLabelText("Camera preview")).toBeNull();
  });

  it("returns to Home only when the user chooses Later", async () => {
    const screen = await render(<CheckInScreen />);

    await fireEvent.press(await screen.findByText("Để sau"));
    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("uses the redirect action when the OS cannot ask again", async () => {
    mockUseCheckInCamera.mockReturnValue(cameraState({ canAskAgain: false }));
    const screen = await render(<CheckInScreen />);

    expect(
      await screen.findByText(
        "Thiết bị không cho hỏi lại quyền Camera. Vui lòng bật quyền trong phần Cài đặt của hệ thống.",
      ),
    ).toBeTruthy();
    await fireEvent.press(await screen.findByText("Chuyển hướng"));
    await waitFor(() =>
      expect(mockHandlePermissionAction).toHaveBeenCalledTimes(1),
    );
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => appStateListener?.("active"));
    expect(mockRefreshPermission).toHaveBeenCalledTimes(2);
  });

  it("mounts the camera only with permission and starts scanning after ready", async () => {
    mockUseCheckInCamera.mockReturnValue(
      cameraState({ isPermissionGranted: true }),
    );
    const screen = await render(<CheckInScreen />);

    const camera = await screen.findByLabelText("Camera preview");
    expect(screen.queryByText("Cho phép sử dụng Camera")).toBeNull();
    expect(mockUseContinuousFaceScan).toHaveBeenLastCalledWith(false);

    await act(async () => camera.props.onCameraReady());

    await waitFor(() => {
      expect(mockUseContinuousFaceScan).toHaveBeenLastCalledWith(true);
    });
    expect(screen.getByLabelText("Check-in viewfinder")).toBeTruthy();
  });

  it("routes back from the header through the screen policy", async () => {
    const screen = await render(<CheckInScreen />);

    await fireEvent.press(await screen.findByLabelText("Check-in back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
