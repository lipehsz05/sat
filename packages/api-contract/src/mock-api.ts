import {
  MOCK_CNPJ_USER,
  MOCK_INVOICES,
  MOCK_PASSWORD,
  MOCK_TAX_NOTES,
  MOCK_USER,
  pendingRegistrations,
} from './mock-data';
import type {
  AuthSession,
  Invoice,
  NegotiationResult,
  ReleaseConnectionResult,
  ReportProblemPayload,
  TaxNote,
  UserProfile,
} from './types';
import { stripDocument } from './validators';

const DELAY_MS = 500;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

function findUserByDocument(document: string): UserProfile | undefined {
  const digits = stripDocument(document);
  if (digits === MOCK_USER.document) return MOCK_USER;
  if (digits === MOCK_CNPJ_USER.document) return MOCK_CNPJ_USER;
  for (const [, reg] of pendingRegistrations) {
    if (reg.verified) {
      // placeholder for dynamically registered users
    }
  }
  return undefined;
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
  if (!user || password !== MOCK_PASSWORD) {
    throw new Error('CPF/CNPJ ou senha incorretos.');
  }
  return delay(createSession(user.id));
}

export async function registerFirstAccess(
  document: string,
  email: string,
  password: string,
): Promise<void> {
  const digits = stripDocument(document);
  if (findUserByDocument(document)) {
    throw new Error('Este CPF/CNPJ já possui cadastro. Faça login.');
  }
  if (password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }
  pendingRegistrations.set(digits, { email, verified: true });
  return delay(undefined);
}

export async function verifyFirstAccessCode(_document: string, _code: string): Promise<void> {
  return delay(undefined);
}

export async function getProfile(session: AuthSession): Promise<UserProfile> {
  const user =
    session.userId === MOCK_USER.id
      ? MOCK_USER
      : session.userId === MOCK_CNPJ_USER.id
        ? MOCK_CNPJ_USER
        : MOCK_USER;
  return delay(user);
}

export async function getOpenInvoices(session: AuthSession): Promise<Invoice[]> {
  return delay(
    MOCK_INVOICES.filter(
      (inv) =>
        inv.userId === session.userId && (inv.status === 'open' || inv.status === 'overdue'),
    ),
  );
}

export async function getInvoiceHistory(session: AuthSession): Promise<Invoice[]> {
  return delay(MOCK_INVOICES.filter((inv) => inv.userId === session.userId));
}

export async function getInvoiceById(session: AuthSession, id: string): Promise<Invoice | null> {
  const invoice = MOCK_INVOICES.find((inv) => inv.id === id && inv.userId === session.userId);
  return delay(invoice ?? null);
}

export async function getTaxNotes(session: AuthSession): Promise<TaxNote[]> {
  return delay(MOCK_TAX_NOTES.filter((note) => note.userId === session.userId));
}

export async function releaseConnection(session: AuthSession): Promise<ReleaseConnectionResult> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return delay({
    expiresAt,
    message: `Conexão liberada para ${session.userId} até ${new Date(expiresAt).toLocaleString('pt-BR')}.`,
  });
}

export async function reportProblem(
  _session: AuthSession,
  _payload: ReportProblemPayload,
): Promise<void> {
  return delay(undefined);
}

export async function negotiateDebt(
  session: AuthSession,
  invoiceId: string,
  installments: number,
): Promise<NegotiationResult> {
  const invoice = MOCK_INVOICES.find(
    (inv) => inv.id === invoiceId && inv.userId === session.userId,
  );
  if (!invoice) throw new Error('Fatura não encontrada.');
  if (installments < 2 || installments > 12) {
    throw new Error('Escolha entre 2 e 12 parcelas.');
  }
  const installmentAmount = Math.ceil((invoice.amount / installments) * 100) / 100;
  return delay({
    invoiceId,
    installments,
    installmentAmount,
    totalAmount: invoice.amount,
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
  return delay(undefined);
}
