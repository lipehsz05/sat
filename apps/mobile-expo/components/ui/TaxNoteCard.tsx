import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { formatCompetence, formatCurrency, formatDate } from '@/lib/api-contract';
import type { TaxNote } from '@/lib/api-contract';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface TaxNoteCardProps {
  note: TaxNote;
  locationName?: string;
  compact?: boolean;
  onDownload?: (note: TaxNote) => void;
}

export function TaxNoteCard({
  note,
  locationName,
  compact,
  onDownload,
}: TaxNoteCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createTaxNoteCardStyles);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(note);
      return;
    }
    Alert.alert('Download', `Download da NF ${note.number} iniciado (simulado).`);
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => router.push(`/invoices-notes/${note.id}` as Href)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Nota fiscal ${note.number}, ${formatCurrency(note.amount)}`}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.number}>NF nº {note.number}</Text>
          {locationName && !compact ? (
            <Text style={styles.location}>{locationName}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.competenceBadge}>
              <Text style={styles.competenceText}>{formatCompetence(note.competence)}</Text>
            </View>
            <Text style={styles.issueDate}>Emitida em {formatDate(note.issueDate)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(note.amount)}</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionHint}>
          <Ionicons name="eye-outline" size={16} color={colors.primaryLight} />
          <Text style={styles.actionHintText}>Ver detalhes</Text>
        </View>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            handleDownload();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Baixar PDF da nota ${note.number}`}
        >
          <Ionicons name="download-outline" size={18} color={colors.white} />
          <Text style={styles.downloadText}>PDF</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function createTaxNoteCardStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardCompact: {
      marginBottom: 0,
      borderWidth: 0,
      borderRadius: 0,
      shadowOpacity: 0,
      elevation: 0,
      paddingHorizontal: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    number: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
    location: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    competenceBadge: {
      backgroundColor: colors.primary + '12',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    competenceText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryLight,
    },
    issueDate: {
      fontSize: typography.label,
      color: colors.textSecondary,
    },
    amount: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.accent,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionHintText: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.md,
      minHeight: 36,
    },
    downloadText: {
      color: colors.white,
      fontSize: typography.label,
      fontWeight: '700',
    },
  });
}
