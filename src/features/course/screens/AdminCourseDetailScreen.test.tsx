import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  BottomSheetWindow: ({ visible, children, footer }: { visible: boolean; children: React.ReactNode; footer?: React.ReactNode }) => {
    const { View } = require('react-native');
    return visible ? <View>{children}{footer}</View> : null;
  },
}));

jest.mock('@/features/course/api/courseApi', () => ({
  courseApi: {
    get: jest.fn().mockImplementation((id: string) => {
      const { getCommerceState, getCourse } = require('@/features/student-commerce/utils/studentCommerceUtils');
      const state = getCommerceState();
      const course = getCourse(state.courses, id);
      if (course) {
        return Promise.resolve({
          courseId: course.courseId,
          courseSchedules: [],
          name: course.title,
          capacity: course.capacity,
          currentStudentCount: course.enrolledCount,
          status: course.catalogStatus === 'ended' ? 'CLOSED' : 'ACTIVE',
          classSessionGeneratedUntil: null,
          nextScheduleEffectiveFrom: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          primaryCoach: {
            personId: 'coach-1',
            fullName: course.primaryCoachName,
          },
          manager: {
            personId: 'manager-1',
            fullName: course.managerName,
          },
        });
      }
      return Promise.reject(new Error('Course not found'));
    }),
  },
}));

import { AdminCourseDetailScreen } from './AdminCourseDetailScreen';

async function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return await render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('AdminCourseDetailScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('disables registration action for ended courses', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="ended-basic" />);

    const registerButton = view.getByLabelText('Đăng ký học viên');
    expect(registerButton.props.accessibilityState).toEqual({ disabled: true });

    fireEvent.press(registerButton);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens packages from course detail and navigates to package detail', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const viewPackagesButton = view.getByLabelText('Xem gói học');
    fireEvent.press(viewPackagesButton);
    await waitFor(() =>
      expect(view.getByLabelText('Chọn gói 6 tháng')).toBeTruthy(),
    );
    fireEvent.press(view.getByLabelText('Chọn gói 6 tháng'));
    await waitFor(() =>
      expect(view.getByLabelText('Chọn gói 6 tháng').props.accessibilityState).toEqual({ selected: true }),
    );
    fireEvent.press(view.getByLabelText('Chọn gói này'));

    expect(mockPush).toHaveBeenCalledWith('/courses/basic/packages/basic-6m');
  });

  it('navigates to course edit screen on pressing Chỉnh sửa', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const editButton = view.getByLabelText('Chỉnh sửa khóa học');
    fireEvent.press(editButton);

    expect(mockPush).toHaveBeenCalledWith('/courses/basic/edit');
  });
});
