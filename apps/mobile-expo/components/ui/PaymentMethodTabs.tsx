import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type PaymentMethod = 'pix' | 'card' | 'boleto';

const METHODS: { id: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'pix', label: 'PIX', icon: 'qr-code-outline' },
  { id: 'card', label: 'Cartão', icon: 'card-outline' },
  { id: 'boleto', label: 'Boleto', icon: 'barcode-outline' },
];

interface PaymentMethodTabsProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  compact?: boolean;
}

export function PaymentMethodTabs({ value, onChange, compact }: PaymentMethodTabsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createPaymentMethodTabsStyles);

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {METHODS.map((method) => {
        const active = value === method.id;
        return (
          <TouchableOpacity
            key={method.id}
            style={[styles.tab, active && styles.tabActive, compact && styles.tabCompact]}
            onPress={() => onChange(method.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Ionicons
              name={method.icon}
              size={compact ? 18 : 20}
              color={active ? colors.white : colors.primaryLight}
            />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{method.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createPaymentMethodTabsStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    rowCompact: {
      marginTop: spacing.sm,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    tabCompact: {
      minHeight: 40,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.primaryLight,
    },
    tabTextActive: {
      color: colors.white,
    },
  });
}
