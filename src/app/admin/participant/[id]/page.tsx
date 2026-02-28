'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ChevronLeftIcon, LockIcon, EditIcon,
  CheckIcon, XIcon, MicIcon, CheckCircleIcon, BookIcon, BarChartIcon, CircleIcon, GiftIcon,
} from '@/components/Icons';
import dynamic from 'next/dynamic';
import { JOHN1_VERSES, JOHN2_VERSES, CH2_TOTAL } from '@/lib/verseData';

const VoiceRecorder = dynamic(() => import('@/components/VoiceRecorder'), { ssr: false });
const MultiVerseRecorder = dynamic(() => import('@/components/MultiVerseRecorder'), { ssr: false });

interface Participant {
  id: number; firstName: string; lastName: string;
  isLocked: boolean; isLockedByMe: boolean; lockedByUsername: string | null;
  optedOutChallenges: number[];
}
interface ProgressRow { chapter: number; verse: number; completed: number; }

interface Challenge {
  id: number;
  name: string;
  isActive: boolean;
}

interface ChallengeDetail {
  id: number;
  name: string;
  book: string;
  chapterNum: number;
  version: string;
}

/* ── Style helpers ──────────────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'var(--bg-color)',
  border: 'var(--base-border-width) solid var(--text-color)',
  boxShadow: '8px 8px 0px 0px var(--text-color)',
  padding: '16px',
};
function btn(variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger', size: 'sm' | 'md' = 'sm'): React.CSSProperties {
  const pad = size === 'sm' ? '10px 16px' : '14px 24px';
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: pad, fontSize: size === 'sm' ? '14px' : '16px', fontWeight: '900',
    cursor: 'pointer', border: 'var(--base-border-width) solid var(--text-color)', transition: 'none',
    whiteSpace: 'nowrap' as const, textTransform: 'uppercase',
    boxShadow: '4px 4px 0px 0px var(--text-color)',
  };
  if (variant === 'primary') return { ...base, background: 'var(--btn-primary-bg, var(--text-color))', color: 'var(--btn-primary-txt, var(--bg-color))', boxShadow: 'none', transform: 'translate(4px, 4px)', border: 'var(--base-border-width) solid var(--text-color)' };
  if (variant === 'secondary') return { ...base, background: 'var(--bg-color)', color: 'var(--text-color)' };
  if (variant === 'success') return { ...base, background: 'var(--success-color)', color: 'var(--bg-color)' };
  if (variant === 'danger') return { ...base, background: 'var(--error-color)', color: 'var(--bg-color)' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--text-color)', border: 'none', boxShadow: 'none' };
  return base;
}
const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: 'var(--base-border-width) solid var(--text-color)',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 'bold',
  color: 'var(--text-color)',
  outline: 'none',
  width: '100%',
  textTransform: 'uppercase',
  boxShadow: '4px 4px 0px 0px var(--text-color)',
};

function ParticipantPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const challengeId = Number(searchParams.get('c') ?? 1);

  const [admin, setAdmin] = useState<{ username: string; adminId: number } | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeDetail, setChallengeDetail] = useState<ChallengeDetail | null>(null);
  // For non-default challenges: verse texts from challenge_verses
  const [challengeVerses, setChallengeVerses] = useState<Array<{ verseNumber: number; verseText: string }>>([]);
  const [loading, setLoading] = useState(true);

  // For challenge 1: John 1 / John 2 tabs; for others: single chapter
  const [activeChapter, setActiveChapter] = useState<number>(challengeId === 1 ? 1 : -1);

  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [recorder, setRecorder] = useState<{ chapter: number; verse: number; text: string } | null>(null);
  const [multiRecorder, setMultiRecorder] = useState(false);
  const [toast, setToast] = useState('');
  const [markAllConfirm, setMarkAllConfirm] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [togglingOptOut, setTogglingOptOut] = useState(false);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  const fetchData = useCallback(async () => {
    const [meRes, pRes, cRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch(`/api/participants/${id}?c=${challengeId}`),
      fetch('/api/challenges'),
    ]);
    const meData = await meRes.json();
    if (!meData.success) { router.replace('/login'); return; }
    setAdmin({ username: meData.username, adminId: meData.adminId });

    const pData = await pRes.json();
    if (!pData.success) { router.replace('/admin'); return; }
    setParticipant(pData.participant);
    setProgress(pData.progress);
    setEditFirst(pData.participant.firstName);
    setEditLast(pData.participant.lastName);

    const cData = await cRes.json();
    if (cData.success) setChallenges(cData.challenges);

    // For non-default challenges, fetch verse texts
    if (challengeId !== 1) {
      const cvRes = await fetch(`/api/challenges/${challengeId}`);
      const cvData = await cvRes.json();
      if (cvData.success) {
        setChallengeDetail(cvData.challenge);
        setChallengeVerses(cvData.verses);
        setActiveChapter(cvData.challenge.chapterNum);
      }
    } else {
      setChallengeDetail({ id: 1, name: 'John 1 & 2', book: 'John', chapterNum: 1, version: 'NIV' });
      setActiveChapter(1);
    }

    setLoading(false);
  }, [id, router, challengeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function isDone(chapter: number, verse: number) {
    return progress.find(r => r.chapter === chapter && r.verse === verse)?.completed === 1;
  }

  function getVerseText(chapter: number, verse: number): string | undefined {
    if (challengeId === 1) {
      return chapter === 1
        ? JOHN1_VERSES.find(v => v.v === verse)?.text
        : JOHN2_VERSES[verse];
    }
    // For other challenges, verse_number in challenge_verses equals the actual verse number
    return challengeVerses.find(v => v.verseNumber === verse)?.verseText;
  }

  async function toggleVerse(chapter: number, verse: number) {
    if (!participant?.isLockedByMe) { showToast('Lock this participant first to edit progress.'); return; }
    const current = progress.find(r => r.chapter === chapter && r.verse === verse);
    const newVal = current?.completed === 1 ? 0 : 1;
    setProgress(prev => {
      const exists = prev.find(r => r.chapter === chapter && r.verse === verse);
      if (exists) return prev.map(r => r.chapter === chapter && r.verse === verse ? { ...r, completed: newVal } : r);
      return [...prev, { chapter, verse, completed: newVal }];
    });
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: participant.id, chapter, verse, completed: newVal === 1, challengeId }),
    });
  }

  async function handleMarkAllComplete() {
    if (!participant?.isLockedByMe) return;
    setMarkingAll(true);

    // Determine which verses to mark (all in current chapter/view)
    const versesToMark = getVerseListForChapter(activeChapter).map(v => v.verse);

    await fetch('/api/progress/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: participant.id,
        chapter: activeChapter,
        challengeId,
        verses: versesToMark,
        completed: true,
      }),
    });

    setProgress(prev => {
      let updated = [...prev];
      for (const verse of versesToMark) {
        const exists = updated.find(r => r.chapter === activeChapter && r.verse === verse);
        if (exists) {
          updated = updated.map(r => r.chapter === activeChapter && r.verse === verse ? { ...r, completed: 1 } : r);
        } else {
          updated.push({ chapter: activeChapter, verse, completed: 1 });
        }
      }
      return updated;
    });

    setMarkingAll(false);
    setMarkAllConfirm(false);
    showToast(`All ${versesToMark.length} verses marked complete`);
  }

  async function handleSaveName() {
    if (!editFirst.trim() || !editLast.trim()) return;
    await fetch(`/api/participants/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: editFirst.trim(), lastName: editLast.trim() }),
    });
    setEditing(false); fetchData(); showToast('Name updated');
  }

  async function handleRelease() {
    await fetch('/api/lock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: participant?.id, action: 'unlock' }),
    });
    router.push(`/admin?c=${challengeId}`);
  }

  async function toggleOptOut(cid: number, currentlyOptedOut: boolean) {
    if (!participant) return;
    setTogglingOptOut(true);
    await fetch(`/api/challenges/${cid}/optout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: participant.id, optOut: !currentlyOptedOut }),
    });
    await fetchData();
    setTogglingOptOut(false);
  }

  function openRecorder(chapter: number, verse: number) {
    if (!participant?.isLockedByMe) { showToast('Lock this participant first to record.'); return; }
    const text = getVerseText(chapter, verse);
    if (!text) return;
    setRecorder({ chapter, verse, text });
  }

  function openMultiRecorder() {
    if (!participant?.isLockedByMe) { showToast('Lock this participant first to record.'); return; }
    setMultiRecorder(true);
  }

  function handleRecordPassed(chapter: number, verse: number) {
    setProgress(prev => {
      const exists = prev.find(r => r.chapter === chapter && r.verse === verse);
      if (exists) return prev.map(r => r.chapter === chapter && r.verse === verse ? { ...r, completed: 1 } : r);
      return [...prev, { chapter, verse, completed: 1 }];
    });
    showToast(`${chapter}:${verse} marked complete`);
  }

  function handleMultiSaved(passedVerses: number[]) {
    setProgress(prev => {
      let updated = [...prev];
      for (const vNum of passedVerses) {
        const exists = updated.find(r => r.chapter === activeChapter && r.verse === vNum);
        if (exists) {
          updated = updated.map(r => r.chapter === activeChapter && r.verse === vNum ? { ...r, completed: 1 } : r);
        } else {
          updated.push({ chapter: activeChapter, verse: vNum, completed: 1 });
        }
      }
      return updated;
    });
    showToast(`${passedVerses.length} verse${passedVerses.length !== 1 ? 's' : ''} saved`);
  }

  // Build verse list for current chapter view
  function getVerseListForChapter(ch: number): Array<{ verse: number; text: string }> {
    if (challengeId === 1) {
      if (ch === 1) return JOHN1_VERSES.map(v => ({ verse: v.v, text: v.text }));
      return Object.entries(JOHN2_VERSES).map(([k, t]) => ({ verse: Number(k), text: t }));
    }
    // Other challenges
    return challengeVerses.map(v => ({ verse: v.verseNumber, text: v.verseText }));
  }

  const currentVerseList = getVerseListForChapter(activeChapter);

  // allVerses for MultiVerseRecorder (with done status)
  const allVersesForRecorder = currentVerseList.map(v => ({
    verse: v.verse,
    text: v.text,
    done: isDone(activeChapter, v.verse),
  }));

  // Stats for challenge 1
  const ch1Done = progress.filter(r => r.chapter === 1 && r.completed === 1).length;
  const ch2Done = progress.filter(r => r.chapter === 2 && r.completed === 1).length;

  // Stats for current challenge
  let totalDone: number;
  let totalPossible: number;
  if (challengeId === 1) {
    totalDone = ch1Done + ch2Done;
    totalPossible = 8 + CH2_TOTAL;
  } else {
    totalDone = progress.filter(r => r.completed === 1).length;
    totalPossible = challengeVerses.length;
  }
  const overallPct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  const lockedByOther = participant?.isLocked && !participant?.isLockedByMe;
  const canEdit = !!participant?.isLockedByMe;
  const canRename = !!admin;
  const isOptedOut = participant?.optedOutChallenges.includes(challengeId) ?? false;

  const incompleteInChapter = currentVerseList.filter(v => !isDone(activeChapter, v.verse)).length;
  const allDoneInChapter = incompleteInChapter === 0 && currentVerseList.length > 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
    </div>
  );

  const chapterLabel = challengeId === 1
    ? `John ${activeChapter}`
    : challengeDetail ? `${challengeDetail.book} ${challengeDetail.chapterNum}` : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
          borderRadius: '8px', padding: '10px 18px', fontSize: '13px',
          color: 'var(--txt)', zIndex: 1000, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          animation: 'fadeUp .2s ease both',
        }}>
          {toast}
        </div>
      )}

      {/* Single-verse recorder */}
      {recorder && participant && (
        <VoiceRecorder
          verse={recorder}
          participantName={`${participant.firstName} ${participant.lastName}`}
          participantId={participant.id}
          onClose={() => setRecorder(null)}
          onPassed={handleRecordPassed}
        />
      )}

      {/* Multi-verse recorder */}
      {multiRecorder && participant && allVersesForRecorder.length > 0 && (
        <MultiVerseRecorder
          chapter={activeChapter}
          chapterLabel={chapterLabel}
          allVerses={allVersesForRecorder}
          participantName={`${participant.firstName} ${participant.lastName}`}
          participantId={participant.id}
          challengeId={challengeId}
          onClose={() => setMultiRecorder(false)}
          onSaved={handleMultiSaved}
        />
      )}

      {/* Nav */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 20px', height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button onClick={() => router.push(`/admin?c=${challengeId}`)} style={{ ...btn('ghost'), gap: '4px' }}>
          <ChevronLeftIcon size={14} /> Back
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <div style={{ color: 'var(--accent)' }}><BookIcon size={14} /></div>

        {!editing ? (
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--txt)' }}>
            {participant?.firstName} {participant?.lastName}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input style={{ ...inputStyle, width: '110px' }} value={editFirst} onChange={e => setEditFirst(e.target.value)} />
            <input style={{ ...inputStyle, width: '110px' }} value={editLast} onChange={e => setEditLast(e.target.value)} />
            <button onClick={handleSaveName} style={btn('success')}><CheckIcon size={12} /></button>
            <button onClick={() => setEditing(false)} style={btn('ghost')}><XIcon size={12} /></button>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/admin/prizes')} style={{ ...btn('ghost'), gap: '5px' }}>
          <GiftIcon size={13} /> Prizes
        </button>
        <button onClick={() => router.push(`/admin/insights?c=${challengeId}`)} style={{ ...btn('ghost'), gap: '5px' }}>
          <BarChartIcon size={13} /> Insights
        </button>
        {canRename && !editing && (
          <button onClick={() => setEditing(true)} style={{ ...btn('ghost'), gap: '5px' }}>
            <EditIcon size={13} /> Rename
          </button>
        )}
        {canEdit && (
          <button onClick={handleRelease} style={{ ...btn('secondary'), gap: '5px' }}>
            <LockIcon size={13} /> Release
          </button>
        )}
        <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{admin?.username}</span>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Lock warning */}
        {lockedByOther && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px',
            background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)',
            borderRadius: '8px', fontSize: '13px', color: 'var(--amber)',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <LockIcon size={14} />
            Currently being edited by <strong style={{ marginLeft: 4 }}>{participant?.lockedByUsername}</strong> — view only.
          </div>
        )}

        {!canEdit && !lockedByOther && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', fontSize: '13px', color: 'var(--txt-2)',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <LockIcon size={14} />
            Go back and use Open to lock this participant before editing.
          </div>
        )}

        {/* Header card */}
        <div className="reveal" style={{ ...card, padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
              background: `hsl(${(participant!.id * 53) % 360},35%,22%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: '700', color: 'var(--txt-2)',
              border: overallPct === 100 ? '2px solid var(--green)' : '2px solid var(--border)',
            }}>
              {participant?.firstName[0]}{participant?.lastName[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.01em', color: 'var(--txt)', marginBottom: '3px' }}>
                {participant?.firstName} {participant?.lastName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>
                {isOptedOut
                  ? `Not participating in ${challengeDetail?.name ?? 'this challenge'}`
                  : `${totalDone} of ${totalPossible} verses · ${challengeDetail?.name ?? ''}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {isOptedOut ? (
                <div style={{ fontSize: '11px', color: 'var(--txt-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Opted out
                </div>
              ) : (
                <>
                  <div className="font-mono" style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.04em', color: overallPct === 100 ? 'var(--green)' : 'var(--txt)', lineHeight: 1 }}>
                    {overallPct}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>complete</div>
                </>
              )}
            </div>
          </div>
          {!isOptedOut && (
            <div style={{ marginTop: '16px' }}>
              <ProgressBar pct={overallPct} gradient />
            </div>
          )}
        </div>

        {/* Challenge Switcher Tabs */}
        {challenges.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {challenges.filter(c => c.isActive).map(c => {
              const active = challengeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/admin/participant/${id}?c=${c.id}`)}
                  style={active ? btn('primary') : btn('secondary')}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Challenge enrollment section */}
        {challenges.length > 0 && canEdit && (
          <div style={{ ...card, padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--txt)', marginBottom: '12px' }}>
              Challenge enrollment
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {challenges.filter(c => c.isActive).map(c => {
                const optedOut = participant?.optedOutChallenges.includes(c.id) ?? false;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--txt)' }}>{c.name}</span>
                    <button
                      onClick={() => toggleOptOut(c.id, optedOut)}
                      disabled={togglingOptOut}
                      style={{
                        ...btn(optedOut ? 'secondary' : 'success'),
                        fontSize: '11px', padding: '4px 10px',
                        opacity: togglingOptOut ? 0.6 : 1,
                      }}
                    >
                      {optedOut ? 'Opted out — Enroll' : '✓ Enrolled'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chapter tabs — only for challenge 1 */}
        {challengeId === 1 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            {([1, 2] as const).map(ch => {
              const done = ch === 1 ? ch1Done : ch2Done;
              const total = ch === 1 ? 8 : CH2_TOTAL;
              const pct = Math.round((done / total) * 100);
              const active = activeChapter === ch;
              return (
                <button key={ch} onClick={() => setActiveChapter(ch)} style={active ? btn('primary') : btn('secondary')}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '900' }}>
                      John {ch} &mdash; {done}/{total}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Verse list */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--txt)' }}>
              {chapterLabel} — Verses
              {!isOptedOut && (
                <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--txt-3)', marginLeft: '8px' }}>
                  {currentVerseList.length - incompleteInChapter}/{currentVerseList.length} done
                </span>
              )}
            </span>

            {canEdit && !isOptedOut && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {/* Mark all complete */}
                {!allDoneInChapter && !markAllConfirm && (
                  <button
                    onClick={() => setMarkAllConfirm(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: '500',
                      background: 'var(--bg-hover)', color: 'var(--txt-2)', border: '1px solid var(--border-hi)',
                      cursor: 'pointer',
                    }}
                  >
                    <CheckIcon size={12} /> Mark all
                  </button>
                )}

                {markAllConfirm && (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--txt-2)' }}>Mark all {chapterLabel} complete?</span>
                    <button
                      onClick={handleMarkAllComplete}
                      disabled={markingAll}
                      style={{ ...btn('success'), padding: '4px 8px', fontSize: '11px', opacity: markingAll ? 0.6 : 1 }}
                    >
                      {markingAll ? '…' : 'Yes'}
                    </button>
                    <button onClick={() => setMarkAllConfirm(false)} style={{ ...btn('ghost'), padding: '4px 8px', fontSize: '11px' }}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Record multiple */}
                {allVersesForRecorder.length > 1 && (
                  <button
                    onClick={openMultiRecorder}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: '500',
                      background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)',
                      cursor: 'pointer',
                    }}
                  >
                    <MicIcon size={12} />
                    Record multiple
                  </button>
                )}
              </div>
            )}

            {!canEdit && (
              <span style={{ fontSize: '11px', color: 'var(--txt-2)' }}>
                {lockedByOther ? 'View only' : 'Lock to edit'}
              </span>
            )}
          </div>

          {isOptedOut ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px' }}>
              This participant has opted out of this challenge.
            </div>
          ) : currentVerseList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px' }}>
              No verses found for this challenge.
            </div>
          ) : (
            currentVerseList.map((v, i) => (
              <VerseRow
                key={v.verse}
                chapter={activeChapter}
                verse={v.verse}
                text={v.text}
                done={isDone(activeChapter, v.verse)}
                canEdit={canEdit}
                last={i === currentVerseList.length - 1}
                onToggle={() => toggleVerse(activeChapter, v.verse)}
                onRecord={() => openRecorder(activeChapter, v.verse)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function ParticipantPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
      </div>
    }>
      <ParticipantPageInner />
    </Suspense>
  );
}

/* ── ProgressBar ──────────────────────────────────────────────────────────── */
function ProgressBar({ pct, gradient, color, height = 5 }: { pct: number; gradient?: boolean; color?: string; height?: number }) {
  const barColor = color || (gradient
    ? 'linear-gradient(90deg, var(--accent), var(--green))'
    : pct === 100 ? 'var(--green)' : pct > 60 ? 'linear-gradient(90deg, var(--accent), var(--green))' : 'var(--accent)');
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: '99px', height: `${height}px`, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`,
        borderRadius: '99px', background: barColor, transition: 'width .3s ease',
      }} />
    </div>
  );
}

/* ── VerseRow ─────────────────────────────────────────────────────────────── */
function VerseRow({ chapter, verse, text, done, canEdit, last, onToggle, onRecord }: {
  chapter: number; verse: number; text: string; done: boolean;
  canEdit: boolean; last: boolean;
  onToggle: () => void; onRecord: () => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: '14px', padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      background: done ? 'rgba(61,214,140,0.03)' : 'transparent',
      alignItems: 'flex-start',
    }}>
      <button
        onClick={onToggle}
        disabled={!canEdit}
        style={{
          width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
          background: done ? 'var(--green)' : 'transparent',
          border: `1.5px solid ${done ? 'var(--green)' : canEdit ? 'var(--border-hi)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canEdit ? 'pointer' : 'default',
          color: done ? '#0c1a12' : 'var(--txt-3)',
        }}
      >
        {done ? <CheckIcon size={12} /> : <CircleIcon size={12} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-mono" style={{ fontSize: '10px', fontWeight: '700', color: done ? 'var(--green)' : 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
          {chapter}:{verse}
        </div>
        <p className="font-verse" style={{ color: done ? 'var(--txt-3)' : 'var(--txt-2)' }}>{text}</p>
      </div>

      {done ? (
        <div style={{ color: 'var(--green)', marginTop: '3px', flexShrink: 0 }}>
          <CheckCircleIcon size={15} />
        </div>
      ) : (
        <button
          onClick={onRecord}
          disabled={!canEdit}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '5px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: '500',
            flexShrink: 0, marginTop: '1px',
            cursor: canEdit ? 'pointer' : 'default',
            background: canEdit ? 'var(--accent-bg)' : 'transparent',
            color: canEdit ? 'var(--accent)' : 'var(--txt-3)',
            border: canEdit ? '1px solid var(--accent-bd)' : '1px solid transparent',
          }}
        >
          <MicIcon size={12} />
          Record
        </button>
      )}
    </div>
  );
}
