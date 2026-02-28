import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await ensureInit();
    const db = getDb();

    // Challenge 1: 1 John 1 (chapter=1, verses 1-10) and 1 John 2 (chapter=2, verses 1-29)
    // "Did Both Passages" criteria: completed all of 1 John 1:1-10 AND 1 John 2:1-10

    const result = await db.execute(`
    SELECT 
      p.id, p.first_name, p.last_name,
      (SELECT COUNT(*) FROM progress WHERE participant_id = p.id AND challenge_id = 1 AND completed = 1) as completed_count,
      (SELECT COUNT(DISTINCT verse) FROM progress WHERE participant_id = p.id AND challenge_id = 1 AND chapter = 1 AND completed = 1 AND verse BETWEEN 1 AND 10) as john1_count,
      (SELECT COUNT(DISTINCT verse) FROM progress WHERE participant_id = p.id AND challenge_id = 1 AND chapter = 2 AND completed = 1 AND verse BETWEEN 1 AND 10) as john2_count
    FROM participants p
    WHERE 
      (SELECT COUNT(*) FROM progress WHERE participant_id = p.id AND challenge_id = 1 AND completed = 1) > 0
    ORDER BY LOWER(p.last_name) ASC, LOWER(p.first_name) ASC
  `);

    const participated: string[] = [];
    const atLeastOne: string[] = [];
    const allPassages: string[] = [];

    for (const row of result.rows) {
        const name = `${row.first_name} ${row.last_name}`;
        const total = Number(row.completed_count);
        const j1 = Number(row.john1_count);
        const j2 = Number(row.john2_count);

        const didJ1 = j1 === 10;  // All 10 verses of 1 John 1
        const didJ2 = j2 === 10;  // First 10 verses of 1 John 2

        if (didJ1 && didJ2) {
            allPassages.push(name);
        }
        if (didJ1 || didJ2) {
            atLeastOne.push(name);
        } else if (j1 > 0 || j2 > 0) {
            participated.push(name);
        }
    }

    return NextResponse.json({
        success: true,
        data: {
            year2025: {
                allPassages,
                atLeastOne,
                participated,
            }
        }
    });
}
