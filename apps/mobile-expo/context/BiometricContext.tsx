import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, Platform } from 'react-native';
import { BiometricLockOverlay } from '@/components/BiometricLockOverlay';
import { useAuth } from '@/context/AuthContext';
import {
  authenticateForAppUnlock,
  getBiometricLabel,
  isBiometricPreferenceEnabled,
} from '@/lib/biometric';

interface BiometricContextValue {
  isLocked: boolean;
  isBiometricEnabled: boolean;
  biometricLabel: string;
  refreshBiometricPreference: () => Promise<void>;
  /** Já passou Face ID nesta sessão (ex.: ao ativar nas Ajustes). */
  markUnlockedThisSession: () => void;
}

const BiometricContext = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [prefLoaded, setPrefLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometria');
  const unlockingRef = useRef(false);
  const unlockedThisSessionRef = useRef(false);
  const coldStartPromptDoneRef = useRef(false);

  const refreshBiometricPreference = useCallback(async () => {
    const enabled = await isBiometricPreferenceEnabled();
    setIsBiometricEnabled(enabled);
    setPrefLoaded(true);
    if (Platform.OS !== 'web' && enabled) {
      setBiometricLabel(await getBiometricLabel());
    }
  }, []);

  const markUnlockedThisSession = useCallback(() => {
    unlockedThisSessionRef.current = true;
    setIsLocked(false);
  }, []);

  useEffect(() => {
    void refreshBiometricPreference();
  }, [refreshBiometricPreference]);

  const attemptUnlock = useCallback(async () => {
    if (Platform.OS === 'web' || !isBiometricEnabled || !session) {
      setIsLocked(false);
      return;
    }
    if (unlockingRef.current) return;

    unlockingRef.current = true;
    setIsAuthenticating(true);

    try {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });

      const promptMessage =
        Platform.OS === 'ios'
          ? `Use ${biometricLabel} para continuar`
          : 'Desbloqueie com biometria ou senha do aparelho';
      const result = await authenticateForAppUnlock(promptMessage);

      if (result.success) {
        unlockedThisSessionRef.current = true;
        setIsLocked(false);
      }
    } finally {
      unlockingRef.current = false;
      setIsAuthenticating(false);
    }
  }, [isBiometricEnabled, session, biometricLabel]);

  /** Face ID só na abertura do app — não ao voltar do background ou notificações */
  useEffect(() => {
    if (authLoading || !prefLoaded) return;

    if (!session || !isBiometricEnabled || Platform.OS === 'web') {
      setIsLocked(false);
      return;
    }

    if (unlockedThisSessionRef.current) {
      setIsLocked(false);
      return;
    }

    if (coldStartPromptDoneRef.current) return;

    coldStartPromptDoneRef.current = true;
    setIsLocked(true);
    void attemptUnlock();
  }, [authLoading, prefLoaded, session, isBiometricEnabled, attemptUnlock]);

  useEffect(() => {
    if (!session) {
      setIsLocked(false);
      unlockedThisSessionRef.current = false;
      coldStartPromptDoneRef.current = false;
    }
  }, [session]);

  const value = useMemo(
    () => ({
      isLocked,
      isBiometricEnabled,
      biometricLabel,
      refreshBiometricPreference,
      markUnlockedThisSession,
    }),
    [isLocked, isBiometricEnabled, biometricLabel, refreshBiometricPreference, markUnlockedThisSession],
  );

  const showLock = isLocked && !!session && isBiometricEnabled && Platform.OS !== 'web';

  return (
    <BiometricContext.Provider value={value}>
      {children}
      {showLock ? (
        <BiometricLockOverlay
          biometricLabel={biometricLabel}
          onUnlock={() => void attemptUnlock()}
          isAuthenticating={isAuthenticating}
        />
      ) : null}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric deve ser usado dentro de BiometricProvider');
  return ctx;
}
