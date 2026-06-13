import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { formatCurrency, getTaxNotes } from '@/lib/api-contract';
import type { ServiceLocation, TaxNote } from '@/lib/api-contract';
import { ExpandableTaxNotesLocation } from '@/components/ui/ExpandableTaxNotesLocation';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { PAGE_SIZE } from '@/lib/pagination';
import { paginateTaxNoteGroups } from '@/lib/api-contract';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useFocusFetch } from '@/hooks/useFocusFetch';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface TaxNotesGroup {
  location: ServiceLocation;
  notes: TaxNote[];
}

export default function TaxNotesScreen() {
  const { profile } = useAuth();
  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createTaxNotesStyles);
  const [notes, setNotes] = useState<TaxNote[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleNotes = useCallback((items: TaxNote[]) => {
    setNotes(items);
    setExpandedId((current) => {
      if (current && items.some((n) => n.locationId === current)) return current;
      const firstLocation = items[0]?.locationId;
      return items.length === 1 && firstLocation ? firstLocation : null;
    });
  }, []);

  const loading = useFocusFetch(
    !authLoading && session ? `${session.userId}:tax-notes` : null,
    () => getTaxNotes(session!),
    handleNotes,
    () => setNotes([]),
  );

  const groups = useMemo((): TaxNotesGroup[] => {
    if (!profile?.locations.length) return [];

    const byLocation = new Map<string, TaxNote[]>();
    for (const note of notes) {
      const list = byLocation.get(note.locationId) ?? [];
      list.push(note);
      byLocation.set(note.locationId, list);
    }

    return profile.locations
      .map((location) => ({
        location,
        notes: (byLocation.get(location.id) ?? []).sort((a, b) =>
          b.competence.localeCompare(a.competence),
        ),
      }))
      .filter((g) => g.notes.length > 0);
  }, [notes, profile?.locations]);

  const pagination = useMemo(
    () => paginateTaxNoteGroups(groups, page, PAGE_SIZE),
    [groups, page],
  );

  const pageGroups = pagination.groups;

  useEffect(() => {
    setExpandedId((current) => {
      if (current && pageGroups.some((g) => g.location.id === current)) return current;
      return pageGroups.length === 1 ? pageGroups[0].location.id : null;
    });
  }, [pageGroups]);

  const summary = useMemo(() => {
    const total = notes.reduce((sum, n) => sum + n.amount, 0);
    return { count: notes.length, total };
  }, [notes]);

  const toggleLocation = (locationId: string) => {
    setExpandedId((current) => (current === locationId ? null : locationId));
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Notas fiscais' }} />
      {authLoading || loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="receipt-outline" size={28} color={colors.accent} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Suas notas fiscais</Text>
              <Text style={styles.heroSub}>
                Documentos de serviço de internet por endereço
              </Text>
            </View>
          </View>

          {summary.count > 0 ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{summary.count}</Text>
                <Text style={styles.summaryLabel}>
                  {summary.count === 1 ? 'Nota disponível' : 'Notas disponíveis'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.summaryValueAccent]}>
                  {formatCurrency(summary.total)}
                </Text>
                <Text style={styles.summaryLabel}>Valor total emitido</Text>
              </View>
            </View>
          ) : null}

          {pageGroups.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>Nenhuma nota fiscal</Text>
              <Text style={styles.emptyText}>
                Quando uma fatura for paga, a nota fiscal do serviço aparecerá aqui.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionHint}>
                Toque no endereço para expandir e baixar o PDF
              </Text>
              {pageGroups.map(({ location, notes: locationNotes }) => (
                <ExpandableTaxNotesLocation
                  key={location.id}
                  location={location}
                  notes={locationNotes}
                  expanded={expandedId === location.id}
                  onToggle={() => toggleLocation(location.id)}
                />
              ))}
              <PaginationBar
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </ScrollView>
      )}
    </>
  );
}

function createTaxNotesStyles(colors: AppColors) {
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
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.lg,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroText: {
      flex: 1,
    },
    heroTitle: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    heroSub: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.sm,
    },
    summaryValue: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    summaryValueAccent: {
      color: colors.accent,
    },
    summaryLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    sectionHint: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
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
