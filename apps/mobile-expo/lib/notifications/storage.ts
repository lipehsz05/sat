import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppNotification } from './types';

const INBOX_KEY = 'sat_notification_inbox';
const PUSH_TOKEN_KEY = 'sat_push_token';
const SENT_KEY = 'sat_notification_sent';
const MAX_INBOX = 50;

export async function loadInbox(): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(INBOX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export async function saveInbox(items: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(0, MAX_INBOX)));
}

export async function addToInbox(item: AppNotification): Promise<void> {
  const inbox = await loadInbox();
  const exists = inbox.some((n) => n.id === item.id);
  if (exists) return;
  await saveInbox([item, ...inbox]);
}

export async function markInboxRead(id: string): Promise<void> {
  const inbox = await loadInbox();
  await saveInbox(
    inbox.map((n) => (n.id === id ? { ...n, read: true } : n)),
  );
}

export async function markAllInboxRead(): Promise<void> {
  const inbox = await loadInbox();
  await saveInbox(inbox.map((n) => ({ ...n, read: true })));
}

export async function clearInbox(): Promise<void> {
  await AsyncStorage.removeItem(INBOX_KEY);
}

export async function savePushToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function getPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function loadSentNotificationIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(SENT_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function wasNotificationSent(id: string): Promise<boolean> {
  const sent = await loadSentNotificationIds();
  return sent.has(id);
}

export async function markNotificationSent(id: string): Promise<void> {
  const sent = await loadSentNotificationIds();
  if (sent.has(id)) return;
  sent.add(id);
  await AsyncStorage.setItem(SENT_KEY, JSON.stringify([...sent]));
}
