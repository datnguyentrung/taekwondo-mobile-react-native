import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';

import { VISIBLE_APP_TABS, type AppTabConfig } from './appTabs.config';

type TabButtonProps = TabTriggerSlotProps & {
  tab: AppTabConfig;
};

export default function AppTabsLayout() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          {VISIBLE_APP_TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton tab={tab} />
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function CustomTabList({ children, style, ...props }: TabListProps) {
  return (
    <View
      {...props}
      pointerEvents="box-none"
      style={[styles.tabListContainer, style]}>
      <View style={styles.tabList}>{children}</View>
    </View>
  );
}

function TabButton({ tab, isFocused, ...props }: TabButtonProps) {
  const active = Boolean(isFocused);
  const iconName = active && tab.activeIcon ? tab.activeIcon : tab.icon;
  const iconColor = active ? Colors.light.primary : Colors.light.textSecondary;

  if (tab.centerAction) {
    return (
      <Pressable
        {...props}
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: active }}
        style={({ pressed }) => [
          styles.centerButton,
          pressed ? styles.pressed : null,
        ]}>
        <AppIcon name={iconName} size={41} color={Colors.light.surface} />
      </Pressable>
    );
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.tabButton, pressed ? styles.pressed : null]}>
      <AppIcon name={iconName} size={30} color={iconColor} />
      <ThemedText
        type="featureLabel"
        style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
        {tab.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabList: {
    width: '100%',
    maxWidth: 352,
    height: 70,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: {
    width: 64,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  centerButton: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.light.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
