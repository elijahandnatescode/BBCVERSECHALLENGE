import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { participantId, action } = await req.json();

  if (!participantId) {
    return NextResponse.json({ success: false, message: 'Participant ID required' });
  }

  if (action === 'unlock') {
    await db.execute({ sql: 'DELETE FROM locks WHERE participant_id = ? AND admin_id = ?', args: [participantId, session.adminId] });
    return NextResponse.json({ success: true });
  }

  const existing = await db.execute({ sql: 'SELECT admin_id FROM locks WHERE participant_id = ?', args: [participantId] });
  if (existing.rows.length > 0) {
    const lockedBy = Number(existing.rows[0].admin_id);
    if (lockedBy !== session.adminId) {
      const other = await db.execute({ sql: 'SELECT username FROM admins WHERE id = ?', args: [lockedBy] });
      const name = other.rows.length > 0 ? String(other.rows[0].username) : 'another admin';
      return NextResponse.json({ success: false, message: `Locked by ${name}` });
    }
  }

  await db.execute({
    sql: 'INSERT OR REPLACE INTO locks (participant_id, admin_id) VALUES (?, ?)',
    args: [participantId, session.adminId],
  });
  return NextResponse.json({ success: true });
}
