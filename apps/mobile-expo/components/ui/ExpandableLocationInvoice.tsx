import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import type { InvoicesByLocation } from '@/lib/api-contract';
import { InvoiceCard } from '@/components/ui/InvoiceCard';
import { LocationSectionHeader } from '@/components/ui/LocationSectionHeader';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ExpandableLocationInvoiceProps {
  group: InvoicesByLocation;
  expanded: boolean;
  onToggle: () => void;
}

export function ExpandableLocationInvoice({
  group,
  expanded,
  onToggle,
}: ExpandableLocationInvoiceProps) {
  const styles = useThemedStyles(createExpandableLocationInvoiceStyles);
  if (group.invoices.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <LocationSectionHeader
        group={group}
        expanded={expanded}
        onPress={onToggle}
      />

      {expanded ? (
        <View style={styles.expandedBody}>
          {group.invoices.map((invoice, index) => (
            <View key={invoice.id} style={index > 0 ? styles.invoiceSpacing : undefined}>
              <InvoiceCard
                invoice={invoice}
                showPayment
                compact
                embedded
              />
              <TouchableOpacity
                style={styles.detailLink}
                onPress={() => router.push(`/invoice/${invoice.id}`)}
                accessibilityRole="button"
              >
                <Text style={styles.detailLinkText}>Ver detalhes da fatura</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createExpandableLocationInvoiceStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    expandedBody: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      marginTop: -spacing.sm,
    },
    invoiceSpacing: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailLink: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    detailLinkText: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.primaryLight,
    },
  });
}
