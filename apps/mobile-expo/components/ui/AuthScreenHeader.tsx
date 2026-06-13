import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo, LOGO_IN_CARD_HEIGHT } from '@/components/ui/BrandLogo';
import { brandGradient, spacing, typography } from '@/constants/theme';
import type { AppColors } from '@/constants/theme';
import { useTopSafeInset } from '@/hooks/useTopSafeInset';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface AuthScreenHeaderProps {
  tagline: string;
}

export function AuthScreenHeader({ tagline }: AuthScreenHeaderProps) {
  const topInset = useTopSafeInset();
  const styles = useThemedStyles(createAuthScreenHeaderStyles);

  return (
    <LinearGradient
      colors={[brandGradient.start, brandGradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: topInset }]}
    >
      <View style={styles.inner}>
        <View style={styles.logoWrap} pointerEvents="none">
          <BrandLogo variant="onDark" size="inCard" style={styles.logo} />
        </View>
        <Text style={styles.tagline}>{tagline}</Text>
      </View>
    </LinearGradient>
  );
}

function createAuthScreenHeaderStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      overflow: 'hidden',
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    inner: {
      width: '100%',
      alignItems: 'center',
    },
    logoWrap: {
      width: '100%',
      height: LOGO_IN_CARD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    logo: {
      width: '100%',
    },
    tagline: {
      marginTop: spacing.sm,
      fontSize: typography.body,
      color: colors.textMutedOnDark,
      fontWeight: '600',
    },
  });
}
