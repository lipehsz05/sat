import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthSession } from '@/lib/api-contract';

const SESSION_KEY = 'sat_auth_session';
const PREFS_PREFIX = 'sat_pref_';
const useAsyncStorage = Platform.OS === 'web';
const SESSION_READ_TIMEOUT_MS = 5000;

async function storageGet(key: string): Promise<string | null> {
  if (useAsyncStorage) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storageGetWithTimeout(key: string, ms: number): Promise<string | null> {
  return Promise.race([
    storageGet(key),
    new Promise<string | null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (useAsyncStorage) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (useAsyncStorage) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveSession(session: AuthSession): Promise<void> {
  await storageSet(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = await storageGetWithTimeout(SESSION_KEY, SESSION_READ_TIMEOUT_MS);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await storageRemove(SESSION_KEY);
}

export async function savePreference(key: string, value: string): Promise<void> {
  await storageSet(`${PREFS_PREFIX}${key}`, value);
}

export async function getPreference(key: string): Promise<string | null> {
  return storageGet(`${PREFS_PREFIX}${key}`);
}
