import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('@/routes/navigation/layouts/StackScreenLayout', () => ({
  __esModule: true,
  default: ({
    children,
    floatingContent,
  }: {
    children: React.ReactNode;
    floatingContent?: React.ReactNode;
  }) => {
    const { View } = require('react-native');
    return (
      <View>
        {children}
        {floatingContent}
      </View>
    );
  },
}));

jest.mock('@/shared/ui/BottomSheetWindow', () => ({
  BottomSheetWindow: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => {
    const { View } = require('react-native');
    return visible ? <View>{children}</View> : null;
  },
}));

import { AdminCourseDetailScreen } from './AdminCourseDetailScreen';

describe('AdminCourseDetailScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('disables registration action for ended courses', async () => {
    const screen = await render(<AdminCourseDetailScreen courseId="ended-basic" />);

    const registerButton = screen.getByLabelText('Đăng ký học viên');
    expect(registerButton.props.accessibilityState).toEqual({ disabled: true });

    fireEvent.press(registerButton);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens packages from course detail and navigates to package detail', async () => {
    const screen = await render(<AdminCourseDetailScreen courseId="basic" />);

    fireEvent.press(screen.getByLabelText('Xem gói học'));
    await waitFor(() =>
      expect(screen.getByLabelText('Xem chi tiết gói 6 tháng')).toBeTruthy(),
    );
    fireEvent.press(screen.getByLabelText('Xem chi tiết gói 6 tháng'));

    expect(mockPush).toHaveBeenCalledWith('/courses/basic/packages/basic-6m');
  });
});
