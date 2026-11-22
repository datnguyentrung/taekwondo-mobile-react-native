/* eslint-disable @typescript-eslint/no-require-imports, import/first */
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  return {
    __esModule: true,
    default: { View: RN.View },
    Extrapolation: { CLAMP: "clamp" },
    ReduceMotion: { System: "system" },
    interpolate: () => 1,
    useAnimatedStyle: (factory: () => object) => factory(),
    useReducedMotion: () => false,
    useSharedValue: (initial: number) => ({
      value: initial,
      get() {
        return this.value;
      },
      set(next: number) {
        this.value = next;
      },
    }),
    withSpring: (value: number, _config: object, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return value;
    },
  };
});

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
}));

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const pan = {
    activeOffsetX: () => pan,
    failOffsetY: () => pan,
    onStart: () => pan,
    onUpdate: () => pan,
    onEnd: () => pan,
  };
  return {
    Gesture: { Pan: () => pan },
    GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
}));

import SideDrawerWindow from "./SideDrawerWindow";

describe("SideDrawerWindow", () => {
  it("does not render drawer content while hidden", async () => {
    const screen = await render(
      <SideDrawerWindow visible={false} title="Thiết lập" onClose={jest.fn()}>
        <Text>Nội dung drawer</Text>
      </SideDrawerWindow>,
    );

    expect(screen.queryByText("Nội dung drawer")).toBeNull();
  });

  it("renders title and children while visible", async () => {
    const screen = await render(
      <SideDrawerWindow visible title="Thiết lập" onClose={jest.fn()}>
        <Text>Nội dung drawer</Text>
      </SideDrawerWindow>,
    );

    expect(screen.getByText("Thiết lập")).toBeTruthy();
    expect(screen.getByText("Nội dung drawer")).toBeTruthy();
  });

  it("closes from the close button", async () => {
    const onClose = jest.fn();
    const screen = await render(
      <SideDrawerWindow visible title="Thiết lập" onClose={onClose}>
        <Text>Nội dung drawer</Text>
      </SideDrawerWindow>,
    );

    fireEvent.press(screen.getByLabelText("Đóng"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("can render non-scrollable content", async () => {
    const screen = await render(
      <SideDrawerWindow visible title="Thiết lập" scrollEnabled={false} onClose={jest.fn()}>
        <Text>Nội dung drawer</Text>
      </SideDrawerWindow>,
    );

    expect(screen.getByTestId("side-drawer-fixed-content")).toBeTruthy();
    expect(screen.queryByTestId("side-drawer-scroll-content")).toBeNull();
  });
});
