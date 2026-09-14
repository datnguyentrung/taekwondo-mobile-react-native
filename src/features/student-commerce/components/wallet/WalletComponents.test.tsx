import { fireEvent, render } from "@testing-library/react-native";

import { studentCommerceMock } from "../../fixtures/studentCommerce.fixtures";
import {
  WalletBalanceCard,
  WalletCoursePreviewCard,
  WalletSectionGroup,
  WalletTransactionPreviewCard,
} from ".";

describe("wallet components", () => {
  it("renders wallet balance card content and handles the action", async () => {
    const onActionPress = jest.fn();
    const screen = await render(
      <WalletBalanceCard
        student={studentCommerceMock.selectedStudent}
        balance={studentCommerceMock.wallet.balance}
        actionLabel="Hướng dẫn nạp tiền"
        onActionPress={onActionPress}
      />,
    );

    expect(screen.getByText("Đang xem ví của")).toBeTruthy();
    expect(screen.getByText("Nguyễn Văn An · VQ_00123")).toBeTruthy();
    expect(screen.getByText("Hồ sơ học viên đang hoạt động")).toBeTruthy();
    expect(screen.getByText("2.500.000đ")).toBeTruthy();

    fireEvent.press(screen.getByText("Hướng dẫn nạp tiền"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it("renders wallet section group and handles footer press", async () => {
    const onFooterPress = jest.fn();
    const screen = await render(
      <WalletSectionGroup
        icon="layersFill"
        title="Khóa học đang học"
        subtitle="Tiếp tục hành trình chinh phục mục tiêu của bạn"
        count={2}
        footerLabel="Xem tất cả khóa học"
        onFooterPress={onFooterPress}
      >
        <WalletCoursePreviewCard
          enrollment={studentCommerceMock.enrollments[0]}
          onPress={jest.fn()}
        />
      </WalletSectionGroup>,
    );

    expect(screen.getByText("Khóa học đang học (2)")).toBeTruthy();
    expect(
      screen.getByText("Tiếp tục hành trình chinh phục mục tiêu của bạn"),
    ).toBeTruthy();
    expect(screen.getByText("Taekwondo Cơ bản")).toBeTruthy();

    fireEvent.press(screen.getByText("Xem tất cả khóa học"));
    expect(onFooterPress).toHaveBeenCalledTimes(1);
  });

  it("renders course preview progress from remaining sessions", async () => {
    const screen = await render(
      <WalletCoursePreviewCard
        enrollment={studentCommerceMock.enrollments[0]}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Còn 17/24 buổi")).toBeTruthy();
    expect(screen.getByText("71%")).toBeTruthy();
    expect(screen.getByText("01/09 → 01/12/2026")).toBeTruthy();
  });

  it("renders positive and negative transaction preview amounts", async () => {
    const screen = await render(
      <>
        <WalletTransactionPreviewCard
          transaction={studentCommerceMock.transactions[0]}
        />
        <WalletTransactionPreviewCard
          transaction={studentCommerceMock.transactions[1]}
        />
      </>,
    );

    expect(screen.getByText("+2.000.000đ")).toBeTruthy();
    expect(screen.getByText("-3.000.000đ")).toBeTruthy();
  });
});
