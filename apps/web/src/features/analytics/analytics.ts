import type { PageResponse } from '@tkd/contracts'
import { javaApi } from '../../lib/javaApi'

export type AnalyticsValue = string | number | boolean | null | undefined
export type AnalyticsRow = Record<string, AnalyticsValue | AnalyticsRow[]>
export type AnalyticsResponse = Record<string, AnalyticsValue | AnalyticsRow | AnalyticsRow[]>
export type AnalyticsQuery = Record<string, string | number | boolean | string[] | number[] | undefined>

export type ReportKey =
  | 'overview' | 'movement' | 'retention' | 'classHealth' | 'attendanceRisk'
  | 'recruitment' | 'plans' | 'branches' | 'coaches' | 'development' | 'finance'

const paths: Record<ReportKey, string> = {
  overview: '/analytics/overview', movement: '/analytics/student-movements', retention: '/analytics/retention',
  classHealth: '/analytics/classes', attendanceRisk: '/analytics/attendance-risk', recruitment: '/analytics/recruitment',
  plans: '/analytics/courses-plans', branches: '/analytics/branches', coaches: '/analytics/coaches',
  development: '/analytics/development', finance: '/analytics/finance',
}

export async function getReport(key: ReportKey, params: AnalyticsQuery, signal?: AbortSignal) {
  const { data } = await javaApi.client.get<AnalyticsResponse>(paths[key], { params, signal })
  return data
}

export type DrilldownKind = 'overviewMovements' | 'movementStudents' | 'retentionStudents' | 'classStudents' | 'riskStudents' | 'recruitmentStudents' | 'planStudents' | 'branchClasses' | 'coachSessions' | 'developmentStudents' | 'transactions'
const drilldownPaths: Record<DrilldownKind, string> = {
  overviewMovements: '/analytics/overview/movements', movementStudents: '/analytics/student-movements/students',
  retentionStudents: '/analytics/retention/students', classStudents: '/analytics/classes/{id}/students',
  riskStudents: '/analytics/attendance-risk/students', recruitmentStudents: '/analytics/recruitment/students',
  planStudents: '/analytics/courses-plans/{id}/students', branchClasses: '/analytics/branches/{id}/classes',
  coachSessions: '/analytics/coaches/{id}/sessions', developmentStudents: '/analytics/development/students',
  transactions: '/analytics/finance/transactions',
}

export async function getDrilldown(kind: DrilldownKind, params: AnalyticsQuery, id?: string, signal?: AbortSignal) {
  const path = drilldownPaths[kind].replace('{id}', id ?? '')
  const { data } = await javaApi.client.get<PageResponse<AnalyticsRow>>(path, { params, signal })
  return data
}

export type ReportDefinition = {
  key: ReportKey
  nav: string
  title: string
  description: string
  summaryKey: string
  trendKey?: string
  tableKey?: string
  drilldown?: DrilldownKind
  dataNote?: string
}

export const reports: ReportDefinition[] = [
  { key: 'overview', nav: 'Tổng quan', title: 'Tổng quan điều hành', description: 'Tình hình học viên, lớp học và cảnh báo vận hành trong kỳ.', summaryKey: 'summary', trendKey: 'monthlyTrend', tableKey: 'classAlerts', drilldown: 'overviewMovements', dataNote: 'Số học viên nghỉ được xác định từ trạng thái đã nghỉ và ngày kết thúc đăng ký học gần nhất; đây chưa phải nhật ký nghỉ học đầy đủ.' },
  { key: 'movement', nav: 'Tăng giảm học viên', title: 'Tăng trưởng và biến động', description: 'Theo dõi học viên mới, quay lại, nghỉ và chuyển lớp/cơ sở.', summaryKey: 'summary', trendKey: 'monthly', tableKey: 'byClass', drilldown: 'movementStudents', dataNote: 'Đai hiển thị là đai hiện tại, không phải đai tại thời điểm học viên nghỉ.' },
  { key: 'retention', nav: 'Duy trì học viên', title: 'Duy trì và nghỉ học', description: 'Nhóm học viên, gia hạn và thời gian theo học theo phân khúc.', summaryKey: 'summary', trendKey: 'expiries', tableKey: 'bySegment', drilldown: 'retentionStudents', dataNote: 'Chưa có nhật ký biến động đầy đủ để xác nhận toàn bộ lịch sử nghỉ học.' },
  { key: 'classHealth', nav: 'Sức khỏe lớp', title: 'Sức khỏe lớp học', description: 'Sĩ số, chỗ trống, điểm danh và cảnh báo theo từng lớp.', summaryKey: 'summary', trendKey: 'monthlyTrend', tableKey: 'classes', drilldown: 'classStudents' },
  { key: 'attendanceRisk', nav: 'Điểm danh và rủi ro', title: 'Điểm danh và rủi ro', description: 'Phát hiện sớm học viên cần được liên hệ.', summaryKey: 'summary', trendKey: 'weeklyTrend', tableKey: 'byClass', drilldown: 'riskStudents', dataNote: 'Ngưỡng hệ thống: 3 buổi vắng liên tiếp, 14 ngày không đi học, hoặc điểm danh giảm 20%.' },
  { key: 'recruitment', nav: 'Tuyển sinh', title: 'Tuyển sinh và mùa vụ', description: 'Thời điểm, độ tuổi, cơ sở và lớp có cơ hội tuyển sinh.', summaryKey: 'summary', trendKey: 'monthly', tableKey: 'byClass', drilldown: 'recruitmentStudents', dataNote: 'Marketing, lead, trial và ad spend hiện chưa có dữ liệu nguồn.' },
  { key: 'plans', nav: 'Khóa và gói học', title: 'Khóa học và gói tập', description: 'Mức sử dụng, gia hạn và sức hút của khóa/gói.', summaryKey: 'summary', tableKey: 'plans', drilldown: 'planStudents' },
  { key: 'branches', nav: 'Cơ sở', title: 'Hiệu quả cơ sở', description: 'So sánh vận hành, movement và chỗ trống giữa các cơ sở.', summaryKey: 'summary', trendKey: 'monthly', tableKey: 'branches', drilldown: 'branchClasses' },
  { key: 'coaches', nav: 'Huấn luyện viên', title: 'Vận hành huấn luyện viên', description: 'Phân công, buổi dạy, bảng chấm công và điểm danh lớp phụ trách.', summaryKey: 'summary', trendKey: 'monthly', tableKey: 'coaches', drilldown: 'coachSessions' },
  { key: 'development', nav: 'Phát triển học viên', title: 'Đai và phát triển học viên', description: 'Phân bố đai, thi đai, kết quả và bài thể lực.', summaryKey: 'summary', trendKey: 'examTrend', tableKey: 'fitness', drilldown: 'developmentStudents' },
  { key: 'finance', nav: 'Tài chính', title: 'Tài chính và thương mại', description: 'Đối soát dòng tiền hợp lệ theo giao dịch, gói và cơ sở.', summaryKey: 'summary', trendKey: 'monthly', tableKey: 'byStatus', drilldown: 'transactions', dataNote: 'Không cộng top-up, purchase, add-on và refund thành một chỉ số doanh thu.' },
]

export function reportFor(key: string) { return reports.find((report) => report.key === key) ?? reports[0] }
