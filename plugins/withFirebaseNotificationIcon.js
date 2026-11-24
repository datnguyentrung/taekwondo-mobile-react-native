const { withAndroidManifest } = require('@expo/config-plugins');

const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';
const FCM_COLOR_META = 'com.google.firebase.messaging.default_notification_color';
const FCM_CHANNEL_META =
  'com.google.firebase.messaging.default_notification_channel_id';

/**
 * Ensures Firebase Messaging notification meta-data written by `expo-notifications`
 * includes `tools:replace` so Android Manifest Merger can override the default
 * `<meta-data>` entries declared in `@react-native-firebase/messaging`'s AndroidManifest.xml.
 *
 * Must be listed BEFORE `expo-notifications` in `app.config.ts` so its
 * `withAndroidManifest` callback executes AFTER `expo-notifications`.
 */
function withFirebaseNotificationIcon(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return modConfig;

    manifest.$ = {
      ...manifest.$,
      'xmlns:tools': manifest.$?.['xmlns:tools'] ?? TOOLS_NAMESPACE,
    };

    for (const item of application['meta-data'] ?? []) {
      const name = item.$?.['android:name'];
      if (name === FCM_COLOR_META) {
        item.$['tools:replace'] = 'android:resource';
      } else if (name === FCM_CHANNEL_META) {
        item.$['tools:replace'] = 'android:value';
      }
    }

    return modConfig;
  });
}

module.exports = withFirebaseNotificationIcon;
