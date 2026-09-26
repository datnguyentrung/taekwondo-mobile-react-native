import type { Face } from 'react-native-vision-camera-face-detector';
import {
  FACE_QUALITY_MESSAGES,
  FACE_SCANNER_CONFIG,
} from '../constants/faceScannerConfig';
import type {
  FaceDetectionRecord,
  FaceQualityReason,
  FaceQualityResult,
} from '../types/faceScanner.types';

/**
 * Checks if exactly one face is detected.
 */
export function isSingleFace(faces: Face[]): boolean {
  return faces.length === 1;
}

/**
 * Checks if the face area is sufficiently large relative to the frame.
 */
export function isFaceLargeEnough(
  face: Face,
  minRatio: number = FACE_SCANNER_CONFIG.MIN_FACE_AREA_RATIO,
): boolean {
  const frameWidth = face.frameWidth || 1;
  const frameHeight = face.frameHeight || 1;
  const frameArea = frameWidth * frameHeight;
  const faceArea = face.bounds.width * face.bounds.height;

  if (frameArea <= 0) return false;
  return faceArea / frameArea >= minRatio;
}

/**
 * Checks if the face is not excessively close or clipping.
 */
export function isFaceSmallEnough(
  face: Face,
  maxRatio: number = FACE_SCANNER_CONFIG.MAX_FACE_AREA_RATIO,
): boolean {
  const frameWidth = face.frameWidth || 1;
  const frameHeight = face.frameHeight || 1;
  const frameArea = frameWidth * frameHeight;
  const faceArea = face.bounds.width * face.bounds.height;

  if (frameArea <= 0) return true;
  return faceArea / frameArea <= maxRatio;
}

/**
 * Checks if the face center is situated comfortably inside the scan region.
 */
export function isFaceInsideScanRegion(
  face: Face,
  region = FACE_SCANNER_CONFIG.SCAN_REGION,
): boolean {
  const frameWidth = face.frameWidth || 1;
  const frameHeight = face.frameHeight || 1;

  const centerX = (face.bounds.x + face.bounds.width / 2) / frameWidth;
  const centerY = (face.bounds.y + face.bounds.height / 2) / frameHeight;

  return (
    centerX >= region.minX &&
    centerX <= region.maxX &&
    centerY >= region.minY &&
    centerY <= region.maxY
  );
}

/**
 * Checks if the head pose angles (yaw, roll, pitch) are within tolerance.
 */
export function isFaceAngleAcceptable(
  face: Face,
  maxYaw: number = FACE_SCANNER_CONFIG.MAX_HEAD_YAW,
  maxRoll: number = FACE_SCANNER_CONFIG.MAX_HEAD_ROLL,
  maxPitch: number = FACE_SCANNER_CONFIG.MAX_HEAD_PITCH,
): boolean {
  const yaw = Math.abs(face.yawAngle || 0);
  const roll = Math.abs(face.rollAngle || 0);
  const pitch = Math.abs(face.pitchAngle || 0);

  return yaw <= maxYaw && roll <= maxRoll && pitch <= maxPitch;
}

/**
 * Checks if face has been stably detected for at least `minDurationMs` without jumping around.
 */
export function isFaceStable(
  history: FaceDetectionRecord[],
  minDurationMs: number = FACE_SCANNER_CONFIG.STABILITY_DURATION_MS,
  minFrames: number = FACE_SCANNER_CONFIG.STABILITY_MIN_FRAMES,
  maxDrift: number = FACE_SCANNER_CONFIG.MAX_POSITION_DRIFT_RATIO,
): boolean {
  if (history.length < minFrames) {
    return false;
  }

  const oldest = history[0];
  const newest = history[history.length - 1];
  const duration = newest.timestamp - oldest.timestamp;

  if (duration < minDurationMs) {
    return false;
  }

  // Check if tracking ID changed (if provided by ML Kit)
  if (
    oldest.trackingId !== undefined &&
    newest.trackingId !== undefined &&
    oldest.trackingId !== newest.trackingId
  ) {
    return false;
  }

  // Check position drift between the first and latest frame
  const dx = Math.abs(newest.centerX - oldest.centerX);
  const dy = Math.abs(newest.centerY - oldest.centerY);

  return dx <= maxDrift && dy <= maxDrift;
}

/**
 * Evaluates all Quality Gate conditions for a frame of detected faces.
 */
export function evaluateFaceQuality(
  faces: Face[],
  history: FaceDetectionRecord[] = [],
): FaceQualityResult {
  if (faces.length === 0) {
    return {
      isValid: false,
      reason: 'NO_FACE',
      feedbackText: FACE_QUALITY_MESSAGES.NO_FACE,
    };
  }

  if (faces.length > 1) {
    return {
      isValid: false,
      reason: 'MULTIPLE_FACES',
      feedbackText: FACE_QUALITY_MESSAGES.MULTIPLE_FACES,
    };
  }

  const face = faces[0];

  if (!isFaceLargeEnough(face)) {
    return {
      isValid: false,
      reason: 'FACE_TOO_SMALL',
      feedbackText: FACE_QUALITY_MESSAGES.FACE_TOO_SMALL,
      face,
    };
  }

  if (!isFaceSmallEnough(face)) {
    return {
      isValid: false,
      reason: 'FACE_TOO_LARGE',
      feedbackText: FACE_QUALITY_MESSAGES.FACE_TOO_LARGE,
      face,
    };
  }

  if (!isFaceInsideScanRegion(face)) {
    return {
      isValid: false,
      reason: 'FACE_OUT_OF_BOUNDS',
      feedbackText: FACE_QUALITY_MESSAGES.FACE_OUT_OF_BOUNDS,
      face,
    };
  }

  if (!isFaceAngleAcceptable(face)) {
    return {
      isValid: false,
      reason: 'FACE_ANGLE_BAD',
      feedbackText: FACE_QUALITY_MESSAGES.FACE_ANGLE_BAD,
      face,
    };
  }

  if (!isFaceStable(history)) {
    return {
      isValid: false,
      reason: 'FACE_NOT_STABLE',
      feedbackText: FACE_QUALITY_MESSAGES.FACE_NOT_STABLE,
      face,
    };
  }

  return {
    isValid: true,
    reason: 'VALID',
    feedbackText: FACE_QUALITY_MESSAGES.VALID,
    face,
  };
}

/**
 * Helper to convert Face into a detection record for stability tracking.
 */
export function createDetectionRecord(face: Face): FaceDetectionRecord {
  const frameWidth = face.frameWidth || 1;
  const frameHeight = face.frameHeight || 1;

  return {
    timestamp: Date.now(),
    centerX: (face.bounds.x + face.bounds.width / 2) / frameWidth,
    centerY: (face.bounds.y + face.bounds.height / 2) / frameHeight,
    width: face.bounds.width / frameWidth,
    height: face.bounds.height / frameHeight,
    trackingId: face.trackingId,
  };
}
