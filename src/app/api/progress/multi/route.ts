import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

interface VerseResult {
  verse: number;
  score: number;
  passed: boolean;
  segment: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { participantId, chapter, challengeId, results } = await req.json() as {
    participantId: number;
    chapter: number;
    challengeId?: number;
    results: VerseResult[];
  };

  if (!participantId || !chapter || !Array.isArray(results)) {
    return NextResponse.json({ success: false, message: 'Missing required fields' });
  }

  const cid = challengeId ?? 1;
  const passed: number[] = [];

  for (const r of results) {
    // Always log each attempt
    await db.execute({
      sql: `INSERT INTO verse_attempts (participant_id, chapter, verse, score, passed, admin_id, challenge_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [participantId, chapter, r.verse, r.score, r.passed ? 1 : 0, session.adminId, cid],
    });

    // Mark complete only if passed
    if (r.passed) {
      await db.execute({
        sql: `INSERT INTO progress (participant_id, chapter, verse, completed, challenge_id)
              VALUES (?, ?, ?, 1, ?)
              ON CONFLICT(participant_id, chapter, verse) DO UPDATE SET completed = 1`,
        args: [participantId, chapter, r.verse, cid],
      });
      passed.push(r.verse);
    }
  }

  return NextResponse.json({ success: true, passed });
}
