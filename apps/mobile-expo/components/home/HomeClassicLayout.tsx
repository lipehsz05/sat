import { router, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader } from '@/components/ui/BrandHeader';
import { ExpandableLocationInvoice } from '@/components/ui/ExpandableLocationInvoice';
import { QuickActionStrip } from '@/components/ui/QuickActionGrid';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { HomeLayoutSharedProps } from '@/hooks/useHomeScreenData';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export function HomeClassicLayout({
  groups,
  loading,
  expandedId,
  quickActions,
  toggleLocation,
  onQuickAction,
}: HomeLayoutSharedProps) {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createHomeClassicStyles);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BrandHeader profile={profile} />

      <Text style={styles.sectionTitle}>Acessos rápidos</Text>
      <QuickActionStrip
        actions={quickActions}
        onAction={(route) => onQuickAction(route as Href)}
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
  );
}

function createHomeClassicStyles(colors: AppColors) {
  return StyleSheet.create({
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
