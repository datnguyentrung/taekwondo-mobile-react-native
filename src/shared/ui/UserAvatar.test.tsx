import { render } from "@testing-library/react-native";

import { UserAvatar } from "./UserAvatar";

describe("UserAvatar", () => {
  it("uses initials when initials mode is requested", async () => {
    const screen = await render(
      <UserAvatar
        name="Nguyễn Trung Đạt"
        imageUrl="https://example.com/avatar.jpg"
        gender={true}
        mode="initials"
      />,
    );

    expect(screen.getByText("NT")).toBeTruthy();
  });

  it("uses a gender image when gender mode is requested", async () => {
    const screen = await render(
      <UserAvatar
        name="Nguyễn Trung Đạt"
        imageUrl="https://example.com/avatar.jpg"
        gender={true}
        mode="gender"
      />,
    );

    expect(screen.queryByText("NT")).toBeNull();
    expect(screen.getByLabelText("Ảnh đại diện của Nguyễn Trung Đạt")).toBeTruthy();
  });

  it("defaults to the saved profile image when it is available", async () => {
    const screen = await render(
      <UserAvatar
        name="Nguyễn Trung Đạt"
        imageUrl="https://example.com/avatar.jpg"
        gender={true}
      />,
    );

    expect(screen.queryByText("NT")).toBeNull();
    expect(screen.getByLabelText("Ảnh đại diện của Nguyễn Trung Đạt")).toBeTruthy();
  });
});
