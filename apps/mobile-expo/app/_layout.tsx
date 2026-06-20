import { useEffect, useMemo } from 'react';
import { ActivityIndicator } from 'react-native';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BiometricProvider } from '@/context/BiometricContext';
import { HomeLayoutProvider } from '@/context/HomeLayoutContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LocationLabelsGate } from '@/components/LocationLabelsGate';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastProvider } from '@/context/ToastContext';
import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';
import { buildNavigationTheme } from '@/lib/navigation-theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();
  const { colors, isDark, isReady } = useTheme();
  const headerOptions = useStackScreenOptions();
  const navigationTheme = useMemo(
    () => buildNavigationTheme(colors, isDark),
    [colors, isDark],
  );

  useEffect(() => {
    if (!isLoading && isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, isReady]);

  if (!isReady || isLoading) {
    return (
      <SafeScreen style={{ backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeScreen>
    );
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, ...headerOptions }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="invoice/[id]"
          options={{ headerShown: true, title: 'Detalhe da fatura', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="invoices-notes/index"
          options={{ headerShown: true, title: 'Notas fiscais', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="invoices-notes/[id]"
          options={{ headerShown: true, title: 'Nota fiscal', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="release-connection"
          options={{ headerShown: true, title: 'Liberar conexão', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="report-problem"
          options={{ headerShown: true, title: 'Reportar problema', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="negotiate-debt"
          options={{ headerShown: true, title: 'Negociar débitos', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="pay-card"
          options={{ headerShown: true, title: 'Pagamento', presentation: 'modal', headerBackTitle: 'Fechar' }}
        />
        <Stack.Screen
          name="pay-boleto"
          options={{ headerShown: true, title: 'Boleto', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="pay-all"
          options={{ headerShown: true, title: 'Pagar todas', headerBackTitle: 'Voltar' }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{ headerShown: true, title: 'Notificações', headerBackTitle: 'Voltar' }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <HomeLayoutProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <BiometricProvider>
                <LocationLabelsGate>
                  <RootNavigator />
                </LocationLabelsGate>
              </BiometricProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
        </HomeLayoutProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
