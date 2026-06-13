import { StyleSheet, View } from 'react-native';
import type { ServiceLocation, TaxNote } from '@/lib/api-contract';
import { LocationSectionHeader } from '@/components/ui/LocationSectionHeader';
import { TaxNoteCard } from '@/components/ui/TaxNoteCard';
import type { AppColors } from '@/constants/theme';
import { radius, spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface ExpandableTaxNotesLocationProps {
  location: ServiceLocation;
  notes: TaxNote[];
  expanded: boolean;
  onToggle: () => void;
}

export function ExpandableTaxNotesLocation({
  location,
  notes,
  expanded,
  onToggle,
}: ExpandableTaxNotesLocationProps) {
  const styles = useThemedStyles(createExpandableTaxNotesLocationStyles);
  const total = notes.reduce((sum, n) => sum + n.amount, 0);

  return (
    <View style={styles.wrapper}>
      <LocationSectionHeader
        group={{ location, invoices: [], openTotal: total }}
        showOpenTotal
        expanded={expanded}
        onPress={onToggle}
        openTotalLabel={`${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}`}
        showMonthly={false}
      />

      {expanded ? (
        <View style={styles.expandedBody}>
          <TaxNoteCard note={notes[0]} compact />
          {notes.slice(1).map((note) => (
            <View key={note.id} style={styles.noteSpacing}>
              <TaxNoteCard note={note} compact />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createExpandableTaxNotesLocationStyles(colors: AppColors) {
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
      borderLeftColor: colors.primaryMid,
      marginTop: -spacing.sm,
    },
    noteSpacing: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
}
