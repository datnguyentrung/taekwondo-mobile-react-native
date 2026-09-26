import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useCameraDevice,
  usePhotoOutput,
  type CameraDevice,
  type CameraPhotoOutput,
} from 'react-native-vision-camera';
import {
  useFaceDetectorOutput,
  type Face,
} from 'react-native-vision-camera-face-detector';
import { FACE_QUALITY_MESSAGES } from '../constants/faceScannerConfig';
import type {
  CameraFacing,
  FaceDetectionRecord,
  FaceQualityReason,
  ScannerState,
} from '../types/faceScanner.types';
import { createDetectionRecord, evaluateFaceQuality } from '../utils/faceQuality';

export type UseFaceScannerProps = {
  facing: CameraFacing;
  isActive: boolean;
  onFaceCaptured: (photoFilePath: string) => Promise<void> | void;
};

export type UseFaceScannerResult = {
  scannerState: ScannerState;
  feedbackMessage: string;
  qualityReason: FaceQualityReason;
  device: CameraDevice | undefined;
  photoOutput: CameraPhotoOutput;
  faceDetectorOutput: ReturnType<typeof useFaceDetectorOutput>;
  resumeScanner: () => void;
  pauseScanner: () => void;
  setScannerState: (state: ScannerState) => void;
};

export function useFaceScanner({
  facing,
  isActive,
  onFaceCaptured,
}: UseFaceScannerProps): UseFaceScannerResult {
  const [scannerState, setScannerState] = useState<ScannerState>('initializing');
  const [feedbackMessage, setFeedbackMessage] = useState<string>(
    FACE_QUALITY_MESSAGES.NO_FACE,
  );
  const [qualityReason, setQualityReason] = useState<FaceQualityReason>('NO_FACE');

  const isCapturingRef = useRef<boolean>(false);
  const historyRef = useRef<FaceDetectionRecord[]>([]);
  const isMountedRef = useRef<boolean>(true);
  const onFaceCapturedRef = useRef(onFaceCaptured);
  onFaceCapturedRef.current = onFaceCaptured;

  const device = useCameraDevice(facing);

  const photoOutput = usePhotoOutput({
    containerFormat: 'jpeg',
    quality: 0.85,
    qualityPrioritization: 'speed',
  });

  const resumeScanner = useCallback(() => {
    isCapturingRef.current = false;
    historyRef.current = [];
    setFeedbackMessage(FACE_QUALITY_MESSAGES.NO_FACE);
    setQualityReason('NO_FACE');
    setScannerState('scanning');
  }, []);

  const pauseScanner = useCallback(() => {
    isCapturingRef.current = false;
    historyRef.current = [];
    setScannerState('initializing');
  }, []);

  // Sync state when camera becomes active/inactive
  useEffect(() => {
    isMountedRef.current = true;

    if (isActive) {
      resumeScanner();
    } else {
      pauseScanner();
    }

    return () => {
      isMountedRef.current = false;
      historyRef.current = [];
    };
  }, [isActive, pauseScanner, resumeScanner]);

  const handleCapture = useCallback(
    async (photoOut: CameraPhotoOutput) => {
      if (isCapturingRef.current) return;
      isCapturingRef.current = true;

      console.log('[FaceScanner] 🎯 Khuôn mặt đạt chuẩn (Quality Gate Pass) -> Tiến hành chụp ảnh');
      setScannerState('capturing');
      setFeedbackMessage('Đang chụp ảnh...');

      try {
        const photoFile = await photoOut.capturePhotoToFile(
          { flashMode: 'off', enableShutterSound: false },
          {},
        );

        if (!isMountedRef.current) return;

        if (photoFile?.filePath) {
          console.log('[FaceScanner] 📸 Đã chụp ảnh thành công:', photoFile.filePath);
          await onFaceCapturedRef.current(photoFile.filePath);
        } else {
          console.warn('[FaceScanner] ⚠️ Không nhận được đường dẫn ảnh sau khi chụp');
          resumeScanner();
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.warn('[FaceScanner] ❌ Lỗi khi chụp ảnh:', error);
        resumeScanner();
      }
    },
    [resumeScanner],
  );

  const onFacesDetected = useCallback(
    (faces: Face[]) => {
      if (!isMountedRef.current) return;

      // Only evaluate frames when in active scanning state and not currently capturing/submitting
      if (scannerState !== 'scanning' || isCapturingRef.current) {
        return;
      }

      if (faces.length === 0) {
        historyRef.current = [];
        setFeedbackMessage(FACE_QUALITY_MESSAGES.NO_FACE);
        setQualityReason('NO_FACE');
        return;
      }

      const primaryFace = faces[0];
      console.log('[FaceScanner] 👤 Nhận diện khuôn mặt:', {
        count: faces.length,
        bounds: primaryFace.bounds,
        angles: {
          yaw: Math.round(primaryFace.yawAngle || 0),
          pitch: Math.round(primaryFace.pitchAngle || 0),
          roll: Math.round(primaryFace.rollAngle || 0),
        },
      });

      const newRecord = createDetectionRecord(primaryFace);
      const now = Date.now();

      // Keep only recent detections within 1000ms
      const filteredHistory = [
        ...historyRef.current.filter((r) => now - r.timestamp <= 1000),
        newRecord,
      ];
      historyRef.current = filteredHistory;

      const evaluation = evaluateFaceQuality(faces, filteredHistory);

      setFeedbackMessage(evaluation.feedbackText);
      setQualityReason(evaluation.reason);

      if (evaluation.isValid) {
        setScannerState('face-ready');
        void handleCapture(photoOutput);
      }
    },
    [handleCapture, photoOutput, scannerState],
  );

  const onError = useCallback((error: Error) => {
    console.warn('MLKit Face Detector encountered an error:', error);
  }, []);

  const faceDetectorOutput = useFaceDetectorOutput({
    cameraFacing: facing,
    performanceMode: 'fast',
    autoMode: true,
    runLandmarks: false,
    runContours: false,
    runClassifications: false,
    onFacesDetected,
    onError,
  });

  return {
    scannerState,
    feedbackMessage,
    qualityReason,
    device,
    photoOutput,
    faceDetectorOutput,
    resumeScanner,
    pauseScanner,
    setScannerState,
  };
}
