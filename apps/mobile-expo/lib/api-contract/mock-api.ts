import {
  MOCK_CNPJ_USER,
  MOCK_INVOICES,
  MOCK_LOCATIONS,
  MOCK_PASSWORD,
  MOCK_TAX_NOTES,
  MOCK_USER,
  pendingRegistrations,
  registeredUsers,
} from './mock-data';
import { groupInvoicesByLocation } from './location-helpers';
import type {
  AuthSession,
  FirstAccessContact,
  Invoice,
  InvoicesByLocation,
  NegotiationResult,
  OpenInvoicesSummary,
  ReleaseConnectionResult,
  ReportProblemPayload,
  ServiceLocation,
  TaxNote,
  UserProfile,
} from './types';
import { stripDocument } from './validators';
import { readApiCache, writeApiCache } from '../api-cache';

const READ_DELAY_MS = 50;
const WRITE_DELAY_MS = 100;

function delayRead<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), READ_DELAY_MS));
}

function delayWrite<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), WRITE_DELAY_MS));
}

function cacheKey(userId: string, scope: string, extra?: string): string {
  return extra ? `${userId}:${scope}:${extra}` : `${userId}:${scope}`;
}

async function cachedRead<T>(key: string, compute: () => T): Promise<T> {
  const hit = readApiCache<T>(key);
  if (hit !== undefined) return hit;
  const value = await delayRead(compute());
  writeApiCache(key, value);
  return value;
}

function findRegisteredProfile(userId: string): UserProfile | undefined {
  for (const entry of registeredUsers.values()) {
    if (entry.profile.id === userId) return entry.profile;
  }
  return undefined;
}

function findUserByDocument(document: string): UserProfile | undefined {
  const digits = stripDocument(document);
  if (digits === MOCK_USER.document) return MOCK_USER;
  if (digits === MOCK_CNPJ_USER.document) return MOCK_CNPJ_USER;
  return registeredUsers.get(digits)?.profile;
}

function buildRegisteredProfile(
  document: string,
  contact: { email: string; phone: string },
): UserProfile {
  const digits = stripDocument(document);
  const isCnpj = digits.length === 14;
  return {
    id: `user-reg-${digits}`,
    name: isCnpj ? 'Nova empresa' : 'Novo cliente',
    document: digits,
    documentType: isCnpj ? 'cnpj' : 'cpf',
    email: contact.email,
    phone: contact.phone,
    address: MOCK_USER.address,
    locations: [],
  };
}

function isValidPassword(document: string, password: string): boolean {
  const digits = stripDocument(document);
  const registered = registeredUsers.get(digits);
  if (registered) return registered.password === password;
  return password === MOCK_PASSWORD;
}

function getUserLocations(userId: string): ServiceLocation[] {
  return MOCK_LOCATIONS.filter((loc) => loc.userId === userId);
}

function createSession(userId: string): AuthSession {
  return {
    token: `mock-token-${userId}-${Date.now()}`,
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export async function login(document: string, password: string): Promise<AuthSession> {
  const user = findUserByDocument(document);
  if (!user || !isValidPassword(document, password)) {
    throw new Error('CPF/CNPJ ou senha incorretos.');
  }
  return delayWrite(createSession(user.id));
}

export async function registerFirstAccess(
  document: string,
  contact: FirstAccessContact,
  password: string,
): Promise<void> {
  const digits = stripDocument(document);
  if (findUserByDocument(document)) {
    throw new Error('Este CPF/CNPJ já possui cadastro. Faça login.');
  }
  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }
  const email = contact.channel === 'email' ? contact.email.trim() : '';
  const phone = contact.channel === 'whatsapp' ? stripDocument(contact.phone) : '';
  const profile = buildRegisteredProfile(document, { email, phone });
  registeredUsers.set(digits, { email, phone, password, profile });
  pendingRegistrations.delete(digits);
  return delayWrite(undefined);
}

export async function verifyFirstAccessCode(_document: string, _code: string): Promise<void> {
  return delayWrite(undefined);
}

export async function getProfile(session: AuthSession): Promise<UserProfile> {
  return cachedRead(cacheKey(session.userId, 'profile'), () => {
    if (session.userId === MOCK_USER.id) return MOCK_USER;
    if (session.userId === MOCK_CNPJ_USER.id) return MOCK_CNPJ_USER;
    const registered = findRegisteredProfile(session.userId);
    if (registered) return registered;
    return MOCK_USER;
  });
}

export async function getServiceLocations(session: AuthSession): Promise<ServiceLocation[]> {
  return cachedRead(cacheKey(session.userId, 'locations'), () =>
    getUserLocations(session.userId),
  );
}

export async function getOpenInvoices(session: AuthSession): Promise<Invoice[]> {
  return cachedRead(cacheKey(session.userId, 'open-invoices'), () =>
    MOCK_INVOICES.filter(
      (inv) =>
        inv.userId === session.userId && (inv.status === 'open' || inv.status === 'overdue'),
    ),
  );
}

export async function getOpenInvoicesByLocation(
  session: AuthSession,
): Promise<InvoicesByLocation[]> {
  return cachedRead(cacheKey(session.userId, 'open-by-location'), () => {
    const locations = getUserLocations(session.userId);
    const open = MOCK_INVOICES.filter(
      (inv) =>
        inv.userId === session.userId && (inv.status === 'open' || inv.status === 'overdue'),
    );
    return groupInvoicesByLocation(locations, open, { openOnly: true });
  });
}

function buildCombinedBoletoBarcode(total: number): string {
  const cents = Math.round(total * 100);
  const centsStr = String(cents).padStart(10, '0');
  return `2379338128600000${centsStr}00000000001234567890199`;
}

function buildCombinedBoletoUrl(total: number, invoiceCount: number): string {
  return `https://example.com/boleto/lote?total=${total}&count=${invoiceCount}`;
}

function buildCombinedPixQr(total: number, invoiceCount: number): string {
  const amountStr = total.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136sat-telecom-pix-lote52040000530398654${amountStr.length}${amountStr}5802BR5925SAT TELECOM LOTE6009ALAGOA NOVA6207${invoiceCount}FAT6304ALL1`;
}

export async function getOpenInvoicesSummary(
  session: AuthSession,
): Promise<OpenInvoicesSummary> {
  const groups = await getOpenInvoicesByLocation(session);
  const invoices = groups.flatMap((g) => g.invoices);
  const total = Math.round(invoices.reduce((sum, inv) => sum + inv.amount, 0) * 100) / 100;
  return {
    invoices,
    total,
    groups,
    combinedPixQrCode: buildCombinedPixQr(total, invoices.length),
    combinedBoletoBarcode: buildCombinedBoletoBarcode(total),
    combinedBoletoUrl: buildCombinedBoletoUrl(total, invoices.length),
  };
}

export async function getInvoicesByIds(
  session: AuthSession,
  ids: string[],
): Promise<Invoice[]> {
  const key = cacheKey(session.userId, 'invoices-by-ids', ids.slice().sort().join(','));
  return cachedRead(key, () => {
    const set = new Set(ids);
    return MOCK_INVOICES.filter((inv) => inv.userId === session.userId && set.has(inv.id));
  });
}

export async function getInvoiceHistory(session: AuthSession): Promise<Invoice[]> {
  return cachedRead(cacheKey(session.userId, 'invoice-history'), () =>
    MOCK_INVOICES.filter((inv) => inv.userId === session.userId),
  );
}

export async function getInvoiceHistoryByLocation(
  session: AuthSession,
  filter: 'open' | 'paid' | 'all' = 'all',
): Promise<InvoicesByLocation[]> {
  return cachedRead(cacheKey(session.userId, 'history-by-location', filter), () => {
    const locations = getUserLocations(session.userId);
    let invoices = MOCK_INVOICES.filter((inv) => inv.userId === session.userId);

    if (filter === 'open') {
      invoices = invoices.filter((inv) => inv.status === 'open' || inv.status === 'overdue');
    } else if (filter === 'paid') {
      invoices = invoices.filter((inv) => inv.status === 'paid');
    }

    return groupInvoicesByLocation(locations, invoices).filter((g) => g.invoices.length > 0);
  });
}

export async function getInvoiceById(session: AuthSession, id: string): Promise<Invoice | null> {
  return cachedRead(cacheKey(session.userId, 'invoice', id), () => {
    const invoice = MOCK_INVOICES.find((inv) => inv.id === id && inv.userId === session.userId);
    return invoice ?? null;
  });
}

export async function getTaxNotes(session: AuthSession): Promise<TaxNote[]> {
  return cachedRead(cacheKey(session.userId, 'tax-notes'), () =>
    MOCK_TAX_NOTES.filter((note) => note.userId === session.userId),
  );
}

export async function getTaxNoteById(
  session: AuthSession,
  id: string,
): Promise<TaxNote | null> {
  return cachedRead(cacheKey(session.userId, 'tax-note', id), () => {
    const note = MOCK_TAX_NOTES.find((n) => n.id === id && n.userId === session.userId);
    return note ?? null;
  });
}

export async function getTaxNoteByInvoiceId(
  session: AuthSession,
  invoiceId: string,
): Promise<TaxNote | null> {
  return cachedRead(cacheKey(session.userId, 'tax-note-invoice', invoiceId), () => {
    const note = MOCK_TAX_NOTES.find(
      (n) => n.invoiceId === invoiceId && n.userId === session.userId,
    );
    return note ?? null;
  });
}

export async function releaseConnection(session: AuthSession): Promise<ReleaseConnectionResult> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return delayWrite({
    expiresAt,
    message: `Conexão liberada até ${new Date(expiresAt).toLocaleString('pt-BR')}.`,
  });
}

export async function reportProblem(
  _session: AuthSession,
  _payload: ReportProblemPayload,
): Promise<void> {
  return delayWrite(undefined);
}

export async function negotiateDebt(
  session: AuthSession,
  invoiceId: string,
  installments: number,
): Promise<NegotiationResult> {
  return negotiateDebts(session, [invoiceId], installments);
}

export async function negotiateAllDebts(
  session: AuthSession,
  installments: number,
): Promise<NegotiationResult> {
  const open = MOCK_INVOICES.filter(
    (inv) =>
      inv.userId === session.userId &&
      (inv.status === 'open' || inv.status === 'overdue'),
  );
  return negotiateDebts(
    session,
    open.map((inv) => inv.id),
    installments,
  );
}

export async function negotiateDebts(
  session: AuthSession,
  invoiceIds: string[],
  installments: number,
): Promise<NegotiationResult> {
  const idSet = new Set(invoiceIds);
  const invoices = MOCK_INVOICES.filter(
    (inv) => inv.userId === session.userId && idSet.has(inv.id),
  );
  if (invoices.length === 0) {
    throw new Error('Nenhuma fatura encontrada para negociar.');
  }
  if (installments < 2 || installments > 12) {
    throw new Error('Escolha entre 2 e 12 parcelas.');
  }
  const totalAmount =
    Math.round(invoices.reduce((sum, inv) => sum + inv.amount, 0) * 100) / 100;
  const installmentAmount = Math.ceil((totalAmount / installments) * 100) / 100;
  return delayWrite({
    invoiceIds: invoices.map((inv) => inv.id),
    installments,
    installmentAmount,
    totalAmount,
    firstDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
}

export async function changePassword(
  _session: AuthSession,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (currentPassword !== MOCK_PASSWORD) {
    throw new Error('Senha atual incorreta.');
  }
  if (newPassword.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }
  return delayWrite(undefined);
}
