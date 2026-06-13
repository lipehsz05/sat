import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import type { AppColors } from '@/constants/theme';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function Index() {
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createIndexStyles);

  if (isLoading) {
    return (
      <SafeScreen style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeScreen>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

function createIndexStyles(colors: AppColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
}
