import { useMemo } from 'react';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useTheme } from '@/context/ThemeContext';

export function useStackScreenOptions(): NativeStackNavigationOptions {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.primary,
      headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
      headerShadowVisible: false,
      headerBackTitle: 'Voltar',
      headerBackButtonDisplayMode: 'minimal' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors],
  );
}
