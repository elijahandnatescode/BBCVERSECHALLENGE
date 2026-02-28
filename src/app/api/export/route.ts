import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db/schema';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await ensureInit();
    const db = getDb();

    try {
        // Get all participants
        const participantsResult = await db.execute('SELECT id, first_name, last_name FROM participants');

        // Get all progress
        const progressResult = await db.execute('SELECT id, participant_id, chapter, verse, completed, challenge_id FROM progress');

        // Group progress by participant_id
        const progressByParticipant: Record<number, any[]> = {};
        for (const row of progressResult.rows) {
            const pId = Number(row.participant_id);
            if (!progressByParticipant[pId]) {
                progressByParticipant[pId] = [];
            }
            progressByParticipant[pId].push({
                chapter: Number(row.chapter),
                verse: Number(row.verse),
                completed: Number(row.completed),
                challenge_id: Number(row.challenge_id || 1) // default to 1 if missing for backwards compat
            });
        }

        // Format the final JSON output
        const exportData = participantsResult.rows.map(p => {
            const pId = Number(p.id);
            return {
                firstName: p.first_name,
                lastName: p.last_name,
                progress: progressByParticipant[pId] || []
            };
        });

        return NextResponse.json({
            success: true,
            data: exportData
        });

    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Export failed' }, { status: 500 });
    }
}
