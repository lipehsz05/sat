import { getPreference, savePreference } from '@/lib/storage';

export type LocationLabelsMap = Record<string, string>;

const MAX_LABEL_LENGTH = 40;

function storageKey(userId: string): string {
  return `location_labels_${userId}`;
}

export async function loadLocationLabels(userId: string): Promise<LocationLabelsMap> {
  const raw = await getPreference(storageKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const result: LocationLabelsMap = {};
    for (const [id, label] of Object.entries(parsed)) {
      if (typeof label === 'string') {
        const normalized = normalizeLocationLabel(label);
        if (normalized) result[id] = normalized;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function persistLocationLabels(
  userId: string,
  labels: LocationLabelsMap,
): Promise<void> {
  await savePreference(storageKey(userId), JSON.stringify(labels));
}

/** Retorna o rótulo salvo ou null se vazio / igual ao oficial. */
export function normalizeLocationLabel(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_LABEL_LENGTH);
}

export function resolveLocationDisplayName(
  labels: LocationLabelsMap,
  locationId: string,
  officialName: string,
): string {
  const custom = labels[locationId];
  return custom ?? officialName;
}
