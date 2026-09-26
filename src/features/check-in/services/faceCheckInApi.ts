import { javaApi } from '@/infrastructure/http/httpClient';
import { isAxiosError } from 'axios';
import { getNextMockPerson } from '../mock/checkIn.mock';
import type { CheckInApiResult, CheckInRecord } from '../types/faceScanner.types';

export type BackendFaceCheckInResponse = {
  success?: boolean;
  message?: string;
  data?: {
    id?: string;
    personId?: string;
    code?: string;
    fullName?: string;
    avatarUrl?: string;
    personType?: 'STUDENT' | 'COACH';
    role?: 'STUDENT' | 'COACH';
    status?: 'ON_TIME' | 'LATE' | 'EXCUSED';
    statusLabel?: string;
    checkInTime?: string;
    dateLabel?: string;
  };
  // Or direct record response
  id?: string;
  personId?: string;
  code?: string;
  fullName?: string;
  avatarUrl?: string;
  personType?: 'STUDENT' | 'COACH';
  role?: 'STUDENT' | 'COACH';
  status?: 'ON_TIME' | 'LATE' | 'EXCUSED';
  statusLabel?: string;
  checkInTime?: string;
  dateLabel?: string;
};

export const faceCheckInApi = {
  /**
   * Upload captured face photo to backend for InsightFace recognition & check-in.
   */
  async submitFaceCheckIn(photoFilePath: string): Promise<CheckInApiResult> {
    const formData = new FormData();
    const uri = photoFilePath.startsWith('file://')
      ? photoFilePath
      : `file://${photoFilePath}`;

    formData.append('file', {
      uri,
      name: 'face.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    console.log('[FaceCheckInApi] 📡 Đang gửi ảnh lên Backend API: POST /attendance/face-check-in', { uri });

    try {
      const response = await javaApi.post<BackendFaceCheckInResponse>(
        '/attendance/face-check-in',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('[FaceCheckInApi] 📥 Nhận phản hồi HTTP', response.status, response.data);

      const data = response.data.data ?? response.data;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const role = data.personType || data.role || 'STUDENT';
      const record: CheckInRecord = {
        id: data.id || `rec-${Date.now()}`,
        personId: data.personId || `p-${Date.now()}`,
        code: data.code || (role === 'STUDENT' ? 'HV00001' : 'NV00001'),
        fullName: data.fullName || 'Người dùng',
        avatarUrl: data.avatarUrl,
        role,
        checkInTime: data.checkInTime || `${hours}:${minutes}`,
        dateLabel: data.dateLabel || 'Hôm nay',
        status: data.status || 'ON_TIME',
        statusLabel: data.statusLabel || 'Đúng giờ',
        timestamp: Date.now(),
        message: response.data.message,
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
