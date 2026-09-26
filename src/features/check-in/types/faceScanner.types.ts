import type { Face } from 'react-native-vision-camera-face-detector';

export type ScannerState =
  | 'initializing'
  | 'scanning'
  | 'face-ready'
  | 'capturing'
  | 'submitting'
  | 'result'
  | 'error';

export type ScanState = ScannerState | 'SCANNING' | 'ANALYZING' | 'SUCCESS' | 'ERROR';

export type CheckInPersonType = 'STUDENT' | 'COACH';

export type CheckInStatus = 'ON_TIME' | 'LATE' | 'EXCUSED';

export type FaceQualityReason =
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FACE_TOO_SMALL'
  | 'FACE_TOO_LARGE'
  | 'FACE_OUT_OF_BOUNDS'
  | 'FACE_ANGLE_BAD'
  | 'FACE_NOT_STABLE'
  | 'VALID';

export type FaceQualityResult = {
  isValid: boolean;
  reason: FaceQualityReason;
  feedbackText: string;
  face?: Face;
};

export type FaceDetectionRecord = {
  timestamp: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  trackingId?: number;
};

export type CheckInRecord = {
  id: string;
  personId: string;
  code: string;
  fullName: string;
  avatarUrl?: string;
  role: CheckInPersonType;
  checkInTime: string;
  dateLabel: string;
  status: CheckInStatus;
  statusLabel: string;
  timestamp: number;
  message?: string;
};

export type CheckInApiResult = {
  success: boolean;
  record?: CheckInRecord;
  errorType?:
    | 'NO_FACE'
    | 'PERSON_NOT_FOUND'
    | 'ALREADY_CHECKED_IN'
    | 'NO_ACTIVE_SESSION'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';
  errorMessage?: string;
};

export type CameraFacing = 'front' | 'back';
