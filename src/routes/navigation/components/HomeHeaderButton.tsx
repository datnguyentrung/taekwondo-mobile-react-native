import { useRouter } from 'expo-router';

import { HeaderActionButton } from './HeaderActionButton';

export function HomeHeaderButton({ color }: { color?: string }) {
  const router = useRouter();

  const handlePress = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    } else {
      router.replace('/');
    }
  };

  return (
    <HeaderActionButton
      icon="homeOutline"
      label="Trang chủ"
      color={color}
      onPress={handlePress}
      testID="home-header-button"
    />
  );
}
