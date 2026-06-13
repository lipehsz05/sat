import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LocationLabelsProvider } from '@/context/LocationLabelsContext';

export function LocationLabelsGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  return (
    <LocationLabelsProvider userId={session?.userId ?? null}>{children}</LocationLabelsProvider>
  );
}
