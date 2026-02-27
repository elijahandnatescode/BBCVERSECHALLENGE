'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_LIBRARY, getBooks, getChapters, getPassage } from '@/lib/bible/nkjv';

interface Challenge {
  id: number;
  name: string;
  description: string | null;
  book: string;
  chapterNum: number;
  version: string;
  isActive: boolean;
  sortOrder: number;
  verseCount: number;
  totalParticipants: number;
  overallPct: number;
  createdAt: string;
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const page: React.CSSProperties = {
  minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};
const navBar: React.CSSProperties = {
  background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
  padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px',
  height: '52px', position: 'sticky', top: 0, zIndex: 100,
};
const main: React.CSSProperties = {
  maxWidth: '760px', margin: '0 auto', padding: '32px 24px',
  display: 'flex', flexDirection: 'column', gap: '24px',
};
function btnStyle(variant: 'primary' | 'secondary' | 'ghost' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '7px', fontSize: '13px', fontWeight: '500',
    cursor: 'pointer', border: '1px solid transparent',
  };
  if (variant === 'primary') return { ...base, background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-txt)', borderColor: 'var(--btn-primary-bg)' };
  if (variant === 'secondary') return { ...base, background: 'var(--bg-hover)', color: 'var(--txt)', borderColor: 'var(--border-hi)' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--txt-2)', borderColor: 'transparent' };
  if (variant === 'danger') return { ...base, background: 'var(--red-bg)', color: 'var(--red)', borderColor: 'var(--red-bd)' };
  return base;
}

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  // New challenge form state
  const [formMode, setFormMode] = useState<'library' | 'custom'>('library');
  const books = getBooks();
  const [newBook, setNewBook] = useState(books[0] ?? 'John');
  const [newChapter, setNewChapter] = useState<number>(getChapters(books[0] ?? 'John')[0] ?? 3);
  const [customName, setCustomName] = useState('');
  const [customText, setCustomText] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const chapters = getChapters(newBook);
  const previewPassage = getPassage(newBook, newChapter);
  const alreadyAdded = formMode === 'library' && challenges.some(c => c.book === newBook && c.chapterNum === newChapter);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/challenges');
    const data = await res.json();
    if (data.success) setChallenges(data.challenges);
    setLoading(false);
  }

  function handleBookChange(b: string) {
    setNewBook(b);
    const chs = getChapters(b);
    setNewChapter(chs[0] ?? 1);
    setCreateError('');
  }

  function handleChapterChange(ch: number) {
    setNewChapter(ch);
    setCreateError('');
  }

  async function handleCreate() {
    if (formMode === 'library' && alreadyAdded) return;
    if (formMode === 'custom' && (!customName.trim() || !customText.trim())) {
      setCreateError('Name and custom text are required');
      return;
    }

    setCreating(true);
    setCreateError('');

    const body = formMode === 'library'
      ? { book: newBook, chapterNum: newChapter }
      : { customName: customName.trim(), customText: customText.trim() };

    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setCreating(false);
    if (data.success) {
      setShowNewForm(false);
      setCustomName('');
      setCustomText('');
      await load();
    } else {
      setCreateError(data.message ?? 'Failed to create challenge');
    }
  }

  async function toggleActive(c: Challenge) {
    await fetch(`/api/challenges/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    await load();
  }

  async function handleDelete(c: Challenge) {
    if (!confirm(`Are you sure you want to delete "${c.name}"? This will remove all progress for this challenge.`)) return;

    await fetch(`/api/challenges/${c.id}`, {
      method: 'DELETE',
    });
    await load();
  }

  return (
    <div style={page}>

      {/* Nav */}
      <nav style={navBar}>
        <button onClick={() => router.push('/admin')} style={{ ...btnStyle('ghost'), padding: '6px 10px', fontSize: '12px' }}>
          ← Dashboard
        </button>
        <span style={{ flex: 1, fontSize: '14px', fontWeight: '600' }}>Challenges</span>
        <button onClick={() => router.push('/admin/insights')} style={{ ...btnStyle('ghost'), fontSize: '12px', padding: '6px 10px' }}>
          Insights
        </button>
        <button onClick={() => setShowNewForm(f => !f)} style={btnStyle('primary')}>
          + New challenge
        </button>
      </nav>

      <main style={main}>

        {/* New challenge form */}
        {showNewForm && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: '12px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--txt)' }}>Add a new challenge</div>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-hi)' }}>
                <button
                  onClick={() => { setFormMode('library'); setCreateError(''); }}
                  style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', background: formMode === 'library' ? 'var(--bg-card)' : 'transparent', color: formMode === 'library' ? 'var(--txt)' : 'var(--txt-3)', boxShadow: formMode === 'library' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', border: 'none' }}
                >
                  NKJV Library
                </button>
                <button
                  onClick={() => { setFormMode('custom'); setCreateError(''); }}
                  style={{ padding: '4px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', background: formMode === 'custom' ? 'var(--bg-card)' : 'transparent', color: formMode === 'custom' ? 'var(--txt)' : 'var(--txt-3)', boxShadow: formMode === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', border: 'none' }}
                >
                  Custom Text
                </button>
              </div>
            </div>

            {formMode === 'library' ? (
              <>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Book picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Book</label>
                    <select
                      value={newBook}
                      onChange={e => handleBookChange(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--border-hi)', background: 'var(--bg-input)', color: 'var(--txt)', fontSize: '13px', minWidth: '140px' }}
                    >
                      {books.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  {/* Chapter picker */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Chapter</label>
                    <select
                      value={newChapter}
                      onChange={e => handleChapterChange(Number(e.target.value))}
                      style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--border-hi)', background: 'var(--bg-input)', color: 'var(--txt)', fontSize: '13px', minWidth: '100px' }}
                    >
                      {chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                </div>

                {/* Passage preview */}
                {previewPassage && (
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                      {previewPassage.displayName} &middot; {previewPassage.verses.length} verses &middot; NKJV
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      &ldquo;{previewPassage.verses[0]?.text}&rdquo;
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Challenge Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Memory Verses Week 1"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--border-hi)', background: 'var(--bg-input)', color: 'var(--txt)', fontSize: '13px', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verses (One per line)</label>
                  <textarea
                    placeholder="Paste the verses here. Each new line will be treated as a separate verse in the challenge."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    rows={6}
                    style={{ padding: '8px 12px', borderRadius: '7px', border: '1px solid var(--border-hi)', background: 'var(--bg-input)', color: 'var(--txt)', fontSize: '13px', width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {alreadyAdded && formMode === 'library' && (
              <div style={{ fontSize: '12px', color: 'var(--amber)', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: '7px', padding: '8px 12px' }}>
                This passage is already a challenge.
              </div>
            )}

            {createError && (
              <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: '7px', padding: '8px 12px' }}>
                {createError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowNewForm(false); setCreateError(''); }} style={btnStyle('ghost')}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || (formMode === 'library' && (alreadyAdded || !previewPassage)) || (formMode === 'custom' && (!customName.trim() || !customText.trim()))}
                style={{ ...btnStyle('primary'), opacity: (creating || (formMode === 'library' && (alreadyAdded || !previewPassage)) || (formMode === 'custom' && (!customName.trim() || !customText.trim()))) ? 0.5 : 1 }}
              >
                {creating ? 'Creating…' : `Create challenge →`}
              </button>
            </div>
          </div>
        )}

        {/* Challenge list */}
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--txt-3)', textAlign: 'center', padding: '40px 0' }}>Loading…</div>
        ) : challenges.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--txt-3)', textAlign: 'center', padding: '40px 0' }}>
            No challenges yet. Create your first one above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active challenges
            </div>
            {challenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onToggleActive={() => toggleActive(c)} onDelete={() => handleDelete(c)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChallengeCard({ challenge: c, onToggleActive, onDelete }: { challenge: Challenge; onToggleActive: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '18px 20px',
      opacity: c.isActive ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--txt)' }}>{c.name}</span>
            <span style={{
              fontSize: '10px', fontWeight: '600',
              color: c.isActive ? 'var(--green)' : 'var(--txt-3)',
              background: c.isActive ? 'var(--green-bg)' : 'var(--bg-hover)',
              border: `1px solid ${c.isActive ? 'var(--green-bd)' : 'var(--border)'}`,
              borderRadius: '4px', padding: '1px 6px',
            }}>
              {c.isActive ? 'active' : 'inactive'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginBottom: '12px' }}>
            {c.verseCount} verses &middot; {c.book === 'Custom' ? 'Custom Text' : c.version} &middot; {c.totalParticipants} participants
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '5px', background: 'var(--bg-hover)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px', background: 'var(--accent)',
                width: `${c.overallPct}%`, transition: 'width .4s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--txt-2)', flexShrink: 0, width: '36px', textAlign: 'right' }}>
              {c.overallPct}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onToggleActive}
            style={{ ...btnStyle('secondary'), fontSize: '12px', padding: '6px 10px', flexShrink: 0 }}
          >
            {c.isActive ? 'Deactivate' : 'Activate'}
          </button>
          {c.id !== 1 && (
            <button
              onClick={onDelete}
              style={{ ...btnStyle('danger'), fontSize: '12px', padding: '6px 10px', flexShrink: 0 }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
