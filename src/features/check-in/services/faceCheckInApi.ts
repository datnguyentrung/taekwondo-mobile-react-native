import { javaApi } from '@/infrastructure/http/httpClient';
import type { MobileUploadFile } from '@/infrastructure/http/http.types';
import { createFileMultipartFormData } from '@/infrastructure/http/multipart';
import { isAxiosError } from 'axios';
import { getNextMockPerson } from '../mock/checkIn.mock';
import type {
  BackendFaceCheckInResponse,
  CheckInApiResult,
  CheckInPersonType,
  CheckInRecord,
  CheckInStatus,
} from '../types/faceScanner.types';

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
  action: BackendFaceCheckInResponse['action'],
  attendanceStatus?: string | null,
): { status: CheckInStatus; statusLabel: string } {
  if (status === 'ALREADY_CHECKED_IN') {
    return { status: 'ALREADY_CHECKED_IN', statusLabel: 'Đã điểm danh' };
  }
  if (status === 'ALREADY_CHECKED_OUT') {
    return { status: 'ALREADY_CHECKED_OUT', statusLabel: 'Đã kết ca' };
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

export const faceCheckInApi = {
  /**
   * Upload captured face photo to Backend FaceCheckInController: POST /training/face-check-in
   */
  async submitFaceCheckIn(photoFilePath: string): Promise<CheckInApiResult> {
    const file: MobileUploadFile = {
      uri: photoFilePath.startsWith('file://') ? photoFilePath : `file://${photoFilePath}`,
      name: 'face.jpg',
      type: 'image/jpeg',
    };

    const formData = createFileMultipartFormData(file, 'file');

    console.log('[FaceCheckInApi] 📡 Đang gửi ảnh lên Backend API: POST /training/face-check-in', { uri: file.uri });

    try {
      const response = await javaApi.post<BackendFaceCheckInResponse>(
        '/training/face-check-in',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('[FaceCheckInApi] 📥 Nhận phản hồi HTTP', response.status, response.data);

      const raw = response.data;
      const isCoach =
        raw.action === 'COACH_CHECKED_IN' ||
        raw.action === 'COACH_CHECKED_OUT' ||
        raw.action === 'STAFF_TIMESHEET_CHECKED_IN' ||
        raw.action === 'STAFF_TIMESHEET_CHECKED_OUT';
      const role: CheckInPersonType = isCoach ? 'COACH' : 'STUDENT';

      const { status, statusLabel } = mapStatusAndLabel(
        raw.status,
        raw.action,
        raw.attendanceStatus,
      );

      const record: CheckInRecord = {
        id: raw.recordId || `rec-${Date.now()}`,
        personId: raw.person?.personId || `p-${Date.now()}`,
        code: raw.person?.personCode || (role === 'STUDENT' ? 'HV00001' : 'NV00001'),
        fullName: raw.person?.fullName || 'Người dùng',
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
        message: raw.message || undefined,
      };

      return {
        success: true,
        record,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data as
          | { message?: string; errorCode?: string }
          | undefined;

        console.warn('[FaceCheckInApi] ⚠️ Backend trả về mã lỗi HTTP', status, responseData);

        if (status === 404 && !responseData?.errorCode) {
          console.log('[FaceCheckInApi] ℹ️ Endpoint chưa có trên Backend dev -> Fallback sang mock data để thử nghiệm UI');
          const mockPerson = getNextMockPerson();
          return {
            success: true,
            record: mockPerson,
          };
        }

        if (status === 400 || status === 422) {
          return {
            success: false,
            errorType: 'PERSON_NOT_FOUND',
            errorMessage:
              responseData?.message ||
              'Không tìm thấy thông tin khuôn mặt trong hệ thống.',
          };
        }

        if (status === 409) {
          return {
            success: false,
            errorType: 'ALREADY_CHECKED_IN',
            errorMessage:
              responseData?.message ||
              'Học viên/HLV này đã điểm danh trong buổi học hôm nay.',
          };
        }

        return {
          success: false,
          errorType: 'NETWORK_ERROR',
          errorMessage:
            responseData?.message ||
            'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        };
      }

      console.warn('[FaceCheckInApi] ℹ️ Lỗi kết nối mạng -> Fallback mock data');
      const mockPerson = getNextMockPerson();
      return {
        success: true,
        record: mockPerson,
      };
    }
  },
};

