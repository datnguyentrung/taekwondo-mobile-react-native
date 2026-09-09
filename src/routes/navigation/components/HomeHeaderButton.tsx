import { useRouter } from 'expo-router';

import { HeaderActionButton } from './HeaderActionButton';

export function HomeHeaderButton({ color }: { color?: string }) {
  const router = useRouter();

  return (
    <HeaderActionButton
      icon="homeOutline"
      label="Trang chủ"
      color={color}
      onPress={() => router.push('/')}
      testID="home-header-button"
    />
  );
}
