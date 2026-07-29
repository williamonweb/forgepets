const DEFAULT_SANDBOX_URL = 'https://api-sandbox.asaas.com/v3';

export type AsaasBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

function apiUrl() {
  return (process.env.ASAAS_API_URL || DEFAULT_SANDBOX_URL).replace(/\/$/, '');
}

function apiKey() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error('ASAAS_API_KEY não configurada.');
  return key;
}

export async function asaasRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: apiKey(),
      ...(init.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data?.errors)
      ? data.errors.map((item: { description?: string }) => item.description).filter(Boolean).join(' ')
      : data?.message;
    throw new Error(message || `Erro Asaas (${response.status}).`);
  }

  return data as T;
}

export function normalizeDocument(value: string) {
  return String(value || '').replace(/\D/g, '');
}
