import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { SettingsProvider } from '../context/SettingsContext';
import { GameProvider } from '../context/GameContext';
import { colors } from '../constants/colors';
import { ErrorBoundary } from '../components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <KeyboardProvider>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
            <SettingsProvider>
              <GameProvider>
                <Stack
                  screenOptions={{
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerTitleStyle: { fontFamily: 'Inter_600SemiBold' },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="game" options={{ headerShown: false }} />
                  <Stack.Screen name="empire" options={{ title: 'Your Empire', headerBackTitle: 'Back' }} />
                  <Stack.Screen name="achievements" options={{ title: 'Achievements', headerBackTitle: 'Back' }} />
                  <Stack.Screen name="profile" options={{ title: 'Profile & Stats', headerBackTitle: 'Back' }} />
                  <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'Back' }} />
                  <Stack.Screen name="bankruptcy" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="victory" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="android-smoke" options={{ headerShown: false }} />
                </Stack>
              </GameProvider>
            </SettingsProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
