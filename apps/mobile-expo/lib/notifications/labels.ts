import type { NotificationCategory } from './types';

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  invoice_due_soon: 'Vencimento próximo',
  invoice_due_today: 'Vence hoje',
  invoice_overdue: 'Fatura vencida',
  promotion: 'Promoção',
};

export function categoryIcon(
  category: NotificationCategory,
): 'calendar-outline' | 'alert-circle-outline' | 'warning-outline' | 'gift-outline' {
  switch (category) {
    case 'invoice_due_soon':
      return 'calendar-outline';
    case 'invoice_due_today':
      return 'alert-circle-outline';
    case 'invoice_overdue':
      return 'warning-outline';
    case 'promotion':
      return 'gift-outline';
  }
}
