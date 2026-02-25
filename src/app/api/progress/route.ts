import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { participantId, chapter, verse, completed, score, attemptOnly, challengeId } = await req.json();

  if (!participantId || !chapter || !verse) {
    return NextResponse.json({ success: false, message: 'Missing required fields' });
  }

  const cid = challengeId ?? 1;

  // Log attempt to verse_attempts table if a score was provided
  if (typeof score === 'number') {
    await db.execute({
      sql: `INSERT INTO verse_attempts (participant_id, chapter, verse, score, passed, admin_id, challenge_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [participantId, chapter, verse, score, completed ? 1 : 0, session.adminId, cid],
    });
  }

  // Update the progress completion status unless this is an attempt-only log
  if (!attemptOnly) {
    await db.execute({
      sql: `INSERT INTO progress (participant_id, chapter, verse, completed, challenge_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(participant_id, chapter, verse) DO UPDATE SET completed = excluded.completed`,
      args: [participantId, chapter, verse, completed ? 1 : 0, cid],
    });
  }

  return NextResponse.json({ success: true });
}
