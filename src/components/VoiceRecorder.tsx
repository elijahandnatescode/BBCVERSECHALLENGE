'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MicIcon, StopIcon, RefreshIcon, CheckCircleIcon, XCircleIcon, XIcon, AlertIcon } from './Icons';
import { verifyRecitation } from '@/lib/verification';

interface VoiceRecorderProps {
  verse: { chapter: number; verse: number; text: string };
  participantName: string;
  participantId: number;
  onClose: () => void;
  onPassed: (chapter: number, verse: number) => void;
}

type Phase = 'ready' | 'listening' | 'processing' | 'result';

const PASS_THRESHOLD = 80;

/* ── Better word-level diff using DP ─────────────────────────────────────── */
type DiffToken = { word: string; status: 'match' | 'miss' | 'extra' };

function diffWords(spokenNorm: string, masterNorm: string): DiffToken[] {
  const sw = spokenNorm.split(' ').filter(Boolean);
  const mw = masterNorm.split(' ').filter(Boolean);
  const M = sw.length, N = mw.length;

  // LCS table
  const dp: number[][] = Array.from({ length: M + 1 }, () => new Array(N + 1).fill(0));
  for (let i = M - 1; i >= 0; i--)
    for (let j = N - 1; j >= 0; j--)
      dp[i][j] = sw[i] === mw[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);

  // Traceback
  const result: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < M || j < N) {
    if (i < M && j < N && sw[i] === mw[j]) {
      result.push({ word: mw[j], status: 'match' });
      i++; j++;
    } else if (j < N && (i >= M || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ word: mw[j], status: 'miss' });
      j++;
    } else {
      result.push({ word: sw[i], status: 'extra' });
      i++;
    }
  }
  return result;
}

/* ── Shared styles ────────────────────────────────────────────────────────── */
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px', zIndex: 500,
  animation: 'fadeIn .15s ease both',
};
const modalBox: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
  borderRadius: '14px', width: '100%', maxWidth: '520px',
  maxHeight: '90vh', overflow: 'auto',
  animation: 'scaleIn .15s ease both',
  boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
};
const divider: React.CSSProperties = { height: '1px', background: 'var(--border)', margin: '0' };

function btnStyle(variant: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
    cursor: 'pointer', border: '1px solid transparent',
  };
  if (variant === 'primary') return { ...base, background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' };
  if (variant === 'secondary') return { ...base, background: 'var(--bg-hover)', color: 'var(--txt)', border: '1px solid var(--border-hi)' };
  if (variant === 'ghost') return { ...base, background: 'transparent', color: 'var(--txt-2)', border: '1px solid transparent' };
  if (variant === 'success') return { ...base, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-bd)' };
  if (variant === 'danger') return { ...base, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-bd)' };
  return base;
}

export default function VoiceRecorder({ verse, participantName, participantId, onClose, onPassed }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [result, setResult] = useState<{ score: number; passed: boolean; normalizedSpoken: string; normalizedMaster: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [micError, setMicError] = useState('');

  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTranscriptRef = useRef('');

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

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
        setMicError('Microphone access denied. Please allow microphone access and try again.');
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
          const r = verifyRecitation(full, verse.text, PASS_THRESHOLD);
          setResult(r);
          setPhase('result');
        }, 400);
      } else {
        setPhase('ready');
      }
    };

    recRef.current = rec;
    try { rec.start(); } catch { setMicError('Could not start microphone.'); }
  }, [verse.text]);

  function stopListening() {
    if (recRef.current) { try { recRef.current.stop(); } catch { } }
  }

  async function handleConfirm() {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        chapter: verse.chapter,
        verse: verse.verse,
        completed: true,
        score: result?.score,
      }),
    });
    onPassed(verse.chapter, verse.verse);
    onClose();
  }

  function handleRetry() {
    // Log the failed attempt silently before resetting
    if (result && !result.passed) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          chapter: verse.chapter,
          verse: verse.verse,
          completed: false,
          score: result.score,
          attemptOnly: true,
        }),
      });
    }
    setResult(null);
    setTranscript('');
    setInterimText('');
    setElapsed(0);
    finalTranscriptRef.current = '';
    setPhase('ready');
  }

  const diff = result ? diffWords(result.normalizedSpoken, result.normalizedMaster) : [];

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalBox}>

        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>
              1 John {verse.chapter}:{verse.verse} &middot; {participantName}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--txt-2)', lineHeight: '1.6' }}>
              {verse.text}
            </div>
          </div>
          <button onClick={onClose} style={{ ...btnStyle('ghost'), padding: '6px', flexShrink: 0 }}>
            <XIcon size={14} />
          </button>
        </div>

        <div style={divider} />

        <div style={{ padding: '20px 24px 24px' }}>

          {/* Browser not supported */}
          {!isSupported && (
            <div style={{ padding: '14px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: '8px', color: 'var(--amber)', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <AlertIcon size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              Speech recognition is not supported in this browser. Use Chrome or Edge.
            </div>
          )}

          {/* Mic error */}
          {micError && (
            <div style={{ padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: '8px', color: 'var(--red)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <AlertIcon size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              {micError}
            </div>
          )}

          {/* READY */}
          {phase === 'ready' && isSupported && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
              <div style={{ fontSize: '13px', color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.6 }}>
                Press record, then recite the verse from memory.
                <br />
                <span style={{ color: 'var(--txt-3)', fontSize: '12px' }}>Grace threshold: {PASS_THRESHOLD}% accuracy</span>
              </div>
              <button onClick={startListening} style={{ ...btnStyle('primary'), paddingLeft: '24px', paddingRight: '24px' }}>
                <MicIcon size={15} />
                Start recording
              </button>
            </div>
          )}

          {/* LISTENING */}
          {phase === 'listening' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="rec-dot" />
                  <span style={{ fontSize: '11px', color: 'var(--red)', fontWeight: '700', letterSpacing: '0.08em' }}>
                    RECORDING
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--txt-2)' }}>
                  {formatTime(elapsed)}
                </span>
              </div>

              {/* Waveform */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="wave">
                  {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
                </div>
              </div>

              {/* Live transcript */}
              <div style={{
                minHeight: '72px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '13px',
                lineHeight: '1.6',
              }}>
                {transcript && <span style={{ color: 'var(--txt)' }}>{transcript} </span>}
                {interimText && <span style={{ color: 'var(--txt-2)', fontStyle: 'italic' }}>{interimText}</span>}
                {!transcript && !interimText && (
                  <span style={{ color: 'var(--txt-3)' }}>Listening…</span>
                )}
              </div>

              <button onClick={stopListening} style={{ ...btnStyle('danger'), justifyContent: 'center' }}>
                <StopIcon size={14} />
                Stop recording
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {phase === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 0' }}>
              <div style={{ color: 'var(--txt-2)', fontSize: '13px' }}>Analyzing recitation…</div>
            </div>
          )}

          {/* RESULT */}
          {phase === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Score banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px',
                background: result.passed ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1px solid ${result.passed ? 'var(--green-bd)' : 'var(--red-bd)'}`,
                borderRadius: '10px',
              }}>
                {result.passed
                  ? <CheckCircleIcon size={26} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  : <XCircleIcon size={26} style={{ color: 'var(--red)', flexShrink: 0 }} />
                }
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: result.passed ? 'var(--green)' : 'var(--red)' }}>
                    {result.passed ? 'Passed' : 'Not quite'} &mdash; {Math.round(result.score)}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-2)', marginTop: '2px' }}>
                    {result.passed
                      ? 'Verse will be marked as memorized.'
                      : `Needs ${PASS_THRESHOLD}% to pass. Try again.`}
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ background: 'var(--bg-hover)', borderRadius: '99px', height: '7px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(result.score)}%`,
                  borderRadius: '99px',
                  background: result.passed ? 'var(--green)' : result.score > 60 ? 'var(--amber)' : 'var(--red)',
                  transition: 'width .5s ease',
                }} />
              </div>

              {/* Word diff */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                  Word comparison
                </div>
                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  lineHeight: '2',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '2px 4px',
                }}>
                  {diff.map((d, i) => (
                    <span key={i} style={{
                      color: d.status === 'match' ? 'var(--txt)'
                        : d.status === 'miss' ? 'var(--red)'
                          : 'var(--amber)',
                      textDecoration: d.status === 'miss' ? 'line-through' : d.status === 'extra' ? 'underline' : 'none',
                      opacity: d.status === 'miss' ? 0.75 : 1,
                      padding: '0 2px',
                      borderRadius: '3px',
                      background: d.status !== 'match' ? (d.status === 'miss' ? 'var(--red-bg)' : 'var(--amber-bg)') : 'transparent',
                    }}>
                      {d.word}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '11px', color: 'var(--txt-2)' }}>
                  <span style={{ color: 'var(--txt)' }}>&#9632; Correct</span>
                  <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>Missing</span>
                  <span style={{ color: 'var(--amber)', textDecoration: 'underline' }}>Extra</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleRetry} style={{ ...btnStyle('secondary'), flex: 1, justifyContent: 'center' }}>
                  <RefreshIcon size={13} />
                  Try again
                </button>
                {result.passed ? (
                  <button onClick={handleConfirm} style={{ ...btnStyle('success'), flex: 1, justifyContent: 'center' }}>
                    <CheckCircleIcon size={13} />
                    Confirm &amp; save
                  </button>
                ) : (
                  <button onClick={onClose} style={{ ...btnStyle('ghost'), flex: 1, justifyContent: 'center' }}>
                    Close
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
