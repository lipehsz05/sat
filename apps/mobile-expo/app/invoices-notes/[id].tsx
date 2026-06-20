import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import {
  formatAddressShort,
  formatCompetence,
  formatCurrency,
  formatDate,
  findLocation,
  getTaxNoteById,
} from '@/lib/api-contract';
import type { ServiceLocation, TaxNote } from '@/lib/api-contract';
import { Button } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocationDisplayName } from '@/context/LocationLabelsContext';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { paramString } from '@/lib/route-params';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function TaxNoteLocationRows({ location }: { location: ServiceLocation }) {
  const displayName = useLocationDisplayName(location.id, location.name);

  return (
    <>
      <InfoRow label="Endereço / rede" value={displayName} />
      <InfoRow label="Local" value={formatAddressShort(location.address)} />
      <InfoRow label="Plano" value={location.planName} />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(createTaxNoteDetailInfoRowStyles);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function TaxNoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const noteId = paramString(id);
  const { profile } = useAuth();
  const { session, isLoading: authLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createTaxNoteDetailStyles);
  const [note, setNote] = useState<TaxNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !session || !noteId) {
      if (!authLoading) setLoading(false);
      return;
    }
    setLoading(true);
    getTaxNoteById(session, noteId)
      .then((result) => {
        setNote(result);
        if (!result) setError('Nota fiscal não encontrada.');
      })
      .catch(() => setError('Não foi possível carregar a nota fiscal.'))
      .finally(() => setLoading(false));
  }, [session, noteId, authLoading]);

  const location = note && profile?.locations
    ? findLocation(profile.locations, note.locationId)
    : undefined;

  const handleDownload = () => {
    if (!note) return;
    Alert.alert('Download iniciado', `O PDF da NF ${note.number} será salvo no dispositivo (simulado).`);
  };

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.error}>{error || 'Nota fiscal não encontrada.'}</Text>
      </View>
    );
  }

  return (
    <>
      <StackScreenTitle title={`NF ${note.number}`} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.document}>
          <View style={styles.documentHeader}>
            <Ionicons name="business-outline" size={20} color={colors.textMutedOnDark} />
            <Text style={styles.documentIssuer}>SAT TELECOM</Text>
          </View>
          <Text style={styles.documentType}>NOTA FISCAL DE SERVIÇO</Text>
          <Text style={styles.documentNumber}>Nº {note.number}</Text>

          <View style={styles.documentDivider} />

          <InfoRow label="Competência" value={formatCompetence(note.competence)} />
          <InfoRow label="Data de emissão" value={formatDate(note.issueDate)} />
          {location ? <TaxNoteLocationRows location={location} /> : null}
          {profile ? (
            <InfoRow label="Tomador" value={profile.name} />
          ) : null}

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Valor do serviço</Text>
            <Text style={styles.amountValue}>{formatCurrency(note.amount)}</Text>
          </View>
        </View>

        <View style={styles.previewBox}>
          <Ionicons name="document-attach-outline" size={48} color={colors.primaryLight} />
          <Text style={styles.previewTitle}>Pré-visualização do PDF</Text>
          <Text style={styles.previewHint}>
            O arquivo oficial contém todos os dados fiscais exigidos pela legislação.
          </Text>
        </View>

        <Button
          title="Baixar PDF"
          variant="accent"
          onPress={handleDownload}
        />
        <View style={styles.spacer} />
        <Button
          title="Ver fatura vinculada"
          variant="outline"
          onPress={() => router.push(`/invoice/${note.invoiceId}` as Href)}
        />
      </ScrollView>
    </>
  );
}

function createTaxNoteDetailInfoRowStyles(colors: AppColors) {
  return StyleSheet.create({
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    infoLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      flex: 1.2,
      textAlign: 'right',
    },
  });
}

function createTaxNoteDetailStyles(colors: AppColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.lg,
      gap: spacing.md,
    },
    container: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background,
    },
    document: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    documentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
    },
    documentIssuer: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.textOnDark,
      letterSpacing: 1,
    },
    documentType: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.lg,
      letterSpacing: 0.5,
    },
    documentNumber: {
      fontSize: typography.headline,
      fontWeight: '800',
      color: colors.primary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    documentDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    amountBox: {
      backgroundColor: colors.background,
      margin: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    amountLabel: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    amountValue: {
      fontSize: typography.amount,
      fontWeight: '800',
      color: colors.accent,
      marginTop: spacing.xs,
    },
    previewBox: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    previewTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing.md,
    },
    previewHint: {
      fontSize: typography.label,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    spacer: { height: spacing.sm },
    error: {
      color: colors.error,
      fontSize: typography.body,
      textAlign: 'center',
    },
  });
}
