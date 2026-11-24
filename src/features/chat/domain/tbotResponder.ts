import type { ChatPeer } from "../domain/chat.types";

export function formatChatTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function buildPeerReply(
  userText: string,
  peer: ChatPeer,
  hasImage = false,
): string {
  if (!peer.isBot) {
    return `Cảm ơn bạn đã nhắn tin cho ${peer.name}. Mình đã nhận được thông tin và sẽ phản hồi sớm nhất ạ!`;
  }

  const normalized = userText.trim().toLowerCase();

  if (hasImage && !normalized) {
    return "Em đã nhận được hình ảnh anh/chị gửi. Anh/chị cần em hỗ trợ kiểm tra nội dung nào từ ảnh này ạ?";
  }

  if (
    normalized.includes("học phí") ||
    normalized.includes("giá") ||
    normalized.includes("gói") ||
    normalized.includes("tiền")
  ) {
    return "CLB hiện có các gói tập theo tháng, quý và khóa cơ bản/nâng cao. Anh/chị có thể xem chi tiết học phí trong mục Khóa học hoặc để lại độ tuổi của bé để em báo gói phù hợp nhất ạ!";
  }

  if (
    normalized.includes("học thử") ||
    normalized.includes("đăng ký") ||
    normalized.includes("trải nghiệm")
  ) {
    return "Dạ CLB có buổi học thử miễn phí cho học viên mới ạ! Anh/chị cho em xin họ tên bé, độ tuổi và cơ sở muốn tập để em giữ lịch học thử nhé.";
  }

  if (
    normalized.includes("lớp") ||
    normalized.includes("tuổi") ||
    normalized.includes("thiếu nhi") ||
    normalized.includes("tư vấn")
  ) {
    return "CLB chia lớp theo độ tuổi và trình độ: Lớp Mầm non (5–6 tuổi), Lớp Cơ bản thiếu nhi (7–11 tuổi), và Lớp Thiếu niên/Nâng cao (12+ tuổi). Bé nhà mình bao nhiêu tuổi để em tư vấn ca tập phù hợp ạ?";
  }

  if (
    normalized.includes("lịch") ||
    normalized.includes("giờ") ||
    normalized.includes("thời khóa biểu")
  ) {
    return "Các lớp tập diễn ra vào các buổi chiều tối trong tuần (17h30 – 20h30) và cuối tuần. Anh/chị có thể xem chi tiết từng ca tại tab Lịch học ở thanh điều hướng phía dưới ạ.";
  }

  if (
    normalized.includes("đai") ||
    normalized.includes("thi") ||
    normalized.includes("kiểm tra")
  ) {
    return "Kỳ thi lên đai định kỳ được tổ chức mỗi quý một lần. Học viên đủ số buổi chuyên cần và hoàn thành nội dung kỹ thuật sẽ được HLV đề xuất tham gia thi ạ. 🥋";
  }

  return "Em đã ghi nhận câu hỏi của anh/chị. Anh/chị có thể chọn nhanh mục Tư vấn lớp học, Xem học phí hoặc Đăng ký học thử ở bên dưới để em hỗ trợ ngay nhé! 😊";
}
