/** Rota tipada da tela de notificações (app/notifications/index.tsx) */
export const NOTIFICATIONS_SCREEN = '/notifications' as const;

export function normalizeNotificationRoute(route?: string): string | undefined {
  if (!route) return undefined;
  if (route === '/notifications/index' || route === '/notifications/') {
    return NOTIFICATIONS_SCREEN;
  }
  return route;
}
