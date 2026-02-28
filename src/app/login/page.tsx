'use client';

import { useState, useEffect, FormEvent, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookIcon, ChevronDownIcon } from '@/components/Icons';

function HiddenPassage() {
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Freeform blob SVG with soft edges
    const blobSvg = encodeURIComponent(`
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <filter id="blur"><feGaussianBlur stdDeviation="15" /></filter>
        <path filter="url(#blur)" fill="black" d="M45.7,-76.4C58,-69.2,65.9,-53.4,73.1,-38.4C80.3,-23.4,86.8,-9.2,85.6,4.5C84.4,18.2,75.4,31.4,65.1,42.4C54.8,53.4,43.2,62.2,29.8,68.9C16.4,75.6,1.2,80.2,-13.6,79.5C-28.4,78.8,-42.8,72.8,-54.6,63.1C-66.4,53.4,-75.6,40.1,-80.6,25.3C-85.6,10.5,-86.4,-5.8,-82.1,-20.5C-77.8,-35.2,-68.4,-48.3,-56.3,-55.9C-44.2,-63.5,-29.4,-65.6,-15.5,-63.9C-1.6,-62.2,11.4,-56.7,24,-52.3C36.6,-47.9,48.8,-44.6,45.7,-76.4Z" transform="translate(100 100)" />
      </svg>
    `.trim());
    const maskUrl = `url("data:image/svg+xml;utf8,${blobSvg}")`;
    const maskSize = 160; // smaller radius

    const handleMouseMove = (e: MouseEvent) => {
      if (maskRef.current) {
        Object.assign(maskRef.current.style, {
          webkitMaskImage: maskUrl,
          webkitMaskRepeat: 'no-repeat',
          webkitMaskSize: `${maskSize}px ${maskSize}px`,
          webkitMaskPosition: `${e.clientX - maskSize / 2}px ${e.clientY - maskSize / 2}px`
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const words = useMemo(() => {
    const raw = "In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through him, and without him was not any thing made that was made. In him was life, and the life was the light of men. The light shines in the darkness, and the darkness has not overcome it. ";
    return Array(30).fill(raw).join('').split(' ').filter(Boolean);
  }, []);

  const colors = ['#f97316', '#eab308', '#38bdf8']; // orange, yellow, baby blue

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none',
      fontFamily: 'var(--font-ui)', fontSize: '18px', fontWeight: '900', lineHeight: '1.8', textTransform: 'uppercase',
      background: 'var(--bg-color, #f4f4f0)'
    }}>
      <div ref={maskRef} style={{
        position: 'absolute', inset: 0, padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '8px', color: 'var(--bg)',
        WebkitMaskImage: 'radial-gradient(circle 250px at -1000px -1000px, black 0%, transparent 100%)',
      }}>
        {words.map((w, i) => {
          const c = colors[(i * 7 + 3) % colors.length];
          return (
            <span key={`m-${i}`} style={{
              backgroundColor: c,
              color: '#000',
              padding: '0 6px',
              borderRadius: '2px',
              border: '2px solid #000',
              boxShadow: '2px 2px 0px 0px #000'
            }}>{w}</span>
          );
        })}
      </div>
    </div>
  );
}

const ADMINS = ['Tim', 'AiAi', 'Nathan', 'BBC_Other'];

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '24px',
  } as React.CSSProperties,
  glow: {
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,119,87,0.07) 0%, transparent 70%)',
  },
  wrap: {
    width: '100%',
    maxWidth: '360px',
    animation: 'fadeUp .25s ease both',
    position: 'relative' as const,
    zIndex: 10,
  } as React.CSSProperties,
  logoWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    marginBottom: '32px',
    gap: '12px',
  },
  logoBox: {
    width: '44px',
    height: '44px',
    background: 'var(--text-color, #000)',
    border: '3px solid var(--text-color, #000)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--bg-color, #fff)',
    boxShadow: '4px 4px 0px 0px var(--text-color, #000)',
  },
  card: {
    background: 'var(--bg-color, #ffffff)',
    border: '3px solid var(--text-color, #000)',
    boxShadow: '8px 8px 0px 0px var(--text-color, #000)',
    padding: '32px',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '900' as const,
    color: 'var(--text-color, #000)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
  },
  inputWrap: { position: 'relative' as const },
  select: {
    width: '100%',
    background: 'var(--bg-color, #fff)',
    border: '3px solid var(--text-color, #000)',
    padding: '12px 32px 12px 16px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: 'var(--text-color, #000)',
    appearance: 'none' as const,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '4px 4px 0px 0px var(--text-color, #000)',
    textTransform: 'uppercase' as const,
  },
  chevron: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: 'var(--text-color, #000)',
  },
  input: {
    width: '100%',
    background: 'var(--bg-color, #fff)',
    border: '3px solid var(--text-color, #000)',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: 'var(--text-color, #000)',
    outline: 'none',
    boxShadow: '4px 4px 0px 0px var(--text-color, #000)',
    textTransform: 'uppercase' as const,
  },
  errBox: {
    padding: '12px 16px',
    background: 'var(--error-color, #ef4444)',
    border: '3px solid var(--text-color, #000)',
    fontSize: '13px',
    fontWeight: 'bold' as const,
    color: '#fff',
    boxShadow: '4px 4px 0px 0px var(--text-color, #000)',
  },
  btn: (disabled: boolean) => ({
    width: '100%',
    marginTop: '12px',
    padding: '14px 24px',
    background: disabled ? '#ccc' : 'var(--text-color, #000)',
    border: '3px solid var(--text-color, #000)',
    fontSize: '16px',
    fontWeight: '900' as const,
    color: disabled ? '#666' : 'var(--bg-color, #fff)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textTransform: 'uppercase' as const,
    boxShadow: disabled ? 'none' : '4px 4px 0px 0px var(--text-color, #000)',
    transform: disabled ? 'translate(4px, 4px)' : 'none',
    transition: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  footer: {
    textAlign: 'center' as const,
    marginTop: '24px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    color: 'var(--text-color, #000)',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <HiddenPassage />
      <div style={{ ...S.glow, zIndex: 1 }} />
      <div style={S.wrap}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoBox}><BookIcon size={20} /></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-color, #000)', textTransform: 'uppercase' }}>
              BBC Verse Challenge
            </div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-color, #000)' }}>
              ADMIN PORTAL
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={S.card}>
          <form onSubmit={handleSubmit} style={S.form}>

            {/* Name */}
            <div>
              <label style={S.label}>Your name</label>
              <div style={S.inputWrap}>
                <select
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={S.select}
                >
                  <option value="" disabled>Select admin…</option>
                  {ADMINS.map(a => (
                    <option key={a} value={a}>{a === 'BBC_Other' ? 'BBC Other' : a}</option>
                  ))}
                </select>
                <div style={S.chevron}><ChevronDownIcon size={14} /></div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={S.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={S.input}
              />
            </div>

            {error && <div style={S.errBox}>{error}</div>}

            <button
              type="submit"
              disabled={loading || !username || !password}
              style={S.btn(loading || !username || !password)}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={S.footer}>1 John 1 &amp; 2 · Memory Challenge</p>
      </div>
    </div>
  );
}
