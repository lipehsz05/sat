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

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}
