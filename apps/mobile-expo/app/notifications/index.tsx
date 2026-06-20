import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import { SafeScreen } from '@/components/ui/SafeScreen';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useNotifications } from '@/context/NotificationContext';
import { useTheme } from '@/context/ThemeContext';
import { categoryIcon, CATEGORY_LABELS } from '@/lib/notifications/labels';
import type { AppNotification, NotificationCategory } from '@/lib/notifications/types';
import { formatDate } from '@/lib/api-contract';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function getCategoryTheme(category: NotificationCategory, colors: AppColors) {
  switch (category) {
    case 'invoice_overdue':
      return {
        icon: colors.accent,
        iconBg: colors.accentLight,
        accent: colors.accent,
        badgeText: colors.accent,
        badgeBg: colors.accentLight,
      };
    case 'invoice_due_today':
      return {
        icon: colors.warning,
        iconBg: colors.warningLight,
        accent: colors.warning,
        badgeText: colors.warning,
        badgeBg: colors.warningLight,
      };
    case 'invoice_due_soon':
      return {
        icon: colors.primaryLight,
        iconBg: colors.primary + '14',
        accent: colors.primaryMid,
        badgeText: colors.primaryLight,
        badgeBg: colors.primary + '12',
      };
    case 'promotion':
      return {
        icon: colors.success,
        iconBg: colors.successLight,
        accent: colors.success,
        badgeText: colors.success,
        badgeBg: colors.successLight,
      };
  }
}

function formatNotificationWhen(iso: string): string {
  const created = iso.slice(0, 10);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (created === todayKey) return 'Hoje';
  if (created === yesterdayKey) return 'Ontem';
  return formatDate(created);
}

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createRowStyles);
  const theme = getCategoryTheme(item.category, colors);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        !item.read && styles.rowUnread,
        !item.read && { borderLeftColor: theme.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ selected: !item.read }}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.iconBg }]}>
        <Ionicons name={categoryIcon(item.category)} size={22} color={theme.icon} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.title, !item.read && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.when}>{formatNotificationWhen(item.createdAt)}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
          <Text style={[styles.badgeText, { color: theme.badgeText }]}>
            {CATEGORY_LABELS[item.category]}
          </Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      {!item.read ? <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} /> : null}
    </TouchableOpacity>
  );
}

function NotificationsHeader({
  unreadCount,
  total,
  onMarkAll,
}: {
  unreadCount: number;
  total: number;
  onMarkAll: () => void;
}) {
  const styles = useThemedStyles(createHeaderStyles);

  return (
    <View style={styles.header}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {total === 0
            ? 'Nenhuma notificação'
            : total === 1
              ? '1 notificação'
              : `${total} notificações`}
        </Text>
        {unreadCount > 0 ? (
          <View style={styles.unreadPill}>
            <View style={styles.unreadPillDot} />
            <Text style={styles.unreadPillText}>
              {unreadCount === 1 ? '1 não lida' : `${unreadCount} não lidas`}
            </Text>
          </View>
        ) : (
          <Text style={styles.allRead}>Tudo em dia</Text>
        )}
      </View>

      {unreadCount > 0 ? (
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={onMarkAll}
          accessibilityRole="button"
        >
          <Ionicons name="checkmark-done-outline" size={18} color={styles.markAllIcon.color} />
          <Text style={styles.markAllText}>Marcar lidas</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const {
    inbox,
    unreadCount,
    isSyncing,
    refreshInbox,
    syncNotifications,
    markAllRead,
    openNotification,
  } = useNotifications();
  const { colors } = useTheme();
  const styles = useThemedStyles(createScreenStyles);

  const onRefresh = useCallback(async () => {
    await syncNotifications();
    await refreshInbox();
  }, [syncNotifications, refreshInbox]);

  const listHeader = useMemo(
    () => (
      <>
        <NotificationsHeader
          unreadCount={unreadCount}
          total={inbox.length}
          onMarkAll={() => void markAllRead()}
        />
        {Platform.OS === 'web' ? (
          <View style={styles.webBanner}>
            <Ionicons name="information-circle-outline" size={18} color={styles.webBannerIcon.color} />
            <Text style={styles.webBannerText}>
              No celular você recebe alertas na bandeja do sistema. Aqui você vê o histórico salvo no
              aparelho.
            </Text>
          </View>
        ) : null}
      </>
    ),
    [unreadCount, inbox.length, markAllRead, styles],
  );

  return (
    <SafeScreen style={styles.safe} edges={['bottom']}>
      <StackScreenTitle title="Notificações" />

      <FlatList
        data={inbox}
        keyExtractor={(item) => item.id}
        contentContainerStyle={inbox.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isSyncing ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="notifications-off-outline" size={36} color={styles.emptyIcon.color} />
                </View>
                <Text style={styles.emptyTitle}>Caixa vazia</Text>
                <Text style={styles.emptySubtitle}>
                  Quando houver lembretes de fatura ou novidades, elas aparecerão aqui. Puxe para
                  atualizar.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => openNotification(item)} />
        )}
      />
    </SafeScreen>
  );
}

function createScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    emptyList: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    webBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    webBannerIcon: { color: colors.primaryLight },
    webBannerText: {
      flex: 1,
      fontSize: typography.label,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    empty: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.sm,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyIcon: { color: colors.textSecondary },
    emptyTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
    },
    emptySubtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}

function createHeaderStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    summary: {
      flex: 1,
      gap: 6,
    },
    summaryTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '800',
      color: colors.primary,
    },
    unreadPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: colors.accentLight,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    unreadPillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    unreadPillText: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.accent,
    },
    allRead: {
      fontSize: typography.label,
      color: colors.success,
      fontWeight: '600',
    },
    markAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
    },
    markAllIcon: { color: colors.primary },
    markAllText: {
      fontSize: typography.label,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}

function createRowStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    rowUnread: {
      backgroundColor: colors.background,
      borderColor: colors.primaryMid + '55',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
    },
    titleUnread: {
      fontWeight: '800',
      color: colors.primary,
    },
    when: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 6,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    message: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
  });
}
