import type { FaceCheckInStage } from '../types/faceScanner.types';

const STAGE_MESSAGES: Record<FaceCheckInStage, string> = {
  READY: 'Máy chủ đã sẵn sàng, đang gửi ảnh...',
  IMAGE_RECEIVED: 'Fog đã nhận ảnh, đang kiểm tra khuôn mặt...',
  FACE_DETECTED: 'Đã phát hiện khuôn mặt, đang tạo đặc trưng...',
  EMBEDDING_READY: 'Đã tạo đặc trưng khuôn mặt, đang đối chiếu...',
  MATCH_FOUND: 'Đã nhận diện người dùng, đang kiểm tra điều kiện...',
  ELIGIBILITY_CHECKED: 'Đủ điều kiện điểm danh, đang lưu kết quả...',
  ATTENDANCE_SAVED: 'Đã lưu điểm danh, đang hoàn tất...',
  SUCCEEDED: 'Điểm danh thành công.',
  REJECTED: 'Yêu cầu điểm danh không được chấp nhận.',
  FAILED: 'Không thể hoàn tất điểm danh.',
  EXPIRED: 'Yêu cầu điểm danh đã hết hạn.',
};

export function faceCheckInStageMessage(stage: FaceCheckInStage): string {
  return STAGE_MESSAGES[stage];
}

export function isFaceCheckInStage(value: unknown): value is FaceCheckInStage {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(STAGE_MESSAGES, value)
  );
}

export function isTerminalFaceCheckInStage(stage: FaceCheckInStage): boolean {
  return (
    stage === 'SUCCEEDED' ||
    stage === 'REJECTED' ||
    stage === 'FAILED' ||
    stage === 'EXPIRED'
  );
}
