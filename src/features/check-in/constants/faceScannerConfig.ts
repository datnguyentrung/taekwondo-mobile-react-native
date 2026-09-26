export const FACE_SCANNER_CONFIG = {
  /**
   * Minimum ratio of face bounding box area relative to frame area (0..1).
   * ~0.10 ensures user is close enough to camera for accurate InsightFace recognition.
   */
  MIN_FACE_AREA_RATIO: 0.10,

  /**
   * Maximum ratio of face bounding box area relative to frame area (0..1).
   * Prevents capturing when face is too close to camera or clipped.
   */
  MAX_FACE_AREA_RATIO: 0.75,

  /**
   * Maximum allowed yaw angle in degrees (head turning left/right).
   */
  MAX_HEAD_YAW: 20,

  /**
   * Maximum allowed roll angle in degrees (head tilting sideways).
   */
  MAX_HEAD_ROLL: 20,

  /**
   * Maximum allowed pitch angle in degrees (head looking up/down).
   */
  MAX_HEAD_PITCH: 20,

  /**
   * Minimum duration in milliseconds that a valid face must remain stable before capture.
   */
  STABILITY_DURATION_MS: 350,

  /**
   * Minimum number of consecutive frames required for stability check.
   */
  STABILITY_MIN_FRAMES: 2,

  /**
   * Maximum normalized coordinate drift between frames to be considered stable.
   */
  MAX_POSITION_DRIFT_RATIO: 0.15,

  /**
   * Cooldown period after completing a check-in before next scan can be triggered.
   */
  CAPTURE_COOLDOWN_MS: 1500,

  /**
   * Normalized region of the frame where face must be centered.
   */
  SCAN_REGION: {
    minX: 0.10,
    maxX: 0.90,
    minY: 0.08,
    maxY: 0.92,
  },
} as const;

export const FACE_QUALITY_MESSAGES = {
  NO_FACE: 'Đang nhận diện...',
  MULTIPLE_FACES: 'Chỉ một người đứng trước camera',
  FACE_TOO_SMALL: 'Vui lòng lại gần camera hơn',
  FACE_TOO_LARGE: 'Vui lòng lùi xa camera một chút',
  FACE_OUT_OF_BOUNDS: 'Vui lòng đưa khuôn mặt vào giữa khung hình',
  FACE_ANGLE_BAD: 'Vui lòng nhìn thẳng vào camera',
  FACE_NOT_STABLE: 'Giữ yên khuôn mặt...',
  VALID: 'Đang xử lý...',
} as const;
