import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/theme/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const labelStyle = useMemo(
    () => ({ selected: { color: colors.text } }),
    [colors.text],
  );

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={labelStyle}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Trang chủ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Khám phá</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
