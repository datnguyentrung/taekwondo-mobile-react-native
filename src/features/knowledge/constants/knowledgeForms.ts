import type {
  ConceptCategory,
  DiscountType,
  EnrollmentChannel,
  FacilityCategory,
  KnowledgeFormMeta,
  KnowledgeFormType,
  PolicyCategory,
  SelectOption,
  TargetAudience,
  TargetGoal,
} from "../domain/knowledge.types";

export const KNOWLEDGE_FORM_ITEMS: readonly KnowledgeFormMeta[] = [
  {
    id: "center-profile",
    title: "Hồ sơ & Liên hệ Trung tâm",
    shortTitle: "Hồ sơ &\nLiên hệ\nTrung tâm",
    description: "Giới thiệu, lịch sử, tầm nhìn, sứ mệnh và các kênh liên hệ.",
    image: require("../../../../assets/images/knowledge/CenterProfile.png"),
    layout: "half",
  },
  {
    id: "facility-item",
    title: "Cơ sở vật chất",
    shortTitle: "Cơ sở\nvật chất",
    description: "Thảm tập, giáp bảo hộ, trang thiết bị và tiện ích phòng tập.",
    image: require("../../../../assets/images/knowledge/FacilityItem.png"),
    layout: "half",
  },
  {
    id: "policy-rule",
    title: "Chính sách & Nội quy",
    shortTitle: "Chính sách\n& Nội quy",
    description: "Học thử, giờ mở cửa, nội quy, nghỉ bù, thi đai, học phí, thanh toán.",
    image: require("../../../../assets/images/knowledge/PolicyRule.png"),
    layout: "half",
  },
  {
    id: "class-suitability",
    title: "Tư vấn Lớp học & Giáo trình",
    shortTitle: "Tư vấn\nLớp học &\nGiáo trình",
    description: "Độ tuổi, mục tiêu tập luyện và nội dung giáo trình chi tiết.",
    image: require("../../../../assets/images/knowledge/ClassSuitability.png"),
    layout: "half",
  },
  {
    id: "enrollment-step",
    title: "Quy trình Đăng ký",
    shortTitle: "Quy trình\nĐăng ký",
    description: "Các bước đăng ký nhập học và hồ sơ cần chuẩn bị.",
    image: require("../../../../assets/images/knowledge/EnrollmentStep.png"),
    layout: "half",
  },
  {
    id: "taekwondo-concept",
    title: "Kiến thức Chuyên môn & Lợi ích",
    shortTitle: "Kiến thức\nChuyên môn\n& Lợi ích",
    description: "Đòn thế, luật thi đấu, thuật ngữ và lợi ích tập võ.",
    image: require("../../../../assets/images/knowledge/TaekwondoConcept.png"),
    layout: "half",
  },
  {
    id: "poomsae",
    title: "Bài quyền",
    shortTitle: "Bài quyền",
    description: "Danh mục bài quyền Taekwondo, số động tác và cấp độ.",
    image: require("../../../../assets/images/knowledge/Poomsae.png"),
    layout: "half",
  },
  {
    id: "belt-rank",
    title: "Hệ thống Cấp đai",
    shortTitle: "Hệ thống\nCấp đai",
    description: "Thứ tự đai, màu sắc, ý nghĩa và yêu cầu thăng cấp.",
    image: require("../../../../assets/images/knowledge/BeltRank.png"),
    layout: "half",
  },
  {
    id: "discount-rule",
    title: "Quy tắc Ưu đãi & Tính học phí",
    shortTitle: "Quy tắc\nƯu đãi &\nTính học phí",
    description: "Chính sách giảm giá theo tháng, nhóm học viên và mã khuyến mãi.",
    image: require("../../../../assets/images/knowledge/DiscountRule.png"),
    layout: "half",
  },
] as const;

export const KNOWLEDGE_FORM_BY_ID: Record<KnowledgeFormType, KnowledgeFormMeta> =
  KNOWLEDGE_FORM_ITEMS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<KnowledgeFormType, KnowledgeFormMeta>,
  );

export const FACILITY_CATEGORY_OPTIONS: readonly SelectOption<FacilityCategory>[] = [
  { value: "MAT", label: "Thảm tập", description: "Thảm EVA, thảm thi đấu" },
  { value: "ARMOR", label: "Giáp & Bảo hộ", description: "Giáp thân, mũ, bảo hộ tay chân" },
  { value: "EQUIPMENT", label: "Dụng cụ tập", description: "Bao cát, đích đá, vợt đá" },
  { value: "ROOM_AMENITY", label: "Tiện ích phòng tập", description: "Điều hòa, tủ đồ, khu chờ phụ huynh" },
  { value: "SAFETY", label: "An toàn & Y tế", description: "Tủ thuốc, camera, phòng cháy chữa cháy" },
];

export const POLICY_CATEGORY_OPTIONS: readonly SelectOption<PolicyCategory>[] = [
  { value: "TRIAL", label: "Chính sách Học thử", description: "Điều kiện, chi phí buổi học thử" },
  { value: "OPENING_HOURS", label: "Giờ mở cửa", description: "Thời gian hoạt động theo ngày" },
  { value: "TRAINING_CONDUCT", label: "Nội quy tập luyện", description: "Trang phục, kỷ luật lớp học" },
  { value: "LEAVE_MAKEUP", label: "Nghỉ phép & Học bù", description: "Quy định xin phép và xếp lịch bù" },
  { value: "BELT_EXAM", label: "Quy định Thi lên đai", description: "Điều kiện dự thi và chấm điểm" },
  { value: "TUITION", label: "Chính sách Học phí", description: "Bảo lưu, hoàn phí, chuyển gói" },
  { value: "PAYMENT", label: "Phương thức Thanh toán", description: "Chuyển khoản, tiền mặt, thời hạn" },
];

export const TARGET_GOAL_OPTIONS: readonly SelectOption<TargetGoal>[] = [
  { value: "FITNESS", label: "Rèn thể lực" },
  { value: "SELF_DEFENSE", label: "Tự vệ" },
  { value: "COMPETITION", label: "Thi đấu" },
  { value: "RECREATIONAL", label: "Phong trào" },
  { value: "DISCIPLINE", label: "Kỷ luật & Tập trung" },
];

export const ENROLLMENT_CHANNEL_OPTIONS: readonly SelectOption<EnrollmentChannel>[] = [
  { value: "ONLINE", label: "Trực tuyến" },
  { value: "OFFLINE", label: "Trực tiếp tại cơ sở" },
  { value: "HYBRID", label: "Trực tuyến và tại cơ sở" },
];

export const CONCEPT_CATEGORY_OPTIONS: readonly SelectOption<ConceptCategory>[] = [
  { value: "TECHNIQUE", label: "Kỹ thuật / Đòn thế", description: "Đá, đấm, đỡ, tấn pháp" },
  { value: "RULE", label: "Luật thi đấu", description: "Quy tắc đối kháng, quyền" },
  { value: "TERMINOLOGY", label: "Thuật ngữ Taekwondo", description: "Khẩu lệnh, thuật ngữ tiếng Hàn" },
  { value: "BENEFIT", label: "Lợi ích tập võ", description: "Thể chất, tinh thần, kỹ năng sống" },
];

export const TARGET_AUDIENCE_OPTIONS: readonly SelectOption<TargetAudience>[] = [
  { value: "ALL", label: "Tất cả đối tượng" },
  { value: "KIDS", label: "Thiếu nhi" },
  { value: "TEENS", label: "Thanh thiếu niên" },
  { value: "ADULTS", label: "Người lớn" },
];

export const DISCOUNT_TYPE_OPTIONS: readonly SelectOption<DiscountType>[] = [
  { value: "PERCENTAGE", label: "Giảm theo %", description: "Từ 1% đến 100%" },
  { value: "FIXED_AMOUNT", label: "Giảm số tiền cố định (VNĐ)", description: "Trừ trực tiếp vào tổng tiền" },
];

export const WEEKDAY_KEYS = [
  { key: "MON", label: "Thứ 2" },
  { key: "TUE", label: "Thứ 3" },
  { key: "WED", label: "Thứ 4" },
  { key: "THU", label: "Thứ 5" },
  { key: "FRI", label: "Thứ 6" },
  { key: "SAT", label: "Thứ 7" },
  { key: "SUN", label: "Chủ nhật" },
] as const;
