export type CheckInPersonType = 'STUDENT' | 'COACH';

export type CheckInStatus = 'ON_TIME' | 'LATE' | 'EXCUSED';

export type ScanState = 'SCANNING' | 'ANALYZING' | 'SUCCESS' | 'ERROR';

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
};

export type CameraFacing = 'front' | 'back';
