import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@/shared/ui/BottomSheetWindow', () => ({
  BottomSheetWindow: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => {
    const { View } = require('react-native');
    return visible ? <View>{children}</View> : null;
  },
}));

import {
  PackageSheet,
  SegmentedTabs,
  StudentSummaryCard,
  TransactionCard,
} from './StudentCommercePrimitives';
import { studentCommerceMock } from '../fixtures/studentCommerce.fixtures';

describe('StudentCommercePrimitives', () => {
  it('renders student summary card content', async () => {
    const screen = await render(<StudentSummaryCard student={studentCommerceMock.selectedStudent} />);

    expect(screen.getByText('Nguyễn Văn An')).toBeTruthy();
    expect(screen.getByText('VQ_00123 · Đai xanh')).toBeTruthy();
    expect(screen.getByText('Đang hoạt động')).toBeTruthy();
  });

  it('renders positive and negative transaction amounts', async () => {
    const screen = await render(
      <>
        <TransactionCard transaction={studentCommerceMock.transactions[0]} />
        <TransactionCard transaction={studentCommerceMock.transactions[1]} />
      </>,
    );

    expect(screen.getByText('+2.000.000đ')).toBeTruthy();
    expect(screen.getByText('-3.000.000đ')).toBeTruthy();
  });

  it('exposes selected state for segmented tabs', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <SegmentedTabs
        value="registration"
        tabs={[
          { value: 'registration', label: 'Đăng ký' },
          { value: 'active', label: 'Đang diễn ra' },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByText('Đang diễn ra'));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('opens package detail callback from package sheet', async () => {
    const onOpenPackage = jest.fn();
    const screen = await render(
      <PackageSheet
        visible
        course={studentCommerceMock.courses[1]}
        onClose={jest.fn()}
        onOpenPackage={onOpenPackage}
      />,
    );

    fireEvent.press(screen.getAllByText('Xem chi tiết →')[1]);
    expect(onOpenPackage).toHaveBeenCalledWith('advanced-3m');
  });
});
