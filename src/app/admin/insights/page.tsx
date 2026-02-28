'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, BookIcon, LogOutIcon, BarChartIcon, GiftIcon } from '@/components/Icons';
import { CH1_TOTAL, CH2_TOTAL } from '@/lib/verseData';

interface VerseDifficulty {
  chapter: number;
  verse: number;
  label: string;
  completionPct: number;
  avgScore: number | null;
  attemptCount: number;
  failCount: number;
  difficultyScore: number;
}

interface Analytics {
  hasAttemptData: boolean;
  verses: VerseDifficulty[];
}

interface Challenge {
  id: number;
  name: string;
  chapterNum: number;
  verseCount: number;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function diffColor(pct: number): string {
  if (pct >= 80) return 'var(--green)';
  if (pct >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function heatColor(pct: number): string {
  if (pct >= 80) return '#1a3d2a';
  if (pct >= 60) return '#3d2e0a';
  return '#3d1212';
}

function btn(variant: 'ghost' | 'secondary'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', fontSize: '14px', fontWeight: '900',
    cursor: 'pointer', border: 'var(--base-border-width) solid var(--text-color)', transition: 'none',
    whiteSpace: 'nowrap' as const, textTransform: 'uppercase',
    boxShadow: '4px 4px 0px 0px var(--text-color)',
  };
  if (variant === 'ghost') return { ...base, background: 'var(--bg-color)', color: 'var(--text-color)' };
  if (variant === 'secondary') return { ...base, background: '#ffffff', color: 'var(--text-color)' };
  return base;
}

function InsightsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = Number(searchParams.get('c') ?? 1);

  const [admin, setAdmin] = useState<{ username: string } | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeDetail, setChallengeDetail] = useState<{ chapterNum: number; verseCount: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChapter, setActiveChapter] = useState<number>(challengeId === 1 ? 1 : -1);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    async function load() {
      const [meRes, analyticsRes, cRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/analytics/verse-difficulty?c=${challengeId}`),
        fetch('/api/challenges'),
      ]);
      const me = await meRes.json();
      if (!me.success) { router.replace('/login'); return; }
      setAdmin({ username: me.username });

      const a = await analyticsRes.json();
      if (a.success) setAnalytics(a);

      const cData = await cRes.json();
      if (cData.success) {
        setChallenges(cData.challenges);
        const current = cData.challenges.find((c: Challenge) => c.id === challengeId);
        if (current) {
          setChallengeDetail({ chapterNum: current.chapterNum, verseCount: current.verseCount, name: current.name });
          if (challengeId !== 1) setActiveChapter(current.chapterNum);
        }
      }

      setLoading(false);
    }
    load();
  }, [router, challengeId]);

  function scrollToVerse(chapter: number, verse: number) {
    const key = `${chapter}:${verse}`;
    rowRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function switchChallenge(id: number) {
    router.push(`/admin/insights?c=${id}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
      </div>
    );
  }

  // For challenge 1: chapters 1 and 2; for others: single chapter
  const isDefault = challengeId === 1;
  const chapterList: number[] = isDefault ? [1, 2] : [activeChapter];

  // For the active chapter view
  const chVerses = analytics?.verses.filter(v => v.chapter === activeChapter) ?? [];
  const chTotal: number = (() => {
    if (isDefault) return activeChapter === 1 ? CH1_TOTAL : CH2_TOTAL;
    // Non-default: use max verse number from analytics data, or verseCount from challenge
    const maxV = Math.max(0, ...chVerses.map(v => v.verse));
    return challengeDetail?.verseCount ?? maxV;
  })();

  // Hardest verse per chapter for stat cards
  const hardestVerses = chapterList.map(ch => {
    const vv = analytics?.verses.filter(v => v.chapter === ch) ?? [];
    return vv.length ? vv.reduce((a, b) => a.difficultyScore < b.difficultyScore ? a : b) : null;
  });

  const attemptRows = analytics?.verses
    .filter(v => v.chapter === activeChapter && v.attemptCount > 0)
    .sort((a, b) => (b.failCount / b.attemptCount) - (a.failCount / a.attemptCount)) ?? [];

  const challengeName = challenges.find(c => c.id === challengeId)?.name ?? 'Insights';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 20px', height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <button onClick={() => router.push(`/admin?c=${challengeId}`)} style={{ ...btn('ghost'), gap: '4px' }}>
          <ChevronLeftIcon size={14} /> Back
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <div style={{ color: 'var(--accent)' }}><BookIcon size={14} /></div>
        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--txt)' }}>Insights</span>

        {/* Challenge switcher */}
        {challenges.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>·</span>
            <select
              value={challengeId}
              onChange={e => switchChallenge(Number(e.target.value))}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px',
                padding: '3px 6px', fontSize: '12px', color: 'var(--txt)', cursor: 'pointer',
              }}
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/admin/prizes')} style={{ ...btn('ghost'), gap: '5px' }}>
          <GiftIcon size={14} /> Prizes
        </button>
        <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{admin?.username}</span>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChartIcon size={18} style={{ color: 'var(--accent)' }} />
            Chapel Insights
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--txt-2)', marginTop: '3px' }}>
            {challengeName} &mdash; verse difficulty analysis across all participants
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {hardestVerses.map((h, i) => h ? (
            <StatCard
              key={i}
              label={`Hardest — ${isDefault ? `John ${i + 1}` : challengeName}`}
              value={h.label}
              sub={`${h.completionPct}% completion`}
              color="var(--red)"
              bg="var(--red-bg)"
              bd="var(--red-bd)"
            />
          ) : null)}
        </div>

        {/* Chapter tabs — only for default challenge */}
        {isDefault && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {([1, 2] as const).map(ch => {
              const vv = analytics?.verses.filter(v => v.chapter === ch) ?? [];
              const avg = vv.length ? Math.round(vv.reduce((s, v) => s + v.completionPct, 0) / vv.length) : 0;
              const active = activeChapter === ch;
              const total = ch === 1 ? CH1_TOTAL : CH2_TOTAL;
              return (
                <button key={ch} onClick={() => setActiveChapter(ch)} style={{
                  flex: 1, padding: '12px 16px', borderRadius: '10px',
                  border: `1px solid ${active ? 'var(--accent-bd)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-bg)' : 'var(--bg-card)',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: active ? 'var(--accent)' : 'var(--txt-2)', marginBottom: '6px' }}>
                    John {ch} &mdash; {vv.length}/{total} verses tracked
                  </div>
                  <div style={{ background: 'var(--bg-hover)', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${avg}%`, borderRadius: '99px', background: active ? 'var(--accent)' : 'var(--txt-3)' }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Heatmap */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Difficulty heatmap {isDefault ? `— John ${activeChapter}` : `— ${challengeName}`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Array.from({ length: chTotal }, (_, i) => {
              const vNum = i + 1;
              const vData = chVerses.find(v => v.verse === vNum);
              const pct = vData?.difficultyScore ?? 100;
              return (
                <button
                  key={vNum}
                  onClick={() => scrollToVerse(activeChapter, vNum)}
                  title={`${activeChapter}:${vNum} — ${pct}%`}
                  style={{
                    width: '36px', height: '36px', borderRadius: '6px',
                    background: vData ? heatColor(pct) : 'var(--bg-hover)',
                    border: `1px solid ${vData ? diffColor(pct) + '44' : 'var(--border)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', gap: '1px',
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: '700', color: vData ? diffColor(pct) : 'var(--txt-3)', lineHeight: 1 }}>
                    {vNum}
                  </span>
                  {vData && (
                    <span style={{ fontSize: '8px', color: diffColor(pct), lineHeight: 1, opacity: 0.8 }}>
                      {pct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--txt-2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#1a3d2a', display: 'inline-block' }} />
              ≥ 80% easy
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3d2e0a', display: 'inline-block' }} />
              60–79% medium
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3d1212', display: 'inline-block' }} />
              &lt; 60% hard
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--txt)' }}>
              Completion rate {isDefault ? `— John ${activeChapter}` : `— ${challengeName}`}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--txt-2)', marginLeft: '8px' }}>
              % of participants who have memorized each verse
            </span>
          </div>

          {chVerses.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--txt-2)' }}>
              No data yet
            </div>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {Array.from({ length: chTotal }, (_, i) => {
                const vNum = i + 1;
                const vData = chVerses.find(v => v.verse === vNum);
                const pct = vData?.completionPct ?? 0;
                const isMedium = pct >= 60 && pct < 80;
                const isHard = pct < 60 && !!vData;
                const key = `${activeChapter}:${vNum}`;

                return (
                  <div
                    key={vNum}
                    ref={el => {
                      if (el) rowRefs.current.set(key, el);
                      else rowRefs.current.delete(key);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '9px 20px',
                      borderLeft: isHard ? '3px solid var(--red)' : isMedium ? '3px solid var(--amber)' : '3px solid transparent',
                      background: isHard ? 'rgba(224,82,82,0.03)' : isMedium ? 'rgba(240,167,66,0.02)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)', fontFamily: 'monospace', flexShrink: 0, width: '72px' }}>
                      {activeChapter}:{vNum}
                    </span>
                    <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: '99px',
                        background: vData ? diffColor(pct) : 'var(--bg-hover)', transition: 'width .5s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: vData ? diffColor(pct) : 'var(--txt-3)', flexShrink: 0, width: '38px', textAlign: 'right' }}>
                      {vData ? `${pct}%` : '—'}
                    </span>
                    {vData && vData.attemptCount > 0 && (
                      <span style={{
                        fontSize: '10px', color: 'var(--txt-3)', flexShrink: 0,
                        background: 'var(--bg-hover)', borderRadius: '4px',
                        padding: '2px 5px', fontFamily: 'monospace',
                      }}>
                        {vData.attemptCount}×
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attempt quality table */}
        {analytics?.hasAttemptData && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--txt)' }}>
                Recording quality {isDefault ? `— John ${activeChapter}` : `— ${challengeName}`}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--txt-2)', marginLeft: '8px' }}>
                Based on voice recording sessions · sorted by fail rate
              </span>
            </div>

            {attemptRows.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--txt-2)' }}>
                No recording sessions yet for this chapter
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '12px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', width: '72px', flexShrink: 0 }}>Verse</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', flex: 1 }}>Avg score</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', width: '70px', flexShrink: 0, textAlign: 'center' }}>Attempts</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', flex: 1, textAlign: 'right' }}>Fail rate</span>
                </div>
                {attemptRows.map((v, i) => {
                  const failRate = v.attemptCount > 0 ? Math.round((v.failCount / v.attemptCount) * 100) : 0;
                  return (
                    <div key={v.verse} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 20px',
                      borderBottom: i < attemptRows.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--txt-2)', fontFamily: 'monospace', width: '72px', flexShrink: 0 }}>
                        {v.label}
                      </span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${v.avgScore ?? 0}%`, borderRadius: '99px',
                            background: diffColor(v.avgScore ?? 0),
                          }} />
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: diffColor(v.avgScore ?? 0), width: '32px' }}>
                          {v.avgScore !== null ? `${v.avgScore}%` : '—'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--txt-2)', width: '70px', textAlign: 'center', flexShrink: 0 }}>
                        {v.attemptCount}
                      </span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: diffColor(100 - failRate), width: '32px', textAlign: 'right' }}>
                          {failRate}%
                        </span>
                        <div style={{ width: '80px', background: 'var(--bg-hover)', borderRadius: '99px', height: '5px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${failRate}%`, borderRadius: '99px',
                            background: failRate > 60 ? 'var(--red)' : failRate > 30 ? 'var(--amber)' : 'var(--green)',
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!analytics?.hasAttemptData && (
          <div style={{
            padding: '14px 18px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', fontSize: '13px', color: 'var(--txt-2)',
            lineHeight: 1.6,
          }}>
            Showing completion rates only. Recording quality data will appear here once voice recordings are made using the Record or Record multiple buttons.
          </div>
        )}
      </main>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
      </div>
    }>
      <InsightsPageInner />
    </Suspense>
  );
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, bg, bd }: {
  label: string; value: string; sub?: string;
  color?: string; bg?: string; bd?: string;
}) {
  return (
    <div style={{
      background: bg || 'var(--bg-card)',
      border: `1px solid ${bd || 'var(--border)'}`,
      borderRadius: '10px', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: '700', color: color || 'var(--txt)', letterSpacing: '-0.01em', marginBottom: '2px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: color || 'var(--txt-2)' }}>{sub}</div>}
    </div>
  );
}
