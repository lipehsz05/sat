export type DocumentType = 'cpf' | 'cnpj';

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface UserProfile {
  id: string;
  name: string;
  document: string;
  documentType: DocumentType;
  email: string;
  phone: string;
  address: Address;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export type InvoiceStatus = 'open' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  userId: string;
  referenceMonth: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: InvoiceStatus;
  pixQrCode: string;
  boletoUrl: string;
  barcode: string;
}

export interface TaxNote {
  id: string;
  userId: string;
  number: string;
  issueDate: string;
  competence: string;
  amount: number;
  pdfUrl: string;
}

export interface ReportProblemPayload {
  type: 'connection' | 'speed' | 'billing' | 'other';
  description: string;
}

export interface NegotiationResult {
  invoiceId: string;
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  firstDueDate: string;
}

export interface ReleaseConnectionResult {
  expiresAt: string;
  message: string;
}
