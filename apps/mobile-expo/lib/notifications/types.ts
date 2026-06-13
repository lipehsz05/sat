export type NotificationCategory =
  | 'invoice_due_soon'
  | 'invoice_due_today'
  | 'invoice_overdue'
  | 'promotion';

export interface NotificationPreferences {
  enabled: boolean;
  invoiceReminders: boolean;
  promotions: boolean;
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** Rota interna ao tocar (ex.: /invoice/inv-001) */
  route?: string;
  invoiceId?: string;
}

export interface PromotionPayload {
  id: string;
  title: string;
  body: string;
  route?: string;
}
