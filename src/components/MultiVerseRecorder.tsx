'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MicIcon, StopIcon, RefreshIcon, CheckCircleIcon, XCircleIcon, XIcon, AlertIcon, CheckIcon } from './Icons';
import { segmentAndVerify, type VerseSegmentResult } from '@/lib/multiVerseSegmentation';

interface VerseEntry {
  verse: number;
  text: string;
  done: boolean;
}

interface MultiVerseRecorderProps {
  chapter: number;
  chapterLabel: string; // e.g. "John 1" or "Psalm 23"
  allVerses: VerseEntry[];
  participantName: string;
  participantId: number;
  challengeId?: number;
  onClose: () => void;
  onSaved: (passedVerses: number[]) => void;
}

type Phase = 'select' | 'ready' | 'listening' | 'processing' | 'results';

const PASS_THRESHOLD = 80;

/* ── Shared styles for Brutalism ─────────────────────────────────────────── */
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px', zIndex: 500, animation: 'fadeIn .15s ease both',
};
const modalBox: React.CSSProperties = {
  background: 'var(--bg-color)', border: 'var(--base-border-width) solid var(--text-color)',
  boxShadow: 'var(--shadow-offset) var(--shadow-offset) 0px 0px var(--text-color)',
  width: '100%', maxWidth: '640px',
  maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
  animation: 'scaleIn .15s ease both',
};

function btnStyle(variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
    padding: '12px 24px', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em',
    cursor: 'pointer', border: 'var(--base-border-width) solid var(--text-color)',
    boxShadow: '4px 4px 0px 0px var(--text-color)', transition: 'none',
  };

  if (variant === 'primary') return { ...base, background: 'var(--text-color)', color: 'var(--bg-color)', borderColor: 'var(--text-color)' };
  if (variant === 'secondary') return { ...base, background: 'var(--bg-color)', color: 'var(--text-color)' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--text-color)', border: 'none', boxShadow: 'none' };
  if (variant === 'success') return { ...base, background: 'var(--success-color)', color: 'var(--text-color)' };
  if (variant === 'danger') return { ...base, background: 'var(--error-color)', color: 'var(--bg-color)' };
  return base;
}

function scoreColor(score: number): string {
  if (score >= PASS_THRESHOLD) return 'var(--success-color)';
  if (score >= 60) return '#FF9900';
  return 'var(--error-color)';
}

export default function MultiVerseRecorder({
  chapter, chapterLabel, allVerses, participantName, participantId,
  challengeId = 1, onClose, onSaved,
}: MultiVerseRecorderProps) {

  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(allVerses.filter(v => !v.done).map(v => v.verse))
  );

  const [phase, setPhase] = useState<Phase>('select');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [micError, setMicError] = useState('');
  const [results, setResults] = useState<VerseSegmentResult[]>([]);
  const [saving, setSaving] = useState(false);

  const [verseSequence, setVerseSequence] = useState<Array<{ verse: number; text: string }>>([]);

  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef('');

  const incompleteCount = allVerses.filter(v => !v.done).length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!API);
    }
    return () => {
      stopTimer();
      if (recRef.current) { try { recRef.current.abort(); } catch { } }
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && phase !== 'listening') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, phase]);

  function toggleVerse(v: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  function selectIncomplete() { setSelected(new Set(allVerses.filter(v => !v.done).map(v => v.verse))); }
  function selectAll() { setSelected(new Set(allVerses.map(v => v.verse))); }
  function clearAll() { setSelected(new Set()); }

  function handleConfirmSelection() {
    const seq = allVerses
      .filter(v => selected.has(v.verse))
      .sort((a, b) => a.verse - b.verse)
      .map(v => ({ verse: v.verse, text: v.text }));
    setVerseSequence(seq);
    setPhase('ready');
  }

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  const startListening = useCallback(() => {
    setMicError('');
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API) return;

    const rec = new API();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimText('');

    rec.onstart = () => { setPhase('listening'); startTimer(); };

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + seg.trim();
          setTranscript(finalTranscriptRef.current);
        } else {
          interim += seg;
        }
      }
      setInterimText(interim);
    };

    rec.onerror = (e: any) => {
      stopTimer();
      if (e.error === 'not-allowed') {
        setMicError('Microphone access denied.');
      } else if (e.error !== 'no-speech') {
        setMicError(`Microphone error: ${e.error}`);
      }
      setPhase('ready');
    };

    rec.onend = () => {
      stopTimer();
      setInterimText('');
      const full = finalTranscriptRef.current.trim();
      if (full) {
        setPhase('processing');
        setTimeout(() => {
          const segs = segmentAndVerify(full, verseSequence, PASS_THRESHOLD);
          setResults(segs);
          setPhase('results');
        }, 400);
      } else {
        setPhase('ready');
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch { setMicError('Could not start microphone.'); }
  }, [verseSequence]);

  function stopListening() {
    if (recRef.current) { try { recRef.current.stop(); } catch { } }
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/progress/multi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        chapter,
        challengeId,
        results: results.map(r => ({
          verse: r.verse,
          score: r.score,
          passed: r.passed,
          segment: r.segment,
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      onSaved(data.passed);
      onClose();
    }
  }

  function handleRetry() {
    setResults([]);
    setTranscript('');
    setInterimText('');
    setElapsed(0);
    finalTranscriptRef.current = '';
    setPhase('select');
  }

  const passCount = results.filter(r => r.passed).length;

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget && phase !== 'listening') onClose(); }}>
      <div style={modalBox} className={`${phase === 'results' && passCount === results.length ? 'success-state scale-[1.02]' : ''} transition-all duration-300`}>

        {/* Header */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: 'var(--base-border-width) solid var(--text-color)', background: 'var(--text-color)', color: 'var(--bg-color)' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              SEQ :: {chapterLabel} // {participantName}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', opacity: 0.8, textTransform: 'uppercase' }}>
              {phase === 'select'
                ? `TARGET: ${incompleteCount} PENDING`
                : phase === 'results'
                  ? `STATUS: ${passCount}/${results.length} SECURED`
                  : `REC: ${verseSequence.length} TARGETS`}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={phase === 'listening'}
            style={{ ...btnStyle('ghost'), padding: '8px', opacity: phase === 'listening' ? 0.3 : 1, color: 'var(--bg-color)' }}
          >
            <XIcon size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>

          {!isSupported && phase !== 'select' && (
            <div className="brutalist-border p-4 mb-6 bg-[var(--error-color)] text-[var(--bg-color)] font-black uppercase tracking-widest flex items-center gap-4">
              <AlertIcon size={24} /> Engine Not Supported in Browser
            </div>
          )}

          {micError && (
            <div className="brutalist-border p-4 mb-6 bg-[var(--error-color)] text-[var(--bg-color)] font-black uppercase tracking-widest flex items-center gap-4">
              <AlertIcon size={24} /> {micError}
            </div>
          )}

          {/* ── SELECT PHASE ─────────────────────────────────────────── */}
          {phase === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={selectIncomplete} style={{ ...btnStyle('secondary'), fontSize: '12px', padding: '8px 16px' }}>
                  Queue Pending
                </button>
                <button onClick={selectAll} style={{ ...btnStyle('secondary'), fontSize: '12px', padding: '8px 16px' }}>
                  Queue All
                </button>
                <button onClick={clearAll} style={{ ...btnStyle('secondary'), fontSize: '12px', padding: '8px 16px' }}>
                  Clear Queue
                </button>
              </div>

              <div className="brutalist-border overflow-hidden bg-[var(--bg-color)] max-h-[40vh] overflow-y-auto">
                {allVerses.map((v, i) => (
                  <label
                    key={v.verse}
                    className={`flex gap-4 p-4 border-b-[var(--base-border-width)] border-[var(--text-color)] cursor-pointer hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] group transition-none ${selected.has(v.verse) ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'bg-white text-[var(--text-color)]'}`}
                    style={{ borderBottomWidth: i < allVerses.length - 1 ? '2px' : '0' }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(v.verse)}
                      onChange={() => toggleVerse(v.verse)}
                      className={`mt-1 w-6 h-6 border-2 rounded-none cursor-pointer ${selected.has(v.verse) ? 'border-[var(--bg-color)] accent-[var(--bg-color)]' : 'border-[var(--text-color)] accent-[var(--text-color)]'}`}
                    />
                    <span className={`font-black text-lg w-12 flex-shrink-0 group-hover:text-[var(--bg-color)] ${selected.has(v.verse) ? 'text-[var(--bg-color)]' : ''}`}>
                      {chapter}:{v.verse}
                    </span>
                    <span className={`font-medium text-base leading-snug flex-1 group-hover:text-[var(--bg-color)] ${selected.has(v.verse) ? 'text-[var(--bg-color)]' : ''}`}>
                      {v.text}
                    </span>
                    {v.done && (
                      <span className="flex-shrink-0 bg-[var(--success-color)] text-[var(--text-color)] px-2 py-1 text-xs font-black uppercase brutalist-border h-fit">
                        SECURED
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span className="font-bold uppercase tracking-widest">
                  [{selected.size}] Queued
                </span>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selected.size === 0}
                  className={`flex items-center gap-2 px-8 py-4 text-xl font-black uppercase tracking-widest brutalist-border brutalist-shadow transition-none ${selected.size === 0 ? 'opacity-50 cursor-not-allowed bg-[var(--bg-color)] text-[var(--text-color)]' : 'bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--sucess-color)]'}`}
                >
                  <MicIcon size={20} />
                  Initiate Sequence
                </button>
              </div>
            </div>
          )}

          {/* ── READY PHASE ──────────────────────────────────────────── */}
          {phase === 'ready' && isSupported && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="text-xl font-bold uppercase tracking-widest opacity-80 border-l-4 border-[var(--text-color)] pl-4">
                Recite queued target segments in sequence. Audio input will be parsed and verified automatically.
              </div>

              <div className="brutalist-border overflow-hidden bg-white">
                {verseSequence.map((v, i) => (
                  <div key={v.verse} className="flex gap-4 p-4 border-b-[var(--base-border-width)] border-[var(--text-color)]" style={{ borderBottomWidth: i < verseSequence.length - 1 ? '2px' : '0' }}>
                    <span className="font-black text-xl w-16 flex-shrink-0">{chapter}:{v.verse}</span>
                    <span className="font-medium text-lg leading-snug opacity-90 text-ellipsis overflow-hidden line-clamp-2">{v.text}</span>
                  </div>
                ))}
              </div>

              <div className="text-center font-black uppercase tracking-widest p-4 bg-[var(--bg-color)] brutalist-border">
                TOLERANCE DELTA // {PASS_THRESHOLD}%
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setPhase('select')} className="px-8 py-4 font-black uppercase tracking-widest brutalist-border bg-[var(--bg-color)] text-[var(--text-color)]">
                  Abort
                </button>
                <button onClick={startListening} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 font-black uppercase tracking-widest text-2xl brutalist-border brutalist-shadow bg-[var(--error-color)] text-[var(--bg-color)] hover:bg-[var(--text-color)] transition-none shadow-[8px_8px_0_0_var(--text-color)] transform hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_0_var(--text-color)]">
                  <MicIcon size={28} /> ACTIVE ENGAGE
                </button>
              </div>
            </div>
          )}

          {/* ── LISTENING PHASE ──────────────────────────────────────── */}
          {phase === 'listening' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div className="flex w-full items-center justify-between p-6 brutalist-border bg-[var(--error-color)] text-[var(--bg-color)]">
                <div className="flex items-center gap-4 animate-pulse">
                  <span className="w-6 h-6 rounded-full bg-[var(--bg-color)] border-[var(--base-border-width)] border-[var(--text-color)]" />
                  <span className="text-2xl font-black tracking-widest">TRANSMITTING</span>
                </div>
                <span className="text-3xl font-black font-mono">{formatTime(elapsed)}</span>
              </div>

              <div className="w-full min-h-[240px] brutalist-border bg-white text-[var(--text-color)] p-8 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-[var(--text-color)] text-[var(--bg-color)] text-sm font-black px-4 py-2 uppercase tracking-widest border-b-[var(--base-border-width)] border-l-[var(--base-border-width)] border-[var(--text-color)]">
                  Input Stream
                </div>
                <p className="font-medium text-2xl md:text-3xl leading-relaxed mt-4">
                  {transcript && <span className="opacity-100">{transcript} </span>}
                  {interimText && <span className="opacity-50 blur-[1px]">{interimText}</span>}
                  {!transcript && !interimText && <span className="opacity-20 italic">Awaiting audio telemetry array...</span>}
                </p>
              </div>

              <button onClick={stopListening} className="w-full flex items-center justify-center gap-3 px-8 py-6 font-black uppercase tracking-widest text-3xl brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--bg-color)] hover:text-[var(--text-color)] transition-none">
                <StopIcon size={32} /> HALT INPUT
              </button>
            </div>
          )}

          {/* ── PROCESSING PHASE ─────────────────────────────────────── */}
          {phase === 'processing' && (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-8">
              <div className="text-5xl font-black uppercase tracking-tighter animate-pulse">COMPILING...</div>
            </div>
          )}

          {/* ── RESULTS PHASE ────────────────────────────────────────── */}
          {phase === 'results' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Summary banner */}
              <div className={`p-8 brutalist-border flex flex-col items-center text-center ${passCount === results.length ? 'bg-transparent text-[var(--text-color)] border-none px-0 py-4' : 'bg-[var(--text-color)] text-[var(--bg-color)]'}`}>
                {passCount === results.length && <CheckCircleIcon size={80} className="mb-6 opacity-30" />}
                <div className={`text-5xl md:text-7xl font-black uppercase tracking-tighter ${passCount === results.length ? 'text-[var(--text-color)]' : ''}`}>
                  {passCount === results.length ? 'SUCCESS MATRIX' : `${passCount}/${results.length} SECURED`}
                </div>
              </div>

              {/* Per-verse results */}
              <div className={`brutalist-border overflow-hidden bg-white ${passCount === results.length ? 'border-[var(--text-color)]' : ''}`}>
                {results.map((r, i) => (
                  <div key={r.verse} className="flex gap-4 p-4 items-center border-b-[var(--base-border-width)] border-[var(--text-color)] bg-white" style={{ borderBottomWidth: i < results.length - 1 ? '2px' : '0' }}>
                    <div className="flex-shrink-0">
                      {r.passed ? <CheckCircleIcon size={32} className="text-[var(--success-color)]" /> : <XCircleIcon size={32} className="text-[var(--error-color)]" />}
                    </div>
                    <span className="text-2xl font-black w-16 flex-shrink-0">
                      {chapter}:{r.verse}
                    </span>
                    <div className="flex-1 bg-[var(--bg-color)] brutalist-border h-8 overflow-hidden relative">
                      <div className="h-full border-r-[var(--base-border-width)] border-[var(--text-color)] transition-none" style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }} />
                    </div>
                    <span className="text-xl font-black w-20 text-right">
                      {Math.round(r.score)}%
                    </span>
                  </div>
                ))}
              </div>

              {transcript && (
                <div className="p-6 bg-[var(--text-color)] text-[var(--bg-color)] brutalist-border">
                  <div className="font-bold uppercase tracking-widest text-sm mb-4 border-b-[var(--base-border-width)] border-[var(--bg-color)] pb-2">Diagnostic Audio Log</div>
                  <div className="font-medium text-lg leading-relaxed">{transcript}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-6">
                <button onClick={handleRetry} className="flex-1 flex justify-center items-center gap-3 px-8 py-4 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] text-xl font-black uppercase">
                  <RefreshIcon size={24} /> Reset
                </button>
                {passCount > 0 && (
                  <button onClick={handleSave} disabled={saving} className={`flex-2 flex justify-center items-center gap-3 px-8 py-4 brutalist-border brutalist-shadow text-2xl font-black uppercase transition-none ${passCount === results.length ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--text-color)]' : 'bg-[var(--text-color)] text-[var(--success-color)]'} ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:-translate-x-1 shadow-[8px_8px_0_0_var(--text-color)]'}`}>
                    <CheckIcon size={28} />
                    {saving ? 'COMPILING…' : `LOG ${passCount} TARGETS`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
