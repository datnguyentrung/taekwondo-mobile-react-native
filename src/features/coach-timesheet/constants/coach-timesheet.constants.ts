export type CoachTimesheetStatus =
  | "PENDING" // Chờ duyệt
  | "APPROVED" // Đã duyệt
  | "REJECTED" // Bị từ chối
  | "CHECKED_IN"; // Đã check-in

export const CoachTimesheetStatusLabel: Record<CoachTimesheetStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CHECKED_IN: "Đã check-in",
};
