import { formatVnd } from '@tkd/utils'
import type { AnalyticsRow, AnalyticsValue } from './analytics'

const words: Record<string, string> = {
  activeStudents: 'Đang học', newStudents: 'Học viên mới', reactivatedStudents: 'Học viên quay lại', inferredLeavers: 'Học viên nghỉ',
  netMovement: 'Tăng giảm ròng', retentionRate: 'Duy trì', attendanceRate: 'Điểm danh', atRiskStudents: 'Nguy cơ nghỉ',
  renewalsDue: 'Sắp gia hạn', averageFillRate: 'Lấp đầy TB', approvedRevenue: 'Giao dịch hợp lệ',
  approvedTopUpAmount: 'Nạp ví duyệt', approvedPlanPurchaseAmount: 'Mua gói duyệt', approvedAddonPurchaseAmount: 'Add-on duyệt', approvedRefundAmount: 'Hoàn tiền duyệt',
  approvedTransactionCount: 'Giao dịch duyệt', excludedMigrationTransactionCount: 'Loại giao dịch chuyển đổi dữ liệu', eligibleStudents: 'Đủ điều kiện',
  inferredLeaveRate: 'Tỷ lệ học viên nghỉ', renewalRate: 'Gia hạn', medianTenureDays: 'Thời gian học trung bình', earlyDepartureCount: 'Rời học sớm',
  totalClasses: 'Tổng lớp', classesWithDecline: 'Lớp giảm', classesAtRisk: 'Lớp rủi ro', totalActiveRoster: 'Sĩ số hoạt động',
  averageAttendanceRate: 'Điểm danh TB', expectedAttendances: 'Lượt dự kiến', presentCount: 'Có mặt', absentCount: 'Vắng', highRiskStudents: 'Rủi ro cao',
  firstTimeStudents: 'Học viên lần đầu', averageMonthlyIntake: 'Tuyển mới TB', availableSeats: 'Chỗ trống', validPurchases: 'Gói hợp lệ',
  activeEnrollments: 'Đăng ký học đang hoạt động', sessionUtilizationRate: 'Sử dụng buổi học', operatingBranches: 'Cơ sở hoạt động', totalActiveStudents: 'Tổng đang học',
  totalInferredLeavers: 'Tổng học viên nghỉ', systemAttendanceRate: 'Điểm danh hệ thống', assignedCoaches: 'Huấn luyện viên được phân công', assignedSessions: 'Buổi được phân công',
  completedSessions: 'Buổi hoàn thành', missingTimesheets: 'Thiếu bảng chấm công', timesheetCoverageRate: 'Đủ bảng chấm công', examParticipants: 'Học viên dự thi',
  examAttempts: 'Lượt thi', passedAttempts: 'Đạt', passRate: 'Tỷ lệ đạt', fitnessParticipants: 'Tham gia thể lực', fitnessRecordCount: 'Bản ghi thể lực',
  month: 'Tháng', week: 'Tuần', date: 'Ngày', age: 'Tuổi', gender: 'Giới tính', belt: 'Đai', level: 'Cấp độ',
  personId: 'Mã định danh học viên', personCode: 'Mã học viên', fullName: 'Họ và tên', birthDate: 'Ngày sinh', ageAtEvent: 'Tuổi tại thời điểm biến động',
  personStatus: 'Trạng thái học viên', eventType: 'Loại biến động', eventDate: 'Ngày biến động', currentBelt: 'Đai hiện tại',
  courseName: 'Khóa học', courseScheduleId: 'Mã lớp', scheduleLabel: 'Lớp học', branchId: 'Mã cơ sở', branchName: 'Cơ sở',
  trainingPlanId: 'Mã gói tập', coachPersonId: 'Mã huấn luyện viên', coachName: 'Huấn luyện viên', enrollmentStatus: 'Trạng thái đăng ký',
  unknownLeaveDateCount: 'Chưa xác định ngày nghỉ', provisionalDateCount: 'Ngày dữ liệu tạm tính', historicalStatusLimitation: 'Lưu ý dữ liệu lịch sử',
  inferredLeaveDate: 'Ngày kết thúc học gần nhất', leaveDateSource: 'Nguồn ngày nghỉ', leaveDateQuality: 'Độ tin cậy ngày nghỉ',
  transferIn: 'Chuyển đến', transferOut: 'Chuyển đi', byMonthAndAge: 'Tăng giảm theo tháng và tuổi',
}

const values: Record<string, string> = {
  MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác', UNKNOWN: 'Chưa xác định',
  NEW: 'Học viên mới', REACTIVATED: 'Học viên quay lại', INFERRED_LEFT: 'Học viên nghỉ', TRANSFER_IN: 'Chuyển đến', TRANSFER_OUT: 'Chuyển đi',
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Đã nghỉ', CURRENT_BELT: 'Đai hiện tại', LAST_ENROLLMENT_END_DATE: 'Ngày kết thúc đăng ký học gần nhất',
  LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao', PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', EXCUSED: 'Có phép',
  LOW_ATTENDANCE: 'Điểm danh thấp', DECLINING_ATTENDANCE: 'Điểm danh giảm', RECENT_LEAVERS: 'Có học viên nghỉ gần đây',
  'Current person.status is used for inferred leave; it is not a complete historical event log.': 'Trạng thái học viên và ngày kết thúc đăng ký học gần nhất được dùng để xác định học viên nghỉ; đây chưa phải nhật ký nghỉ học đầy đủ.',
}

export function label(key: string) { return words[key] ?? values[key] ?? 'Thông tin' }
export function isRate(key: string) { return /rate|utilization/i.test(key) }
export function isMoney(key: string) { return /amount|revenue|price|balance/i.test(key) }
export function formatValue(value: AnalyticsValue | unknown[], key = ''): string {
  if (value === null || value === undefined) return 'Chưa có dữ liệu'
  if (Array.isArray(value)) return value.length ? value.map((item) => values[String(item)] ?? String(item)).join(', ') : 'Không có'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (typeof value === 'number') {
    if (isRate(key)) return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 }).format(value)
    if (isMoney(key)) return formatVnd(value)
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
  }
  return values[value] ?? value
}
export function asRows(value: unknown): AnalyticsRow[] { return Array.isArray(value) ? value.filter((row): row is AnalyticsRow => !!row && typeof row === 'object') : [] }
export function asRecord(value: unknown): AnalyticsRow { return value && typeof value === 'object' && !Array.isArray(value) ? value as AnalyticsRow : {} }
