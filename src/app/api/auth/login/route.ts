import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { createSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await seedDatabase();
    const db = getDb();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password required' });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM admins WHERE username = ? AND password = ?',
      args: [username, password],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const token = createSessionToken({ adminId: Number(admin.id), username: String(admin.username) });
    const res = NextResponse.json({ success: true, username: admin.username });
    res.cookies.set('bbc_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
