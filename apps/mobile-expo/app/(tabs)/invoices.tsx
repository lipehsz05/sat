import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeScreen } from '@/components/ui/SafeScreen';
import {
  formatCurrency,
  getInvoiceHistoryByLocation,
  getOpenInvoicesSummary,
  getTaxNotes,
} from '@/lib/api-contract';
import type { InvoicesByLocation, OpenInvoicesSummary, TaxNote } from '@/lib/api-contract';
import { paginateInvoiceGroups } from '@/lib/api-contract';
import { ExpandableInvoicesLocation } from '@/components/ui/ExpandableInvoicesLocation';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { PAGE_SIZE } from '@/lib/pagination';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFocusFetch } from '@/hooks/useFocusFetch';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Filter = 'open' | 'paid';

interface InvoicesPayload {
  history: InvoicesByLocation[];
  summary: OpenInvoicesSummary | null;
  notes: TaxNote[];
}

export default function InvoicesScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createInvoicesStyles);
  const [groups, setGroups] = useState<InvoicesByLocation[]>([]);
  const [filter, setFilter] = useState<Filter>('open');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payAllTotal, setPayAllTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [taxNotes, setTaxNotes] = useState<TaxNote[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const fetchInvoices = useCallback(async (): Promise<InvoicesPayload> => {
    const [history, summary, notes] = await Promise.all([
      getInvoiceHistoryByLocation(session!, filter),
      filter === 'open' ? getOpenInvoicesSummary(session!) : Promise.resolve(null),
      filter === 'paid' ? getTaxNotes(session!) : Promise.resolve([] as TaxNote[]),
    ]);
    return { history, summary, notes };
  }, [session, filter]);

  const handleInvoices = useCallback(({ history, summary, notes }: InvoicesPayload) => {
    setGroups(history);
    setTaxNotes(notes);
    setExpandedId((current) => {
      if (current && history.some((g) => g.location.id === current)) return current;
      return history.length === 1 ? history[0].location.id : null;
    });
    if (summary) {
      setPayAllTotal(summary.total);
      setOpenCount(summary.invoices.length);
    } else {
      setPayAllTotal(0);
      setOpenCount(0);
    }
  }, []);

  const handleInvoicesError = useCallback(() => {
    setGroups([]);
    setTaxNotes([]);
    setPayAllTotal(0);
    setOpenCount(0);
  }, []);

  const loading = useFocusFetch(
    session ? `${session.userId}:invoices:${filter}` : null,
    fetchInvoices,
    handleInvoices,
    handleInvoicesError,
  );

  const pagination = useMemo(
    () => paginateInvoiceGroups(groups, page, PAGE_SIZE),
    [groups, page],
  );

  const pageGroups = pagination.groups;

  useEffect(() => {
    setExpandedId((current) => {
      if (current && pageGroups.some((g) => g.location.id === current)) return current;
      return pageGroups.length === 1 ? pageGroups[0].location.id : null;
    });
  }, [pageGroups]);

  const hasInvoices = pageGroups.some((g) => g.invoices.length > 0);

  const toggleLocation = (locationId: string) => {
    setExpandedId((current) => (current === locationId ? null : locationId));
  };

  return (
    <SafeScreen style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas faturas</Text>
        <Text style={styles.subtitle}>Toque no endereço para ver faturas e pagar</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, filter === 'open' && styles.tabActive]}
            onPress={() => setFilter('open')}
          >
            <Text style={[styles.tabText, filter === 'open' && styles.tabTextActive]}>
              Em aberto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'paid' && styles.tabActive]}
            onPress={() => setFilter('paid')}
          >
            <Text style={[styles.tabText, filter === 'paid' && styles.tabTextActive]}>
              Pagas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filter === 'open' && openCount > 1 && !loading ? (
        <TouchableOpacity
          style={styles.payAllBar}
          onPress={() => router.push('/pay-all')}
          accessibilityRole="button"
          accessibilityLabel={`Pagar todas as ${openCount} faturas, total ${formatCurrency(payAllTotal)}`}
        >
          <View style={styles.payAllLeft}>
            <Ionicons name="wallet-outline" size={24} color={colors.white} />
            <View>
              <Text style={styles.payAllTitle}>Pagar todas</Text>
              <Text style={styles.payAllSub}>
                {openCount} {openCount === 1 ? 'fatura' : 'faturas'}
              </Text>
            </View>
          </View>
          <Text style={styles.payAllAmount}>{formatCurrency(payAllTotal)}</Text>
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {!hasInvoices ? (
            <Text style={styles.empty}>Nenhuma fatura nesta categoria.</Text>
          ) : (
            pageGroups.map((group) => (
              <ExpandableInvoicesLocation
                key={group.location.id}
                group={group}
                expanded={expandedId === group.location.id}
                onToggle={() => toggleLocation(group.location.id)}
                showPayment={filter === 'open'}
                taxNotes={filter === 'paid' ? taxNotes : undefined}
              />
            ))
          )}
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
          />
        </ScrollView>
      )}
    </SafeScreen>
  );
}

function createInvoicesStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    title: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    subtitle: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: spacing.md,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: radius.md,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    tabActive: {
      backgroundColor: colors.surface,
    },
    tabText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.accent,
    },
    payAllBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
    },
    payAllLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    payAllTitle: {
      fontSize: typography.body,
      fontWeight: '800',
      color: colors.white,
    },
    payAllSub: {
      fontSize: typography.label,
      color: colors.white,
      opacity: 0.9,
      marginTop: 2,
    },
    payAllAmount: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.white,
    },
    loader: { marginTop: spacing.xl },
    list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
    empty: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: typography.body,
      marginTop: spacing.xl,
    },
  });
}
