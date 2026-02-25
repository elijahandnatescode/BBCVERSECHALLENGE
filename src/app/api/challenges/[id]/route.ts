import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();

  const { id } = await params;
  const challengeId = Number(id);

  const [challengeRes, versesRes] = await Promise.all([
    db.execute({
      sql: 'SELECT id, name, description, book, chapter_num, version, is_active, sort_order, created_at FROM challenges WHERE id = ?',
      args: [challengeId],
    }),
    db.execute({
      sql: 'SELECT verse_number, verse_text FROM challenge_verses WHERE challenge_id = ? ORDER BY verse_number',
      args: [challengeId],
    }),
  ]);

  if (challengeRes.rows.length === 0) {
    return NextResponse.json({ success: false, message: 'Challenge not found' }, { status: 404 });
  }

  const c = challengeRes.rows[0];
  return NextResponse.json({
    success: true,
    challenge: {
      id:          Number(c.id),
      name:        String(c.name),
      book:        String(c.book),
      chapterNum:  Number(c.chapter_num),
      version:     String(c.version),
      isActive:    Number(c.is_active) === 1,
    },
    verses: versesRes.rows.map(r => ({
      verseNumber: Number(r.verse_number),
      verseText:   String(r.verse_text),
    })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();

  const { id } = await params;
  const challengeId = Number(id);

  const body = await req.json() as {
    isActive?: boolean;
    name?: string;
    sortOrder?: number;
  };

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (body.isActive !== undefined) {
    updates.push('is_active = ?');
    args.push(body.isActive ? 1 : 0);
  }
  if (body.name !== undefined) {
    updates.push('name = ?');
    args.push(body.name);
  }
  if (body.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    args.push(body.sortOrder);
  }

  if (updates.length === 0) {
    return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
  }

  args.push(challengeId);
  await db.execute({
    sql: `UPDATE challenges SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return NextResponse.json({ success: true });
}
