import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const c = Number(req.nextUrl.searchParams.get('c') ?? 1);

  const pResult = await db.execute({
    sql: `
      SELECT p.id, p.first_name, p.last_name,
        l.admin_id as locked_by_admin_id,
        a.username as locked_by_username
      FROM participants p
      LEFT JOIN locks l ON l.participant_id = p.id
      LEFT JOIN admins a ON a.id = l.admin_id
      WHERE p.id = ?
    `,
    args: [id],
  });

  if (pResult.rows.length === 0) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const p = pResult.rows[0];

  // Progress scoped to requested challenge
  const progressResult = await db.execute({
    sql: 'SELECT chapter, verse, completed FROM progress WHERE participant_id = ? AND challenge_id = ? ORDER BY chapter, verse',
    args: [id, c],
  });

  // All opt-outs for this participant
  const optoutsResult = await db.execute({
    sql: 'SELECT challenge_id FROM participant_challenge_optouts WHERE participant_id = ?',
    args: [id],
  });
  const optedOutChallenges = optoutsResult.rows.map(r => Number(r.challenge_id));

  return NextResponse.json({
    success: true,
    participant: {
      id: Number(p.id),
      firstName: String(p.first_name),
      lastName: String(p.last_name),
      lockedByAdminId: p.locked_by_admin_id ? Number(p.locked_by_admin_id) : null,
      lockedByUsername: p.locked_by_username ? String(p.locked_by_username) : null,
      isLockedByMe: Number(p.locked_by_admin_id) === session.adminId,
      isLocked: !!p.locked_by_admin_id,
      optedOutChallenges,
    },
    progress: progressResult.rows.map(r => ({
      chapter: Number(r.chapter),
      verse: Number(r.verse),
      completed: Number(r.completed),
    })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const { firstName, lastName } = await req.json();

  if (!firstName || !lastName) {
    return NextResponse.json({ success: false, message: 'First and last name required' });
  }

  await db.execute({
    sql: 'UPDATE participants SET first_name = ?, last_name = ? WHERE id = ?',
    args: [firstName.trim(), lastName.trim(), id],
  });
  return NextResponse.json({ success: true });
}
