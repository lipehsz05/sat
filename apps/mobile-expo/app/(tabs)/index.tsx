import { router, type Href } from 'expo-router';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { HomeClassicLayout } from '@/components/home/HomeClassicLayout';
import { HomeDashboardLayout } from '@/components/home/HomeDashboardLayout';
import type { AppColors } from '@/constants/theme';
import { useHomeLayout } from '@/context/HomeLayoutContext';
import { useTheme } from '@/context/ThemeContext';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { variant } = useHomeLayout();
  const styles = useThemedStyles(createHomeStyles);
  const homeData = useHomeScreenData(colors);

  const sharedProps = {
    ...homeData,
    onQuickAction: (route: Href) => router.push(route),
  };

  return (
    <SafeScreen style={styles.safe}>
      {variant === 'dashboard' ? (
        <HomeDashboardLayout {...sharedProps} />
      ) : (
        <HomeClassicLayout {...sharedProps} />
      )}
    </SafeScreen>
  );
}

function createHomeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });
}
