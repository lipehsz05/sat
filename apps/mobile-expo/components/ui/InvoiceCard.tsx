import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatCurrency, formatDate, formatReferenceMonth } from '@/lib/api-contract';
import type { Invoice } from '@/lib/api-contract';
import { InvoicePaymentSection } from '@/components/ui/InvoicePaymentSection';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Card } from './Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface InvoiceCardProps {
  invoice: Invoice;
  locationName?: string;
  onPress?: () => void;
  showPayment?: boolean;
  compact?: boolean;
  embedded?: boolean;
}

const statusLabels: Record<Invoice['status'], string> = {
  open: 'Em aberto',
  paid: 'Paga',
  overdue: 'Vencida',
};

export function InvoiceCard({
  invoice,
  locationName,
  onPress,
  showPayment,
  compact,
  embedded,
}: InvoiceCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createInvoiceCardStyles);
  const statusColors: Record<Invoice['status'], string> = {
    open: colors.primary,
    paid: colors.success,
    overdue: colors.accent,
  };
  const isPayable = invoice.status === 'open' || invoice.status === 'overdue';

  const content = (
    <>
      {locationName && !compact ? (
        <Text style={styles.locationTag}>{locationName}</Text>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.reference}>Referência {formatReferenceMonth(invoice.referenceMonth)}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[invoice.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColors[invoice.status] }]}>
            {statusLabels[invoice.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
      <Text style={styles.dueDate}>Vencimento: {formatDate(invoice.dueDate)}</Text>

      {showPayment && isPayable ? (
        <InvoicePaymentSection invoice={invoice} compact={compact} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} accessibilityRole="button">
        <Card style={[styles.card, embedded && styles.cardEmbedded]}>{content}</Card>
      </TouchableOpacity>
    );
  }

  return <Card style={[styles.card, embedded && styles.cardEmbedded]}>{content}</Card>;
}

function createInvoiceCardStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    cardEmbedded: {
      marginBottom: 0,
      borderLeftWidth: 0,
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    locationTag: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.primaryLight,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    reference: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    amount: {
      fontSize: typography.amount,
      fontWeight: '800',
      color: colors.primary,
    },
    dueDate: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
}
