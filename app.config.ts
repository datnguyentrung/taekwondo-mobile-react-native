import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ID = 'com.dat.taekwondomobile';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Taekwondo Van Quan',
  slug: 'taekwondo-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'taekwondomobile',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: APP_ID,
    googleServicesFile:
      process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: APP_ID,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    permissions: ['android.permission.POST_NOTIFICATIONS'],
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#A9151A',
        image: './assets/taekwondo-removebg-preview.png',
        imageWidth: 104,
      },
    ],
    ['expo-secure-store', { configureAndroidBackup: true }],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrlJava:
      process.env.EXPO_PUBLIC_API_URL_JAVA ??
      process.env.VITE_API_URL_JAVA ??
      'http://localhost:8080/api/v1',
    router: {},
    eas: {
      projectId: 'e3b24282-1d01-4d4f-981d-4c28cdb43ee1',
    },
  },
});
