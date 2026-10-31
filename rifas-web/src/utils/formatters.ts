export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCpf(cpf: string): string {
  const clean = cleanDigits(cpf);
  if (clean.length < 6) return '******';
  const first2 = clean.slice(0, 2);
  const last4 = clean.slice(-4);
  return `${first2}******${last4}`;
}

export function maskPhone(phone: string): string {
  const clean = cleanDigits(phone);
  if (clean.length < 4) return '(XX) XXXXX-****';
  const last4 = clean.slice(-4);
  return `(XX) XXXXX-${last4}`;
}

export function formatCpf(cpf: string): string {
  const clean = cleanDigits(cpf).slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function formatPhone(phone: string): string {
  const clean = cleanDigits(phone).slice(0, 11);
  if (clean.length <= 2) return clean ? `(${clean}` : '';
  if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

