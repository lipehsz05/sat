import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatAddress } from '@/lib/api-contract';
import type { UserProfile } from '@/lib/api-contract';
import { BrandLogo, LOGO_IN_CARD_HEIGHT } from '@/components/ui/BrandLogo';
import { brandGradient, spacing, typography } from '@/constants/theme';
import type { AppColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

/** Espaço da logo no card — texto começa logo abaixo, sem sobreposição */
const LOGO_SLOT_HEIGHT = LOGO_IN_CARD_HEIGHT;

interface BrandHeaderProps {
  profile?: UserProfile | null;
  compact?: boolean;
}

export function BrandHeader({ profile, compact }: BrandHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createBrandHeaderStyles);
  const firstName = profile?.name.split(' ')[0];
  const locationCount = profile?.locations.length ?? 0;

  return (
    <LinearGradient
      colors={[brandGradient.start, brandGradient.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, compact && styles.compact]}
    >
      <View style={styles.logoSlot} pointerEvents="none">
        <BrandLogo variant="onDark" size="inCard" style={styles.logoInCard} />
      </View>

      {profile ? (
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Olá, {firstName}</Text>
          <Text style={styles.fullName}>{profile.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={colors.textOnDark} />
            <Text style={styles.address}>
              {locationCount > 1
                ? `${locationCount} endereços cadastrados`
                : formatAddress(profile.address)}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.tagline}>Área do cliente · Internet banda larga</Text>
      )}
    </LinearGradient>
  );
}

function createBrandHeaderStyles(colors: AppColors) {
  return StyleSheet.create({
    gradient: {
      overflow: 'hidden',
      borderRadius: 16,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    compact: {
      paddingVertical: spacing.sm,
    },
    logoSlot: {
      width: '100%',
      height: LOGO_SLOT_HEIGHT,
      alignItems: 'center',
      justifyContent: 'flex-start',
      zIndex: 0,
    },
    logoInCard: {
      width: '100%',
    },
    greetingBlock: {
      width: '100%',
      marginTop: spacing.sm,
      zIndex: 1,
    },
    greeting: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.textOnDark,
    },
    fullName: {
      fontSize: typography.label,
      color: colors.textMutedOnDark,
      marginTop: 2,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: spacing.xs,
    },
    address: {
      flex: 1,
      fontSize: typography.body,
      color: colors.textMutedOnDark,
      lineHeight: 22,
    },
    tagline: {
      fontSize: typography.body,
      color: colors.textMutedOnDark,
      textAlign: 'center',
      marginTop: spacing.sm,
      zIndex: 1,
    },
  });
}
