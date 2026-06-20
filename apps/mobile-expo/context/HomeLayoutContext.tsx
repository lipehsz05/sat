import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPreference, savePreference } from '@/lib/storage';

export type HomeLayoutVariant = 'classic' | 'dashboard';

interface HomeLayoutContextValue {
  variant: HomeLayoutVariant;
  setVariant: (variant: HomeLayoutVariant) => Promise<void>;
  isReady: boolean;
}

const HomeLayoutContext = createContext<HomeLayoutContextValue | null>(null);

export function HomeLayoutProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<HomeLayoutVariant>('classic');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getPreference('home_layout');
      if (saved === 'classic' || saved === 'dashboard') {
        setVariantState(saved);
      }
      setIsReady(true);
    })();
  }, []);

  const setVariant = useCallback(async (next: HomeLayoutVariant) => {
    setVariantState(next);
    await savePreference('home_layout', next);
  }, []);

  const value = useMemo<HomeLayoutContextValue>(
    () => ({ variant, setVariant, isReady }),
    [variant, setVariant, isReady],
  );

  return <HomeLayoutContext.Provider value={value}>{children}</HomeLayoutContext.Provider>;
}

export function useHomeLayout(): HomeLayoutContextValue {
  const ctx = useContext(HomeLayoutContext);
  if (!ctx) {
    throw new Error('useHomeLayout deve ser usado dentro de HomeLayoutProvider');
  }
  return ctx;
}
