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

  it('submits captured face photo multipart and parses successful student response', async () => {
    (javaApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Điểm danh học viên thành công',
        data: {
          id: 'rec-100',
          personId: 'p-100',
          code: 'HV00099',
          fullName: 'Trần Văn A',
          avatarUrl: 'https://example.com/avatar.jpg',
          role: 'STUDENT',
          status: 'ON_TIME',
          statusLabel: 'Đúng giờ',
          checkInTime: '18:30',
          dateLabel: 'Hôm nay',
        },
      },
    });

    const result = await faceCheckInApi.submitFaceCheckIn('/path/to/face.jpg');

    expect(javaApi.post).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.record?.code).toBe('HV00099');
    expect(result.record?.role).toBe('STUDENT');
    expect(result.record?.fullName).toBe('Trần Văn A');
  });

  it('submits captured face photo multipart and parses successful coach response', async () => {
    (javaApi.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'rec-101',
          personId: 'p-101',
          code: 'NV00055',
          fullName: 'Nguyễn HLV',
          role: 'COACH',
          status: 'ON_TIME',
          statusLabel: 'Đúng giờ',
          checkInTime: '18:35',
          dateLabel: 'Hôm nay',
        },
      },
    });

    const result = await faceCheckInApi.submitFaceCheckIn('file:///path/to/face.jpg');

    expect(result.success).toBe(true);
    expect(result.record?.code).toBe('NV00055');
    expect(result.record?.role).toBe('COACH');
    expect(result.record?.fullName).toBe('Nguyễn HLV');
  });
});
