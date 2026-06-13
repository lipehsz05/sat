import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Busca ao focar a tela; spinner só na primeira carga de cada chave. */
export function useFocusFetch<T>(
  cacheKey: string | null,
  fetcher: () => Promise<T>,
  onSuccess: (data: T) => void,
  onError?: () => void,
): boolean {
  const [loading, setLoading] = useState(true);
  const loadedKeysRef = useRef(new Set<string>());

  useEffect(() => {
    loadedKeysRef.current.clear();
    setLoading(true);
  }, [cacheKey?.split(':')[0] ?? null]);

  useFocusEffect(
    useCallback(() => {
      if (!cacheKey) {
        setLoading(false);
        return;
      }

      const showSpinner = !loadedKeysRef.current.has(cacheKey);
      if (showSpinner) setLoading(true);

      let active = true;
      fetcher()
        .then((data) => {
          if (active) onSuccess(data);
        })
        .catch(() => {
          if (active) onError?.();
        })
        .finally(() => {
          if (active) {
            loadedKeysRef.current.add(cacheKey);
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [cacheKey, fetcher, onSuccess, onError]),
  );

  return loading;
}
