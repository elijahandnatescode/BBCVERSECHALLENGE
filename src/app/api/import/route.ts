import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ success: false, message: 'Invalid format: Expected an array of participants' }, { status: 400 });
        }

        await ensureInit();
        const db = getDb();

        // Begin a transaction specifically for SQLite (libsql)
        await db.execute('BEGIN TRANSACTION');

        try {
            // 1. Delete all existing participants and their related data.
            // SQLite foreign keys are often OFF by default, so we delete child tables manually to prevent orphans.
            await db.execute('DELETE FROM locks');
            await db.execute('DELETE FROM verse_attempts');
            await db.execute('DELETE FROM progress');
            await db.execute('DELETE FROM participant_challenge_optouts');
            await db.execute('DELETE FROM participants');

            // 2. Insert all participants and their progress
            for (const p of body) {
                if (!p.firstName || !p.lastName) continue; // Skip invalid rows

                // Insert participant
                const pRes = await db.execute({
                    sql: 'INSERT INTO participants (first_name, last_name) VALUES (?, ?)',
                    args: [p.firstName, p.lastName]
                });

                const newParticipantId = Number(pRes.lastInsertRowid);

                if (Array.isArray(p.progress)) {
                    for (const prog of p.progress) {
                        // Handle backwards compatibility (if missing challenge_id)
                        const challengeId = prog.challenge_id || 1;

                        await db.execute({
                            sql: 'INSERT INTO progress (participant_id, chapter, verse, completed, challenge_id) VALUES (?, ?, ?, ?, ?)',
                            args: [newParticipantId, Number(prog.chapter), Number(prog.verse), Number(prog.completed || 0), Number(challengeId)]
                        });
                    }
                }
            }

            await db.execute('COMMIT');

            return NextResponse.json({ success: true, message: 'Import successful' });

        } catch (txError: any) {
            // Rollback if anything goes wrong during the inserts
            await db.execute('ROLLBACK');
            throw txError;
        }

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Import failed' }, { status: 500 });
    }
}
