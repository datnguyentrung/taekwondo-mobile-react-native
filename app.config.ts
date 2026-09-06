import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_ID = "com.dat.taekwondomobile";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: "Taekwondo Van Quan",
  slug: "taekwondo-mobile",
  version: "1.0.0",

  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "taekwondomobile",
  userInterfaceStyle: "automatic",

  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: APP_ID,

    googleServicesFile:
      process.env.GOOGLE_SERVICE_INFO_PLIST ??
      "./ios/com.dat.taekwondomobile/GoogleService-Info.plist",

    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
  },

  android: {
    package: APP_ID,

    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./android/app/google-services.json",

    permissions: ["android.permission.POST_NOTIFICATIONS"],

    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },

    predictiveBackGestureEnabled: false,
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",
    "expo-sqlite",

    [
      "expo-splash-screen",
      {
        backgroundColor: "#A9151A",
        image: "./assets/taekwondo-removebg-preview.png",
        imageWidth: 104,
      },
    ],

    [
      "expo-font",
      {
        fonts: [
          "./node_modules/@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf",
          "./node_modules/@expo-google-fonts/roboto/500Medium/Roboto_500Medium.ttf",
          "./node_modules/@expo-google-fonts/roboto/600SemiBold/Roboto_600SemiBold.ttf",
          "./node_modules/@expo-google-fonts/roboto/800ExtraBold/Roboto_800ExtraBold.ttf",
        ],
      },
    ],

    [
      "expo-secure-store",
      {
        configureAndroidBackup: true,
      },
    ],

    [
      "expo-camera",
      {
        cameraPermission:
          "Cho phép Taekwondo Văn Quán sử dụng camera để quét mã QR, chụp ảnh và thực hiện các chức năng điểm danh.",

        // Hiện tại app chưa có nhu cầu quay video kèm âm thanh.
        microphonePermission:
          "Cho phép Taekwondo Văn Quán sử dụng microphone khi quay video.",

        // Không tự thêm RECORD_AUDIO Android nếu chưa cần quay video có tiếng.
        recordAudioAndroid: false,

        // App có luồng QR/check-in nên giữ barcode scanner.
        barcodeScannerEnabled: true,
      },
    ],

    [
      "expo-image-picker",
      {
        photosPermission:
          "Cho phép Taekwondo Văn Quán truy cập thư viện ảnh để chọn ảnh đại diện.",

        cameraPermission:
          "Cho phép Taekwondo Văn Quán sử dụng camera để chụp ảnh đại diện.",

        // Không cần microphone chỉ để chọn/chụp ảnh.
        microphonePermission: false,
      },
    ],

    // "@react-native-firebase/app",
    // "@react-native-firebase/messaging",
    // "@react-native-firebase/crashlytics",

    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "dynamic",
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
      process.env.EXPO_PUBLIC_API_URL_JAVA ?? "http://localhost:8080/api/v1",

    router: {},

    eas: {
      projectId: "e3b24282-1d01-4d4f-981d-4c28cdb43ee1",
    },
  },
});
