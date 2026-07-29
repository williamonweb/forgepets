import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = { userId: string; companyId: string | null; role: string; name: string };
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-change-me');

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
  cookies().set('forgepets_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get('forgepets_session')?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret)).payload as unknown as SessionPayload; } catch { return null; }
}

export function clearSession() { cookies().delete('forgepets_session'); }
