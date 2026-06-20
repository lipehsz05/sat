import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification, NotificationPreferences } from '@/lib/notifications/types';
import {
  loadInbox,
  loadNotificationPreferences,
  mapExpoNotificationToInbox,
  saveNotificationPreferences,
  syncAllNotifications,
} from '@/lib/notifications';
import { addToInbox, markAllInboxRead, markInboxRead, markNotificationSent } from '@/lib/notifications/storage';
import { normalizeNotificationRoute, NOTIFICATIONS_SCREEN } from '@/lib/notifications/routes';

interface NotificationContextValue {
  inbox: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isSyncing: boolean;
  refreshInbox: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  setPreferences: (partial: Partial<NotificationPreferences>) => Promise<void>;
  syncNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  openNotification: (item: AppNotification) => void;
}

const defaultPrefs: NotificationPreferences = {
  enabled: true,
  invoiceReminders: true,
  promotions: true,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function navigateFromRoute(route?: string) {
  const normalized = normalizeNotificationRoute(route);
  if (!normalized) return;
  if (normalized.startsWith('/invoice/')) {
    router.push(normalized as `/invoice/${string}`);
    return;
  }
  if (normalized === '/(tabs)' || normalized === '/(tabs)/') {
    router.push('/(tabs)');
    return;
  }
  if (normalized === NOTIFICATIONS_SCREEN) {
    router.push(NOTIFICATIONS_SCREEN);
    return;
  }
  router.push(normalized as never);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [inbox, setInbox] = useState<AppNotification[]>([]);
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(defaultPrefs);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInFlight = useRef(false);

  const refreshInbox = useCallback(async () => {
    const items = await loadInbox();
    setInbox(items);
  }, []);

  const refreshPreferences = useCallback(async () => {
    const prefs = await loadNotificationPreferences();
    setPreferencesState(prefs);
  }, []);

  const syncNotifications = useCallback(async () => {
    if (!session || syncInFlight.current) return;
    syncInFlight.current = true;
    setIsSyncing(true);
    try {
      await syncAllNotifications(session);
      await refreshInbox();
    } finally {
      syncInFlight.current = false;
      setIsSyncing(false);
    }
  }, [session, refreshInbox]);

  const setPreferences = useCallback(
    async (partial: Partial<NotificationPreferences>) => {
      const next = await saveNotificationPreferences(partial);
      setPreferencesState(next);
      if (session) {
        await syncAllNotifications(session);
        await refreshInbox();
      }
    },
    [session, refreshInbox],
  );

  const markRead = useCallback(
    async (id: string) => {
      await markInboxRead(id);
      await refreshInbox();
    },
    [refreshInbox],
  );

  const markAllRead = useCallback(async () => {
    await markAllInboxRead();
    await refreshInbox();
  }, [refreshInbox]);

  const openNotification = useCallback(
    (item: AppNotification) => {
      void markRead(item.id);
      navigateFromRoute(item.route);
    },
    [markRead],
  );

  useEffect(() => {
    void refreshPreferences();
    void refreshInbox();
  }, [refreshPreferences, refreshInbox]);

  useEffect(() => {
    if (session && preferences.enabled) {
      void syncNotifications();
    }
  }, [session, preferences.enabled, syncNotifications]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { notificationId?: string };
      if (data.notificationId) {
        void markNotificationSent(data.notificationId);
      }
      const item = mapExpoNotificationToInbox({
        identifier: notification.request.identifier,
        content: notification.request.content,
        trigger: notification.request.trigger,
      });
      void addToInbox(item).then(refreshInbox);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        route?: string;
        invoiceId?: string;
      };
      const route =
        data.route ??
        (data.invoiceId ? `/invoice/${data.invoiceId}` : undefined);
      navigateFromRoute(route);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [refreshInbox]);

  const unreadCount = useMemo(
    () => inbox.filter((n) => !n.read).length,
    [inbox],
  );

  const value = useMemo(
    () => ({
      inbox,
      unreadCount,
      preferences,
      isSyncing,
      refreshInbox,
      refreshPreferences,
      setPreferences,
      syncNotifications,
      markRead,
      markAllRead,
      openNotification,
    }),
    [
      inbox,
      unreadCount,
      preferences,
      isSyncing,
      refreshInbox,
      refreshPreferences,
      setPreferences,
      syncNotifications,
      markRead,
      markAllRead,
      openNotification,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return ctx;
}
