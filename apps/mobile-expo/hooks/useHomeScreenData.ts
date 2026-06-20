import { useCallback, useMemo, useState } from 'react';
import type { Href } from 'expo-router';
import { getOpenInvoicesByLocation } from '@/lib/api-contract';
import type { InvoicesByLocation } from '@/lib/api-contract';
import type { QuickAction } from '@/components/ui/QuickActionGrid';
import type { AppColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useFocusFetch } from '@/hooks/useFocusFetch';

export function useHomeScreenData(colors: AppColors) {
  const { session } = useAuth();
  const [groups, setGroups] = useState<InvoicesByLocation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleInvoices = useCallback((items: InvoicesByLocation[]) => {
    setGroups(items);
    setExpandedId((current) => {
      if (current && items.some((g) => g.location.id === current)) return current;
      return items.length === 1 ? items[0].location.id : null;
    });
  }, []);

  const loading = useFocusFetch(
    session ? `${session.userId}:home-invoices` : null,
    () => getOpenInvoicesByLocation(session!),
    handleInvoices,
    () => setGroups([]),
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: 'release',
        label: 'Liberar conexão',
        icon: 'wifi-outline',
        route: '/release-connection',
        color: colors.accent,
      },
      {
        id: 'report',
        label: 'Reportar problema',
        icon: 'alert-circle-outline',
        route: '/report-problem',
        color: colors.primary,
      },
      {
        id: 'negotiate',
        label: 'Negociar débitos',
        icon: 'chatbubbles-outline',
        route: '/negotiate-debt',
        color: colors.primaryLight,
      },
      {
        id: 'tax',
        label: 'Notas fiscais',
        icon: 'document-text-outline',
        route: '/invoices-notes',
        color: colors.primaryMid,
      },
    ],
    [colors],
  );

  const toggleLocation = useCallback((locationId: string) => {
    setExpandedId((current) => (current === locationId ? null : locationId));
  }, []);

  const totalOpen = useMemo(
    () => groups.reduce((sum, group) => sum + group.openTotal, 0),
    [groups],
  );

  return {
    groups,
    loading,
    expandedId,
    quickActions,
    toggleLocation,
    totalOpen,
  };
}

export type HomeScreenData = ReturnType<typeof useHomeScreenData>;

export type HomeLayoutSharedProps = HomeScreenData & {
  onQuickAction: (route: Href) => void;
};
