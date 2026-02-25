import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  await ensureInit();
  const db = getDb();

  const { id } = await params;
  const challengeId = Number(id);

  const { participantId, optOut } = await req.json() as {
    participantId: number;
    optOut: boolean;
  };

  if (!participantId) {
    return NextResponse.json({ success: false, message: 'participantId is required' }, { status: 400 });
  }

  if (optOut) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO participant_challenge_optouts (participant_id, challenge_id) VALUES (?, ?)`,
      args: [participantId, challengeId],
    });
  } else {
    await db.execute({
      sql: `DELETE FROM participant_challenge_optouts WHERE participant_id = ? AND challenge_id = ?`,
      args: [participantId, challengeId],
    });
  }

  return NextResponse.json({ success: true, optOut });
}
