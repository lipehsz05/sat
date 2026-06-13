import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { getOpenInvoicesByLocation } from '@/lib/api-contract';
import type { InvoicesByLocation } from '@/lib/api-contract';
import { BrandHeader } from '@/components/ui/BrandHeader';
import { ExpandableLocationInvoice } from '@/components/ui/ExpandableLocationInvoice';
import { QuickActionStrip, type QuickAction } from '@/components/ui/QuickActionGrid';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFocusFetch } from '@/hooks/useFocusFetch';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function HomeScreen() {
  const { session, profile } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createHomeStyles);
  const [groups, setGroups] = useState<InvoicesByLocation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleInvoices = useCallback((items: InvoicesByLocation[]) => {
    setGroups(items);
    setExpandedId((current) => {
      if (current && items.some((g) => g.location.id === current)) return current;
      return items.length === 1 ? items[0].location.id : null;
    });
  }, []);

  const loading = useFocusFetch(
    session ? `${session.userId}:home-invoices` : null,
    () => getOpenInvoicesByLocation(session!),
    handleInvoices,
    () => setGroups([]),
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'release',
        label: 'Liberar conexão',
        icon: 'wifi-outline',
        route: '/release-connection',
        color: colors.accent,
      },
      {
        id: 'report',
        label: 'Reportar problema',
        icon: 'alert-circle-outline',
        route: '/report-problem',
        color: colors.primary,
      },
      {
        id: 'negotiate',
        label: 'Negociar débitos',
        icon: 'chatbubbles-outline',
        route: '/negotiate-debt',
        color: colors.primaryLight,
      },
      {
        id: 'tax',
        label: 'Notas fiscais',
        icon: 'document-text-outline',
        route: '/invoices-notes',
        color: colors.primaryMid,
      },
    ],
    [colors],
  );

  const toggleLocation = (locationId: string) => {
    setExpandedId((current) => (current === locationId ? null : locationId));
  };

  return (
    <SafeScreen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader profile={profile} />

        <Text style={styles.sectionTitle}>Acessos rápidos</Text>
        <QuickActionStrip
          actions={quickActions}
          onAction={(route) => router.push(route as Href)}
        />

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Faturas em aberto</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma fatura em aberto no momento.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <ExpandableLocationInvoice
              key={group.location.id}
              group={group}
              expanded={expandedId === group.location.id}
              onToggle={() => toggleLocation(group.location.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

function createHomeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    sectionTitleSpaced: {
      marginTop: spacing.lg,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
