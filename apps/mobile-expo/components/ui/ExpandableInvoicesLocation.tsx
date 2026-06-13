import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { formatCurrency, formatReferenceMonth, findTaxNoteForInvoice } from '@/lib/api-contract';
import type { InvoicesByLocation, Invoice, TaxNote } from '@/lib/api-contract';
import { InvoiceCard } from '@/components/ui/InvoiceCard';
import { LocationSectionHeader } from '@/components/ui/LocationSectionHeader';
import { PaidInvoiceMeta } from '@/components/ui/PaidInvoiceMeta';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ExpandableInvoicesLocationProps {
  group: InvoicesByLocation;
  expanded: boolean;
  onToggle: () => void;
  showPayment?: boolean;
  taxNotes?: TaxNote[];
}

function isPayable(invoice: Invoice) {
  return invoice.status === 'open' || invoice.status === 'overdue';
}

export function ExpandableInvoicesLocation({
  group,
  expanded,
  onToggle,
  showPayment = false,
  taxNotes = [],
}: ExpandableInvoicesLocationProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createExpandableInvoicesLocationStyles);

  if (group.invoices.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <LocationSectionHeader group={group} expanded={expanded} onPress={onToggle} />

      {expanded ? (
        <View style={styles.expandedBody}>
          {group.invoices.map((invoice, index) => (
            <View key={invoice.id} style={index > 0 ? styles.invoiceSpacing : undefined}>
              {showPayment && isPayable(invoice) ? (
                <>
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
                    <Text style={styles.detailLinkText}>Ver detalhes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.paidBlock}>
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => router.push(`/invoice/${invoice.id}`)}
                    accessibilityRole="button"
                  >
                    <View style={styles.itemBody}>
                      <Text style={styles.ref}>Ref. {formatReferenceMonth(invoice.referenceMonth)}</Text>
                      <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
                      <PaidInvoiceMeta invoice={invoice} compact />
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {(() => {
                    const taxNote = findTaxNoteForInvoice(invoice.id, taxNotes);
                    if (!taxNote) return null;
                    return (
                      <TouchableOpacity
                        style={styles.taxNoteLink}
                        onPress={() => router.push(`/invoices-notes/${taxNote.id}` as Href)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver nota fiscal ${taxNote.number}`}
                      >
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <Text style={styles.taxNoteText}>Ver nota fiscal</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primaryLight} />
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createExpandableInvoicesLocationStyles(colors: AppColors) {
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
    paidBlock: {
      paddingBottom: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    itemBody: { flex: 1 },
    ref: { fontSize: typography.label, color: colors.textSecondary },
    amount: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 4,
    },
    date: { fontSize: typography.body, color: colors.textSecondary },
    chevron: { fontSize: 28, color: colors.textSecondary, marginLeft: spacing.sm },
    detailLink: {
      alignItems: 'center',
      paddingBottom: spacing.sm,
    },
    detailLinkText: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    taxNoteLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.primary + '10',
      borderRadius: radius.md,
    },
    taxNoteText: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
