import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/** Redireciona para login se não houver sessão (telas protegidas). */
export function useRequireAuth() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading]);

  return { session, isLoading, isAuthenticated: !!session };
}
