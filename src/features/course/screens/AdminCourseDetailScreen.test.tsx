import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor, act } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockToastShow = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock('@/shared/ui/Toast', () => ({
  useToast: () => ({ show: mockToastShow }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: {
      View: (props: object) => React.createElement(View, props),
    },
    useSharedValue: (initialValue: unknown) => ({
      get: () => initialValue,
      set: jest.fn(),
    }),
    useAnimatedStyle: (fn: () => object) => fn(),
    useReducedMotion: () => false,
    withTiming: (toValue: unknown) => toValue,
    Easing: {
      bezier: () => () => 0,
    },
  };
});

jest.mock('@/shared/ui/AppIcon', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AppIcon: () => React.createElement(View, null),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
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
  BottomSheetWindow: ({
    visible,
    children,
    footer,
    overlay,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
    overlay?: React.ReactNode;
  }) => {
    const { View } = require('react-native');
    return visible ? (
      <View testID="bottom-sheet-window">
        {children}
        {footer}
        {overlay}
      </View>
    ) : null;
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
          name: course.courseName ?? course.title ?? 'Taekwondo Cơ bản',
          capacity: course.capacity ?? 20,
          currentStudentCount: course.enrolledStudentCount ?? course.enrolledCount ?? 15,
          status: course.catalogStatus === 'ended' ? 'CLOSED' : 'ACTIVE',
          classSessionGeneratedUntil: null,
          nextScheduleEffectiveFrom: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          primaryCoach: {
            personId: 'coach-1',
            fullName: course.primaryCoachName ?? 'HLV Nguyễn Văn A',
          },
          manager: {
            personId: 'manager-1',
            fullName: course.managerName ?? 'Quản lý B',
          },
        });
      }
      return Promise.reject(new Error('Course not found'));
    }),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

import { courseApi } from '@/features/course/api/courseApi';
import { AdminCourseDetailScreen } from './AdminCourseDetailScreen';

let activeQueryClient: QueryClient | null = null;

async function renderWithQuery(ui: React.ReactElement) {
  activeQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return await render(
    <QueryClientProvider client={activeQueryClient}>{ui}</QueryClientProvider>,
  );
}

describe('AdminCourseDetailScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockToastShow.mockClear();
    (courseApi.update as jest.Mock).mockReset();
    (courseApi.remove as jest.Mock).mockReset();
    (courseApi.update as jest.Mock).mockResolvedValue({
      courseId: 'basic',
      courseSchedules: [],
      name: 'Lớp Taekwondo Cơ Bản Cập Nhật',
      capacity: 35,
      currentStudentCount: 15,
      status: 'ACTIVE',
      classSessionGeneratedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    activeQueryClient?.clear();
    activeQueryClient = null;
  });

  it('disables registration action for ended courses', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="ended-basic" />);

    const registerButton = await view.findByLabelText('Đăng ký học viên');
    expect(registerButton.props.accessibilityState).toEqual({ disabled: true });

    await fireEvent.press(registerButton);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens packages from course detail and navigates to package detail', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const viewPackagesButton = await view.findByLabelText('Xem gói học');
    await fireEvent.press(viewPackagesButton);

    const selectPackage = await view.findByLabelText('Chọn gói 6 tháng');
    expect(selectPackage).toBeTruthy();
    await fireEvent.press(selectPackage);

    await waitFor(() =>
      expect(selectPackage.props.accessibilityState).toEqual({ selected: true }),
    );
    await fireEvent.press(view.getByLabelText('Chọn gói này'));

    expect(mockPush).toHaveBeenCalledWith('/courses/basic/packages/basic-6m');
  });

  it('opens course edit bottom sheet when clicking Chỉnh sửa and pre-fills 3 fields', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const editButton = await view.findByLabelText('Chỉnh sửa khóa học');
    await fireEvent.press(editButton);

    await waitFor(() => {
      expect(view.getByTestId('bottom-sheet-window')).toBeTruthy();
      expect(view.getByLabelText('Tên khóa học')).toBeTruthy();
      expect(view.getByLabelText('Sức chứa tối đa (học viên)')).toBeTruthy();
      expect(view.getAllByText('Đang diễn ra').length).toBeGreaterThan(0);
    });

    const saveButton = view.getByLabelText('Lưu thay đổi');
    expect(saveButton).toBeTruthy();
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables Save button when changes exist, calls courseApi.update, shows cancellable loading, and updates on success', async () => {
    const updatedResponse = {
      courseId: 'basic',
      courseSchedules: [],
      name: 'Lớp Taekwondo Cơ Bản Cập Nhật',
      capacity: 35,
      currentStudentCount: 15,
      status: 'ACTIVE' as const,
      classSessionGeneratedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      primaryCoach: { personId: 'coach-1', fullName: 'HLV Nguyễn Văn A' },
      manager: { personId: 'manager-1', fullName: 'Quản lý B' },
    };

    let resolvePromise: (val: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (courseApi.update as jest.Mock).mockImplementation(() => updatePromise);

    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const editButton = await view.findByLabelText('Chỉnh sửa khóa học');
    await fireEvent.press(editButton);

    const nameInput = await view.findByLabelText('Tên khóa học');
    const capacityInput = await view.findByLabelText('Sức chứa tối đa (học viên)');

    // Change course name and capacity
    await fireEvent.changeText(nameInput, 'Lớp Taekwondo Cơ Bản Cập Nhật');
    await fireEvent.changeText(capacityInput, '35');

    // Click Save
    await waitFor(() => {
      const btn = view.getByLabelText('Lưu thay đổi');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });

    await fireEvent.press(view.getByLabelText('Lưu thay đổi'));

    // Verify API called with signal
    await waitFor(() => {
      expect(courseApi.update).toHaveBeenCalledWith(
        'basic',
        {
          name: 'Lớp Taekwondo Cơ Bản Cập Nhật',
          capacity: 35,
          status: 'ACTIVE',
        },
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });

    // Loading overlay is visible with cancel button
    await waitFor(() => {
      expect(view.getByText('Đang lưu thay đổi khóa học...')).toBeTruthy();
      expect(view.getByLabelText('Hủy')).toBeTruthy();
    });

    // Resolve update
    await act(async () => {
      resolvePromise!(updatedResponse);
    });

    await waitFor(() => {
      // Bottom sheet should close
      expect(view.queryByTestId('bottom-sheet-window')).toBeNull();
      // Toast success should be shown
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('thành công'),
          variant: 'success',
        }),
      );
    });
  });

  it('allows cancelling in-flight update with Hủy button and keeps bottom sheet open without error toast', async () => {
    (courseApi.update as jest.Mock).mockImplementation((_id, _req, options) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const abortErr = new Error('Canceled');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });

    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const editButton = await view.findByLabelText('Chỉnh sửa khóa học');
    await fireEvent.press(editButton);

    const nameInput = await view.findByLabelText('Tên khóa học');
    await fireEvent.changeText(nameInput, 'Tên Khác');

    await waitFor(() => {
      const btn = view.getByLabelText('Lưu thay đổi');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });
    await fireEvent.press(view.getByLabelText('Lưu thay đổi'));

    // Loading appears
    await waitFor(() => expect(view.getByText('Đang lưu thay đổi khóa học...')).toBeTruthy());

    // Press Cancel in loading overlay
    const cancelButton = view.getByLabelText('Hủy');
    await fireEvent.press(cancelButton);

    // Sheet should remain open with the modified value
    await waitFor(() => {
      expect(view.getByTestId('bottom-sheet-window')).toBeTruthy();
      expect(view.getByDisplayValue('Tên Khác')).toBeTruthy();
      // No error toast for user abort
      expect(mockToastShow).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });

  it('keeps bottom sheet open and displays error toast when update fails', async () => {
    (courseApi.update as jest.Mock).mockRejectedValue(new Error('Tên khóa học không hợp lệ'));

    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const editButton = await view.findByLabelText('Chỉnh sửa khóa học');
    await fireEvent.press(editButton);

    const nameInput = await view.findByLabelText('Tên khóa học');
    await fireEvent.changeText(nameInput, 'Tên Bị Lỗi');

    await waitFor(() => {
      const btn = view.getByLabelText('Lưu thay đổi');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });
    await fireEvent.press(view.getByLabelText('Lưu thay đổi'));

    await waitFor(() => {
      // Sheet remains open
      expect(view.getByTestId('bottom-sheet-window')).toBeTruthy();
      // Error toast shown
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Tên khóa học không hợp lệ'),
          variant: 'error',
        }),
      );
    });
  });

  it('opens confirmation dialog on delete button click and cancels when Hủy is pressed', async () => {
    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const deleteButton = await view.findByLabelText('Xóa khóa học');
    await fireEvent.press(deleteButton);

    const dialog = await view.findByTestId('confirmation-dialog');
    expect(dialog).toBeTruthy();
    expect(view.getByText('Xóa khóa học')).toBeTruthy();
    expect(view.getByText(/Bạn có chắc chắn muốn xóa khóa học/)).toBeTruthy();

    const cancelButton = view.getByText('Hủy');
    await fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(courseApi.remove).not.toHaveBeenCalled();
    });
  });

  it('calls courseApi.remove, shows cancellable loading overlay, and navigates back on confirmation', async () => {
    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    (courseApi.remove as jest.Mock).mockImplementation(() => deletePromise);

    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const deleteButton = await view.findByLabelText('Xóa khóa học');
    await fireEvent.press(deleteButton);

    const confirmButton = await view.findByText('Xóa');
    await fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(courseApi.remove).toHaveBeenCalledWith(
        'basic',
        expect.objectContaining({ signal: expect.any(Object) }),
      );
    });

    // Loading overlay is visible
    expect(view.getByText('Đang xóa khóa học...')).toBeTruthy();

    // Resolve delete
    await act(async () => {
      resolveDelete!();
    });

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('thành công'),
          variant: 'success',
        }),
      );
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('allows cancelling in-flight delete with overlay Hủy button and shows no error toast', async () => {
    (courseApi.remove as jest.Mock).mockImplementation((_id, options) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          const abortErr = new Error('Canceled');
          abortErr.name = 'AbortError';
          reject(abortErr);
        });
      });
    });

    const view = await renderWithQuery(<AdminCourseDetailScreen courseId="basic" />);

    const deleteButton = await view.findByLabelText('Xóa khóa học');
    await fireEvent.press(deleteButton);

    const confirmButton = await view.findByText('Xóa');
    await fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(view.getByText('Đang xóa khóa học...')).toBeTruthy();
    });

    const cancelOverlayBtn = view.getByLabelText('Hủy');
    await fireEvent.press(cancelOverlayBtn);

    await waitFor(() => {
      expect(mockBack).not.toHaveBeenCalled();
      expect(mockToastShow).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      );
    });
  });
});
