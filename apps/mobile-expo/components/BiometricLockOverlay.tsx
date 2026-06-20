import { StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Button } from '@/components/ui/Button';
import { SafeScreen } from '@/components/ui/SafeScreen';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface BiometricLockOverlayProps {
  biometricLabel: string;
  onUnlock: () => void;
  isAuthenticating: boolean;
}

export function BiometricLockOverlay({
  biometricLabel,
  onUnlock,
  isAuthenticating,
}: BiometricLockOverlayProps) {
  const styles = useThemedStyles(createLockStyles);

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <SafeScreen style={styles.container}>
        <BrandLogo variant="onDark" size="auth" />
        <Text style={styles.title}>App bloqueado</Text>
        <Text style={styles.subtitle}>
          Use {biometricLabel} ou a senha do aparelho para acessar sua conta com segurança.
        </Text>
        <Button
          title="Desbloquear"
          onPress={onUnlock}
          loading={isAuthenticating}
          variant="accent"
        />
      </SafeScreen>
    </View>
  );
}

function createLockStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,
      elevation: 9999,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.lg,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.md,
    },
  });
}
