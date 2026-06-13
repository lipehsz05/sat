import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { formatCurrency, formatDate, formatAddressShort, formatReferenceMonth, findLocation, getInvoiceById, getTaxNoteByInvoiceId } from '@/lib/api-contract';
import type { Invoice, ServiceLocation, TaxNote } from '@/lib/api-contract';
import { Button } from '@/components/ui/Button';
import { InvoicePaymentSection } from '@/components/ui/InvoicePaymentSection';
import { PaidInvoiceMeta } from '@/components/ui/PaidInvoiceMeta';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocationDisplayName } from '@/context/LocationLabelsContext';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { paramString } from '@/lib/route-params';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function InvoiceLocationBox({ location }: { location: ServiceLocation }) {
  const styles = useThemedStyles(createInvoiceLocationBoxStyles);
  const displayName = useLocationDisplayName(location.id, location.name);
  const hasCustom = displayName !== location.name;

  return (
    <View style={styles.locationBox}>
      <Text style={styles.locationName}>{displayName}</Text>
      {hasCustom ? <Text style={styles.locationOfficial}>Na conta: {location.name}</Text> : null}
      <Text style={styles.locationPlan}>{location.planName}</Text>
      <Text style={styles.locationAddress}>{formatAddressShort(location.address)}</Text>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const invoiceId = paramString(id);
  const { profile } = useAuth();
  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createInvoiceDetailStyles);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [taxNote, setTaxNote] = useState<TaxNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!session || !invoiceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    getInvoiceById(session, invoiceId)
      .then(async (result) => {
        setInvoice(result);
        if (!result) {
          setError('Fatura não encontrada.');
          setTaxNote(null);
          return;
        }
        if (result.status === 'paid') {
          const note = await getTaxNoteByInvoiceId(session, result.id);
          setTaxNote(note);
        } else {
          setTaxNote(null);
        }
      })
      .catch(() => setError('Não foi possível carregar a fatura.'))
      .finally(() => setLoading(false));
  }, [session, invoiceId, authLoading]);

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Fatura não encontrada.'}</Text>
      </View>
    );
  }

  const isPayable = invoice.status === 'open' || invoice.status === 'overdue';
  const location = profile?.locations
    ? findLocation(profile.locations, invoice.locationId)
    : undefined;

  return (
    <>
      <Stack.Screen options={{ title: `Fatura ${formatReferenceMonth(invoice.referenceMonth)}` }} />
      <ScrollView contentContainerStyle={styles.container}>
        {location ? <InvoiceLocationBox location={location} /> : null}
        <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
        <Text style={styles.meta}>Vencimento: {formatDate(invoice.dueDate)}</Text>
        <Text style={styles.meta}>Status: {invoice.status === 'paid' ? 'Paga' : 'Pendente'}</Text>

        {invoice.status === 'paid' ? (
          <View style={styles.paidBox}>
            <PaidInvoiceMeta invoice={invoice} />
          </View>
        ) : null}

        {isPayable ? (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Formas de pagamento</Text>
            <Text style={styles.paymentSub}>PIX, cartão ou boleto bancário</Text>
            <InvoicePaymentSection invoice={invoice} />
          </View>
        ) : (
          <>
            {taxNote ? (
              <>
                <View style={styles.spacer} />
                <Button
                  title="Ver nota fiscal"
                  variant="outline"
                  onPress={() => router.push(`/invoices-notes/${taxNote.id}` as Href)}
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

function createInvoiceLocationBoxStyles(colors: AppColors) {
  return StyleSheet.create({
    locationBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    locationName: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
    locationOfficial: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationPlan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationAddress: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
  });
}

function createInvoiceDetailStyles(colors: AppColors) {
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
      backgroundColor: colors.background,
    },
    amount: {
      fontSize: typography.amount,
      fontWeight: '800',
      color: colors.text,
    },
    meta: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: 6,
    },
    paidBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
    paymentSub: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 4,
    },
    spacer: { height: spacing.sm },
    error: { color: colors.error, fontSize: typography.body, textAlign: 'center' },
  });
}
