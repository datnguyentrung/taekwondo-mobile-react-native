import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AppProviders } from '@/routes/providers/AppProviders';
import {
  BootstrapScreen,
  SessionRecoveryScreen,
  useAuthStatus,
} from '@/features/authentication';

void SplashScreen.preventAutoHideAsync();

function AuthRouter() {
  const status = useAuthStatus();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  if (status === 'bootstrapping') return <BootstrapScreen />;
  if (status === 'recoverable-error') return <SessionRecoveryScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'anonymous'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected
        guard={status === 'selecting-context' || status === 'authenticated'}>
        <Stack.Screen name="(context)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProviders>
        <AuthRouter />
      </AppProviders>
    </ThemeProvider>
  );
}
