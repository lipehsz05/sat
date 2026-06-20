import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import {
  formatBoletoLinhaDigitavel,
  formatCurrency,
  formatDate,
  formatReferenceMonth,
  getInvoiceById,
  getInvoicesByIds,
  getOpenInvoicesSummary,
} from '@/lib/api-contract';
import type { Invoice } from '@/lib/api-contract';
import { BoletoBarcodeVisual } from '@/components/ui/BoletoBarcodeVisual';
import { Button } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { paramString } from '@/lib/route-params';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function parseInvoiceIds(single?: string, multiple?: string): string[] {
  const raw = multiple?.trim() ? multiple : single;
  if (!raw) return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

export default function PayBoletoScreen() {
  const { invoiceId: rawInvoiceId, invoiceIds: rawInvoiceIds } = useLocalSearchParams<{
    invoiceId?: string | string[];
    invoiceIds?: string | string[];
  }>();
  const singleId = paramString(rawInvoiceId);
  const bulkIds = paramString(rawInvoiceIds);
  const invoiceIdList = useMemo(
    () => parseInvoiceIds(singleId, bulkIds),
    [singleId, bulkIds],
  );
  const isBulk = invoiceIdList.length > 1;

  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createPayBoletoStyles);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [barcode, setBarcode] = useState('');
  const [boletoUrl, setBoletoUrl] = useState('');
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const total = useMemo(
    () => Math.round(invoices.reduce((sum, inv) => sum + inv.amount, 0) * 100) / 100,
    [invoices],
  );

  const dueDate = invoices[0]?.dueDate;

  useEffect(() => {
    if (authLoading || !session) return;

    const load = async () => {
      setLoading(true);
      try {
        if (invoiceIdList.length === 0) {
          setInvoices([]);
          return;
        }
        if (isBulk) {
          const items = await getInvoicesByIds(session, invoiceIdList);
          setInvoices(items);
          const summary = await getOpenInvoicesSummary(session);
          setBarcode(summary.combinedBoletoBarcode);
          setBoletoUrl(summary.combinedBoletoUrl);
        } else {
          const one = await getInvoiceById(session, invoiceIdList[0]);
          setInvoices(one ? [one] : []);
          if (one) {
            setBarcode(one.barcode);
            setBoletoUrl(one.boletoUrl);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, invoiceIdList, isBulk, authLoading]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerated(true);
      setGenerating(false);
      Alert.alert(
        'Boleto gerado',
        isBulk
          ? `Boleto consolidado de ${formatCurrency(total)} gerado com sucesso (simulado).`
          : 'Seu boleto foi gerado e está pronto para pagamento (simulado).',
      );
    }, 600);
  };

  const handleCopy = async () => {
    if (!barcode) return;
    await Clipboard.setStringAsync(barcode.replace(/\D/g, ''));
    Alert.alert('Copiado', 'Linha digitável copiada para a área de transferência.');
  };

  const handleDownloadPdf = async () => {
    if (!boletoUrl) {
      Alert.alert('Indisponível', 'PDF do boleto não disponível.');
      return;
    }
    const canOpen = await Linking.canOpenURL(boletoUrl);
    if (canOpen) {
      await Linking.openURL(boletoUrl);
    } else {
      Alert.alert('Download', 'Download do PDF do boleto iniciado (simulado).');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (invoices.length === 0 || !barcode) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Não foi possível gerar o boleto.</Text>
      </View>
    );
  }

  const linha = formatBoletoLinhaDigitavel(barcode);

  return (
    <>
      <StackScreenTitle title={isBulk ? 'Boleto consolidado' : 'Boleto bancário'} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.slip}>
          <View style={styles.slipHeader}>
            <Text style={styles.slipBank}>237 - Banco Bradesco</Text>
            <Text style={styles.slipTitle}>SAT TELECOM · BOLETO DE COBRANÇA</Text>
          </View>

          <View style={styles.slipBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Beneficiário</Text>
              <Text style={styles.rowValue}>SAT TELECOM LTDA</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Vencimento</Text>
              <Text style={styles.rowValue}>{dueDate ? formatDate(dueDate) : '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                {isBulk ? 'Faturas incluídas' : 'Referência'}
              </Text>
              <Text style={styles.rowValue}>
                {isBulk
                  ? `${invoices.length} faturas em aberto`
                  : formatReferenceMonth(invoices[0].referenceMonth)}
              </Text>
            </View>
            <View style={[styles.row, styles.amountRow]}>
              <Text style={styles.rowLabel}>Valor do documento</Text>
              <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {generated ? (
            <>
              <View style={styles.barcodeSection}>
                <Text style={styles.linhaLabel}>Linha digitável</Text>
                <Text style={styles.linha} selectable>
                  {linha}
                </Text>
                <View style={styles.barcodeVisual}>
                  <BoletoBarcodeVisual code={barcode} />
                </View>
              </View>

              <View style={styles.actions}>
                <Button title="Copiar linha digitável" variant="outline" onPress={handleCopy} />
                <View style={styles.spacer} />
                <Button title="Baixar PDF do boleto" variant="accent" onPress={handleDownloadPdf} />
              </View>
            </>
          ) : (
            <View style={styles.generateBox}>
              <Text style={styles.generateHint}>
                Toque abaixo para gerar o boleto com linha digitável e código de barras.
              </Text>
              <Button
                title={isBulk ? 'Gerar boleto consolidado' : 'Gerar boleto'}
                variant="accent"
                onPress={handleGenerate}
                loading={generating}
              />
            </View>
          )}
        </View>

        {isBulk ? (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Faturas no boleto</Text>
            {invoices.map((inv) => (
              <View key={inv.id} style={styles.breakdownLine}>
                <Text style={styles.breakdownRef}>Ref. {formatReferenceMonth(inv.referenceMonth)}</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(inv.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function createPayBoletoStyles(colors: AppColors) {
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
    slip: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    slipHeader: {
      backgroundColor: colors.primary,
      padding: spacing.md,
    },
    slipBank: {
      fontSize: typography.label,
      color: colors.textMutedOnDark,
      fontWeight: '600',
    },
    slipTitle: {
      fontSize: typography.body,
      fontWeight: '800',
      color: colors.textOnDark,
      marginTop: 4,
    },
    slipBody: {
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    rowLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      flex: 1,
    },
    rowValue: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'right',
    },
    amountRow: {
      borderBottomWidth: 0,
      marginTop: spacing.sm,
    },
    amountValue: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.accent,
      flex: 1,
      textAlign: 'right',
    },
    generateBox: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    generateHint: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
      lineHeight: 22,
    },
    barcodeSection: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linhaLabel: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    linha: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      lineHeight: 22,
      fontFamily: 'monospace',
      marginBottom: spacing.md,
    },
    barcodeVisual: {
      borderRadius: radius.sm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actions: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    spacer: { height: spacing.sm },
    breakdown: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    breakdownTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    breakdownLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    breakdownRef: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    breakdownAmount: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    error: {
      fontSize: typography.body,
      color: colors.error,
      textAlign: 'center',
    },
  });
}
