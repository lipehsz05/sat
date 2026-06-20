import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { BiometricLockOverlay } from '@/components/BiometricLockOverlay';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
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

const AUTH_TIMEOUT_MS = 60_000;

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [prefLoaded, setPrefLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometria');
  const unlockingRef = useRef(false);
  const unlockedThisSessionRef = useRef(false);
  const coldStartPromptDoneRef = useRef(false);

  const refreshBiometricPreference = useCallback(async () => {
    if (!session?.userId) {
      setIsBiometricEnabled(false);
      setPrefLoaded(true);
      return;
    }
    const enabled = await isBiometricPreferenceEnabled(session.userId);
    setIsBiometricEnabled(enabled);
    setPrefLoaded(true);
    if (Platform.OS !== 'web' && enabled) {
      setBiometricLabel(await getBiometricLabel());
    }
  }, [session?.userId]);

  const markUnlockedThisSession = useCallback(() => {
    unlockedThisSessionRef.current = true;
    setIsLocked(false);
  }, []);

  useEffect(() => {
    setPrefLoaded(false);
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

    const timeoutId = setTimeout(() => {
      unlockingRef.current = false;
      setIsAuthenticating(false);
    }, AUTH_TIMEOUT_MS);

    try {
      // Pequena pausa para o overlay montar antes do prompt nativo
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      const promptMessage =
        Platform.OS === 'ios'
          ? `Use ${biometricLabel} ou a senha do aparelho`
          : 'Desbloqueie com biometria ou senha do aparelho';
      const result = await authenticateForAppUnlock(promptMessage);

      if (result.success) {
        unlockedThisSessionRef.current = true;
        setIsLocked(false);
        return;
      }

      if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        showToast('Não foi possível autenticar. Tente novamente.', 'error');
      }
    } catch {
      showToast('Não foi possível autenticar. Tente novamente.', 'error');
    } finally {
      clearTimeout(timeoutId);
      unlockingRef.current = false;
      setIsAuthenticating(false);
    }
  }, [isBiometricEnabled, session, biometricLabel, showToast]);

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
  }, [authLoading, prefLoaded, session, isBiometricEnabled]);

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
