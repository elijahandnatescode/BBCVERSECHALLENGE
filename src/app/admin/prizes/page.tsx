'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, BookIcon, GiftIcon, LogOutIcon } from '@/components/Icons';

interface PrizeData {
    allPassages: string[];
    atLeastOne: string[];
    participated: string[];
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

function PrizesPageInner() {
    const router = useRouter();
    const [admin, setAdmin] = useState<{ username: string } | null>(null);
    const [data2025, setData2025] = useState<PrizeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [meRes, prizesRes] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/prizes')
            ]);
            const me = await meRes.json();
            if (!me.success) { router.replace('/login'); return; }
            setAdmin({ username: me.username });

            const prizesData = await prizesRes.json();
            if (prizesData.success && prizesData.data?.year2025) {
                setData2025(prizesData.data.year2025);
            }
            setLoading(false);
        }
        load();
    }, [router]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Nav */}
            <header style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 20px', height: '52px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
            }}>
                <button onClick={() => router.push('/admin')} style={{ ...btn('ghost'), gap: '4px' }}>
                    <ChevronLeftIcon size={14} /> Back
                </button>
                <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                <div style={{ color: 'var(--accent)' }}><BookIcon size={14} /></div>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--txt)' }}>Prizes</span>

                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{admin?.username}</span>
            </header>

            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <GiftIcon size={20} style={{ color: 'var(--accent)' }} />
                        Prize Distribution
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--txt-2)', marginTop: '4px' }}>
                        Participant lists categorized by achievement levels for prize distribution.
                    </p>
                </div>

                {/* 2025 Section */}
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--txt)', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '20px' }}>
                        2025
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Category 3 */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ background: 'rgba(235, 186, 52, 0.1)', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#b38209', marginBottom: '4px' }}>Did All Passages</h3>
                                <p style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Completed John 1 AND John 2:1-11</p>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#b38209', marginTop: '8px' }}>
                                    {data2025?.allPassages.length ?? 0} participants
                                </div>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {data2025?.allPassages.length ? (
                                    data2025.allPassages.map(name => (
                                        <span key={name} style={{ background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--txt)' }}>
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--txt-3)', fontStyle: 'italic' }}>No participants yet.</span>
                                )}
                            </div>
                        </div>

                        {/* Category 2 */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--txt)', marginBottom: '4px' }}>At Least One Passage</h3>
                                <p style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Completed John 1 OR John 2:1-11</p>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--txt)', marginTop: '8px' }}>
                                    {data2025?.atLeastOne.length ?? 0} participants
                                </div>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {data2025?.atLeastOne.length ? (
                                    data2025.atLeastOne.map(name => (
                                        <span key={name} style={{ background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--txt)' }}>
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--txt-3)', fontStyle: 'italic' }}>No participants yet.</span>
                                )}
                            </div>
                        </div>

                        {/* Category 1 */}
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--txt)', marginBottom: '4px' }}>Participated</h3>
                                <p style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Finished at least one verse but missed some passages.</p>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--txt-2)', marginTop: '8px' }}>
                                    {data2025?.participated.length ?? 0} participants
                                </div>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {data2025?.participated.length ? (
                                    data2025.participated.map(name => (
                                        <span key={name} style={{ border: '1px solid var(--border)', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: 'var(--txt-2)' }}>
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '13px', color: 'var(--txt-3)', fontStyle: 'italic' }}>No participants yet.</span>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* 2026 Section */}
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--txt-3)', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '20px' }}>
                        2026
                    </h2>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '10px',
                        padding: '40px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '14px'
                    }}>
                        We will build this out later when 2026 data is available.
                    </div>
                </div>

            </main>
        </div>
    );
}

export default function PrizesPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
                <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>Loading…</div>
            </div>
        }>
            <PrizesPageInner />
        </Suspense>
    );
}
