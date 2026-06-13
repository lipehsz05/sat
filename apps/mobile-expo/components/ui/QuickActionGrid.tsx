import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
}

interface QuickActionStripProps {
  actions: QuickAction[];
  onAction: (route: string) => void;
}

const ITEM_WIDTH = 96;

export function QuickActionStrip({ actions, onAction }: QuickActionStripProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createQuickActionStripStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      decelerationRate="fast"
      nestedScrollEnabled
    >
      {actions.map((action) => {
        const tint = action.color ?? colors.primary;
        return (
          <TouchableOpacity
            key={action.id}
            style={styles.item}
            onPress={() => onAction(action.route)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: tint + '18' }]}>
              <Ionicons name={action.icon} size={26} color={tint} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {action.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/** @deprecated Use QuickActionStrip */
export const QuickActionGrid = QuickActionStrip;

function createQuickActionStripStyles(colors: AppColors) {
  return StyleSheet.create({
    strip: {
      paddingVertical: spacing.xs,
      paddingRight: spacing.lg,
      gap: spacing.sm,
    },
    item: {
      width: ITEM_WIDTH,
      alignItems: 'center',
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
