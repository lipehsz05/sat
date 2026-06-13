import type { Invoice, ServiceLocation, TaxNote, UserProfile } from './types';

export const MOCK_LOCATIONS: ServiceLocation[] = [
  {
    id: 'loc-casa',
    userId: 'user-1',
    name: 'Casa',
    planName: '100 Mega Fibra',
    monthlyAmount: 89.9,
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'Alagoa Nova',
      state: 'PB',
      zipCode: '58388000',
    },
  },
  {
    id: 'loc-escritorio',
    userId: 'user-1',
    name: 'Escritório',
    planName: '200 Mega Empresarial',
    monthlyAmount: 129.9,
    address: {
      street: 'Av. Brasil',
      number: '890',
      complement: 'Sala 12',
      neighborhood: 'Centro',
      city: 'Alagoa Nova',
      state: 'PB',
      zipCode: '58388000',
    },
  },
  {
    id: 'loc-mae',
    userId: 'user-1',
    name: 'Casa da mãe',
    planName: '50 Mega',
    monthlyAmount: 79.9,
    address: {
      street: 'Rua do Sol',
      number: '56',
      neighborhood: 'Bairro Novo',
      city: 'Alagoa Nova',
      state: 'PB',
      zipCode: '58388000',
    },
  },
  {
    id: 'loc-matriz',
    userId: 'user-2',
    name: 'Matriz',
    planName: '500 Mega Empresarial',
    monthlyAmount: 349.9,
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 501',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310100',
    },
  },
];

export const MOCK_USER: UserProfile = {
  id: 'user-1',
  name: 'Maria Silva Santos',
  document: '52998224725',
  documentType: 'cpf',
  email: 'maria.silva@email.com',
  phone: '(83) 98765-4321',
  address: MOCK_LOCATIONS[0].address,
  locations: MOCK_LOCATIONS.filter((l) => l.userId === 'user-1'),
};

export const MOCK_CNPJ_USER: UserProfile = {
  id: 'user-2',
  name: 'Tech Solutions Ltda',
  document: '11222333000181',
  documentType: 'cnpj',
  email: 'contato@techsolutions.com.br',
  phone: '(11) 3456-7890',
  address: MOCK_LOCATIONS[3].address,
  locations: MOCK_LOCATIONS.filter((l) => l.userId === 'user-2'),
};

export const MOCK_PASSWORD = '123456';

const PAYMENT_METHODS = ['pix', 'card', 'boleto'] as const;

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function dueDateForMonth(ref: string): string {
  const [y, m] = ref.split('-').map(Number);
  const day = 10;
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function paidAtForMonth(ref: string): string {
  const [y, m] = ref.split('-').map(Number);
  const payMonth = m === 1 ? 12 : m - 1;
  const payYear = m === 1 ? y - 1 : y;
  return `${payYear}-${String(payMonth).padStart(2, '0')}-08`;
}

/** Gera histórico extenso para demonstrar paginação (12 por página) */
function buildHistoricalInvoicesAndNotes(): { invoices: Invoice[]; taxNotes: TaxNote[] } {
  const invoices: Invoice[] = [];
  const taxNotes: TaxNote[] = [];
  let invSeq = 7;
  let nfSeq = 4;

  const userLocations = [
    { id: 'loc-casa', userId: 'user-1', amount: 89.9 },
    { id: 'loc-escritorio', userId: 'user-1', amount: 129.9 },
    { id: 'loc-mae', userId: 'user-1', amount: 79.9 },
  ];

  const skipKeys = new Set([
    'loc-casa:2026-05',
    'loc-escritorio:2026-05',
    'loc-mae:2026-04',
    'loc-casa:2026-04',
    'loc-escritorio:2026-04',
    'loc-mae:2026-03',
  ]);

  for (const loc of userLocations) {
    for (let year = 2024; year <= 2026; year += 1) {
      const monthEnd = year === 2026 ? 3 : 12;
      for (let month = 1; month <= monthEnd; month += 1) {
        const ref = monthKey(year, month);
        if (skipKeys.has(`${loc.id}:${ref}`)) continue;

        const id = `inv-${String(invSeq).padStart(3, '0')}`;
        invSeq += 1;

        invoices.push({
          id,
          userId: loc.userId,
          locationId: loc.id,
          referenceMonth: ref,
          amount: loc.amount,
          dueDate: dueDateForMonth(ref),
          paidAt: paidAtForMonth(ref),
          paymentMethod: PAYMENT_METHODS[invSeq % PAYMENT_METHODS.length],
          status: 'paid',
          pixQrCode: '',
          boletoUrl: `https://example.com/boleto/${id}`,
          barcode: `2379338128600000${String(Math.round(loc.amount * 100)).padStart(6, '0')}00000000001234567890123`,
        });

        const nfId = `nf-${String(nfSeq).padStart(3, '0')}`;
        nfSeq += 1;
        taxNotes.push({
          id: nfId,
          userId: loc.userId,
          locationId: loc.id,
          invoiceId: id,
          number: String(123450 + nfSeq).padStart(9, '0'),
          issueDate: paidAtForMonth(ref),
          competence: ref,
          amount: loc.amount,
          pdfUrl: `https://example.com/nf/${nfId}.pdf`,
        });
      }
    }
  }

  return { invoices, taxNotes };
}

const historical = buildHistoricalInvoicesAndNotes();

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    userId: 'user-1',
    locationId: 'loc-casa',
    referenceMonth: '2026-05',
    amount: 89.9,
    dueDate: '2026-06-10',
    status: 'open',
    pixQrCode:
      '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540589.905802BR5925SAT TELECOM6009ALAGOA NOVA62070503***6304ABCD',
    boletoUrl: 'https://example.com/boleto/inv-001',
    barcode: '23793381286000000899900000000001234567890123',
  },
  {
    id: 'inv-002',
    userId: 'user-1',
    locationId: 'loc-escritorio',
    referenceMonth: '2026-05',
    amount: 129.9,
    dueDate: '2026-06-15',
    status: 'open',
    pixQrCode:
      '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986541299.905802BR5925SAT TELECOM6009ALAGOA NOVA62070503***6304EF01',
    boletoUrl: 'https://example.com/boleto/inv-002',
    barcode: '23793381286000001299000000000001234567890124',
  },
  {
    id: 'inv-003',
    userId: 'user-1',
    locationId: 'loc-mae',
    referenceMonth: '2026-04',
    amount: 79.9,
    dueDate: '2026-05-08',
    status: 'overdue',
    pixQrCode:
      '00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540799.905802BR5925SAT TELECOM6009ALAGOA NOVA62070503***6304EF02',
    boletoUrl: 'https://example.com/boleto/inv-003',
    barcode: '23793381286000000799900000000001234567890125',
  },
  {
    id: 'inv-004',
    userId: 'user-1',
    locationId: 'loc-casa',
    referenceMonth: '2026-04',
    amount: 89.9,
    dueDate: '2026-05-10',
    paidAt: '2026-05-08',
    paymentMethod: 'pix',
    status: 'paid',
    pixQrCode: '',
    boletoUrl: 'https://example.com/boleto/inv-004',
    barcode: '23793381286000000899900000000001234567890126',
  },
  {
    id: 'inv-005',
    userId: 'user-1',
    locationId: 'loc-escritorio',
    referenceMonth: '2026-04',
    amount: 129.9,
    dueDate: '2026-04-12',
    paidAt: '2026-04-10',
    paymentMethod: 'card',
    status: 'paid',
    pixQrCode: '',
    boletoUrl: 'https://example.com/boleto/inv-005',
    barcode: '23793381286000001299000000000001234567890127',
  },
  {
    id: 'inv-006',
    userId: 'user-1',
    locationId: 'loc-mae',
    referenceMonth: '2026-03',
    amount: 79.9,
    dueDate: '2026-04-10',
    paidAt: '2026-04-09',
    paymentMethod: 'boleto',
    status: 'paid',
    pixQrCode: '',
    boletoUrl: 'https://example.com/boleto/inv-006',
    barcode: '23793381286000000799900000000001234567890128',
  },
  ...historical.invoices,
];

export const MOCK_TAX_NOTES: TaxNote[] = [
  {
    id: 'nf-001',
    userId: 'user-1',
    locationId: 'loc-casa',
    invoiceId: 'inv-004',
    number: '000123456',
    issueDate: '2026-05-01',
    competence: '2026-04',
    amount: 89.9,
    pdfUrl: 'https://example.com/nf/nf-001.pdf',
  },
  {
    id: 'nf-002',
    userId: 'user-1',
    locationId: 'loc-escritorio',
    invoiceId: 'inv-005',
    number: '000123455',
    issueDate: '2026-05-01',
    competence: '2026-04',
    amount: 129.9,
    pdfUrl: 'https://example.com/nf/nf-002.pdf',
  },
  {
    id: 'nf-003',
    userId: 'user-1',
    locationId: 'loc-mae',
    invoiceId: 'inv-006',
    number: '000123454',
    issueDate: '2026-04-01',
    competence: '2026-03',
    amount: 79.9,
    pdfUrl: 'https://example.com/nf/nf-003.pdf',
  },
  ...historical.taxNotes,
];

export const pendingRegistrations = new Map<string, { email: string; verified: boolean }>();

/** Usuários criados via primeiro acesso (mock em memória) */
export const registeredUsers = new Map<
  string,
  { email: string; password: string; profile: UserProfile }
>();
