import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = {
  userId: string;
  companyId: string | null;
  role: string;
  name: string;
};

function getSecret() {
  const value = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get('forgepets_session')?.value;
  const secret = getSecret();
  if (!token || !secret) return null;

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete('forgepets_session');
}
