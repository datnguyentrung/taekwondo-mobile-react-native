import activity from '../../assets/icons/figma/activity.svg';
import barChart from '../../assets/icons/figma/bar-chart.svg';
import bellOutline from '../../assets/icons/figma/bell-outline.svg';
import calendar from '../../assets/icons/figma/calendar.svg';
import calendarAlt from '../../assets/icons/figma/calendar-alt.svg';
import calendarOutline from '../../assets/icons/figma/calendar-outline.svg';
import chevronRight from '../../assets/icons/figma/chevron-right.svg';
import clockFill from '../../assets/icons/figma/clock-fill.svg';
import clockOutline from '../../assets/icons/figma/clock-outline.svg';
import cup from '../../assets/icons/figma/cup.svg';
import dashboard from '../../assets/icons/figma/dashboard.svg';
import dashboardFill from '../../assets/icons/figma/dashboard-fill.svg';
import dashboardOutline from '../../assets/icons/figma/dashboard-outline.svg';
import databaseFill from '../../assets/icons/figma/database-fill.svg';
import databaseOutline from '../../assets/icons/figma/database-outline.svg';
import docText from '../../assets/icons/figma/doc-text.svg';
import filter from '../../assets/icons/figma/filter.svg';
import headphones from '../../assets/icons/figma/headphones.svg';
import homeFill from '../../assets/icons/figma/home-fill.svg';
import homeOutline from '../../assets/icons/figma/home-outline.svg';
import layersFill from '../../assets/icons/figma/layers-fill.svg';
import location from '../../assets/icons/figma/location.svg';
import lockOpen from '../../assets/icons/figma/lock-open.svg';
import logoutRounded from '../../assets/icons/figma/logout-rounded.svg';
import minus from '../../assets/icons/figma/minus.svg';
import minusCircle from '../../assets/icons/figma/minus-circle.svg';
import noteText from '../../assets/icons/figma/note-text.svg';
import noteTextPlus from '../../assets/icons/figma/note-text-plus.svg';
import personFill from '../../assets/icons/figma/person-fill.svg';
import personOutline from '../../assets/icons/figma/person-outline.svg';
import pinAngle from '../../assets/icons/figma/pin-angle.svg';
import pinAngleFill from '../../assets/icons/figma/pin-angle-fill.svg';
import playButton from '../../assets/icons/figma/play-button.svg';
import playButtonOutline from '../../assets/icons/figma/play-button-outline.svg';
import plus from '../../assets/icons/figma/plus.svg';
import plusCircle from '../../assets/icons/figma/plus-circle.svg';
import qrCode from '../../assets/icons/figma/qr-code.svg';
import qrCodeOutline from '../../assets/icons/figma/qr-code-outline.svg';
import sliders from '../../assets/icons/figma/sliders.svg';
import star from '../../assets/icons/figma/star.svg';
import verified from '../../assets/icons/figma/verified.svg';
import wallet from '../../assets/icons/figma/wallet.svg';
import walletMark from '../../assets/icons/figma/wallet-mark.svg';
import widgetAdd from '../../assets/icons/figma/widget-add.svg';

export const appIcons = {
  activity,
  barChart,
  bellOutline,
  calendar,
  calendarAlt,
  calendarOutline,
  chevronRight,
  clockFill,
  clockOutline,
  cup,
  dashboard,
  dashboardFill,
  dashboardOutline,
  databaseFill,
  databaseOutline,
  docText,
  filter,
  headphones,
  homeFill,
  homeOutline,
  layersFill,
  location,
  lockOpen,
  logoutRounded,
  minus,
  minusCircle,
  noteText,
  noteTextPlus,
  personFill,
  personOutline,
  pinAngle,
  pinAngleFill,
  playButton,
  playButtonOutline,
  plus,
  plusCircle,
  qrCode,
  qrCodeOutline,
  sliders,
  star,
  verified,
  wallet,
  walletMark,
  widgetAdd,
} as const;

export type AppIconName = keyof typeof appIcons;
