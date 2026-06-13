import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { formatCurrency, formatReferenceMonth, getInvoiceById, getInvoicesByIds } from '@/lib/api-contract';
import type { Invoice } from '@/lib/api-contract';
import { Button, Input } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { paramString } from '@/lib/route-params';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function parseInvoiceIds(
  single?: string,
  multiple?: string,
): string[] {
  const raw = multiple?.trim() ? multiple : single;
  if (!raw) return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

export default function PayCardScreen() {
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
  const styles = useThemedStyles(createPayCardStyles);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const total = useMemo(
    () => Math.round(invoices.reduce((sum, inv) => sum + inv.amount, 0) * 100) / 100,
    [invoices],
  );

  useEffect(() => {
    if (authLoading || !session) return;

    const load = async () => {
      setFetching(true);
      try {
        if (invoiceIdList.length === 0) {
          setInvoices([]);
          return;
        }
        if (isBulk) {
          setInvoices(await getInvoicesByIds(session, invoiceIdList));
        } else {
          const one = await getInvoiceById(session, invoiceIdList[0]);
          setInvoices(one ? [one] : []);
        }
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [session, invoiceIdList, isBulk, authLoading]);

  if (authLoading || fetching) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handlePay = () => {
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Cartão inválido', 'Informe o número do cartão completo.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const message = isBulk
        ? `${invoices.length} faturas no valor total de ${formatCurrency(total)} foram simuladas como pagas. Nenhuma cobrança real foi feita.`
        : 'Este é apenas um fluxo de demonstração. Nenhuma cobrança foi realizada.';
      Alert.alert('Pagamento simulado', message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 800);
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isBulk ? 'Pagar todas com cartão' : 'Pagar com cartão' }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {invoices.length > 0 ? (
          <>
            <Text style={styles.amount}>Total: {formatCurrency(total)}</Text>
            {isBulk ? (
              <View style={styles.breakdown}>
                {invoices.map((inv) => (
                  <View key={inv.id} style={styles.line}>
                    <Text style={styles.lineRef}>Ref. {formatReferenceMonth(inv.referenceMonth)}</Text>
                    <Text style={styles.lineValue}>{formatCurrency(inv.amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
        <Text style={styles.note}>
          Ambiente de demonstração — dados do cartão não são enviados a nenhum gateway.
        </Text>

        <Input
          label="Número do cartão"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="number-pad"
          placeholder="0000 0000 0000 0000"
        />
        <Input
          label="Nome no cartão"
          value={cardName}
          onChangeText={setCardName}
          autoCapitalize="characters"
          placeholder="Como impresso no cartão"
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Validade"
              value={expiry}
              onChangeText={setExpiry}
              placeholder="MM/AA"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <Input
              label="CVV"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="123"
            />
          </View>
        </View>

        <Button
          title={isBulk ? 'Confirmar pagamento de todas' : 'Confirmar pagamento'}
          variant="accent"
          onPress={handlePay}
          loading={loading}
        />
      </ScrollView>
    </>
  );
}

function createPayCardStyles(colors: AppColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    amount: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    breakdown: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    line: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    lineRef: {
      fontSize: typography.body,
      color: colors.textSecondary,
    },
    lineValue: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    note: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    half: { flex: 1 },
  });
}
