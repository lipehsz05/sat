export type DocumentType = 'cpf' | 'cnpj';

export type FirstAccessChannel = 'email' | 'whatsapp';

export type FirstAccessContact =
  | { channel: 'email'; email: string }
  | { channel: 'whatsapp'; phone: string };

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

/** Ponto de internet vinculado ao CPF/CNPJ (casa, loja, etc.) */
export interface ServiceLocation {
  id: string;
  userId: string;
  name: string;
  planName: string;
  monthlyAmount: number;
  address: Address;
}

export interface UserProfile {
  id: string;
  name: string;
  document: string;
  documentType: DocumentType;
  email: string;
  phone: string;
  /** Endereço principal (primeiro cadastro) — compatibilidade */
  address: Address;
  locations: ServiceLocation[];
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export type InvoiceStatus = 'open' | 'paid' | 'overdue';

export type PaymentMethod = 'pix' | 'card' | 'boleto';

export interface Invoice {
  id: string;
  userId: string;
  locationId: string;
  referenceMonth: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  /** Forma de pagamento — preenchido quando status = paid */
  paymentMethod?: PaymentMethod;
  status: InvoiceStatus;
  pixQrCode: string;
  boletoUrl: string;
  barcode: string;
}

export interface InvoicesByLocation {
  location: ServiceLocation;
  invoices: Invoice[];
  /** Soma das faturas em aberto/vencidas deste endereço */
  openTotal: number;
}

export interface TaxNote {
  id: string;
  userId: string;
  locationId: string;
  /** Fatura paga vinculada a esta NF */
  invoiceId: string;
  number: string;
  issueDate: string;
  competence: string;
  amount: number;
  pdfUrl: string;
}

export interface ReportProblemPayload {
  type: 'connection' | 'speed' | 'billing' | 'other';
  description: string;
  locationId?: string;
}

export interface NegotiationResult {
  invoiceIds: string[];
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  firstDueDate: string;
}

export interface ReleaseConnectionResult {
  expiresAt: string;
  message: string;
}

export interface OpenInvoicesSummary {
  invoices: Invoice[];
  total: number;
  groups: InvoicesByLocation[];
  /** QR PIX único para pagamento consolidado (mock) */
  combinedPixQrCode: string;
  combinedBoletoBarcode: string;
  combinedBoletoUrl: string;
}
