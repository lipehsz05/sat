import type { Invoice, TaxNote, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'user-1',
  name: 'Maria Silva Santos',
  document: '52998224725',
  documentType: 'cpf',
  email: 'maria.silva@email.com',
  phone: '(11) 98765-4321',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
};

export const MOCK_CNPJ_USER: UserProfile = {
  id: 'user-2',
  name: 'Tech Solutions Ltda',
  document: '11222333000181',
  documentType: 'cnpj',
  email: 'contato@techsolutions.com.br',
  phone: '(11) 3456-7890',
  address: {
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Sala 501',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
};

export const MOCK_PASSWORD = '123456';

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    userId: 'user-1',
    referenceMonth: '2026-05',
    amount: 89.9,
    dueDate: '2026-06-10',
    status: 'open',
    pixQrCode:
      '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540589.905802BR5925PROVEDOR INTERNET SAT6009SAO PAULO62070503***6304ABCD',
    boletoUrl: 'https://example.com/boleto/inv-001',
    barcode: '23793381286000000899900000000001234567890123',
  },
  {
    id: 'inv-002',
    userId: 'user-1',
    referenceMonth: '2026-04',
    amount: 89.9,
    dueDate: '2026-05-10',
    paidAt: '2026-05-08',
    status: 'paid',
    pixQrCode: '',
    boletoUrl: 'https://example.com/boleto/inv-002',
    barcode: '23793381286000000899900000000001234567890124',
  },
  {
    id: 'inv-003',
    userId: 'user-1',
    referenceMonth: '2026-03',
    amount: 89.9,
    dueDate: '2026-04-10',
    paidAt: '2026-04-09',
    status: 'paid',
    pixQrCode: '',
    boletoUrl: 'https://example.com/boleto/inv-003',
    barcode: '23793381286000000899900000000001234567890125',
  },
  {
    id: 'inv-004',
    userId: 'user-1',
    referenceMonth: '2026-02',
    amount: 89.9,
    dueDate: '2026-03-10',
    status: 'overdue',
    pixQrCode:
      '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540589.905802BR5925PROVEDOR INTERNET SAT6009SAO PAULO62070503***6304EFGH',
    boletoUrl: 'https://example.com/boleto/inv-004',
    barcode: '23793381286000000899900000000001234567890126',
  },
];

export const MOCK_TAX_NOTES: TaxNote[] = [
  {
    id: 'nf-001',
    userId: 'user-1',
    number: '000123456',
    issueDate: '2026-05-01',
    competence: '2026-04',
    amount: 89.9,
    pdfUrl: 'https://example.com/nf/nf-001.pdf',
  },
  {
    id: 'nf-002',
    userId: 'user-1',
    number: '000123455',
    issueDate: '2026-04-01',
    competence: '2026-03',
    amount: 89.9,
    pdfUrl: 'https://example.com/nf/nf-002.pdf',
  },
  {
    id: 'nf-003',
    userId: 'user-1',
    number: '000123454',
    issueDate: '2026-03-01',
    competence: '2026-02',
    amount: 89.9,
    pdfUrl: 'https://example.com/nf/nf-003.pdf',
  },
];

export const pendingRegistrations = new Map<string, { email: string; verified: boolean }>();
