import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { Colors, radii } from '@/theme';
import type { AppIconName } from '@/theme/icons';
import { Pressable, StyleSheet, View } from 'react-native';

export type HeaderActionButtonProps = {
  icon: AppIconName;
  label: string;
  badge?: string | number;
  badgeVariant?: 'dot' | 'count';
  color?: string;
  onPress?: () => void;
  testID?: string;
};

export function HeaderActionButton({
  icon,
  label,
  badge,
  badgeVariant = 'count',
  color = Colors.light.text,
  onPress,
  testID,
}: HeaderActionButtonProps) {
  const hasBadge = badgeVariant === 'dot' || Boolean(badge);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
      ]}
    >
      <AppIcon name={icon} size={29} color={color} />
      {hasBadge ? (
        <View
          style={[
            styles.badge,
            badgeVariant === 'dot' ? styles.dotBadge : null,
          ]}
        >
          {badgeVariant === 'count' ? (
            <ThemedText type="caption" style={styles.badgeText}>
              {badge}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: Colors.light.surface,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 4,
  },
  dotBadge: {
    top: 8,
    right: 8,
    minWidth: 9,
    width: 9,
    height: 9,
    paddingHorizontal: 0,
  },
  badgeText: {
    color: Colors.light.surface,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.75,
  },
});
