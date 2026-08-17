export type CoachAssignmentStatus =
  | "ACTIVE" // 🟢 Đang giảng dạy
  | "SUSPENDED" // 🟡 Tạm ngưng / Bảo lưu
  | "COMPLETED" // 🔵 Hoàn thành nhiệm vụ
  | "TERMINATED" // 🔴 Chấm dứt / Hủy bỏ
  | "PENDING"; // ⚪ Dự kiến – chờ nhận lớp

export const CoachAssignmentStatusLabel: Record<CoachAssignmentStatus, string> =
  {
    ACTIVE: "Đang giảng dạy",
    SUSPENDED: "Tạm ngưng",
    COMPLETED: "Hoàn thành nhiệm vụ",
    TERMINATED: "Chấm dứt",
    PENDING: "Chờ nhận lớp",
  };
