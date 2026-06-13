import { useCallback } from 'react';
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
import { Stack } from 'expo-router';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { Card } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useNotifications } from '@/context/NotificationContext';
import { categoryIcon, CATEGORY_LABELS } from '@/lib/notifications/labels';
import type { AppNotification } from '@/lib/notifications/types';
import { formatDate } from '@/lib/api-contract';
import { useThemedStyles } from '@/hooks/useThemedStyles';

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createRowStyles);

  return (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, !item.read && styles.iconWrapActive]}>
        <Ionicons
          name={categoryIcon(item.category)}
          size={22}
          color={styles.iconColor.color}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.category}>{CATEGORY_LABELS[item.category]}</Text>
        <Text style={styles.message} numberOfLines={3}>
          {item.body}
        </Text>
        <Text style={styles.date}>
          {formatDate(item.createdAt.slice(0, 10))}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={styles.chevron.color} />
    </TouchableOpacity>
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
  const styles = useThemedStyles(createScreenStyles);

  const onRefresh = useCallback(async () => {
    await syncNotifications();
    await refreshInbox();
  }, [syncNotifications, refreshInbox]);

  return (
    <SafeScreen style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notificações',
          headerBackTitle: 'Voltar',
        }}
      />
      {Platform.OS === 'web' ? (
        <Card style={styles.webBanner}>
          <Text style={styles.webBannerText}>
            No celular você recebe alertas na bandeja do sistema. Aqui você vê o histórico salvo no
            aparelho.
          </Text>
        </Card>
      ) : null}

      {unreadCount > 0 ? (
        <TouchableOpacity style={styles.markAll} onPress={() => void markAllRead()}>
          <Text style={styles.markAllText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={inbox}
        keyExtractor={(item) => item.id}
        contentContainerStyle={inbox.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isSyncing ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={48} color={styles.emptyIcon.color} />
                <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                <Text style={styles.emptySubtitle}>
                  Ative lembretes de fatura e promoções em Ajustes. Puxe para atualizar.
                </Text>
              </>
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
    list: { padding: spacing.md, paddingBottom: spacing.xl },
    emptyList: { flexGrow: 1, padding: spacing.lg },
    webBanner: { margin: spacing.md, marginBottom: 0 },
    webBannerText: {
      fontSize: typography.label,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    markAll: {
      alignSelf: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    markAllText: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primary,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: spacing.xl * 2,
      gap: spacing.md,
    },
    emptyIcon: { color: colors.textSecondary },
    emptyTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.lg,
    },
  });
}

function createRowStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowUnread: {
      borderColor: colors.primaryMid,
      backgroundColor: colors.background,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: colors.primary + '18',
    },
    iconColor: { color: colors.primary },
    chevron: { color: colors.textSecondary },
    body: { flex: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    titleUnread: { fontWeight: '800', color: colors.primary },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    category: {
      fontSize: typography.label,
      color: colors.primaryLight,
      marginTop: 2,
      fontWeight: '600',
    },
    message: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 20,
    },
    date: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
  });
}
