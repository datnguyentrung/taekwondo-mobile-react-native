import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { PickerPopover } from "./PickerPopover";

describe("PickerPopover", () => {
  const mockOptions = [
    { value: "OPTION_1", label: "Lựa chọn 1", subtitle: "Mô tả 1" },
    { value: "OPTION_2", label: "Lựa chọn 2", subtitle: "Mô tả 2" },
  ];

  it("renders null when visible is false", async () => {
    const screen = await render(
      <PickerPopover
        visible={false}
        title="Tiêu đề"
        options={mockOptions}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.queryByText("Tiêu đề")).toBeNull();
  });

  it("renders title, subtitle, and option items when visible is true", async () => {
    const screen = await render(
      <PickerPopover
        visible={true}
        title="Chọn chức vụ"
        subtitle="Danh sách"
        options={mockOptions}
        selectedValue="OPTION_1"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Chọn chức vụ")).toBeTruthy();
    expect(screen.getByText("DANH SÁCH")).toBeTruthy();
    expect(screen.getByText("Lựa chọn 1")).toBeTruthy();
    expect(screen.getByText("Lựa chọn 2")).toBeTruthy();
  });

  it("calls onSelect and onClose when an option is pressed", async () => {
    const handleSelect = jest.fn();
    const handleClose = jest.fn();

    const screen = await render(
      <PickerPopover
        visible={true}
        title="Chọn chức vụ"
        options={mockOptions}
        onSelect={handleSelect}
        onClose={handleClose}
      />,
    );

    await fireEvent.press(screen.getByText("Lựa chọn 2"));
    expect(handleSelect).toHaveBeenCalledWith("OPTION_2");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
