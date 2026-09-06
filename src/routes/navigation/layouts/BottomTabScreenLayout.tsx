import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';
import type { AppIconName } from '@/theme/icons';

import type { AppTabName } from '../appTabs.config';

export type HeaderAction = {
  icon: AppIconName;
  label: string;
  onPress?: () => void;
};

export type BottomTabScreenLayoutProps = {
  title: string;
  activeTab: AppTabName;
  children: ReactNode;
  rightActions?: HeaderAction[];
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const BOTTOM_TAB_SPACE = 92;

export default function BottomTabScreenLayout({
  title,
  activeTab: _activeTab,
  children,
  rightActions,
  contentContainerStyle,
}: BottomTabScreenLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const actions =
    rightActions ??
    [
      { icon: 'bellOutline', label: 'Thông báo' },
      {
        icon: 'homeOutline',
        label: 'Trang chủ',
        onPress: () => router.push('/'),
      },
    ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 36 }]}>
        <Image
          source={require('@/assets/taekwondo-removebg-preview.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Taekwondo Văn Quán"
        />
        <ThemedText type="heading" style={styles.title}>
          {title}
        </ThemedText>
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={`${action.label}-${action.icon}`}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionButton,
                pressed ? styles.pressed : null,
              ]}>
              <AppIcon name={action.icon} size={29} color={Colors.light.surface} />
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BOTTOM_TAB_SPACE + Math.max(insets.bottom, 10) },
          contentContainerStyle,
        ]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    height: 110,
    borderBottomLeftRadius: radii.header,
    backgroundColor: Colors.light.header,
    paddingHorizontal: 15,
  },
  logo: {
    position: 'absolute',
    left: 15,
    bottom: 6,
    width: 68,
    height: 59,
  },
  title: {
    color: Colors.light.surface,
    textAlign: 'center',
  },
  actions: {
    position: 'absolute',
    right: 34,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.75,
  },
});
