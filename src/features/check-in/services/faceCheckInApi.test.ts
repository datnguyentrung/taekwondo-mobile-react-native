import { javaApi } from '@/infrastructure/http/httpClient';
import { faceCheckInApi } from './faceCheckInApi';

jest.mock('@/infrastructure/http/httpClient', () => ({
  javaApi: {
    post: jest.fn(),
  },
}));

describe('faceCheckInApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits captured face photo multipart to /training/face-check-in and parses student response', async () => {
    (javaApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        status: 'SUCCESS',
        action: 'STUDENT_CHECK_IN',
        person: {
          personId: 'p-100',
          fullName: 'Trần Văn A',
          personCode: 'HV00099',
          faceImagePath: 'https://example.com/avatar.jpg',
        },
        session: {
          classSessionId: 'sess-1',
          courseName: 'Lớp Taekwondo Cơ Bản K1',
          sessionDate: '2026-09-26',
          startTime: '18:00:00',
          endTime: '19:30:00',
        },
        recordId: 'rec-100',
        checkInTime: '2026-09-26T18:30:00',
        attendanceStatus: 'ON_TIME',
        message: 'Face check-in completed',
      },
    });

    const result = await faceCheckInApi.submitFaceCheckIn('/path/to/face.jpg');

    expect(javaApi.post).toHaveBeenCalledWith(
      '/training/face-check-in',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
    expect(result.success).toBe(true);
    expect(result.record?.code).toBe('HV00099');
    expect(result.record?.role).toBe('STUDENT');
    expect(result.record?.fullName).toBe('Trần Văn A');
    expect(result.record?.courseName).toBe('Lớp Taekwondo Cơ Bản K1');
    expect(result.record?.statusLabel).toBe('Đúng giờ');
  });

  it('submits captured face photo multipart and parses coach timesheet response', async () => {
    (javaApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        status: 'SUCCESS',
        action: 'COACH_CHECKED_IN',
        person: {
          personId: 'p-101',
          fullName: 'Nguyễn HLV',
          personCode: 'NV00055',
          faceImagePath: 'https://example.com/coach.jpg',
        },
        session: {
          classSessionId: 'sess-2',
          courseName: 'Lớp Đối Kháng Nâng Cao',
          sessionDate: '2026-09-26',
          startTime: '19:30:00',
          endTime: '21:00:00',
        },
        recordId: 'rec-101',
        checkInTime: '2026-09-26T19:25:00',
        attendanceStatus: null,
        message: 'Coach timesheet updated',
      },
    });

    const result = await faceCheckInApi.submitFaceCheckIn('file:///path/to/face.jpg');

    expect(result.success).toBe(true);
    expect(result.record?.code).toBe('NV00055');
    expect(result.record?.role).toBe('COACH');
    expect(result.record?.fullName).toBe('Nguyễn HLV');
    expect(result.record?.courseName).toBe('Lớp Đối Kháng Nâng Cao');
    expect(result.record?.statusLabel).toBe('Đúng giờ');
  });
});

