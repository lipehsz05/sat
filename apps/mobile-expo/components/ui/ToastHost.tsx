import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useTopSafeInset } from '@/hooks/useTopSafeInset';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastHostProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  const topInset = useTopSafeInset(spacing.sm);
  const styles = useThemedStyles(createToastHostStyles);

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.overlay, { paddingTop: topInset }]} pointerEvents="box-none">
      <View style={styles.stack} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </View>
    </View>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createToastHostStyles);
  const accent =
    toast.type === 'success'
      ? colors.success
      : toast.type === 'error'
        ? colors.error
        : colors.primary;

  return (
    <View
      style={[styles.toast, { borderLeftColor: accent }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={ICONS[toast.type]} size={22} color={accent} />
      <Text style={styles.message}>{toast.message}</Text>
      <TouchableOpacity
        onPress={() => onDismiss(toast.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
      >
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function createToastHostStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 9999,
      elevation: 9999,
      alignItems: 'flex-end',
      paddingRight: spacing.md,
    },
    stack: {
      gap: spacing.sm,
      maxWidth: 340,
      width: '100%',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    message: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
    },
  });
}
