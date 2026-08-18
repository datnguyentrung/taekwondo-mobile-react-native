import type { RoleLevel } from "@/features/roles/constants/roles.constants";

export interface AppTabConfig {
  name: string;
  label: string;
  icon: number;
  minimumRoleLevel: RoleLevel;
  display: boolean;
}

export const APP_TABS: AppTabConfig[] = [
  {
    name: "index",
    label: "Trang chủ",
    icon: require("@/assets/images/tabIcons/home.png"),
    minimumRoleLevel: 0,
    display: true,
  },
  {
    name: "explore",
    label: "Khám phá",
    icon: require("@/assets/images/tabIcons/explore.png"),
    minimumRoleLevel: 1,
    display: true,
  },
];
