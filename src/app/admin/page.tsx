'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookIcon, UsersIcon, SearchIcon, PlusIcon, ActivityIcon,
  BarChartIcon, LockIcon, UnlockIcon, LogOutIcon, CheckCircleIcon,
  XIcon, CheckIcon, EditIcon, ChevronDownIcon, ChevronRightIcon, GiftIcon
} from '@/components/Icons';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Stats {
  totalParticipants: number;
  completedVerses: number;
  totalVerses: number;
  ch1Complete: number;
  ch2Complete: number;
  active: number;
  overallPct: number;
}

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  completedCount: number;
  totalCount: number;
  isLocked: boolean;
  isLockedByMe: boolean;
  lockedByAdminId: number | null;
  lockedByUsername: string | null;
  optedOut: boolean;
}

interface Challenge {
  id: number;
  name: string;
}

type Filter = 'all' | 'complete' | 'incomplete';

/* ── Shared style helpers ─────────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'var(--bg-color)',
  border: 'var(--base-border-width) solid var(--text-color)',
  boxShadow: '8px 8px 0px 0px var(--text-color)',
  padding: '16px',
};
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-color)',
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

function AdminPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = Number(searchParams.get('c') ?? 1);

  const [admin, setAdmin] = useState<{ username: string; adminId: number } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [addingNew, setAddingNew] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [toast, setToast] = useState('');
  const [lockingId, setLockingId] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }

  async function handleRename(p: Participant, newFirst: string, newLast: string) {
    const res = await fetch(`/api/participants/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: newFirst.trim(), lastName: newLast.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Name updated');
      fetchAll(search);
    } else {
      showToast(data.message || 'Failed to update name');
    }
  }

  const fetchAll = useCallback(async (q = '') => {
    const [meRes, statsRes, pRes, cRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch(`/api/stats?c=${challengeId}`),
      fetch(`/api/participants?q=${encodeURIComponent(q)}&c=${challengeId}`),
      fetch('/api/challenges'),
    ]);
    const meData = await meRes.json();
    if (!meData.success) { router.replace('/login'); return; }
    setAdmin({ username: meData.username, adminId: meData.adminId });

    const statsData = await statsRes.json();
    if (statsData.success) setStats(statsData.stats);

    const pData = await pRes.json();
    if (pData.success) setParticipants(pData.participants);

    const cData = await cRes.json();
    if (cData.success) setChallenges(cData.challenges);

    setLoading(false);
  }, [router, challengeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const t = setTimeout(() => fetchAll(search), 280);
    return () => clearTimeout(t);
  }, [search, fetchAll]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  async function handleLockAndOpen(p: Participant) {
    if (p.isLockedByMe) {
      router.push(`/admin/participant/${p.id}?c=${challengeId}`);
      return;
    }
    if (p.isLocked && !p.isLockedByMe) {
      showToast(`Locked by ${p.lockedByUsername}`);
      return;
    }
    setLockingId(p.id);
    const res = await fetch('/api/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: p.id, action: 'lock' }),
    });
    const data = await res.json();
    setLockingId(null);
    if (data.success) {
      router.push(`/admin/participant/${p.id}?c=${challengeId}`);
    } else {
      showToast(data.message || 'Could not lock participant');
      fetchAll(search);
    }
  }

  async function handleUnlock(p: Participant) {
    if (!p.isLockedByMe) return;
    const res = await fetch('/api/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: p.id, action: 'unlock' }),
    });
    const data = await res.json();
    if (data.success) fetchAll(search);
    else showToast(data.message);
  }

  async function handleDelete(p: Participant) {
    if (!window.confirm(`Delete ${p.firstName} ${p.lastName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/participants/${p.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Participant deleted');
      fetchAll(search);
    } else {
      showToast(data.message || 'Failed to delete');
    }
  }

  async function handleAdd() {
    if (!newFirst.trim() || !newLast.trim()) return;
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: newFirst.trim(), lastName: newLast.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setNewFirst(''); setNewLast(''); setAddingNew(false);
      fetchAll(search);
      showToast('Participant added');
    }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bbc_verse_participants_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export successful');
      } else {
        showToast('Export failed: ' + data.message);
      }
    } catch (e) {
      showToast('Export error');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Importing will OVERWRITE the entire database and erase all current data. Are you absolutely sure you want to proceed?')) {
      e.target.value = ''; // reset
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      setLoading(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Import successful');
        await fetchAll(search);
      } else {
        showToast('Import failed: ' + data.message);
        setLoading(false);
      }
    } catch (err) {
      showToast('Invalid JSON file');
      setLoading(false);
    }
    e.target.value = ''; // reset
  }

  function switchChallenge(id: number) {
    router.push(`/admin?c=${id}`);
  }

  const filtered = participants.filter(p => {
    if (filter === 'complete') return p.completedCount === p.totalCount && p.totalCount > 0;
    if (filter === 'incomplete') return p.completedCount < p.totalCount;
    return true;
  });

  const activeChallengeName = challenges.find(c => c.id === challengeId)?.name ?? 'Challenge';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--txt-2)', fontSize: '13px' }}>Loading…</div>
      </div>
    );
  }

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

      {/* Top nav */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 20px', height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        <div style={{ color: 'var(--accent)', display: 'flex' }}>
          <BookIcon size={17} />
        </div>
        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--txt)', letterSpacing: '-0.01em' }}>
          BBC Verse Challenge
        </span>

        {/* Challenge switcher */}
        {challenges.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            {challenges.map(c => (
              <button
                key={c.id}
                onClick={() => switchChallenge(c.id)}
                style={challengeId === c.id ? btn('primary') : btn('secondary')}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/admin/prizes')} style={{ ...btn('ghost'), gap: '5px' }}>
          <GiftIcon size={13} /> Prizes
        </button>
        <button onClick={() => router.push('/admin/challenges')} style={{ ...btn('ghost'), gap: '5px' }}>
          Challenges
        </button>
        <button onClick={() => router.push(`/admin/insights?c=${challengeId}`)} style={{ ...btn('ghost'), gap: '5px' }}>
          <BarChartIcon size={13} /> Insights
        </button>
        <button onClick={handleLogout} style={{ ...btn('ghost'), gap: '8px' }}>
          <LogOutIcon size={13} />
          {admin?.username ? `Sign out, ${admin.username}` : 'Sign out'}
        </button>
      </header>

      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Page title */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="reveal">
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--txt)' }}>
              {activeChallengeName}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--txt-2)', marginTop: '4px' }}>
              Track and manage verse memorization progress
            </p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{ ...btn('ghost'), fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '99px' }}
          >
            {showStats ? (
              <><span style={{ color: 'var(--txt-2)' }}>Hide overview</span><ChevronDownIcon size={14} /></>
            ) : (
              <><span style={{ color: 'var(--txt-2)' }}>Show overview</span><ChevronRightIcon size={14} /></>
            )}
          </button>
        </div>

        {/* Stats row & Progress Bar */}
        {showStats && stats && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '24px' }}>
              <div className="reveal-1"><StatCard icon={<UsersIcon size={14} />} label="Total" value={stats.totalParticipants} /></div>
              <div className="reveal-2"><StatCard icon={<ActivityIcon size={14} />} label="Active" value={stats.active} color="var(--accent)" /></div>
              {challengeId === 1 && (
                <>
                  <div className="reveal-3"><StatCard icon={<CheckCircleIcon size={14} />} label="1 John 1 done" value={stats.ch1Complete} color="var(--green)" /></div>
                  <div className="reveal-4"><StatCard icon={<CheckCircleIcon size={14} />} label="1 John 2 done" value={stats.ch2Complete} color="var(--green)" /></div>
                </>
              )}
              <div className="reveal-5"><StatCard icon={<BarChartIcon size={14} />} label="Overall" value={`${stats.overallPct}%`} color="var(--amber)" /></div>
            </div>

            <div style={{ ...card, padding: '16px 20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--txt-2)', fontWeight: '500' }}>Total verse completions</span>
                <span style={{ fontSize: '12px', color: 'var(--txt-2)', fontFamily: 'monospace' }}>
                  {stats.completedVerses} / {stats.totalVerses}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', gap: '8px' }}>
                <ThemeToggle
                  style={{
                    width: 'auto',
                    height: '28px',
                    padding: '4px 8px',
                    borderRadius: '0',
                    boxShadow: 'none',
                    border: 'var(--base-border-width) solid var(--text-color)',
                    background: 'transparent',
                    color: 'var(--text-color)'
                  }}
                />
                <button
                  onClick={() => setShowAvatars(!showAvatars)}
                  style={{ ...btn('ghost'), fontSize: '12px', padding: '4px 8px' }}
                >
                  {showAvatars ? 'Hide avatars' : 'Show avatars'}
                </button>
              </div>
            </div>

            {/* Toolbar (Filters & Add) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Filter */}
              {(['all', 'complete', 'incomplete'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={filter === f ? btn('primary') : btn('secondary')}
                >
                  {f === 'all' ? `All (${participants.length})` : f === 'complete' ? 'Complete' : 'In progress'}
                </button>
              ))}

              <button onClick={() => setAddingNew(v => !v)} style={btn('secondary')}>
                <PlusIcon size={13} />
                Add
              </button>

              <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

              <button onClick={handleExport} style={btn('secondary')}>
                Export JSON
              </button>

              <label style={btn('secondary')}>
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </label>

            </div>

            {/* Add form */}
            {
              addingNew && (
                <div style={{ ...card, padding: '14px 16px', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input style={{ ...inputStyle, flex: 1, minWidth: '120px' }} placeholder="First name" value={newFirst} onChange={e => setNewFirst(e.target.value)} />
                  <input style={{ ...inputStyle, flex: 1, minWidth: '120px' }} placeholder="Last name" value={newLast} onChange={e => setNewLast(e.target.value)} />
                  <button onClick={handleAdd} style={btn('success')}>
                    <CheckIcon size={12} /> Save
                  </button>
                  <button onClick={() => { setAddingNew(false); setNewFirst(''); setNewLast(''); }} style={btn('ghost')}>
                    <XIcon size={12} />
                  </button>
                </div>
              )
            }

            {/* Count */}
            <p style={{ fontSize: '12px', color: 'var(--txt-2)', marginBottom: '8px' }}>
              {filtered.length} participant{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Global Toolbar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-2)', pointerEvents: 'none' }}>
              <SearchIcon size={13} />
            </div>
            <input
              type="text"
              placeholder="Search participants…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '32px' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--txt-2)', fontSize: '13px' }}>
              No participants found
            </div>
          ) : (
            <div>
              {filtered.map((p, i) => (
                <ParticipantRow
                  key={p.id}
                  p={p}
                  last={i === filtered.length - 1}
                  locking={lockingId === p.id}
                  showAvatars={showAvatars}
                  onOpen={() => handleLockAndOpen(p)}
                  onUnlock={() => handleUnlock(p)}
                  onRename={(first, last) => handleRename(p, first, last)}
                  onDelete={() => handleDelete(p)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--txt-2)', fontSize: '13px' }}>Loading…</div>
      </div>
    }>
      <AdminPageInner />
    </Suspense>
  );
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--txt-2)', marginBottom: '6px' }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-ui)' }}>{label}</span>
      </div>
      <div className="font-mono" style={{ fontSize: '28px', fontWeight: '700', color: color || 'var(--txt)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ── ProgressBar ──────────────────────────────────────────────────────────── */
function ProgressBar({ pct, gradient, height = 5 }: { pct: number; gradient?: boolean; height?: number }) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: '99px', height: `${height}px`, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, pct))}%`,
        borderRadius: '99px',
        background: gradient
          ? 'linear-gradient(90deg, var(--accent), var(--green))'
          : pct === 100 ? 'var(--green)' : pct > 60 ? 'linear-gradient(90deg, var(--accent), var(--green))' : 'var(--accent)',
        transition: 'width .3s ease',
      }} />
    </div>
  );
}

/* ── ParticipantRow ───────────────────────────────────────────────────────── */
function ParticipantRow({ p, last, locking, showAvatars = true, onOpen, onUnlock, onRename, onDelete }: {
  p: Participant; last: boolean; locking: boolean; showAvatars?: boolean;
  onOpen: () => void; onUnlock: () => void;
  onRename: (first: string, last: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFirst, setEditFirst] = useState(p.firstName);
  const [editLast, setEditLast] = useState(p.lastName);
  const [saving, setSaving] = useState(false);

  // Sync state if p changes externally (e.g. from websocket or polling)
  useEffect(() => {
    if (!isEditing) {
      setEditFirst(p.firstName);
      setEditLast(p.lastName);
    }
  }, [p.firstName, p.lastName, isEditing]);

  const pct = p.totalCount > 0 ? Math.round((p.completedCount / p.totalCount) * 100) : 0;
  const done = pct === 100 && p.totalCount > 0;
  const lockedByOther = p.isLocked && !p.isLockedByMe;

  async function handleSave() {
    if (!editFirst.trim() || !editLast.trim()) return;
    setSaving(true);
    await onRename(editFirst, editLast);
    setSaving(false);
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditFirst(p.firstName);
    setEditLast(p.lastName);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '12px 16px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      background: p.isLockedByMe ? 'rgba(217,119,87,0.04)' : 'transparent',
      opacity: p.optedOut ? 0.55 : 1,
    }}>
      {/* Avatar */}
      {showAvatars && (
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
          background: `hsl(${(p.id * 53) % 360},35%,22%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: '600', color: 'var(--txt-2)',
          border: done ? '1.5px solid var(--green)' : '1.5px solid var(--border)',
        }}>
          {p.firstName[0]}{p.lastName[0]}
        </div>
      )}

      {/* Name + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              style={{ ...inputStyle, width: '120px', padding: '6px 10px', fontSize: '13px', boxShadow: '2px 2px 0px 0px var(--text-color)' }}
              value={editFirst}
              onChange={e => setEditFirst(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              placeholder="First"
              disabled={saving}
              autoFocus
            />
            <input
              style={{ ...inputStyle, width: '120px', padding: '6px 10px', fontSize: '13px', boxShadow: '2px 2px 0px 0px var(--text-color)' }}
              value={editLast}
              onChange={e => setEditLast(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              placeholder="Last"
              disabled={saving}
            />
            <button onClick={handleSave} disabled={saving} style={{ ...btn('success'), padding: '6px 10px', fontSize: '12px', boxShadow: '2px 2px 0px 0px var(--text-color)' }}>
              {saving ? '...' : <CheckIcon size={12} />}
            </button>
            <button onClick={handleCancel} disabled={saving} style={{ ...btn('secondary'), padding: '6px 10px', fontSize: '12px', boxShadow: '2px 2px 0px 0px var(--text-color)' }}>
              <XIcon size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--txt)' }}>
              {p.firstName} {p.lastName}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              disabled={lockedByOther || locking}
              style={{ background: 'transparent', border: 'none', padding: '0 4px', cursor: lockedByOther ? 'not-allowed' : 'pointer', color: lockedByOther ? 'var(--txt-3)' : 'var(--txt-2)', display: 'flex', alignItems: 'center' }}
              title={lockedByOther ? `Locked by ${p.lockedByUsername}` : 'Rename inline'}
            >
              <EditIcon size={13} />
            </button>
            {done && <Badge label="Complete" bg="var(--green-bg)" bd="var(--green-bd)" color="var(--green)" />}
            {p.optedOut && <Badge label="Opted out" bg="var(--bg-hover)" bd="var(--border)" color="var(--txt-3)" />}
            {p.isLockedByMe && <Badge label="Editing" bg="var(--accent-bg)" bd="var(--accent-bd)" color="var(--accent)" />}
            {lockedByOther && <Badge label={p.lockedByUsername || 'Locked'} bg="var(--amber-bg)" bd="var(--amber-bd)" color="var(--amber)" />}
          </div>
        )}
        {!p.optedOut && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <ProgressBar pct={pct} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--txt-2)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {p.completedCount}/{p.totalCount}
            </span>
          </div>
        )}
        {p.optedOut && (
          <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Not participating in this challenge</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, opacity: isEditing ? 0.3 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}>
        <button
          onClick={onOpen}
          disabled={lockedByOther || locking}
          style={{
            ...btn('secondary'),
            opacity: lockedByOther ? 0.4 : 1,
            cursor: lockedByOther ? 'not-allowed' : 'pointer',
          }}
          title={lockedByOther ? `Locked by ${p.lockedByUsername}` : p.isLockedByMe ? 'Open (already locked)' : 'Lock & open'}
        >
          {locking ? '…' : 'Open'}
        </button>
        {p.isLockedByMe && (
          <button
            onClick={onUnlock}
            style={{ ...btn('ghost'), color: 'var(--accent)', border: 'var(--base-border-width) solid var(--accent-bd)' }}
            title="Release lock"
          >
            <LockIcon size={13} />
          </button>
        )}
        {!p.isLockedByMe && (
          <button
            onClick={onOpen}
            disabled={lockedByOther || locking}
            style={{
              ...btn('ghost'),
              color: lockedByOther ? 'var(--txt-3)' : 'var(--txt-2)',
              cursor: lockedByOther ? 'not-allowed' : 'pointer',
            }}
            title={lockedByOther ? `Locked by ${p.lockedByUsername}` : 'Lock & open to edit'}
          >
            <UnlockIcon size={13} />
          </button>
        )}
        {!p.isLockedByMe && (
          <button
            onClick={onDelete}
            disabled={lockedByOther}
            style={{
              ...btn('ghost'),
              color: lockedByOther ? 'var(--txt-3)' : 'var(--red, #e05252)',
              cursor: lockedByOther ? 'not-allowed' : 'pointer',
              border: `var(--base-border-width) solid ${lockedByOther ? 'var(--border)' : 'rgba(224,82,82,0.3)'}`,
            }}
            title={lockedByOther ? `Locked by ${p.lockedByUsername}` : 'Delete participant'}
          >
            <XIcon size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
function Badge({ label, bg, bd, color }: { label: string; bg: string; bd: string; color: string }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '99px',
      background: bg, border: `1px solid ${bd}`, color,
    }}>
      {label}
    </span>
  );
}
