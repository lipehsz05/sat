import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSession, UserProfile } from '@/lib/api-contract';
import { getProfile, login as apiLogin } from '@/lib/api-contract';
import { invalidateApiCache } from '@/lib/api-cache';
import { clearSession, getSession, saveSession } from '@/lib/storage';

interface AuthContextValue {
  session: AuthSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (document: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }
    try {
      const userProfile = await getProfile(session);
      setProfile(userProfile);
    } catch {
      setProfile(null);
    }
  }, [session]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await getSession();
        if (!active) return;

        if (stored) {
          setSession(stored);
          try {
            const userProfile = await getProfile(stored);
            if (active) setProfile(userProfile);
          } catch {
            if (active) {
              await clearSession();
              setSession(null);
              setProfile(null);
            }
          }
        }
      } catch {
        if (active) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session && !profile) {
      refreshProfile();
    }
  }, [session, profile, refreshProfile]);

  const signIn = useCallback(async (document: string, password: string) => {
    const newSession = await apiLogin(document, password);
    await saveSession(newSession);
    setSession(newSession);
    const userProfile = await getProfile(newSession);
    setProfile(userProfile);
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.userId;
    await clearSession();
    if (userId) invalidateApiCache(userId);
    setSession(null);
    setProfile(null);
  }, [session?.userId]);

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signOut, refreshProfile }),
    [session, profile, isLoading, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
