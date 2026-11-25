import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppFonts } from '../lib/fonts';
import { SessionProvider } from '../lib/session';
import { C } from '../lib/theme';

export default function RootLayout() {
  const [loaded, error] = useAppFonts();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFallback(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded && !error && !fallback) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.pink} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: C.bg },
            animation: 'fade',
          }}
        />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
