export function stripDocument(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectDocumentType(value: string): 'cpf' | 'cnpj' | null {
  const digits = stripDocument(value);
  if (digits.length === 11) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  return null;
}

export function formatDocument(value: string): string {
  const digits = stripDocument(value);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskDocument(value: string): string {
  const digits = stripDocument(value);
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-**`;
  }
  return value;
}

function calcCpfDigit(digits: number[], factor: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (factor - i);
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value: string): boolean {
  const digits = stripDocument(value).split('').map(Number);
  if (digits.length !== 11 || digits.every((d) => d === digits[0])) return false;
  const d1 = calcCpfDigit(digits.slice(0, 9), 10);
  const d2 = calcCpfDigit(digits.slice(0, 10), 11);
  return d1 === digits[9] && d2 === digits[10];
}

function calcCnpjDigit(digits: number[], weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += digits[i] * weights[i];
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
  const digits = stripDocument(value).split('').map(Number);
  if (digits.length !== 14 || digits.every((d) => d === digits[0])) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcCnpjDigit(digits, w1);
  const d2 = calcCnpjDigit([...digits.slice(0, 12), d1], w2);
  return d1 === digits[12] && d2 === digits[13];
}

export function isValidDocument(value: string): boolean {
  const type = detectDocumentType(value);
  if (type === 'cpf') return isValidCpf(value);
  if (type === 'cnpj') return isValidCnpj(value);
  return false;
}

export function formatAddress(address: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const parts = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    address.zipCode,
  ].filter(Boolean);
  return parts.join(', ');
}

export function formatAddressShort(address: {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}): string {
  return `${address.street}, ${address.number} — ${address.neighborhood}, ${address.city}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

/** Referência/competência armazenada como YYYY-MM → exibição MM/YYYY (ex.: 05/2026) */
export function formatReferenceMonth(referenceMonth: string): string {
  const match = referenceMonth.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return referenceMonth;
  const [, year, month] = match;
  return `${month.padStart(2, '0')}/${year}`;
}

export function formatCompetence(competence: string): string {
  return formatReferenceMonth(competence);
}

import type { PaymentMethod } from './types';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  card: 'Cartão',
  boleto: 'Boleto',
};

/** Rótulo da data conforme a forma de pagamento */
export function getPaymentConfirmationLabel(method: PaymentMethod): string {
  switch (method) {
    case 'pix':
      return 'Creditado em';
    case 'card':
      return 'Debitado em';
    case 'boleto':
      return 'Compensado em';
  }
}

export function formatPaymentMethod(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method];
}

/** Formata código de barras do boleto para exibição (linha digitável simplificada) */
export function formatBoletoLinhaDigitavel(barcode: string): string {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length < 44) return barcode;
  return (
    `${digits.slice(0, 5)}.${digits.slice(5, 10)} ` +
    `${digits.slice(10, 15)}.${digits.slice(15, 21)} ` +
    `${digits.slice(21, 26)}.${digits.slice(26, 32)} ` +
    `${digits.slice(32, 33)} ${digits.slice(33)}`
  );
}
