import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = {
  userId: string;
  companyId: string | null;
  role: string;
  name: string;
};

function getSecret() {
  const value = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    return null;
  }

  return new TextEncoder().encode(value);
}

export async function createSession(payload: SessionPayload) {
  const secret = getSecret();

  if (!secret) {
    throw new Error(
      'JWT_SECRET ausente ou com menos de 32 caracteres.'
    );
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  cookies().set('forgepets_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get('forgepets_session')?.value;
  const secret = getSecret();

  if (!token || !secret) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    });

    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete('forgepets_session');
}
