const store = new Map<string, { expires: number; value: unknown }>();

const DEFAULT_TTL_MS = 45_000;

export function readApiCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry || entry.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function writeApiCache(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function invalidateApiCache(userId?: string): void {
  if (!userId) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`${userId}:`)) {
      store.delete(key);
    }
  }
}
