import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { FloatingActionBar } from "./FloatingActionBar";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 16, left: 0, right: 0, top: 0 }),
}));

describe("FloatingActionBar", () => {
  it("renders 1 action properly and triggers onPress", async () => {
    const handlePress = jest.fn();
    const screen = await render(
      <FloatingActionBar
        actions={[
          {
            label: "Xác nhận đăng ký",
            onPress: handlePress,
            variant: "primary",
          },
        ]}
      />,
    );

    const button = screen.getByRole("button");
    expect(screen.getByText("Xác nhận đăng ký")).toBeTruthy();

    await fireEvent.press(button);
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("renders 2 actions (outline and primary) side by side", async () => {
    const handleEdit = jest.fn();
    const handleRegister = jest.fn();

    const screen = await render(
      <FloatingActionBar
        actions={[
          {
            label: "Chỉnh sửa",
            accessibilityLabel: "Chỉnh sửa khóa học",
            variant: "outline",
            onPress: handleEdit,
          },
          {
            label: "Đăng ký học viên",
            accessibilityLabel: "Đăng ký học viên",
            variant: "primary",
            onPress: handleRegister,
          },
        ]}
      />,
    );

    const editBtn = screen.getByLabelText("Chỉnh sửa khóa học");
    const registerBtn = screen.getByLabelText("Đăng ký học viên");

    expect(screen.getByText("Chỉnh sửa")).toBeTruthy();
    expect(screen.getByText("Đăng ký học viên")).toBeTruthy();

    await fireEvent.press(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);

    await fireEvent.press(registerBtn);
    expect(handleRegister).toHaveBeenCalledTimes(1);
  });

  it("renders 3 actions with compact layout", async () => {
    const screen = await render(
      <FloatingActionBar
        actions={[
          { label: "Hủy", variant: "ghost" },
          { label: "Lưu nháp", variant: "outline" },
          { label: "Xuất bản", variant: "primary" },
        ]}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByText("Hủy")).toBeTruthy();
    expect(screen.getByText("Lưu nháp")).toBeTruthy();
    expect(screen.getByText("Xuất bản")).toBeTruthy();
  });

  it("disables button when disabled is true", async () => {
    const handlePress = jest.fn();
    const screen = await render(
      <FloatingActionBar
        actions={[
          {
            label: "Lưu",
            accessibilityLabel: "Lưu thay đổi",
            disabled: true,
            onPress: handlePress,
          },
        ]}
      />,
    );

    const button = screen.getByLabelText("Lưu thay đổi");
    expect(button.props.accessibilityState).toEqual({ disabled: true });

    await fireEvent.press(button);
    expect(handlePress).not.toHaveBeenCalled();
  });

  it("renders loading indicator when loading is true", async () => {
    const screen = await render(
      <FloatingActionBar
        actions={[
          {
            label: "Đang lưu...",
            loading: true,
          },
        ]}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
    expect(screen.queryByText("Đang lưu...")).toBeNull();
  });

  it("renders custom children if provided", async () => {
    const screen = await render(
      <FloatingActionBar>
        <Text>Custom Content Inside Bar</Text>
      </FloatingActionBar>,
    );

    expect(screen.getByText("Custom Content Inside Bar")).toBeTruthy();
  });
});
