import { getPreference, savePreference } from '@/lib/storage';
import type { NotificationPreferences } from './types';

const KEYS = {
  enabled: 'notifications',
  invoiceReminders: 'notify_invoices',
  promotions: 'notify_promotions',
} as const;

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const [enabled, invoiceReminders, promotions] = await Promise.all([
    getPreference(KEYS.enabled),
    getPreference(KEYS.invoiceReminders),
    getPreference(KEYS.promotions),
  ]);

  const masterOn = enabled !== 'false';

  return {
    enabled: masterOn,
    invoiceReminders: invoiceReminders !== 'false' && masterOn,
    promotions: promotions !== 'false' && masterOn,
  };
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = await loadNotificationPreferences();
  const next = { ...current, ...prefs };

  if (prefs.enabled !== undefined) {
    await savePreference(KEYS.enabled, String(next.enabled));
    if (!next.enabled) {
      await savePreference(KEYS.invoiceReminders, 'false');
      await savePreference(KEYS.promotions, 'false');
      return { enabled: false, invoiceReminders: false, promotions: false };
    }
  }
  if (prefs.invoiceReminders !== undefined) {
    await savePreference(KEYS.invoiceReminders, String(next.invoiceReminders));
  }
  if (prefs.promotions !== undefined) {
    await savePreference(KEYS.promotions, String(next.promotions));
  }

  return loadNotificationPreferences();
}
