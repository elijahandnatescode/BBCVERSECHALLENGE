import { cookies } from 'next/headers';
import { getDb } from './db/schema';

export interface AdminSession {
  adminId: number;
  username: string;
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bbc_session');
  if (!sessionCookie) return null;

  try {
    const data = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    return data as AdminSession;
  } catch {
    return null;
  }
}

export function createSessionToken(session: AdminSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}
