export const colorPrimitives = {
  red: {
    100: '#F7CFD0',
    200: '#EFA0A1',
    300: '#E77071',
    400: '#DF4142',
    500: '#D71113',
    700: '#A21D22',
  },
  neutral: {
    100: '#CCCCCC',
    200: '#999999',
    300: '#666666',
    400: '#333333',
    500: '#000000',
  },
  blue: {
    100: '#D2E4F2',
    200: '#A5C9E4',
    300: '#78AED7',
    400: '#4B93C9',
    500: '#1E78BC',
  },
  white: '#FFFFFF',
  appBackground: '#FAFAFC',
  lineIcon: '#33363F',
  mutedBorder: '#CACCCD',
} as const;

export const Colors = {
  light: {
    text: colorPrimitives.neutral[500],
    background: colorPrimitives.appBackground,
    surface: colorPrimitives.white,
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6F6F6F',
    primary: colorPrimitives.red[500],
    primaryPressed: colorPrimitives.red[700],
    primarySoft: colorPrimitives.red[100],
    header: colorPrimitives.red[700],
    icon: colorPrimitives.lineIcon,
    divider: colorPrimitives.mutedBorder,
    accent: colorPrimitives.blue[500],
  },
  dark: {
    text: colorPrimitives.white,
    background: colorPrimitives.neutral[500],
    surface: '#212225',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: colorPrimitives.red[400],
    primaryPressed: colorPrimitives.red[300],
    primarySoft: '#3A1718',
    header: colorPrimitives.red[700],
    icon: colorPrimitives.white,
    divider: colorPrimitives.neutral[400],
    accent: colorPrimitives.blue[300],
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
