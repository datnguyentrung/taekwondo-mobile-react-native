import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { faceCheckInApi } from '../services/faceCheckInApi';
import type {
  CameraFacing,
  CheckInRecord,
  ScannerState,
} from '../types/faceScanner.types';
import { useFaceScanner } from './useFaceScanner';

export type UseFaceCheckInProps = {
  facing: CameraFacing;
  isActive: boolean;
};

export function useFaceCheckIn({ facing, isActive }: UseFaceCheckInProps) {
  const [currentResult, setCurrentResult] = useState<CheckInRecord | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CheckInRecord[]>([]);
  const [isResultSheetVisible, setIsResultSheetVisible] = useState<boolean>(false);
  const [isHistorySheetVisible, setIsHistorySheetVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const handleFaceCaptured = useCallback(
    async (photoFilePath: string) => {
      console.log('[FaceCheckIn] 🚀 Bắt đầu gửi API điểm danh với ảnh:', photoFilePath);
      setErrorMessage(null);
      scanner.setScannerState('submitting');

      try {
        const result = await faceCheckInApi.submitFaceCheckIn(photoFilePath);

        if (!isMountedRef.current) return;

        if (result.success && result.record) {
          console.log('[FaceCheckIn] ✅ Điểm danh thành công:', {
            id: result.record.id,
            fullName: result.record.fullName,
            role: result.record.role,
            status: result.record.status,
            time: result.record.checkInTime,
          });

          setCurrentResult(result.record);
          setSessionHistory((prev) => [result.record!, ...prev]);
          scanner.setScannerState('result');
          setIsResultSheetVisible(true);

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
        } else {
          // Business or API error
          const msg =
            result.errorMessage || 'Không nhận diện được khuôn mặt. Vui lòng thử lại.';
          console.warn('[FaceCheckIn] ⚠️ Lỗi điểm danh từ Backend:', msg);
          setErrorMessage(msg);
          scanner.setScannerState('error');

          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});

          // Auto-resume scanner after 2.5s on recognition error
          setTimeout(() => {
            if (isMountedRef.current) {
              setErrorMessage(null);
              scanner.resumeScanner();
            }
          }, 2500);
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('[FaceCheckIn] ❌ Lỗi ngoại lệ khi gọi API điểm danh:', error);
        setErrorMessage('Đã xảy ra lỗi khi gửi dữ liệu điểm danh.');
        scanner.setScannerState('error');

        setTimeout(() => {
          if (isMountedRef.current) {
            setErrorMessage(null);
            scanner.resumeScanner();
          }
        }, 2500);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const scanner = useFaceScanner({
    facing,
    isActive: isActive && !isResultSheetVisible && !isHistorySheetVisible,
    onFaceCaptured: handleFaceCaptured,
  });

  const handleNextScan = useCallback(() => {
    setIsResultSheetVisible(false);
    setErrorMessage(null);
    scanner.resumeScanner();
  }, [scanner]);

  const closeResultSheet = useCallback(() => {
    setIsResultSheetVisible(false);
    setErrorMessage(null);
    scanner.resumeScanner();
  }, [scanner]);

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
    sessionHistory,
    isResultSheetVisible,
    isHistorySheetVisible,
    errorMessage,
    handleNextScan,
    closeResultSheet,
    openHistorySheet,
    closeHistorySheet,
    resumeScanner: scanner.resumeScanner,
    pauseScanner: scanner.pauseScanner,
    setScannerState: scanner.setScannerState,
  };
}
