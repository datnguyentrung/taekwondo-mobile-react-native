import { act, renderHook } from '@testing-library/react-native';

import { runFaceCheckIn } from '../services/faceCheckInFlow';
import type { FaceCheckInEvent } from '../types/faceScanner.types';
import { useFaceCheckInSession } from './useFaceCheckInSession';

jest.mock('../services/faceCheckInFlow', () => ({ runFaceCheckIn: jest.fn() }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning' },
}));

const baseEvent = {
  eventId: 1,
  requestId: 'request-1',
  deviceId: 'kiosk-01',
  occurredAt: '2026-11-06T10:00:00Z',
} as const;

describe('useFaceCheckInSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  it('shows real SSE progress and completes from the terminal event', async () => {
    let finish: ((event: FaceCheckInEvent) => void) | undefined;
    jest.mocked(runFaceCheckIn).mockImplementationOnce(({ onEvent }) => {
      onEvent({ ...baseEvent, stage: 'READY' });
      onEvent({ ...baseEvent, eventId: 2, stage: 'FACE_DETECTED' });
      return new Promise((resolve) => {
        finish = resolve;
      });
    });

    const { result } = await renderHook(() => useFaceCheckInSession());
    let submission: Promise<void> | undefined;
    await act(async () => {
      submission = result.current.submitPhoto('/capture/face.jpg');
      await Promise.resolve();
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.progressMessage).toContain('phát hiện khuôn mặt');

    await act(async () => {
      finish?.({
        ...baseEvent,
        eventId: 8,
        stage: 'SUCCEEDED',
        result: {
          status: 'SUCCESS',
          requestId: 'request-1',
          action: 'STUDENT_CHECK_IN',
          person: {
            personId: 'person-1',
            fullName: 'Nguyễn Văn A',
            personCode: 'HV001',
          },
          recordId: 'attendance-1',
          attendanceStatus: 'ON_TIME',
        },
      });
      await submission;
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.status).toBe('result');
    expect(result.current.currentResult?.fullName).toBe('Nguyễn Văn A');
  });

  it('keeps the recognized person when attendance is rejected', async () => {
    jest.mocked(runFaceCheckIn).mockResolvedValueOnce({
      ...baseEvent,
      eventId: 9,
      stage: 'REJECTED',
      result: {
        status: 'REJECTED',
        requestId: 'request-1',
        action: null,
        person: {
          personId: 'person-1',
          fullName: 'Nguyễn Trung Đạt',
          personCode: 'VQ_datnt_311005',
          faceImagePath: 'https://example.test/face.jpg',
        },
        confidence: 0.91,
        message: 'No active attendance context was found for this person',
        error: {
          code: 'FACE_CHECK_IN_NO_ACTIVE_CONTEXT',
          title: 'No active face check-in context',
          detail: 'No active attendance context was found for this person',
        },
      },
      error: {
        code: 'FACE_CHECK_IN_NO_ACTIVE_CONTEXT',
        title: 'No active face check-in context',
        detail: 'No active attendance context was found for this person',
      },
    });

    const { result } = await renderHook(() => useFaceCheckInSession());
    await act(async () => {
      await result.current.submitPhoto('/capture/face.jpg');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.currentResult).toEqual(
      expect.objectContaining({
        personId: 'person-1',
        fullName: 'Nguyễn Trung Đạt',
        code: 'VQ_datnt_311005',
        confidence: 0.91,
      }),
    );
    expect(result.current.currentFailure?.errorType).toBe('NO_ACTIVE_SESSION');
  });

  it('aborts local waiting and resets when the user cancels', async () => {
    let receivedSignal: AbortSignal | undefined;
    jest.mocked(runFaceCheckIn).mockImplementationOnce(({ signal }) => {
      receivedSignal = signal;
      return new Promise(() => {});
    });
    const { result } = await renderHook(() => useFaceCheckInSession());

    await act(async () => {
      void result.current.submitPhoto('/capture/face.jpg');
      await Promise.resolve();
    });
    await act(async () => result.current.cancelCheckIn());

    expect(receivedSignal?.aborted).toBe(true);
    expect(result.current.status).toBe('idle');
    expect(result.current.isResultSheetVisible).toBe(false);
  });

  it('expires local waiting after 30 seconds', async () => {
    jest.mocked(runFaceCheckIn).mockImplementationOnce(
      () => new Promise(() => {}),
    );
    const { result } = await renderHook(() => useFaceCheckInSession());

    await act(async () => {
      void result.current.submitPhoto('/capture/face.jpg');
      await Promise.resolve();
    });
    await act(async () => jest.advanceTimersByTime(30_000));

    expect(result.current.isPending).toBe(false);
    expect(result.current.currentFailure?.title).toBe('Xử lý quá thời gian');
  });
});
