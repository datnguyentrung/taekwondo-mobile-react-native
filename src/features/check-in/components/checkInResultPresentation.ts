import type { ImageSourcePropType } from "react-native";

import { Colors } from "@/theme";

import type {
  CheckInErrorType,
  CheckInFailure,
  CheckInRecord,
} from "../types/faceScanner.types";

export type CheckInResultArtworkGroup =
  | "G01"
  | "G02"
  | "G03"
  | "G04"
  | "G05"
  | "G06"
  | "G07"
  | "G08";

type CheckInResultPresentation = {
  artworkGroup: CheckInResultArtworkGroup;
  artwork: ImageSourcePropType;
  title: string;
  message: string;
  accentColor: string;
  ctaLabel: string;
};

const ARTWORK_BY_GROUP: Record<CheckInResultArtworkGroup, ImageSourcePropType> = {
  G01: require("../../../../assets/images/attendance/G01_Thanh_cong.png"),
  G02: require("../../../../assets/images/attendance/G02_Lich_ca_khong_phu_hop.png"),
  G03: require("../../../../assets/images/attendance/G03_Da_ghi_nhan.png"),
  G04: require("../../../../assets/images/attendance/G04_Khong_xac_dinh_danh_tinh.png"),
  G05: require("../../../../assets/images/attendance/G05_Anh_dau_vao_khong_dat.png"),
  G06: require("../../../../assets/images/attendance/G06_Luot_quet_het_han.png"),
  G07: require("../../../../assets/images/attendance/G07_Loi_ky_thuat.png"),
  G08: require("../../../../assets/images/attendance/G08_Khong_co_quyen.png"),
};

const FAILURE_GROUP_BY_TYPE: Record<CheckInErrorType, CheckInResultArtworkGroup> = {
  NO_FACE: "G05",
  MULTIPLE_FACES: "G05",
  INVALID_IMAGE: "G05",
  PERSON_NOT_FOUND: "G04",
  ALREADY_CHECKED_IN: "G03",
  ALREADY_CHECKED_OUT: "G03",
  NO_ACTIVE_SESSION: "G02",
  AMBIGUOUS_CONTEXT: "G02",
  UNSUPPORTED_CONTEXT: "G02",
  ATTENDANCE_CLOSED: "G02",
  EXPIRED: "G06",
  ACCESS_DENIED: "G08",
  SERVICE_UNAVAILABLE: "G07",
  NETWORK_ERROR: "G07",
  UNKNOWN: "G07",
};

function successMessage(record: CheckInRecord): string {
  if (record.role === "COACH") {
    return record.statusLabel === "Kết ca"
      ? "Đã ghi nhận thời gian kết ca cho huấn luyện viên."
      : "Đã ghi nhận thời gian vào ca cho huấn luyện viên."
  }

  return record.status === "LATE"
    ? "Đã ghi nhận học viên đi muộn trong buổi học này."
    : "Đã ghi nhận điểm danh cho học viên."
}

export function getCheckInResultPresentation(
  record: CheckInRecord | null,
  failure?: CheckInFailure | null,
): CheckInResultPresentation {
  if (!failure) {
    const artworkGroup = "G01";
    return {
      artworkGroup,
      artwork: ARTWORK_BY_GROUP[artworkGroup],
      title: "Điểm danh thành công",
      message: record
        ? successMessage(record)
        : "Đã ghi nhận kết quả điểm danh.",
      accentColor: Colors.light.success,
      ctaLabel: "Quét người tiếp theo",
    };
  }

  const artworkGroup = FAILURE_GROUP_BY_TYPE[failure.errorType];
  return {
    artworkGroup,
    artwork: ARTWORK_BY_GROUP[artworkGroup],
    title: failure.title,
    message: failure.message,
    accentColor:
      artworkGroup === "G03" ? Colors.light.warning : Colors.light.primary,
    ctaLabel: failure.ctaLabel,
  };
}
