import type { Href } from "expo-router";

import type { PermissionValue } from "@/features/authorization";
import type { AppIconName } from "@/theme/icons";

export type AppTabName =
  | "index"
  | "activities"
  | "check-in"
  | "schedule"
  | "account"
  | "explore";

export interface AppTabConfig {
  name: AppTabName;
  label: string;
  href: Href;
  icon: AppIconName;
  activeIcon?: AppIconName;
  /**
   * Permissions required to show this tab.
   * Empty means the tab is always visible for authenticated users.
   * Wire these up when the feature behind the tab has a real screen/API.
   */
  requiredPermissions?: PermissionValue[];
  display: boolean;
  centerAction?: boolean;
}

export const APP_TABS: AppTabConfig[] = [
  {
    name: "index",
    label: "Trang chủ",
    href: "/",
    icon: "homeOutline",
    activeIcon: "homeFill",
    requiredPermissions: [],
    display: true,
  },
  {
    name: "activities",
    label: "Tính năng",
    href: "/activities",
    icon: "databaseOutline",
    activeIcon: "databaseFill",
    requiredPermissions: [],
    display: true,
  },
  {
    name: "check-in",
    label: "Quét mã",
    href: "/check-in",
    icon: "qrCode",
    requiredPermissions: [],
    display: true,
    centerAction: true,
  },
  {
    name: "schedule",
    label: "Lịch học",
    href: "/schedule",
    icon: "calendarOutline",
    activeIcon: "calendarOutline",
    requiredPermissions: [],
    display: true,
  },
  {
    name: "account",
    label: "Tài khoản",
    href: "/account",
    icon: "personOutline",
    activeIcon: "personFill",
    requiredPermissions: [],
    display: true,
  },
  {
    name: "explore",
    label: "Khám phá",
    href: "/explore",
    icon: "dashboardOutline",
    activeIcon: "dashboardFill",
    requiredPermissions: [],
    display: false,
  },
];

export const VISIBLE_APP_TABS = APP_TABS.filter((tab) => tab.display);
