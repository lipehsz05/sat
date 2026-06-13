import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatDate,
  formatPaymentMethod,
  getPaymentConfirmationLabel,
} from '@/lib/api-contract';
import type { Invoice, PaymentMethod } from '@/lib/api-contract';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const METHOD_ICONS: Record<
  PaymentMethod,
  keyof typeof Ionicons.glyphMap
> = {
  pix: 'qr-code-outline',
  card: 'card-outline',
  boleto: 'barcode-outline',
};

interface PaidInvoiceMetaProps {
  invoice: Invoice;
  compact?: boolean;
}

export function PaidInvoiceMeta({ invoice, compact }: PaidInvoiceMetaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createPaidInvoiceMetaStyles);

  if (!invoice.paymentMethod || !invoice.paidAt) return null;

  const method = invoice.paymentMethod;
  const icon = METHOD_ICONS[method];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.methodBadge}>
        <Ionicons name={icon} size={16} color={colors.success} />
        <Text style={styles.methodText}>Pago via {formatPaymentMethod(method)}</Text>
      </View>
      <Text style={styles.dateText}>
        {getPaymentConfirmationLabel(method)}: {formatDate(invoice.paidAt)}
      </Text>
    </View>
  );
}

function createPaidInvoiceMetaStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    wrapCompact: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 0,
    },
    methodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.successLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    methodText: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.success,
    },
    dateText: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
