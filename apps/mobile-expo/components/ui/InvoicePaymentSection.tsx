import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { formatBoletoLinhaDigitavel } from '@/lib/api-contract';
import type { Invoice } from '@/lib/api-contract';
import { PaymentMethodTabs, type PaymentMethod } from '@/components/ui/PaymentMethodTabs';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface InvoicePaymentSectionProps {
  invoice: Invoice;
  compact?: boolean;
  invoiceIds?: string;
}

export function InvoicePaymentSection({
  invoice,
  compact,
  invoiceIds,
}: InvoicePaymentSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createInvoicePaymentSectionStyles);
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const idsParam = invoiceIds ?? invoice.id;

  const openBoleto = () => {
    router.push({
      pathname: '/pay-boleto',
      params: invoiceIds ? { invoiceIds: idsParam } : { invoiceId: invoice.id },
    });
  };

  const openCard = () => {
    router.push({
      pathname: '/pay-card',
      params: invoiceIds ? { invoiceIds: idsParam } : { invoiceId: invoice.id },
    });
  };

  return (
    <View style={styles.wrap}>
      <PaymentMethodTabs value={method} onChange={setMethod} compact={compact} />

      {method === 'pix' && invoice.pixQrCode ? (
        <View style={styles.pixBox}>
          <Text style={styles.methodTitle}>Pague com PIX</Text>
          <Text style={styles.methodHint}>Escaneie o QR Code no app do seu banco</Text>
          <View style={styles.qrWrap}>
            <QRCode value={invoice.pixQrCode} size={compact ? 140 : 160} />
          </View>
        </View>
      ) : null}

      {method === 'pix' && !invoice.pixQrCode ? (
        <Text style={styles.unavailable}>PIX indisponível para esta fatura.</Text>
      ) : null}

      {method === 'card' ? (
        <View style={styles.actionBox}>
          <Ionicons name="card-outline" size={32} color={colors.primary} />
          <Text style={styles.methodTitle}>Cartão de crédito ou débito</Text>
          <Text style={styles.methodHint}>
            Pagamento simulado — ambiente de demonstração
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openCard} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Pagar com cartão</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {method === 'boleto' ? (
        <View style={styles.actionBox}>
          <Ionicons name="barcode-outline" size={32} color={colors.primary} />
          <Text style={styles.methodTitle}>Boleto bancário</Text>
          <Text style={styles.methodHint}>
            Gere o boleto, copie a linha digitável ou baixe o PDF
          </Text>
          {invoice.barcode ? (
            <View style={styles.linhaBox}>
              <Text style={styles.linhaLabel}>Linha digitável</Text>
              <Text style={styles.linhaValue} selectable>
                {formatBoletoLinhaDigitavel(invoice.barcode)}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={openBoleto} accessibilityRole="button">
            <Ionicons name="document-outline" size={20} color={colors.white} />
            <Text style={styles.primaryBtnText}>Gerar / ver boleto</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function createInvoicePaymentSectionStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.sm,
    },
    pixBox: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    methodTitle: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    methodHint: {
      fontSize: typography.label,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    qrWrap: {
      padding: spacing.md,
      backgroundColor: colors.white,
      borderRadius: radius.md,
    },
    actionBox: {
      alignItems: 'center',
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.background,
      borderRadius: radius.md,
    },
    linhaBox: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    linhaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    linhaValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      lineHeight: 20,
      fontFamily: 'monospace',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      minHeight: 48,
      marginTop: spacing.sm,
    },
    primaryBtnText: {
      color: colors.white,
      fontSize: typography.body,
      fontWeight: '700',
    },
    unavailable: {
      fontSize: typography.label,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });
}
