import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { faceCheckInApi } from '../services/faceCheckInApi';
import type {
  CameraFacing,
  CheckInFailure,
  CheckInRecord,
} from '../types/faceScanner.types';
import { useFaceScanner } from './useFaceScanner';

const POLL_INTERVAL_MS = 750;
const POLL_TIMEOUT_MS = 20000;

export type UseFaceCheckInProps = {
  facing: CameraFacing;
  isActive: boolean;
};

export function useFaceCheckIn({ facing, isActive }: UseFaceCheckInProps) {
  const [currentResult, setCurrentResult] = useState<CheckInRecord | null>(null);
  const [currentFailure, setCurrentFailure] = useState<CheckInFailure | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [sessionHistory, setSessionHistory] = useState<CheckInRecord[]>([]);
  const [isResultSheetVisible, setIsResultSheetVisible] = useState<boolean>(false);
  const [isHistorySheetVisible, setIsHistorySheetVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const activePollRequestIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    activePollRequestIdRef.current = null;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollTimeoutTimerRef.current) {
      clearTimeout(pollTimeoutTimerRef.current);
      pollTimeoutTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const pollCommand = useCallback(
    async (requestId: string) => {
      if (!isMountedRef.current || activePollRequestIdRef.current !== requestId) {
        return;
      }

      try {
        const pollResult = await faceCheckInApi.getAttendanceCommand(requestId);

        if (!isMountedRef.current || activePollRequestIdRef.current !== requestId) {
          return;
        }

        if (pollResult.status === 'SUCCEEDED') {
          stopPolling();
          setIsPending(false);

          if (pollResult.record) {
            console.log('[FaceCheckIn] ✅ Async điểm danh thành công:', {
              id: pollResult.record.id,
              fullName: pollResult.record.fullName,
              role: pollResult.record.role,
              status: pollResult.record.status,
              time: pollResult.record.checkInTime,
            });

            setCurrentResult(pollResult.record);
            setCurrentFailure(null);
            setSessionHistory((prev) => [pollResult.record!, ...prev]);
            scanner.setScannerState('result');

            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          } else if (pollResult.failure) {
            setCurrentFailure(pollResult.failure);
            setErrorMessage(pollResult.failure.message);
            scanner.setScannerState('error');

            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            ).catch(() => {});
          }
          return;
        }

        if (pollResult.status === 'FAILED') {
          stopPolling();
          setIsPending(false);

          const failure = pollResult.failure || {
            errorType: 'UNKNOWN',
            title: 'Điểm danh thất bại',
            message: pollResult.errorMessage || 'Không thể hoàn tất điểm danh.',
            ctaLabel: 'Quét lại',
          };

          console.warn('[FaceCheckIn] ⚠️ Lỗi điểm danh từ async command:', failure);
          if (pollResult.record) {
            setCurrentResult(pollResult.record);
          }
          setCurrentFailure(failure);
          setErrorMessage(failure.message);
          scanner.setScannerState('error');

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
          return;
        }

        // Status is QUEUED or PROCESSING - schedule next poll
        pollTimerRef.current = setTimeout(() => {
          void pollCommand(requestId);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (!isMountedRef.current || activePollRequestIdRef.current !== requestId) {
          return;
        }
        console.warn('[FaceCheckIn] ⚠️ Lỗi polling command, sẽ thử lại:', error);
        pollTimerRef.current = setTimeout(() => {
          void pollCommand(requestId);
        }, POLL_INTERVAL_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopPolling],
  );

  const startPolling = useCallback(
    (requestId: string) => {
      stopPolling();
      activePollRequestIdRef.current = requestId;

      // Timeout timer for 20s
      pollTimeoutTimerRef.current = setTimeout(() => {
        if (activePollRequestIdRef.current === requestId && isMountedRef.current) {
          stopPolling();
          setIsPending(false);

          const timeoutFailure: CheckInFailure = {
            errorType: 'UNKNOWN',
            title: 'Xử lý quá thời gian',
            message:
              'Hệ thống xử lý lâu, vui lòng thử lại hoặc kiểm tra lịch sử điểm danh.',
            ctaLabel: 'Quét lại',
          };

          setCurrentFailure(timeoutFailure);
          setErrorMessage(timeoutFailure.message);
          scanner.setScannerState('error');

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
        }
      }, POLL_TIMEOUT_MS);

      // Start initial poll
      pollTimerRef.current = setTimeout(() => {
        void pollCommand(requestId);
      }, POLL_INTERVAL_MS);
    },
    [pollCommand, stopPolling],
  );

  const handleFaceCaptured = useCallback(
    async (photoFilePath: string) => {
      console.log('[FaceCheckIn] 🚀 Bắt đầu gửi API điểm danh với ảnh:', photoFilePath);
      setErrorMessage(null);
      scanner.setScannerState('submitting');

      try {
        const result = await faceCheckInApi.submitFaceCheckIn(photoFilePath);

        if (!isMountedRef.current) return;

        // Async flow: status is PENDING with requestId
        if (result.isPending && result.requestId) {
          console.log('[FaceCheckIn] ⏳ Nhận job async PENDING, requestId:', result.requestId);
          setIsPending(true);
          setCurrentResult(result.record ?? null);
          setCurrentFailure(null);
          scanner.setScannerState('processing');
          setIsResultSheetVisible(true);
          startPolling(result.requestId);
          return;
        }

        // Synchronous success
        if (result.success && result.record) {
          console.log('[FaceCheckIn] ✅ Điểm danh thành công ngay lập tức:', {
            id: result.record.id,
            fullName: result.record.fullName,
            role: result.record.role,
            status: result.record.status,
            time: result.record.checkInTime,
          });

          setIsPending(false);
          setCurrentResult(result.record);
          setCurrentFailure(null);
          setSessionHistory((prev) => [result.record!, ...prev]);
          scanner.setScannerState('result');
          setIsResultSheetVisible(true);

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        } else {
          // Business or API error
          const failure =
            result.failure || {
              errorType: result.errorType || 'UNKNOWN',
              title: 'Điểm danh thất bại',
              message:
                result.errorMessage || 'Không nhận diện được khuôn mặt. Vui lòng thử lại.',
              ctaLabel: 'Thử lại',
            };
          console.warn('[FaceCheckIn] ⚠️ Lỗi điểm danh từ Backend:', failure);
          setIsPending(false);
          setCurrentResult(result.record ?? null);
          setCurrentFailure(failure);
          setErrorMessage(failure.message);
          scanner.setScannerState('error');
          setIsResultSheetVisible(true);

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('[FaceCheckIn] ❌ Lỗi ngoại lệ khi gọi API điểm danh:', error);
        setIsPending(false);
        const failure: CheckInFailure = {
          errorType: 'UNKNOWN',
          title: 'Điểm danh thất bại',
          message: 'Đã xảy ra lỗi khi gửi dữ liệu điểm danh.',
          ctaLabel: 'Thử lại',
        };
        setCurrentResult(null);
        setCurrentFailure(failure);
        setErrorMessage(failure.message);
        scanner.setScannerState('error');
        setIsResultSheetVisible(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startPolling],
  );

  const scanner = useFaceScanner({
    facing,
    isActive:
      isActive && !isResultSheetVisible && !isHistorySheetVisible && !isPending,
    onFaceCaptured: handleFaceCaptured,
  });

  const handleNextScan = useCallback(() => {
    stopPolling();
    setIsPending(false);
    setIsResultSheetVisible(false);
    setErrorMessage(null);
    setCurrentFailure(null);
    scanner.resumeScanner();
  }, [scanner, stopPolling]);

  const closeResultSheet = useCallback(() => {
    stopPolling();
    setIsPending(false);
    setIsResultSheetVisible(false);
    setErrorMessage(null);
    setCurrentFailure(null);
    scanner.resumeScanner();
  }, [scanner, stopPolling]);

  const cancelCheckIn = useCallback(() => {
    console.log('[FaceCheckIn] 🛑 Người dùng đã bấm Hủy điểm danh.');
    stopPolling();
    setIsPending(false);
    setIsResultSheetVisible(false);
    setCurrentResult(null);
    setCurrentFailure(null);
    setErrorMessage(null);
    scanner.resumeScanner();
  }, [scanner, stopPolling]);

  const openHistorySheet = useCallback(() => {
    setIsHistorySheetVisible(true);
    scanner.pauseScanner();
  }, [scanner]);

  const closeHistorySheet = useCallback(() => {
    setIsHistorySheetVisible(false);
    scanner.resumeScanner();
  }, [scanner]);

  return {
    scannerState: scanner.scannerState,
    feedbackMessage: errorMessage || scanner.feedbackMessage,
    qualityReason: scanner.qualityReason,
    device: scanner.device,
    photoOutput: scanner.photoOutput,
    faceDetectorOutput: scanner.faceDetectorOutput,
    currentResult,
    currentFailure,
    isPending,
    sessionHistory,
    isResultSheetVisible,
    isHistorySheetVisible,
    errorMessage,
    handleNextScan,
    closeResultSheet,
    cancelCheckIn,
    openHistorySheet,
    closeHistorySheet,
    resumeScanner: scanner.resumeScanner,
    pauseScanner: scanner.pauseScanner,
    setScannerState: scanner.setScannerState,
  };
}
