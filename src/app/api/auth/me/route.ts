import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false });
  }
  return NextResponse.json({ success: true, adminId: session.adminId, username: session.username });
}
