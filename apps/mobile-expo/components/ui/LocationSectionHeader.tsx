import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InvoicesByLocation } from '@/lib/api-contract';
import { formatAddressShort, formatCurrency } from '@/lib/api-contract';
import { useLocationDisplayName } from '@/context/LocationLabelsContext';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface LocationSectionHeaderProps {
  group: InvoicesByLocation;
  showOpenTotal?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  /** Rótulo do badge à direita (padrão: "Em aberto") */
  openTotalLabel?: string;
  /** Exibir linha "Plano mensal" quando expandido */
  showMonthly?: boolean;
}

export function LocationSectionHeader({
  group,
  showOpenTotal = true,
  expanded = false,
  onPress,
  openTotalLabel = 'Em aberto',
  showMonthly = true,
}: LocationSectionHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createLocationSectionHeaderStyles);
  const { location, openTotal } = group;
  const displayName = useLocationDisplayName(location.id, location.name);
  const isCollapsible = !!onPress;

  const titleRow = (
    <View style={styles.titleRow}>
      <View style={styles.iconWrap}>
        <Ionicons name="home-outline" size={20} color={colors.accent} />
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.name} numberOfLines={2}>
          {displayName}
        </Text>
        <Text style={styles.plan}>{location.planName}</Text>
      </View>
      {showOpenTotal && openTotal > 0 ? (
        <View style={styles.totalBadge}>
          <Text style={styles.totalLabel}>{openTotalLabel}</Text>
          <Text style={styles.totalValue}>{formatCurrency(openTotal)}</Text>
        </View>
      ) : null}
      {isCollapsible ? (
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      ) : null}
    </View>
  );

  const detailsBody = expanded || !isCollapsible ? (
    <>
      <Text style={styles.address}>{formatAddressShort(location.address)}</Text>
      {showMonthly ? (
        <Text style={styles.monthly}>Plano mensal: {formatCurrency(location.monthlyAmount)}</Text>
      ) : null}
    </>
  ) : null;

  if (isCollapsible) {
    return (
      <View style={[styles.header, expanded && styles.headerExpanded]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${displayName}, ${formatCurrency(openTotal)} em aberto`}
        >
          {titleRow}
          {detailsBody}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {titleRow}
      {detailsBody}
    </View>
  );
}

function createLocationSectionHeaderStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    headerExpanded: {
      marginBottom: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleBlock: {
      flex: 1,
    },
    name: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
    plan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    totalBadge: {
      alignItems: 'flex-end',
    },
    totalLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    totalValue: {
      fontSize: typography.body,
      fontWeight: '800',
      color: colors.accent,
    },
    chevron: {
      marginLeft: spacing.xs,
      alignSelf: 'center',
    },
    address: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    monthly: {
      fontSize: typography.label,
      color: colors.primaryLight,
      fontWeight: '600',
      marginTop: 4,
    },
  });
}
