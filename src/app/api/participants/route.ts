import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();
  const q = req.nextUrl.searchParams.get('q') || '';
  const c = Number(req.nextUrl.searchParams.get('c') ?? 1);

  const result = await db.execute({
    sql: `
      SELECT p.id, p.first_name, p.last_name,
        (SELECT COUNT(*) FROM progress WHERE participant_id = p.id AND challenge_id = ? AND completed = 1) as completed_count,
        (SELECT COUNT(*) FROM progress WHERE participant_id = p.id AND challenge_id = ?) as total_count,
        l.admin_id as locked_by_admin_id,
        a.username as locked_by_username,
        (SELECT 1 FROM participant_challenge_optouts WHERE participant_id = p.id AND challenge_id = ?) as opted_out
      FROM participants p
      LEFT JOIN locks l ON l.participant_id = p.id
      LEFT JOIN admins a ON a.id = l.admin_id
      WHERE p.first_name LIKE ? OR p.last_name LIKE ?
      ORDER BY LOWER(p.last_name) ASC, LOWER(p.first_name) ASC
    `,
    args: [c, c, c, `%${q}%`, `%${q}%`],
  });

  const participants = result.rows.map(p => ({
    id: Number(p.id),
    firstName: String(p.first_name),
    lastName: String(p.last_name),
    completedCount: Number(p.completed_count),
    totalCount: Number(p.total_count),
    lockedByAdminId: p.locked_by_admin_id ? Number(p.locked_by_admin_id) : null,
    lockedByUsername: p.locked_by_username ? String(p.locked_by_username) : null,
    isLockedByMe: Number(p.locked_by_admin_id) === session.adminId,
    isLocked: !!p.locked_by_admin_id,
    optedOut: !!p.opted_out,
  }));

  return NextResponse.json({ success: true, participants });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();
  const { firstName, lastName } = await req.json();

  if (!firstName || !lastName) {
    return NextResponse.json({ success: false, message: 'First and last name required' });
  }

  const res = await db.execute({
    sql: 'INSERT INTO participants (first_name, last_name) VALUES (?, ?)',
    args: [firstName.trim(), lastName.trim()],
  });
  const pid = Number(res.lastInsertRowid);

  // Seed progress for all active challenges
  const challengesRes = await db.execute('SELECT id, chapter_num FROM challenges WHERE is_active = 1');
  for (const ch of challengesRes.rows) {
    const cid = Number(ch.id);
    const versesRes = await db.execute({
      sql: 'SELECT verse_number FROM challenge_verses WHERE challenge_id = ?',
      args: [cid],
    });
    for (const v of versesRes.rows) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO progress (participant_id, chapter, verse, completed, challenge_id) VALUES (?, ?, ?, 0, ?)',
        args: [pid, Number(ch.chapter_num), Number(v.verse_number), cid],
      });
    }
  }

  return NextResponse.json({ success: true, id: pid });
}
