export type SessionStatus =
  | "ACTIVE" // Đang diễn ra
  | "CANCELLED" // Đã hủy
  | "COMPLETED" // Đã hoàn thành
  | "SCHEDULED" // Đã lên lịch
  | "POSTPONED" // Đã hoãn
  | "TERMINATED"; // Đã chấm dứt / Hủy bỏ

export const SessionStatusLabel: Record<SessionStatus, string> = {
  ACTIVE: "Đang diễn ra",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  SCHEDULED: "Đã lên lịch",
  POSTPONED: "Đã hoãn",
  TERMINATED: "Đã chấm dứt",
};
