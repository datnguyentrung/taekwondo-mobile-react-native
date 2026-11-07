import { javaApi } from '@/infrastructure/http/httpClient';
import { env } from '@/config/env';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { isAxiosError } from 'axios';
import type {
  BackendFaceCheckInResponse,
  CheckInFailure,
  CheckInPersonType,
  CheckInRecord,
  CheckInStatus,
  FaceCheckInRegistration,
} from '../types/faceScanner.types';

type BackendProblemDetail = {
  code?: string;
  title?: string;
  detail?: string;
  status?: number;
  correlationId?: string;
  message?: string;
  errorCode?: string;
};

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function formatCheckInTime(checkInTime?: string | null, checkOutTime?: string | null): string {
  if (checkInTime) {
    if (checkInTime.includes('T')) {
      const timePart = checkInTime.split('T')[1];
      if (timePart) return timePart.slice(0, 5);
    }
    const d = new Date(checkInTime);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return String(checkInTime).slice(0, 5);
  }
  if (checkOutTime) {
    return String(checkOutTime).slice(0, 5);
  }
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatDateLabel(sessionDate?: string | null): string {
  if (!sessionDate) return 'Hôm nay';
  const parts = sessionDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return sessionDate;
}

function mapStatusAndLabel(
  status: BackendFaceCheckInResponse['status'],
  action?: BackendFaceCheckInResponse['action'] | null,
  attendanceStatus?: string | null,
): { status: CheckInStatus; statusLabel: string } {
  if (status === 'PENDING') {
    return { status: 'ON_TIME', statusLabel: 'Đang xử lý' };
  }
  if (status === 'PROCESSING') {
    return { status: 'ON_TIME', statusLabel: 'Đang xử lý' };
  }
  if (status === 'REJECTED' || status === 'FAILED' || status === 'EXPIRED') {
    return { status: 'FAILED', statusLabel: 'Không thể điểm danh' };
  }
  if (action === 'STAFF_TIMESHEET_CHECKED_OUT' || action === 'COACH_CHECKED_OUT') {
    return { status: 'SUCCESS', statusLabel: 'Kết ca' };
  }
  if (attendanceStatus === 'LATE') {
    return { status: 'LATE', statusLabel: 'Đi muộn' };
  }
  if (attendanceStatus === 'EXCUSED') {
    return { status: 'EXCUSED', statusLabel: 'Có phép' };
  }
  return { status: 'ON_TIME', statusLabel: 'Đúng giờ' };
}

function inferRole(
  action: BackendFaceCheckInResponse['action'] | undefined | null,
  personCode?: string | null,
): CheckInPersonType {
  const isCoachAction =
    action === 'COACH_CHECKED_IN' ||
    action === 'COACH_CHECKED_OUT' ||
    action === 'STAFF_TIMESHEET_CHECKED_IN' ||
    action === 'STAFF_TIMESHEET_CHECKED_OUT';
  if (isCoachAction) return 'COACH';

  const normalizedCode = personCode?.trim().toUpperCase() ?? '';
  return normalizedCode.startsWith('VQT_') || normalizedCode.startsWith('NV')
    ? 'COACH'
    : 'STUDENT';
}

function normalizeBackendError(data: unknown): BackendProblemDetail {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as BackendProblemDetail;
}

function errorCopy(
  code: string | undefined,
  status: number | undefined,
  backend: BackendProblemDetail,
): Pick<CheckInFailure, 'errorType' | 'title' | 'message' | 'ctaLabel'> {
  const detail = backend.detail || backend.message;

  switch (code) {
    case 'FACE_NOT_DETECTED':
      return {
        errorType: 'NO_FACE',
        title: 'Không nhận được khuôn mặt',
        message: 'Vui lòng đưa khuôn mặt vào khung, giữ máy ổn định rồi thử lại.',
        ctaLabel: 'Quét lại',
      };
    case 'MULTIPLE_FACES_DETECTED':
      return {
        errorType: 'MULTIPLE_FACES',
        title: 'Có nhiều khuôn mặt',
        message: 'Chỉ để một người trong khung hình khi điểm danh.',
        ctaLabel: 'Quét lại',
      };
    case 'IMAGE_DECODE_FAILED':
    case 'INVALID_IMAGE_FILE':
    case 'EMPTY_IMAGE_FILE':
    case 'UNSUPPORTED_IMAGE_TYPE':
    case 'FILE_TOO_LARGE':
      return {
        errorType: 'INVALID_IMAGE',
        title: 'Ảnh không hợp lệ',
        message: detail || 'Ảnh chụp chưa hợp lệ. Vui lòng chụp lại.',
        ctaLabel: 'Chụp lại',
      };
    case 'FACE_NOT_MATCHED':
      return {
        errorType: 'PERSON_NOT_FOUND',
        title: 'Không khớp hồ sơ',
        message: 'Khuôn mặt chưa khớp với hồ sơ đã đăng ký. Vui lòng thử lại hoặc cập nhật ảnh khuôn mặt.',
        ctaLabel: 'Quét lại',
      };
    case 'PERSON_NOT_FOUND':
      return {
        errorType: 'PERSON_NOT_FOUND',
        title: 'Không tìm thấy hồ sơ',
        message: 'Không tìm thấy thông tin người dùng tương ứng.',
        ctaLabel: 'Quét lại',
      };
    case 'FACE_CHECK_IN_NO_ACTIVE_CONTEXT':
      return {
        errorType: 'NO_ACTIVE_SESSION',
        title: 'Không có lịch phù hợp',
        message: detail || 'Không có lịch điểm danh hoặc chấm công phù hợp tại thời điểm này.',
        ctaLabel: 'Quét người khác',
      };
    case 'FACE_CHECK_IN_AMBIGUOUS_CONTEXT':
      return {
        errorType: 'AMBIGUOUS_CONTEXT',
        title: 'Có nhiều buổi phù hợp',
        message: 'Hệ thống tìm thấy nhiều buổi có thể điểm danh. Vui lòng kiểm tra lịch học/ca làm.',
        ctaLabel: 'Quét người khác',
      };
    case 'FACE_CHECK_IN_UNSUPPORTED_CONTEXT':
    case 'FACE_CHECK_IN_PERSON_TYPE_INVALID':
      return {
        errorType: 'UNSUPPORTED_CONTEXT',
        title: 'Không thể điểm danh',
        message: detail || 'Ngữ cảnh điểm danh hiện tại không được hỗ trợ.',
        ctaLabel: 'Quét người khác',
      };
    case 'ATTENDANCE_CLOSED':
    case 'ATTENDANCE_ALREADY_CLOSED':
      return {
        errorType: 'ATTENDANCE_CLOSED',
        title: 'Điểm danh đã đóng',
        message: 'Buổi học đã đóng điểm danh.',
        ctaLabel: 'Quét người khác',
      };
    case 'FACE_CHECK_IN_ALREADY_CHECKED_IN':
      return {
        errorType: 'ALREADY_CHECKED_IN',
        title: 'Đã điểm danh trước đó',
        message: detail || 'Người này đã điểm danh trong buổi học hôm nay.',
        ctaLabel: 'Quét người khác',
      };
    case 'FACE_CHECK_IN_ALREADY_CHECKED_OUT':
      return {
        errorType: 'ALREADY_CHECKED_OUT',
        title: 'Đã kết ca trước đó',
        message: detail || 'HLV này đã kết ca trong buổi học hôm nay.',
        ctaLabel: 'Quét người khác',
      };
    case 'FACE_CHECK_IN_EXPIRED':
      return {
        errorType: 'UNKNOWN',
        title: 'Yêu cầu đã hết hạn',
        message: detail || 'Yêu cầu điểm danh đã hết thời gian xử lý. Vui lòng quét lại.',
        ctaLabel: 'Quét lại',
      };
    case 'ACCESS_DENIED':
    case 'UNAUTHORIZED':
      return {
        errorType: 'ACCESS_DENIED',
        title: 'Không có quyền điểm danh',
        message: 'Tài khoản hiện tại không có quyền thực hiện thao tác này.',
        ctaLabel: 'Đóng',
      };
    case 'MODEL_NOT_INITIALIZED':
    case 'PYTHON_BACKEND_UNAVAILABLE':
    case 'PYTHON_BACKEND_ERROR':
      return {
        errorType: 'SERVICE_UNAVAILABLE',
        title: 'Dịch vụ nhận diện tạm thời lỗi',
        message: 'Vui lòng thử lại sau ít phút.',
        ctaLabel: 'Thử lại',
      };
    default:
      if (status === 401 || status === 403) {
        return {
          errorType: 'ACCESS_DENIED',
          title: 'Không có quyền điểm danh',
          message: 'Tài khoản hiện tại không có quyền thực hiện thao tác này.',
          ctaLabel: 'Đóng',
        };
      }
      return {
        errorType: 'UNKNOWN',
        title: backend.title || 'Điểm danh thất bại',
        message: detail || 'Không thể hoàn tất điểm danh. Vui lòng thử lại.',
        ctaLabel: 'Thử lại',
      };
  }
}

export function failureFromBackend(status: number | undefined, data: unknown): CheckInFailure {
  const backend = normalizeBackendError(data);
  const code = backend.code || backend.errorCode;
  const copy = errorCopy(code, status, backend);
  return {
    ...copy,
    correlationId: backend.correlationId,
  };
}

export function failureFromFaceCheckInResponse(raw: BackendFaceCheckInResponse): CheckInFailure {
  const backend: BackendProblemDetail = {
    code: raw.error?.code ?? undefined,
    title: raw.error?.title ?? undefined,
    detail: raw.error?.detail ?? raw.message ?? undefined,
  };
  const copy = errorCopy(backend.code, undefined, backend);
  return {
    ...copy,
  };
}

export function networkFailure(): CheckInFailure {
  return {
    errorType: 'NETWORK_ERROR',
    title: 'Không kết nối được máy chủ',
    message: 'Kiểm tra mạng hoặc máy chủ backend rồi thử lại.',
    ctaLabel: 'Thử lại',
  };
}

export function mapBackendResponseToRecord(raw: BackendFaceCheckInResponse): CheckInRecord {
  if (
    !raw.person?.personId ||
    !raw.person.fullName ||
    !raw.person.personCode
  ) {
    throw new Error('Face check-in terminal result is missing recognized person data');
  }
  const role = inferRole(raw.action, raw.person?.personCode);
  const { status, statusLabel } = mapStatusAndLabel(
    raw.status,
    raw.action,
    raw.attendanceStatus,
  );

  return {
    id: raw.recordId || `rec-${Date.now()}`,
    personId: raw.person.personId,
    code: raw.person.personCode,
    fullName: raw.person.fullName,
    avatarUrl: raw.person?.faceImagePath || undefined,
    role,
    status,
    statusLabel,
    checkInTime: formatCheckInTime(raw.checkInTime, raw.checkOutTime),
    dateLabel: formatDateLabel(raw.session?.sessionDate),
    courseName: raw.session?.courseName,
    sessionTime: raw.session
      ? `${raw.session.startTime?.slice(0, 5)} - ${raw.session.endTime?.slice(0, 5)}`
      : undefined,
    timestamp: Date.now(),
    confidence: typeof raw.confidence === 'number' ? raw.confidence : undefined,
    message: raw.message || undefined,
    requestId: raw.requestId || undefined,
  };
}

export const faceCheckInApi = {
  async registerScan(
    requestId: string,
    deviceId: string,
  ): Promise<FaceCheckInRegistration> {
    const response = await javaApi.post<FaceCheckInRegistration>(
      '/training/face-check-in-scans',
      { requestId, deviceId },
    );
    return response.data;
  },

  async uploadPhotoToFog(
    photoFilePath: string,
    registration: FaceCheckInRegistration,
    signal: AbortSignal,
  ): Promise<void> {
    const photoUri = photoFilePath.startsWith('file://')
      ? photoFilePath
      : `file://${photoFilePath}`;
    const formData = new FormData();
    formData.append('file', new File(photoUri));
    formData.append('requestId', registration.requestId);
    formData.append('deviceId', registration.deviceId);
    formData.append('uploadTicket', registration.uploadTicket);

    const url = `${env.fogApiUrl}/face-check-in-scans`;
    console.log('[FaceCheckIn] uploading photo to Fog', {
      requestId: registration.requestId,
      deviceId: registration.deviceId,
      url,
    });
    let response: Response;
    try {
      response = await expoFetch(url, {
        method: 'POST',
        body: formData,
        signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      console.error('[FaceCheckIn] Fog upload network failure', {
        requestId: registration.requestId,
        url,
        error: describeError(error),
      });
      throw error;
    }
    console.log('[FaceCheckIn] Fog upload response', {
      requestId: registration.requestId,
      status: response.status,
      ok: response.ok,
    });
    if (response.ok) return;

    let problem: unknown;
    try {
      problem = await response.json();
    } catch {
      problem = { detail: `Fog trả về HTTP ${response.status}` };
    }
    console.error('[FaceCheckIn] Fog upload rejected', {
      requestId: registration.requestId,
      status: response.status,
      problem: normalizeBackendError(problem),
    });
    throw new FaceCheckInTransportError(
      failureFromBackend(response.status, problem),
    );
  },
};

export class FaceCheckInTransportError extends Error {
  constructor(readonly failure: CheckInFailure) {
    super(failure.message);
    this.name = 'FaceCheckInTransportError';
  }
}

export function toCheckInFailure(error: unknown): CheckInFailure {
  if (error instanceof FaceCheckInTransportError) return error.failure;
  if (isAxiosError(error)) {
    return error.response
      ? failureFromBackend(error.response.status, error.response.data)
      : networkFailure();
  }
  return {
    ...networkFailure(),
    detail: describeError(error),
  };
}
