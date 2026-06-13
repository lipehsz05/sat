import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loadLocationLabels,
  normalizeLocationLabel,
  persistLocationLabels,
  resolveLocationDisplayName,
  type LocationLabelsMap,
} from '@/lib/location-labels';

interface LocationLabelsContextValue {
  ready: boolean;
  getDisplayName: (locationId: string, officialName: string) => string;
  setCustomName: (locationId: string, value: string, officialName: string) => Promise<void>;
}

const LocationLabelsContext = createContext<LocationLabelsContextValue | null>(null);

export function LocationLabelsProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const [labels, setLabels] = useState<LocationLabelsMap>({});
  const [ready, setReady] = useState(!userId);

  useEffect(() => {
    if (!userId) {
      setLabels({});
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    loadLocationLabels(userId)
      .then((loaded) => {
        if (active) setLabels(loaded);
      })
      .catch(() => {
        if (active) setLabels({});
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const getDisplayName = useCallback(
    (locationId: string, officialName: string) =>
      resolveLocationDisplayName(labels, locationId, officialName),
    [labels],
  );

  const setCustomName = useCallback(
    async (locationId: string, value: string, officialName: string) => {
      if (!userId) return;

      const normalized = normalizeLocationLabel(value);
      const next: LocationLabelsMap = { ...labels };

      if (!normalized || normalized.localeCompare(officialName, 'pt-BR', { sensitivity: 'accent' }) === 0) {
        delete next[locationId];
      } else {
        next[locationId] = normalized;
      }

      setLabels(next);
      await persistLocationLabels(userId, next);
    },
    [userId, labels],
  );

  const value = useMemo(
    () => ({ ready, getDisplayName, setCustomName }),
    [ready, getDisplayName, setCustomName],
  );

  return (
    <LocationLabelsContext.Provider value={value}>{children}</LocationLabelsContext.Provider>
  );
}

export function useLocationLabels(): LocationLabelsContextValue {
  const ctx = useContext(LocationLabelsContext);
  if (!ctx) {
    throw new Error('useLocationLabels deve ser usado dentro de LocationLabelsProvider');
  }
  return ctx;
}

export function useLocationDisplayName(locationId: string, officialName: string): string {
  const { getDisplayName } = useLocationLabels();
  return getDisplayName(locationId, officialName);
}
