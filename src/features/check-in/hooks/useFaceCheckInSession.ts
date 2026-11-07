import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';

import { faceCheckInStageMessage } from '../domain/faceCheckInProgress';
import {
  failureFromBackend,
  failureFromFaceCheckInResponse,
  mapBackendResponseToRecord,
  toCheckInFailure,
} from '../services/faceCheckInApi';
import { runFaceCheckIn } from '../services/faceCheckInFlow';
import type {
  CheckInFailure,
  CheckInRecord,
  FaceCheckInEvent,
} from '../types/faceScanner.types';
import type { FaceCheckInSessionStatus } from '../types/camera.types';

const SCAN_TIMEOUT_MS = 30_000;
const INITIAL_PROGRESS = 'Đang khởi tạo lần quét...';

export function useFaceCheckInSession() {
  const [status, setStatus] = useState<FaceCheckInSessionStatus>('idle');
  const [currentResult, setCurrentResult] = useState<CheckInRecord | null>(null);
  const [currentFailure, setCurrentFailure] = useState<CheckInFailure | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [progressMessage, setProgressMessage] = useState(INITIAL_PROGRESS);
  const [sessionHistory, setSessionHistory] = useState<CheckInRecord[]>([]);
  const [isResultSheetVisible, setIsResultSheetVisible] = useState(false);
  const [isHistorySheetVisible, setIsHistorySheetVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);

  const isMountedRef = useRef(true);
  const activeControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearActiveScan = useCallback((abort: boolean) => {
    const controller = activeControllerRef.current;
    activeControllerRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abort) controller?.abort();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearActiveScan(true);
    };
  }, [clearActiveScan]);

  const applyProgress = useCallback(
    (controller: AbortController, event: FaceCheckInEvent) => {
      if (!isMountedRef.current || activeControllerRef.current !== controller) {
        return;
      }
      setProgressMessage(faceCheckInStageMessage(event.stage));
      if (event.stage !== 'SUCCEEDED') setStatus('processing');
    },
    [],
  );

  const applyFailure = useCallback((failure: CheckInFailure) => {
    setIsPending(false);
    setCurrentFailure(failure);
    setErrorMessage(failure.message);
    setStatus('error');
    setIsResultSheetVisible(true);
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
  }, []);

  const submitPhoto = useCallback(
    async (photoFilePath: string) => {
      clearActiveScan(true);
      const controller = new AbortController();
      activeControllerRef.current = controller;
      setErrorMessage(null);
      setCurrentFailure(null);
      setCurrentResult(null);
      setProgressMessage(INITIAL_PROGRESS);
      setStatus('submitting');
      setIsPending(true);
      setIsResultSheetVisible(true);

      timeoutRef.current = setTimeout(() => {
        if (activeControllerRef.current !== controller || !isMountedRef.current) {
          return;
        }
        clearActiveScan(true);
        applyFailure({
          errorType: 'UNKNOWN',
          title: 'Xử lý quá thời gian',
          message:
            'Hệ thống chưa hoàn tất trong 30 giây. Vui lòng quét lại hoặc kiểm tra lịch sử điểm danh.',
          ctaLabel: 'Quét lại',
        });
      }, SCAN_TIMEOUT_MS);

      try {
        const terminal = await runFaceCheckIn({
          photoFilePath,
          signal: controller.signal,
          onEvent: (event) => applyProgress(controller, event),
        });
        if (!isMountedRef.current || activeControllerRef.current !== controller) {
          return;
        }

        clearActiveScan(false);
        setIsPending(false);
        if (terminal.stage === 'SUCCEEDED' && terminal.result) {
          const record = mapBackendResponseToRecord(terminal.result);
          setCurrentResult(record);
          setCurrentFailure(null);
          setSessionHistory((previous) => [record, ...previous]);
          setStatus('result');
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          return;
        }

        const record = terminal.result
          ? mapBackendResponseToRecord(terminal.result)
          : null;
        const failure = terminal.result
          ? failureFromFaceCheckInResponse(terminal.result)
          : failureFromBackend(undefined, terminal.error ?? {
              code: terminal.stage,
              detail: faceCheckInStageMessage(terminal.stage),
            });
        setCurrentResult(record);
        applyFailure(failure);
      } catch (error) {
        if (!isMountedRef.current || activeControllerRef.current !== controller) {
          return;
        }
        console.error('[FaceCheckIn] scan failed before a terminal result', {
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        });
        clearActiveScan(true);
        applyFailure(toCheckInFailure(error));
      }
    },
    [applyFailure, applyProgress, clearActiveScan],
  );

  const resetSessionView = useCallback(() => {
    clearActiveScan(true);
    setIsPending(false);
    setIsResultSheetVisible(false);
    setCurrentResult(null);
    setCurrentFailure(null);
    setErrorMessage(null);
    setProgressMessage(INITIAL_PROGRESS);
    setStatus('idle');
    setResetToken((value) => value + 1);
  }, [clearActiveScan]);

  const openHistorySheet = useCallback(() => setIsHistorySheetVisible(true), []);
  const closeHistorySheet = useCallback(() => setIsHistorySheetVisible(false), []);

  return {
    status,
    currentResult,
    currentFailure,
    isPending,
    progressMessage,
    sessionHistory,
    isResultSheetVisible,
    isHistorySheetVisible,
    errorMessage,
    resetToken,
    submitPhoto,
    handleNextScan: resetSessionView,
    closeResultSheet: resetSessionView,
    cancelCheckIn: resetSessionView,
    openHistorySheet,
    closeHistorySheet,
  };
}
