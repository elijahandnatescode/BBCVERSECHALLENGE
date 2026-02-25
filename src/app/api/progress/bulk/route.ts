import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { participantId, chapter, challengeId, verses, completed } = await req.json() as {
    participantId: number;
    chapter: number;
    challengeId: number;
    verses: number[];
    completed: boolean;
  };

  if (!participantId || !chapter || !Array.isArray(verses)) {
    return NextResponse.json({ success: false, message: 'Missing required fields' });
  }

  const cid = challengeId ?? 1;

  for (const verse of verses) {
    await db.execute({
      sql: `INSERT INTO progress (participant_id, chapter, verse, completed, challenge_id)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(participant_id, chapter, verse) DO UPDATE SET completed = excluded.completed`,
      args: [participantId, chapter, verse, completed ? 1 : 0, cid],
    });
  }

  return NextResponse.json({ success: true, count: verses.length });
}
