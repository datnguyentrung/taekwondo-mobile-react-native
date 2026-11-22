const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RESOURCE_NAME = 'ic_notification';

function withFirebaseNotificationIcon(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const source = path.join(
        projectRoot,
        'assets',
        'images',
        'android-icon-monochrome.png',
      );
      const destination = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'drawable',
        `${RESOURCE_NAME}.png`,
      );

      if (!fs.existsSync(source)) {
        throw new Error(`Android notification icon source not found: ${source}`);
      }

      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
      return config;
    },
  ]);

  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    application['meta-data'] = application['meta-data'] ?? [];
    application['meta-data'] = application['meta-data'].filter(
      (item) => item.$?.['android:name'] !== 'com.google.firebase.messaging.default_notification_icon',
    );
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.firebase.messaging.default_notification_icon',
        'android:resource': `@drawable/${RESOURCE_NAME}`,
      },
    });

    return config;
  });
}

module.exports = withFirebaseNotificationIcon;
