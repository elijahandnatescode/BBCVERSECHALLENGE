import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { CH1_TOTAL, CH2_TOTAL } from '@/lib/verseData';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const c = Number(req.nextUrl.searchParams.get('c') ?? 1);

  // Run both queries in parallel
  const [completionRes, attemptsRes] = await Promise.all([
    db.execute({
      sql: `
        SELECT chapter, verse,
          SUM(completed) as completed_count,
          COUNT(*) as total_participants
        FROM progress
        WHERE challenge_id = ?
        GROUP BY chapter, verse
        ORDER BY chapter, verse
      `,
      args: [c],
    }),
    db.execute({
      sql: `
        SELECT chapter, verse,
          COUNT(*) as attempt_count,
          AVG(score) as avg_score,
          SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as fail_count,
          SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as pass_count
        FROM verse_attempts
        WHERE challenge_id = ?
        GROUP BY chapter, verse
        ORDER BY chapter, verse
      `,
      args: [c],
    }),
  ]);

  // Build attempt lookup map
  const attemptMap = new Map<string, {
    attemptCount: number;
    avgScore: number;
    failCount: number;
    passCount: number;
  }>();

  for (const row of attemptsRes.rows) {
    const key = `${row.chapter}:${row.verse}`;
    attemptMap.set(key, {
      attemptCount: Number(row.attempt_count),
      avgScore:     Math.round(Number(row.avg_score) * 10) / 10,
      failCount:    Number(row.fail_count),
      passCount:    Number(row.pass_count),
    });
  }

  const hasAttemptData = attemptMap.size > 0;

  // Build verse list
  const verses: {
    chapter: number;
    verse: number;
    label: string;
    completionPct: number;
    avgScore: number | null;
    attemptCount: number;
    failCount: number;
    difficultyScore: number;
  }[] = [];

  for (const row of completionRes.rows) {
    const ch    = Number(row.chapter);
    const vNum  = Number(row.verse);
    const total = Number(row.total_participants);
    const done  = Number(row.completed_count);
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    // For challenge 1 (John 1&2) scope to known verse range
    if (c === 1) {
      if (ch === 1 && vNum > CH1_TOTAL) continue;
      if (ch === 2 && vNum > CH2_TOTAL) continue;
    }

    const key     = `${ch}:${vNum}`;
    const attempt = attemptMap.get(key);

    const avgScore     = attempt?.avgScore ?? null;
    const attemptCount = attempt?.attemptCount ?? 0;
    const failCount    = attempt?.failCount ?? 0;

    const difficultyScore = avgScore !== null
      ? Math.round(avgScore * 0.6 + completionPct * 0.4)
      : completionPct;

    verses.push({
      chapter:        ch,
      verse:          vNum,
      label:          `John ${ch}:${vNum}`,
      completionPct,
      avgScore,
      attemptCount,
      failCount,
      difficultyScore,
    });
  }

  return NextResponse.json({ success: true, hasAttemptData, verses });
}
