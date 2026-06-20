import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import { Ionicons } from '@expo/vector-icons';
import {
  formatCurrency,
  formatDate,
  formatReferenceMonth,
  getOpenInvoicesByLocation,
  negotiateDebts,
} from '@/lib/api-contract';
import type { Invoice, InvoicesByLocation, NegotiationResult } from '@/lib/api-contract';
import { LocationSectionHeader } from '@/components/ui/LocationSectionHeader';
import { Button, Card } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFocusFetch } from '@/hooks/useFocusFetch';
import { useLocationDisplayName } from '@/context/LocationLabelsContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const INSTALLMENT_OPTIONS = [2, 3, 6, 12];

type SelectionMode = 'single' | 'all';

const statusLabels: Record<Invoice['status'], string> = {
  open: 'Em aberto',
  paid: 'Paga',
  overdue: 'Vencida',
};

function getStatusColors(colors: AppColors): Record<Invoice['status'], string> {
  return {
    open: colors.primary,
    paid: colors.success,
    overdue: colors.accent,
  };
}

function estimateInstallment(amount: number, installments: number): number {
  return Math.ceil((amount / installments) * 100) / 100;
}

function NegotiateAllOption({
  selected,
  total,
  count,
  onSelect,
}: {
  selected: boolean;
  total: number;
  count: number;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createNegotiateAllOptionStyles);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.88}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Negociar todos os débitos, total ${formatCurrency(total)}`}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="layers-outline" size={24} color={colors.white} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Negociar todos os débitos</Text>
          <Text style={styles.sub}>
            {count} {count === 1 ? 'fatura' : 'faturas'} em um único parcelamento
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(total)}</Text>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}
function DebtOption({
  debt,
  selected,
  onSelect,
  disabled,
}: {
  debt: Invoice;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createDebtOptionStyles);
  const statusColor = getStatusColors(colors)[debt.status];

  return (
    <TouchableOpacity
      style={[styles.debtCard, selected && styles.debtSelected, disabled && styles.debtDisabled]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Fatura ${formatReferenceMonth(debt.referenceMonth)}, ${formatCurrency(debt.amount)}`}
    >
      <View style={styles.debtMain}>
        <View style={styles.debtHeader}>
          <Text style={styles.debtRef}>Ref. {formatReferenceMonth(debt.referenceMonth)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[debt.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.debtAmount}>{formatCurrency(debt.amount)}</Text>
        <Text style={styles.debtDue}>Vencimento: {formatDate(debt.dueDate)}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function NegotiateBreakdownLine({
  group,
  invoice,
}: {
  group: InvoicesByLocation;
  invoice: Invoice;
}) {
  const styles = useThemedStyles(createNegotiateBreakdownLineStyles);
  const name = useLocationDisplayName(group.location.id, group.location.name);

  return (
    <View style={styles.line}>
      <View style={styles.lineLeft}>
        <Text style={styles.lineName}>{name}</Text>
        <Text style={styles.lineMeta}>
          Ref. {formatReferenceMonth(invoice.referenceMonth)} · {statusLabels[invoice.status]}
        </Text>
      </View>
      <Text style={styles.lineAmount}>{formatCurrency(invoice.amount)}</Text>
    </View>
  );
}

export default function NegotiateDebtScreen() {
  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createNegotiateDebtStyles);
  const [groups, setGroups] = useState<InvoicesByLocation[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [installments, setInstallments] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [simulation, setSimulation] = useState<NegotiationResult | null>(null);

  const fetchDebts = useCallback(
    () => getOpenInvoicesByLocation(session!),
    [session],
  );

  const handleDebts = useCallback((items: InvoicesByLocation[]) => {
    setSimulation(null);
    setGroups(items);
    const all = items.flatMap((g) => g.invoices);
    setSelectedId(all[0]?.id ?? null);
    setSelectionMode(all.length > 1 ? 'all' : 'single');
  }, []);

  const loading = useFocusFetch(
    !authLoading && session ? `${session.userId}:negotiate-debt` : null,
    fetchDebts,
    handleDebts,
    () => setGroups([]),
  );

  const allInvoices = useMemo(() => groups.flatMap((g) => g.invoices), [groups]);

  const allInvoiceIds = useMemo(() => allInvoices.map((inv) => inv.id), [allInvoices]);

  const totalDebt = useMemo(
    () => Math.round(allInvoices.reduce((sum, inv) => sum + inv.amount, 0) * 100) / 100,
    [allInvoices],
  );

  const selectedInvoice = useMemo(() => {
    if (!selectedId) return null;
    for (const group of groups) {
      const found = group.invoices.find((inv) => inv.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [groups, selectedId]);

  const debtCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.invoices.length, 0),
    [groups],
  );

  const activeAmount =
    selectionMode === 'all' ? totalDebt : (selectedInvoice?.amount ?? 0);

  const canSimulate =
    selectionMode === 'all' ? allInvoices.length > 0 : !!selectedInvoice;

  const previewAmount = canSimulate
    ? estimateInstallment(activeAmount, installments)
    : 0;

  const handleSelectAll = () => {
    setSelectionMode('all');
    setSimulation(null);
  };

  const handleSelectDebt = (id: string) => {
    setSelectionMode('single');
    setSelectedId(id);
    setSimulation(null);
  };

  const handleInstallmentsChange = (n: number) => {
    setInstallments(n);
    setSimulation(null);
  };

  const handleNegotiate = async () => {
    if (!session || !canSimulate) return;
    const ids = selectionMode === 'all' ? allInvoiceIds : selectedId ? [selectedId] : [];
    if (ids.length === 0) return;

    setSubmitting(true);
    try {
      const result = await negotiateDebts(session, ids, installments);
      setSimulation(result);
      const scope =
        result.invoiceIds.length > 1
          ? `${result.invoiceIds.length} faturas (total ${formatCurrency(result.totalAmount)})`
          : `fatura de ${formatCurrency(result.totalAmount)}`;
      Alert.alert(
        'Negociação simulada',
        `${result.installments}x de ${formatCurrency(result.installmentAmount)} para ${scope}. Primeira parcela em ${formatDate(result.firstDueDate)}.`,
      );
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível simular.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasDebts = debtCount > 0;

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StackScreenTitle title="Negociar débitos" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Parcelamento de débitos</Text>
        <Text style={styles.subtitle}>
          Negocie uma fatura ou todos os débitos em aberto em um único parcelamento.
        </Text>

        {!hasDebts ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={56} color={colors.success} />
            <Text style={styles.emptyTitle}>Tudo em dia</Text>
            <Text style={styles.emptyText}>
              Não há débitos em aberto para negociar no momento.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={22} color={colors.warning} />
              <Text style={styles.infoText}>
                A simulação não gera cobrança. Após confirmar com nossa equipe, as parcelas
                passam a constar nas próximas faturas.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {debtCount > 1 ? '1. O que negociar' : '1. Fatura em débito'}
                </Text>
                <Text style={styles.sectionHint}>
                  {debtCount} {debtCount === 1 ? 'débito' : 'débitos'}
                </Text>
              </View>

              {debtCount > 1 ? (
                <NegotiateAllOption
                  selected={selectionMode === 'all'}
                  total={totalDebt}
                  count={debtCount}
                  onSelect={handleSelectAll}
                />
              ) : null}

              {debtCount > 1 ? (
                <Text style={styles.orDivider}>ou escolha uma fatura</Text>
              ) : null}

              {groups.map((group) =>
                group.invoices.length > 0 ? (
                  <View key={group.location.id} style={styles.locationBlock}>
                    <LocationSectionHeader group={group} showMonthly={false} />
                    {group.invoices.map((debt) => (
                      <DebtOption
                        key={debt.id}
                        debt={debt}
                        selected={selectionMode === 'single' && selectedId === debt.id}
                        onSelect={() => handleSelectDebt(debt.id)}
                        disabled={selectionMode === 'all'}
                      />
                    ))}
                  </View>
                ) : null,
              )}
            </View>

            {canSimulate ? (
              <>
                <Card style={styles.previewBox}>
                  <Text style={styles.previewLabel}>
                    {selectionMode === 'all' ? 'Total dos débitos' : 'Valor selecionado'}
                  </Text>
                  <Text style={styles.previewTotal}>{formatCurrency(activeAmount)}</Text>
                  {selectionMode === 'all' ? (
                    <Text style={styles.previewMeta}>
                      {debtCount} faturas · parcelamento único
                    </Text>
                  ) : selectedInvoice ? (
                    <Text style={styles.previewMeta}>
                      Ref. {formatReferenceMonth(selectedInvoice.referenceMonth)} · Venc.{' '}
                      {formatDate(selectedInvoice.dueDate)}
                    </Text>
                  ) : null}
                </Card>

                {selectionMode === 'all' ? (
                  <Card style={styles.breakdownBox}>
                    <Text style={styles.breakdownTitle}>Faturas incluídas</Text>
                    {groups.map((group) =>
                      group.invoices.map((inv) => (
                        <NegotiateBreakdownLine
                          key={inv.id}
                          group={group}
                          invoice={inv}
                        />
                      )),
                    )}
                  </Card>
                ) : null}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>2. Número de parcelas</Text>
                  <View style={styles.installments}>
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.chip, installments === n && styles.chipActive]}
                        onPress={() => handleInstallmentsChange(n)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: installments === n }}
                      >
                        <Text
                          style={[styles.chipText, installments === n && styles.chipTextActive]}
                        >
                          {n}x
                        </Text>
                        <Text
                          style={[
                            styles.chipSub,
                            installments === n && styles.chipSubActive,
                          ]}
                        >
                          {formatCurrency(estimateInstallment(activeAmount, n))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Card style={styles.summaryBox}>
                  <Text style={styles.sectionTitle}>3. Resumo da simulação</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {selectionMode === 'all' ? 'Total negociado' : 'Total do débito'}
                    </Text>
                    <Text style={styles.summaryValue}>{formatCurrency(activeAmount)}</Text>
                  </View>
                  {selectionMode === 'all' ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Faturas</Text>
                      <Text style={styles.summaryValue}>{debtCount}</Text>
                    </View>
                  ) : null}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Parcelas</Text>
                    <Text style={styles.summaryValue}>{installments}x</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryHighlight]}>
                    <Text style={styles.summaryHighlightLabel}>Valor estimado por parcela</Text>
                    <Text style={styles.summaryHighlightValue}>
                      {formatCurrency(previewAmount)}
                    </Text>
                  </View>
                </Card>

                {simulation ? (
                  <View style={styles.resultBox}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>Simulação gerada</Text>
                      <Text style={styles.resultText}>
                        {simulation.installments}x de{' '}
                        {formatCurrency(simulation.installmentAmount)}
                        {simulation.invoiceIds.length > 1
                          ? ` — ${simulation.invoiceIds.length} faturas, total ${formatCurrency(simulation.totalAmount)}`
                          : ''}
                        . Primeira parcela em {formatDate(simulation.firstDueDate)}.
                      </Text>
                    </View>
                  </View>
                ) : null}

                <Button
                  title={
                    selectionMode === 'all'
                      ? 'Simular negociação de todos'
                      : 'Simular negociação'
                  }
                  variant="accent"
                  onPress={handleNegotiate}
                  loading={submitting}
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

function createDebtOptionStyles(colors: AppColors) {
  return StyleSheet.create({
    debtCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: colors.border,
    },
    debtSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '08',
    },
    debtDisabled: {
      opacity: 0.55,
    },
    debtMain: {
      flex: 1,
      marginRight: spacing.sm,
    },
    debtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    debtRef: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
    },
    debtAmount: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 4,
    },
    debtDue: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
  });
}

function createNegotiateAllOptionStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    cardSelected: {
      borderColor: colors.accent,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
    },
    title: {
      fontSize: typography.body,
      fontWeight: '800',
      color: colors.textOnDark,
    },
    sub: {
      fontSize: typography.label,
      color: colors.textMutedOnDark,
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    amount: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.textOnDark,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.textMutedOnDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: colors.textOnDark,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.textOnDark,
    },
  });
}

function createNegotiateBreakdownLineStyles(colors: AppColors) {
  return StyleSheet.create({
    line: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    lineLeft: {
      flex: 1,
      marginRight: spacing.sm,
    },
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
    lineAmount: {
      fontSize: typography.body,
      fontWeight: '800',
      color: colors.primary,
    },
  });
}

function createNegotiateDebtStyles(colors: AppColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
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
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.warningLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    infoText: {
      flex: 1,
      fontSize: typography.label,
      color: colors.text,
      lineHeight: 20,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
    },
    sectionHint: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    locationBlock: {
      marginBottom: spacing.md,
    },
    orDivider: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: spacing.sm,
    },
    breakdownBox: {
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    breakdownTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    previewBox: {
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    previewLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    previewTotal: {
      fontSize: typography.amount,
      fontWeight: '800',
      color: colors.accent,
      marginTop: spacing.xs,
    },
    previewMeta: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    installments: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    chip: {
      width: '47%',
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    chipText: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },
    chipSub: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '600',
    },
    chipSubActive: {
      color: colors.primaryLight,
    },
    summaryBox: {
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
    },
    summaryLabel: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    summaryHighlight: {
      backgroundColor: colors.background,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      marginTop: spacing.md,
      borderTopWidth: 0,
    },
    summaryHighlightLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.primary,
    },
    summaryHighlightValue: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.accent,
    },
    resultBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.successLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.success,
      marginBottom: 2,
    },
    resultText: {
      fontSize: typography.label,
      color: colors.text,
      lineHeight: 20,
    },
    emptyBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      marginTop: spacing.md,
    },
    emptyTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing.md,
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 22,
    },
  });
}
