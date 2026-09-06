import type { Href } from 'expo-router';

import type { RoleLevel } from '@/features/roles/constants/roles.constants';
import type { AppIconName } from '@/theme/icons';

export type AppTabName =
  | 'index'
  | 'activities'
  | 'check-in'
  | 'schedule'
  | 'account'
  | 'explore';

export interface AppTabConfig {
  name: AppTabName;
  label: string;
  href: Href;
  icon: AppIconName;
  activeIcon?: AppIconName;
  minimumRoleLevel: RoleLevel;
  display: boolean;
  centerAction?: boolean;
}

export const APP_TABS: AppTabConfig[] = [
  {
    name: 'index',
    label: 'Trang chủ',
    href: '/',
    icon: 'homeOutline',
    activeIcon: 'homeFill',
    minimumRoleLevel: 0,
    display: true,
  },
  {
    name: 'activities',
    label: 'Tính năng',
    href: '/activities',
    icon: 'databaseOutline',
    activeIcon: 'databaseFill',
    minimumRoleLevel: 0,
    display: true,
  },
  {
    name: 'check-in',
    label: 'Quét mã',
    href: '/check-in',
    icon: 'qrCode',
    minimumRoleLevel: 0,
    display: true,
    centerAction: true,
  },
  {
    name: 'schedule',
    label: 'Lịch học',
    href: '/schedule',
    icon: 'calendarOutline',
    activeIcon: 'calendar',
    minimumRoleLevel: 0,
    display: true,
  },
  {
    name: 'account',
    label: 'Tài khoản',
    href: '/account',
    icon: 'personOutline',
    activeIcon: 'personFill',
    minimumRoleLevel: 1,
    display: true,
  },
  {
    name: 'explore',
    label: 'Khám phá',
    href: '/explore',
    icon: 'dashboardOutline',
    activeIcon: 'dashboardFill',
    minimumRoleLevel: 1,
    display: false,
  },
];

export const VISIBLE_APP_TABS = APP_TABS.filter((tab) => tab.display);
