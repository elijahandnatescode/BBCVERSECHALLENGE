import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';
import { getPassage } from '@/lib/bible/nkjv';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();

  const challengesRes = await db.execute(`
    SELECT c.id, c.name, c.description, c.book, c.chapter_num, c.version,
           c.is_active, c.sort_order, c.created_at,
           COUNT(DISTINCT cv.id) as verse_count
    FROM challenges c
    LEFT JOIN challenge_verses cv ON cv.challenge_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order, c.id
  `);

  // For each challenge compute overall completion %
  const challenges = await Promise.all(challengesRes.rows.map(async (row) => {
    const cid = Number(row.id);

    const statsRes = await db.execute({
      sql: `
        SELECT
          COUNT(DISTINCT p2.id) as total_participants,
          SUM(CASE WHEN prog.completed = 1 THEN 1 ELSE 0 END) as completed_verses
        FROM participants p2
        LEFT JOIN progress prog ON prog.participant_id = p2.id AND prog.challenge_id = ?
      `,
      args: [cid],
    });

    const totalP = Number(statsRes.rows[0]?.total_participants ?? 0);
    const completedV = Number(statsRes.rows[0]?.completed_verses ?? 0);
    const verseCount = Number(row.verse_count);
    const possibleTotal = totalP * verseCount;
    const overallPct = possibleTotal > 0 ? Math.round((completedV / possibleTotal) * 100) : 0;

    return {
      id: cid,
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      book: String(row.book),
      chapterNum: Number(row.chapter_num),
      version: String(row.version),
      isActive: Number(row.is_active) === 1,
      sortOrder: Number(row.sort_order),
      createdAt: String(row.created_at),
      verseCount,
      totalParticipants: totalP,
      overallPct,
    };
  }));

  return NextResponse.json({ success: true, challenges });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();

  const { book, chapterNum, name, description, customText, customName } = await req.json() as {
    book?: string;
    chapterNum?: number;
    name?: string;
    description?: string;
    customText?: string;
    customName?: string;
  };

  // Get next sort_order
  const orderRes = await db.execute('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM challenges');
  const nextOrder = Number(orderRes.rows[0]?.next_order ?? 1);

  let challengeId: number;
  let versesToInsert: Array<{ v: number; text: string }> = [];
  let effectiveChapterNum = chapterNum ?? 1;

  if (customText && customName) {
    // Custom challenge
    const displayName = customName;
    const lines = customText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ success: false, message: 'Custom text is empty' }, { status: 400 });
    }

    versesToInsert = lines.map((text, i) => ({ v: i + 1, text }));

    const insertRes = await db.execute({
      sql: `INSERT INTO challenges (name, description, book, chapter_num, version, sort_order)
            VALUES (?, ?, ?, ?, 'NKJV', ?)`,
      args: [displayName, description ?? null, 'Custom', 1, nextOrder], // Default to 'Custom' book, chapter 1
    });

    challengeId = Number(insertRes.lastInsertRowid);
    effectiveChapterNum = 1;

  } else if (book && chapterNum) {
    // Normal library passage challenge
    // Check for duplicate
    const dupRes = await db.execute({
      sql: 'SELECT id FROM challenges WHERE book = ? AND chapter_num = ?',
      args: [book, chapterNum],
    });
    if (dupRes.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'This passage already exists as a challenge' }, { status: 409 });
    }

    const passage = getPassage(book, chapterNum);
    if (!passage) {
      return NextResponse.json({ success: false, message: 'Passage not found in library' }, { status: 404 });
    }

    versesToInsert = passage.verses;
    const displayName = name ?? passage.displayName;

    const insertRes = await db.execute({
      sql: `INSERT INTO challenges (name, description, book, chapter_num, version, sort_order)
            VALUES (?, ?, ?, ?, 'NKJV', ?)`,
      args: [displayName, description ?? null, book, chapterNum, nextOrder],
    });

    challengeId = Number(insertRes.lastInsertRowid);
  } else {
    return NextResponse.json({ success: false, message: 'Must provide either book/chapter OR customText/customName' }, { status: 400 });
  }

  // Insert all verses
  for (const v of versesToInsert) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO challenge_verses (challenge_id, verse_number, verse_text) VALUES (?, ?, ?)`,
      args: [challengeId, v.v, v.text],
    });
  }

  // Seed progress rows for all existing participants (completed = 0)
  await db.execute({
    sql: `
      INSERT OR IGNORE INTO progress (participant_id, chapter, verse, completed, challenge_id)
      SELECT id, ?, cv.verse_number, 0, ?
      FROM participants
      CROSS JOIN challenge_verses cv WHERE cv.challenge_id = ?
    `,
    args: [effectiveChapterNum, challengeId, challengeId],
  });

  return NextResponse.json({ success: true, challengeId });
}
