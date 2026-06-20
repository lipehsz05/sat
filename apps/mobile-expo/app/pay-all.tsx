import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import QRCode from 'react-native-qrcode-svg';
import {
  formatAddressShort,
  formatBoletoLinhaDigitavel,
  formatCurrency,
  formatDate,
  formatReferenceMonth,
  getOpenInvoicesSummary,
} from '@/lib/api-contract';
import type { OpenInvoicesSummary } from '@/lib/api-contract';
import { Button } from '@/components/ui/Button';
import { PaymentMethodTabs, type PaymentMethod } from '@/components/ui/PaymentMethodTabs';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFocusFetch } from '@/hooks/useFocusFetch';
import { useLocationDisplayName } from '@/context/LocationLabelsContext';
import type { Invoice, InvoicesByLocation } from '@/lib/api-contract';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function PayAllBreakdownLine({
  group,
  invoice,
}: {
  group: InvoicesByLocation;
  invoice: Invoice;
}) {
  const styles = useThemedStyles(createPayAllBreakdownLineStyles);
  const name = useLocationDisplayName(group.location.id, group.location.name);

  return (
    <View style={styles.line}>
      <View style={styles.lineLeft}>
        <Text style={styles.lineName}>{name}</Text>
        <Text style={styles.lineMeta}>
          Ref. {formatReferenceMonth(invoice.referenceMonth)} · Venc. {formatDate(invoice.dueDate)}
        </Text>
        <Text style={styles.lineAddress}>{formatAddressShort(group.location.address)}</Text>
      </View>
      <Text style={styles.lineAmount}>{formatCurrency(invoice.amount)}</Text>
    </View>
  );
}

export default function PayAllScreen() {
  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createPayAllStyles);
  const [summary, setSummary] = useState<OpenInvoicesSummary | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('pix');

  const fetchSummary = useCallback(
    () => getOpenInvoicesSummary(session!),
    [session],
  );

  const loading = useFocusFetch(
    !authLoading && session ? `${session.userId}:pay-all` : null,
    fetchSummary,
    setSummary,
    () => setSummary(null),
  );

  const invoiceIds = summary?.invoices.map((i) => i.id).join(',') ?? '';

  const openCard = () => {
    if (!invoiceIds) return;
    router.push({ pathname: '/pay-card', params: { invoiceIds } });
  };

  const openBoleto = () => {
    if (!invoiceIds) return;
    router.push({ pathname: '/pay-boleto', params: { invoiceIds } });
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!summary || summary.invoices.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Não há faturas em aberto para pagar.</Text>
      </View>
    );
  }

  return (
    <>
      <StackScreenTitle title="Pagar todas" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pagamento consolidado</Text>
        <Text style={styles.subtitle}>
          Escolha PIX, cartão ou boleto para quitar {summary.invoices.length} faturas.
        </Text>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Valor total</Text>
          <Text style={styles.totalValue}>{formatCurrency(summary.total)}</Text>
        </View>

        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Detalhamento por endereço</Text>
          {summary.groups.map((group) =>
            group.invoices.map((inv) => (
              <PayAllBreakdownLine key={inv.id} group={group} invoice={inv} />
            )),
          )}
        </View>

        <View style={styles.paymentBox}>
          <PaymentMethodTabs value={method} onChange={setMethod} />

          {method === 'pix' ? (
            <View style={styles.qrBox}>
              <Text style={styles.methodTitle}>PIX único — todas as faturas</Text>
              <Text style={styles.methodHint}>Escaneie no app do banco para pagar o valor total</Text>
              <View style={styles.qrWrap}>
                <QRCode value={summary.combinedPixQrCode} size={200} />
              </View>
            </View>
          ) : null}

          {method === 'card' ? (
            <View style={styles.methodAction}>
              <Text style={styles.methodTitle}>Cartão de crédito ou débito</Text>
              <Text style={styles.methodHint}>Cobrança única no valor total (simulado)</Text>
              <Button title="Pagar todas com cartão" variant="accent" onPress={openCard} />
            </View>
          ) : null}

          {method === 'boleto' ? (
            <View style={styles.methodAction}>
              <Text style={styles.methodTitle}>Boleto bancário consolidado</Text>
              <Text style={styles.methodHint}>
                Um único boleto com a soma de todas as faturas em aberto
              </Text>
              <View style={styles.linhaPreview}>
                <Text style={styles.linhaLabel}>Linha digitável (prévia)</Text>
                <Text style={styles.linhaValue} numberOfLines={2}>
                  {formatBoletoLinhaDigitavel(summary.combinedBoletoBarcode)}
                </Text>
              </View>
              <Button title="Gerar boleto consolidado" variant="accent" onPress={openBoleto} />
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>Voltar para faturas</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function createPayAllBreakdownLineStyles(colors: AppColors) {
  return StyleSheet.create({
    line: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    lineLeft: { flex: 1, marginRight: spacing.sm },
    lineName: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    lineMeta: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    lineAddress: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    lineAmount: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
  });
}

function createPayAllStyles(colors: AppColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    container: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    totalBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    totalLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    totalValue: {
      fontSize: typography.amount,
      fontWeight: '800',
      color: colors.accent,
      marginTop: spacing.xs,
    },
    breakdown: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    breakdownTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.md,
    },
    paymentBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrBox: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    methodTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    methodHint: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    qrWrap: {
      padding: spacing.md,
      backgroundColor: colors.white,
      borderRadius: radius.md,
    },
    methodAction: {
      marginTop: spacing.md,
    },
    linhaPreview: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
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
      fontFamily: 'monospace',
      lineHeight: 20,
    },
    backLink: {
      alignItems: 'center',
      padding: spacing.sm,
    },
    backLinkText: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    empty: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
