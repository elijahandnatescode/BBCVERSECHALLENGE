import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const c = Number(req.nextUrl.searchParams.get('c') ?? 1);

  const [total, totalV, completedV, active] = await Promise.all([
    db.execute('SELECT COUNT(*) as c FROM participants'),
    db.execute({
      sql: 'SELECT COUNT(*) as c FROM progress WHERE challenge_id = ?',
      args: [c],
    }),
    db.execute({
      sql: 'SELECT COUNT(*) as c FROM progress WHERE challenge_id = ? AND completed = 1',
      args: [c],
    }),
    db.execute({
      sql: 'SELECT COUNT(DISTINCT participant_id) as c FROM progress WHERE challenge_id = ? AND completed = 1',
      args: [c],
    }),
  ]);

  const totalParticipants = Number(total.rows[0].c);
  const totalVerses = Number(totalV.rows[0].c);
  const completedVerses = Number(completedV.rows[0].c);

  // Chapter breakdown — only meaningful for challenge 1 (John 1&2)
  let ch1Complete = 0;
  let ch2Complete = 0;
  if (c === 1) {
    const [ch1Res, ch2Res] = await Promise.all([
      db.execute(`SELECT COUNT(*) as c FROM (SELECT participant_id FROM progress WHERE challenge_id = 1 AND chapter = 1 AND completed = 1 GROUP BY participant_id HAVING COUNT(*) = 8)`),
      db.execute(`SELECT COUNT(*) as c FROM (SELECT participant_id FROM progress WHERE challenge_id = 1 AND chapter = 2 AND completed = 1 GROUP BY participant_id HAVING COUNT(*) = 25)`),
    ]);
    ch1Complete = Number(ch1Res.rows[0].c);
    ch2Complete = Number(ch2Res.rows[0].c);
  }

  return NextResponse.json({
    success: true,
    stats: {
      totalParticipants,
      totalVerses,
      completedVerses,
      ch1Complete,
      ch2Complete,
      active: Number(active.rows[0].c),
      overallPct: totalVerses > 0 ? Math.round((completedVerses / totalVerses) * 100) : 0,
    },
  });
}
