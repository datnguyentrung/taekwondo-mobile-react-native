import activity from '../../assets/icons/figma/activity.svg';
import barChart from '../../assets/icons/figma/bar-chart.svg';
import bellOutline from '../../assets/icons/figma/bell-outline.svg';
import calendar from '../../assets/icons/figma/calendar.svg';
import calendarAlt from '../../assets/icons/figma/calendar-alt.svg';
import calendarOutline from '../../assets/icons/figma/calendar-outline.svg';
import chevronLeft from '../../assets/icons/figma/chevron-left.svg';
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
import featureAttendance from '../../assets/icons/figma/feature-attendance.svg';
import featureBadgeMinus from '../../assets/icons/figma/feature-badge-minus.svg';
import featureBadgePlus from '../../assets/icons/figma/feature-badge-plus.svg';
import featureCoachList from '../../assets/icons/figma/feature-coach-list.svg';
import featureQuickMaskPrimary from '../../assets/icons/figma/feature-quick-mask-primary.svg';
import featureQuickMaskSecondary from '../../assets/icons/figma/feature-quick-mask-secondary.svg';
import featureRanking from '../../assets/icons/figma/feature-ranking.svg';
import featureStudentList from '../../assets/icons/figma/feature-student-list.svg';
import featureUtilityDashboard from '../../assets/icons/figma/feature-utility-dashboard.svg';
import featureUtilityDashboardAlt from '../../assets/icons/figma/feature-utility-dashboard-alt.svg';
import headphones from '../../assets/icons/figma/headphones.svg';
import headphonesFill from '../../assets/icons/figma/headphones-fill.svg';
import homeFill from '../../assets/icons/figma/home-fill.svg';
import homeOutline from '../../assets/icons/figma/home-outline.svg';
import layersFill from '../../assets/icons/figma/layers-fill.svg';
import location from '../../assets/icons/figma/location.svg';
import lockOpen from '../../assets/icons/figma/lock-open.svg';
import logoutLight from '../../assets/icons/figma/logout-light.svg';
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
import profileAvatar from '../../assets/icons/figma/profile-avatar.svg';
import profileBelt from '../../assets/icons/figma/profile-belt.svg';
import profileCalendar from '../../assets/icons/figma/profile-calendar.svg';
import profileEdit from '../../assets/icons/figma/profile-edit.svg';
import profileHeight from '../../assets/icons/figma/profile-height.svg';
import profileMail from '../../assets/icons/figma/profile-mail.svg';
import profilePhone from '../../assets/icons/figma/profile-phone.svg';
import profileScore from '../../assets/icons/figma/profile-score.svg';
import profileUser from '../../assets/icons/figma/profile-user.svg';
import profileWeight from '../../assets/icons/figma/profile-weight.svg';
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
  chevronLeft,
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
  featureAttendance,
  featureBadgeMinus,
  featureBadgePlus,
  featureCoachList,
  featureQuickMaskPrimary,
  featureQuickMaskSecondary,
  featureRanking,
  featureStudentList,
  featureUtilityDashboard,
  featureUtilityDashboardAlt,
  headphones,
  headphonesFill,
  homeFill,
  homeOutline,
  layersFill,
  location,
  lockOpen,
  logoutLight,
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
  profileAvatar,
  profileBelt,
  profileCalendar,
  profileEdit,
  profileHeight,
  profileMail,
  profilePhone,
  profileScore,
  profileUser,
  profileWeight,
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
