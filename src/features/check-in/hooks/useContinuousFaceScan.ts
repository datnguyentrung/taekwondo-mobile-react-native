import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { getNextMockPerson } from '../mock/checkIn.mock';
import type { CheckInRecord, ScanState } from '../types/checkIn.types';

export function useContinuousFaceScan(isEnabled: boolean = true) {
  const [scanState, setScanState] = useState<ScanState>('SCANNING');
  const [currentResult, setCurrentResult] = useState<CheckInRecord | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CheckInRecord[]>([]);
  const [isResultSheetVisible, setIsResultSheetVisible] = useState<boolean>(false);
  const [isHistorySheetVisible, setIsHistorySheetVisible] = useState<boolean>(false);

  const isProcessingRef = useRef<boolean>(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const clearTimer = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const triggerNextScan = useCallback(() => {
    if (!isEnabled || isProcessingRef.current || isResultSheetVisible || isHistorySheetVisible) {
      return;
    }

    clearTimer();
    setScanState('SCANNING');

    // Simulate auto camera frame capture & recognition cycle (~2.5s)
    scanTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || isProcessingRef.current) return;
      isProcessingRef.current = true;
      setScanState('ANALYZING');

      // Simulate network + AI classification latency (~400ms)
      setTimeout(() => {
        if (!isMountedRef.current) return;
        const person = getNextMockPerson();
        setCurrentResult(person);
        setSessionHistory((prev) => [person, ...prev]);
        setScanState('SUCCESS');
        setIsResultSheetVisible(true);
        isProcessingRef.current = false;

        // Feedback haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }, 400);
    }, 2400);
  }, [clearTimer, isEnabled, isHistorySheetVisible, isResultSheetVisible]);

  // Handle auto-starting scan loop when ready
  useEffect(() => {
    isMountedRef.current = true;
    if (isEnabled && !isResultSheetVisible && !isHistorySheetVisible && scanState === 'SCANNING') {
      triggerNextScan();
    }

    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer, isEnabled, isHistorySheetVisible, isResultSheetVisible, scanState, triggerNextScan]);

  const handleNextScan = useCallback(() => {
    setIsResultSheetVisible(false);
    isProcessingRef.current = false;
    setScanState('SCANNING');
  }, []);

  const closeResultSheet = useCallback(() => {
    setIsResultSheetVisible(false);
    isProcessingRef.current = false;
    setScanState('SCANNING');
  }, []);

  const openHistorySheet = useCallback(() => {
    clearTimer();
    setIsHistorySheetVisible(true);
  }, [clearTimer]);

  const closeHistorySheet = useCallback(() => {
    setIsHistorySheetVisible(false);
    setScanState('SCANNING');
  }, []);

  return {
    scanState,
    currentResult,
    sessionHistory,
    isResultSheetVisible,
    isHistorySheetVisible,
    handleNextScan,
    closeResultSheet,
    openHistorySheet,
    closeHistorySheet,
  };
}
