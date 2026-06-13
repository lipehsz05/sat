import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { AuthSession, Invoice } from '@/lib/api-contract';
import { formatCurrency, formatDate } from '@/lib/api-contract';
import { findLocation } from '@/lib/api-contract/location-helpers';
import { getOpenInvoicesByLocation, getProfile } from '@/lib/api-contract';
import { MOCK_PROMOTIONS } from './promotions';
import { addToInbox, loadSentNotificationIds, markNotificationSent, savePushToken } from './storage';
import type { AppNotification, NotificationCategory, NotificationPreferences } from './types';
import { loadNotificationPreferences } from './preferences';

/** Dias antes do vencimento para alertar (inclui faturas do mock em ~7 dias) */
const DUE_SOON_DAYS = 7;
const SCHEDULE_PREFIX = 'sat-';

const isNativeNotifications = Platform.OS !== 'web';

if (isNativeNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
}

function daysUntil(dueDateIso: string): number {
  const due = startOfDay(new Date(dueDateIso));
  const today = startOfDay(new Date());
  return Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function buildInvoiceNotification(
  invoice: Invoice,
  locationName: string,
  category: NotificationCategory,
  daysLeft: number,
): { title: string; body: string; triggerDate: Date | null } {
  const amount = formatCurrency(invoice.amount);
  const due = formatDate(invoice.dueDate);

  if (category === 'invoice_overdue') {
    return {
      title: 'Fatura vencida',
      body: `${locationName}: ${amount} venceu em ${due}. Regularize para evitar bloqueio.`,
      triggerDate: null,
    };
  }
  if (category === 'invoice_due_today') {
    const today = startOfDay(new Date());
    return {
      title: 'Fatura vence hoje',
      body: `${locationName}: ${amount} vence hoje (${due}). Pague com PIX, cartão ou boleto.`,
      triggerDate: today.getTime() > Date.now() ? today : null,
    };
  }
  const triggerDate = startOfDay(new Date());
  return {
    title: 'Fatura próxima do vencimento',
    body: `${locationName}: ${amount} vence em ${daysLeft} dia(s) (${due}).`,
    triggerDate: triggerDate.getTime() > Date.now() ? triggerDate : null,
  };
}

async function scheduleLocal(
  id: string,
  title: string,
  body: string,
  triggerDate: Date,
  data: Record<string, unknown>,
): Promise<void> {
  if (!isNativeNotifications) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `${SCHEDULE_PREFIX}${id}`,
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

async function recordInbox(item: Omit<AppNotification, 'read'>): Promise<void> {
  await addToInbox({ ...item, read: false });
}

function resolveInvoiceCategory(
  invoice: Invoice,
  days: number,
): NotificationCategory | null {
  const isOverdue = invoice.status === 'overdue' || days < 0;
  if (isOverdue) return 'invoice_overdue';
  if (days === 0) return 'invoice_due_today';
  if (days > 0 && days <= DUE_SOON_DAYS) return 'invoice_due_soon';
  return null;
}

async function dispatchNotification(
  notifId: string,
  title: string,
  body: string,
  route: string,
  category: NotificationCategory,
  invoiceId: string | undefined,
  sentIds: Set<string>,
  triggerDate: Date | null,
  now: number,
): Promise<void> {
  if (sentIds.has(notifId)) return;

  await recordInbox({
    id: notifId,
    category,
    title,
    body,
    createdAt: new Date().toISOString(),
    route,
    invoiceId,
  });

  if (!isNativeNotifications) {
    sentIds.add(notifId);
    await markNotificationSent(notifId);
    return;
  }

  const data = { route, category, invoiceId, notificationId: notifId };

  if (triggerDate && triggerDate.getTime() > now) {
    await scheduleLocal(notifId, title, body, triggerDate, data);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: `${SCHEDULE_PREFIX}${notifId}-now`,
    content: { title, body, data, sound: true },
    trigger: null,
  });

  sentIds.add(notifId);
  await markNotificationSent(notifId);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SAT TELECOM',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('invoices', {
        name: 'Faturas e vencimentos',
        importance: Notifications.AndroidImportance.HIGH,
      });
      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promoções',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const Constants = await import('expo-constants');
    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
      (Constants.default.expoConfig?.extra?.eas?.projectId as string | undefined);

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    await savePushToken(token);
    return token;
  } catch {
    return null;
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!isNativeNotifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.identifier.startsWith(SCHEDULE_PREFIX));
  await Promise.all(
    ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

export async function syncInvoiceReminders(
  session: AuthSession,
  prefs: NotificationPreferences,
): Promise<void> {
  await cancelAllScheduledNotifications();

  if (!prefs.enabled || !prefs.invoiceReminders) return;

  const [groups, profile, sentIds] = await Promise.all([
    getOpenInvoicesByLocation(session),
    getProfile(session),
    loadSentNotificationIds(),
  ]);

  const now = Date.now();

  for (const group of groups) {
    const locationName =
      findLocation(profile.locations, group.location.id)?.name ?? group.location.name;

    for (const invoice of group.invoices) {
      const days = daysUntil(invoice.dueDate);
      const category = resolveInvoiceCategory(invoice, days);
      if (!category) continue;

      const { title, body, triggerDate } = buildInvoiceNotification(
        invoice,
        locationName,
        category,
        days,
      );

      const notifId = `${category}-${invoice.id}`;
      const route = `/invoice/${invoice.id}`;

      await dispatchNotification(
        notifId,
        title,
        body,
        route,
        category,
        invoice.id,
        sentIds,
        triggerDate,
        now,
      );
    }
  }
}

export async function syncPromotionNotifications(
  prefs: NotificationPreferences,
): Promise<void> {
  if (!prefs.enabled || !prefs.promotions) return;

  const inOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  inOneDay.setHours(10, 0, 0, 0);
  const sentIds = await loadSentNotificationIds();

  for (const promo of MOCK_PROMOTIONS) {
    const notifId = `promo-${promo.id}`;
    if (sentIds.has(notifId)) continue;

    await recordInbox({
      id: notifId,
      category: 'promotion',
      title: promo.title,
      body: promo.body,
      createdAt: new Date().toISOString(),
      route: promo.route,
    });

    if (isNativeNotifications && inOneDay.getTime() > Date.now()) {
      await scheduleLocal(
        notifId,
        promo.title,
        promo.body,
        inOneDay,
        {
          route: promo.route ?? '/(tabs)',
          category: 'promotion',
          notificationId: notifId,
        },
      );
    } else if (!isNativeNotifications) {
      sentIds.add(notifId);
      await markNotificationSent(notifId);
    }
  }
}

export async function syncAllNotifications(session: AuthSession): Promise<void> {
  const prefs = await loadNotificationPreferences();
  if (!prefs.enabled) {
    await cancelAllScheduledNotifications();
    return;
  }

  if (isNativeNotifications) {
    await registerPushToken();
  }
  await syncInvoiceReminders(session, prefs);
  await syncPromotionNotifications(prefs);
}

export async function sendTestNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    await recordInbox({
      id: `test-${Date.now()}`,
      category: 'promotion',
      title: 'Teste de notificação',
      body: 'No celular você também receberá alertas na bandeja do sistema.',
      createdAt: new Date().toISOString(),
      route: '/(tabs)/settings',
    });
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SAT TELECOM',
      body: 'Notificações ativas! Você será avisado sobre faturas e promoções.',
      data: { route: '/notifications/index' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

export function mapExpoNotificationToInbox(request: {
  identifier: string;
  content: Notifications.NotificationContent;
  trigger: Notifications.NotificationTrigger | null;
}): AppNotification {
  const content = request.content;
  const data = (content.data ?? {}) as {
    category?: NotificationCategory;
    route?: string;
    invoiceId?: string;
    notificationId?: string;
  };

  return {
    id: data.notificationId ?? request.identifier,
    category: data.category ?? 'promotion',
    title: content.title ?? 'SAT TELECOM',
    body: content.body ?? '',
    createdAt: new Date().toISOString(),
    read: false,
    route: data.route,
    invoiceId: data.invoiceId,
  };
}
