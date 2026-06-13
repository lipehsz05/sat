import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createPaginationBarStyles);

  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <View style={styles.wrap} accessibilityRole="adjustable">
      <Text style={styles.range}>
        {start}–{end} de {totalItems}
      </Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, !canPrev && styles.btnDisabled]}
          onPress={() => canPrev && onPageChange(page - 1)}
          disabled={!canPrev}
          accessibilityRole="button"
          accessibilityLabel="Página anterior"
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canPrev ? colors.primary : colors.border}
          />
        </TouchableOpacity>
        <Text style={styles.pageLabel}>
          Página {page} de {totalPages}
        </Text>
        <TouchableOpacity
          style={[styles.btn, !canNext && styles.btnDisabled]}
          onPress={() => canNext && onPageChange(page + 1)}
          disabled={!canNext}
          accessibilityRole="button"
          accessibilityLabel="Próxima página"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canNext ? colors.primary : colors.border}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createPaginationBarStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    range: {
      fontSize: typography.label,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    btn: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnDisabled: {
      opacity: 0.5,
    },
    pageLabel: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.text,
    },
  });
}
