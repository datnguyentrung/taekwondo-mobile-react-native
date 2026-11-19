# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

### Face check-in configuration

All mobile clients can scan faces using the shared Fog endpoint. Kiosks can
optionally be provisioned to receive device-specific Fog and MQTT settings:

```dotenv
EXPO_PUBLIC_API_URL_JAVA=http://localhost:8080/api/v1
EXPO_PUBLIC_API_URL_FOG=http://localhost:8000
EXPO_PUBLIC_MQTT_ENABLED=true
EXPO_PUBLIC_MQTT_BROKER_URL=ws://localhost:9001
# Optional; defaults to taekwondo/kiosks/<deviceId>/commands
EXPO_PUBLIC_MQTT_COMMAND_TOPIC=taekwondo/kiosks/kiosk-01/commands
```

The sensor screen accepts only `CHECK_IN_OPEN` commands whose `deviceId`
matches a provisioned kiosk.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Cây thư mục dự án

Cây dưới đây thể hiện các thư mục chính đến cấp 3. Các thư mục sinh tự động
hoặc dependency như `.git`, `.expo`, `node_modules` và `dist` được lược bỏ.

```text
taekwondo-mobile-react-native/
├── .agents/
├── .vscode/
├── android/
├── assets/
│   ├── expo.icon/
│   │   └── Assets/
│   ├── icons/
│   │   └── figma/
│   ├── images/
│   │   ├── attendance/
│   │   ├── sparring/
│   │   └── tabIcons/
│   └── logo/
│       ├── android/
│       ├── ios/
│       └── windows/
├── docs/
│   ├── adr/
│   ├── architecture/
│   └── design-system/
├── e2e/
│   └── flows/
├── ios/
│   └── com.dat.taekwondomobile/
├── jest/
├── plugins/
├── public/
├── scripts/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── (tabs)/
│   │   │   ├── account/
│   │   │   ├── admin/
│   │   │   ├── class-sessions/
│   │   │   ├── coaches/
│   │   │   ├── courses/
│   │   │   ├── history/
│   │   │   ├── notifications/
│   │   │   ├── students/
│   │   │   └── wallet/
│   │   ├── (auth)/
│   │   ├── (context)/
│   │   ├── (knee-counter)/
│   │   │   └── knee-counter/
│   │   └── (sparring)/
│   │       ├── practice/
│   │       └── tkd/
│   ├── config/
│   ├── features/
│   │   ├── activities/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── screens/
│   │   ├── attendance-history/
│   │   ├── authentication/
│   │   ├── authorization/
│   │   ├── belt-exam/
│   │   ├── branch/
│   │   ├── check-in/
│   │   ├── class-schedule/
│   │   ├── class-session/
│   │   ├── coach/
│   │   ├── coach-assignment/
│   │   ├── coach-timesheet/
│   │   ├── course/
│   │   ├── course-member-roster/
│   │   ├── course-price/
│   │   ├── course-purchase/
│   │   ├── course-staff-assignment/
│   │   ├── device-management/
│   │   ├── enrollment-addon-purchase/
│   │   ├── enrollment-schedule-change-request/
│   │   ├── explore/
│   │   ├── facebook/
│   │   ├── fitness/
│   │   ├── home/
│   │   ├── knee-counter/
│   │   │   ├── ai/
│   │   │   ├── components/
│   │   │   ├── config/
│   │   │   ├── domain/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── leaderboard/
│   │   ├── notification/
│   │   ├── permissions/
│   │   ├── sparring/
│   │   ├── sparring-practice/
│   │   ├── student/
│   │   ├── training-plan/
│   │   ├── training-plan-registration/
│   │   ├── tuition-payment/
│   │   ├── user/
│   │   ├── user-profile/
│   │   ├── wallet/
│   │   └── wallet-transaction/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── http/
│   │   ├── mqtt/
│   │   ├── notifications/
│   │   ├── query/
│   │   └── storage/
│   ├── providers/
│   ├── routes/
│   │   ├── account/
│   │   ├── activities/
│   │   ├── components/
│   │   ├── explore/
│   │   ├── home/
│   │   ├── navigation/
│   │   ├── providers/
│   │   └── splash/
│   ├── shared/
│   │   ├── domain/
│   │   ├── hooks/
│   │   ├── ui/
│   │   └── utils/
│   ├── theme/
│   └── types/
├── AGENTS.md
├── app.config.ts
├── babel.config.js
├── index.js
├── package.json
├── tsconfig.json
└── README.md
```

### Cây thư mục đầy đủ đến cấp 4

```text
taekwondo-mobile-react-native/
├── android/
│   ├── app/
│   │   └── src/
│   │       ├── debug/
│   │       ├── debugOptimized/
│   │       └── main/
│   └── gradle/
│       └── wrapper/
├── assets/
│   ├── expo.icon/
│   │   └── Assets/
│   ├── icons/
│   │   └── figma/
│   ├── images/
│   │   ├── attendance/
│   │   ├── sparring/
│   │   └── tabIcons/
│   └── logo/
│       ├── android/
│       ├── ios/
│       └── windows/
├── docs/
│   ├── adr/
│   ├── architecture/
│   └── design-system/
├── e2e/
│   └── flows/
├── ios/
│   └── com.dat.taekwondomobile/
├── jest/
├── logs/
├── plugins/
├── public/
├── scripts/
└── src/
    ├── app/
    │   ├── (app)/
    │   │   ├── (tabs)/
    │   │   ├── account/
    │   │   ├── admin/
    │   │   ├── class-sessions/
    │   │   ├── coaches/
    │   │   ├── courses/
    │   │   ├── history/
    │   │   ├── notifications/
    │   │   ├── students/
    │   │   └── wallet/
    │   ├── (auth)/
    │   ├── (context)/
    │   ├── (knee-counter)/
    │   │   └── knee-counter/
    │   └── (sparring)/
    │       ├── practice/
    │       └── tkd/
    ├── config/
    ├── features/
    │   ├── activities/
    │   │   ├── components/
    │   │   ├── data/
    │   │   ├── domain/
    │   │   └── screens/
    │   ├── attendance-history/
    │   │   ├── components/
    │   │   ├── data/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   └── screens/
    │   ├── authentication/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   ├── screens/
    │   │   ├── services/
    │   │   ├── store/
    │   │   └── utils/
    │   ├── authorization/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   └── ui/
    │   ├── belt-exam/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   └── domain/
    │   ├── branch/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── check-in/
    │   │   ├── camera/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── mock/
    │   │   ├── screens/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── utils/
    │   ├── class-schedule/
    │   │   ├── api/
    │   │   ├── assets/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── class-session/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── coach/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── coach-assignment/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── coach-timesheet/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── course/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   ├── screens/
    │   │   └── utils/
    │   ├── course-member-roster/
    │   │   ├── components/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── course-price/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── course-purchase/
    │   │   ├── api/
    │   │   └── domain/
    │   ├── course-staff-assignment/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   └── queries/
    │   ├── device-management/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── domain/
    │   │   ├── screens/
    │   │   └── services/
    │   ├── enrollment-addon-purchase/
    │   │   ├── api/
    │   │   └── queries/
    │   ├── enrollment-schedule-change-request/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   └── queries/
    │   ├── explore/
    │   │   ├── components/
    │   │   └── screens/
    │   ├── facebook/
    │   │   ├── api/
    │   │   └── domain/
    │   ├── fitness/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── home/
    │   │   └── screens/
    │   ├── housing/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── data/
    │   │   ├── screens/
    │   │   ├── services/
    │   │   ├── types/
    │   │   └── utils/
    │   ├── knee-counter/
    │   │   ├── ai/
    │   │   ├── components/
    │   │   ├── config/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── screens/
    │   │   ├── types/
    │   │   └── utils/
    │   ├── leaderboard/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── leave-request/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   └── screens/
    │   ├── notification/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   ├── screens/
    │   │   ├── store/
    │   │   └── utils/
    │   ├── permissions/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── person/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── position/
    │   │   ├── api/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── roles/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── sensor/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   └── screens/
    │   ├── session-attendance/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   ├── screens/
    │   │   └── services/
    │   ├── sparring/
    │   │   ├── data/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── infrastructure/
    │   │   ├── screens/
    │   │   └── services/
    │   ├── sparring-practice/
    │   │   ├── data/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── infrastructure/
    │   │   └── screens/
    │   ├── student/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   ├── screens/
    │   │   └── utils/
    │   ├── student-commerce/
    │   │   ├── components/
    │   │   ├── fixtures/
    │   │   ├── queries/
    │   │   ├── screens/
    │   │   └── utils/
    │   ├── student-enrollment/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── student-enrollment-schedule/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── training-plan/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   └── screens/
    │   ├── training-plan-registration/
    │   │   ├── api/
    │   │   ├── domain/
    │   │   └── queries/
    │   ├── tuition-payment/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── user/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── queries/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── user-profile/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── hooks/
    │   │   ├── schemas/
    │   │   └── screens/
    │   ├── wallet/
    │   │   ├── api/
    │   │   ├── constants/
    │   │   ├── domain/
    │   │   ├── queries/
    │   │   ├── screens/
    │   │   └── services/
    │   └── wallet-transaction/
    │       ├── api/
    │       ├── domain/
    │       └── screens/
    ├── infrastructure/
    │   ├── database/
    │   │   ├── migrations/
    │   │   ├── repositories/
    │   │   └── schema/
    │   ├── http/
    │   ├── mqtt/
    │   ├── notifications/
    │   ├── query/
    │   └── storage/
    ├── providers/
    ├── routes/
    │   ├── account/
    │   │   └── components/
    │   ├── activities/
    │   ├── components/
    │   ├── explore/
    │   ├── home/
    │   ├── navigation/
    │   │   ├── components/
    │   │   ├── layouts/
    │   │   └── utils/
    │   ├── providers/
    │   └── splash/
    ├── shared/
    │   ├── domain/
    │   ├── hooks/
    │   ├── ui/
    │   │   ├── admin/
    │   │   ├── commerce/
    │   │   ├── NavigationMenu/
    │   │   ├── platform/
    │   │   └── Toast/
    │   └── utils/
    ├── theme/
    └── types/
```
