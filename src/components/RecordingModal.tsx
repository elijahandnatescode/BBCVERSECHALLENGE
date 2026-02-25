'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import type { Member, VerseReference, BibleVersion, RecordingSession } from '@/types'
import { useApp } from '@/lib/store'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { verifyRecitation } from '@/lib/verification'
import { VersionPicker } from '@/components/VersionPicker'
import { v4 as uuidv4 } from 'uuid'
import { MicIcon, StopIcon, RefreshIcon, CheckCircleIcon, XCircleIcon, AlertIcon, CheckIcon } from './Icons'

type Phase = 'setup' | 'recording' | 'results'

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
  verse: VerseReference | null
}

export function RecordingModal({ isOpen, onClose, member, verse }: RecordingModalProps) {
  const { addRecord } = useApp()
  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('KJV')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    normalizedSpoken: string
    normalizedMaster: string
    distance: number
  } | null>(null)

  const { transcript, isListening, startListening, stopListening, resetTranscript, error } =
    useSpeechRecognition()

  const masterText = verse?.versions[selectedVersion] || ''

  useEffect(() => {
    if (!isOpen) {
      resetTranscript()
      setPhase('setup')
      setResult(null)
      setStartTime(null)
      setElapsedTime(0)
    }
  }, [isOpen, resetTranscript])

  useEffect(() => {
    if (!isListening || !startTime) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 100)

    return () => clearInterval(interval)
  }, [isListening, startTime])

  const handleStartRecording = () => {
    resetTranscript()
    setPhase('recording')
    setStartTime(Date.now())
    setElapsedTime(0)
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
    const verificationResult = verifyRecitation(transcript, masterText)
    setResult(verificationResult)
    setPhase('results')
  }

  const handleConfirmAndSave = () => {
    if (!member || !verse || !result) return

    const session: RecordingSession = {
      id: uuidv4(),
      memberId: member.id,
      verseId: verse.id,
      versionUsed: selectedVersion,
      accuracyScore: result.score,
      spokenText: transcript,
      masterText: masterText,
      date: new Date().toISOString(),
      status: result.passed ? 'passed' : 'failed',
    }

    addRecord(session)
    onClose()
  }

  const handleRecordAgain = () => {
    setPhase('setup')
    setResult(null)
    resetTranscript()
    setStartTime(null)
    setElapsedTime(0)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const renderWordDiff = () => {
    if (!result) return null

    const spokenWords = result.normalizedSpoken.split(/\s+/)
    const masterWords = result.normalizedMaster.split(/\s+/)

    return (
      <div className="space-y-6">
        <div className="brutalist-border p-4">
          <p className="text-sm uppercase font-bold tracking-widest opacity-60 mb-4 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2">Target Data</p>
          <div className="flex flex-wrap gap-2 text-xl font-medium leading-relaxed">
            {masterWords.map((word, idx) => (
              <span
                key={idx}
                className="bg-[var(--text-color)] text-[var(--bg-color)] px-2 py-1 uppercase"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        <div className="brutalist-border p-4 bg-white">
          <p className="text-sm uppercase font-bold tracking-widest opacity-60 mb-4 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2">Diagnostic Audio Log</p>
          <div className="flex flex-wrap gap-2 text-xl font-medium leading-relaxed">
            {spokenWords.map((word, idx) => {
              const isMatched = idx < masterWords.length && word === masterWords[idx]
              return (
                <span
                  key={idx}
                  className={`px-2 py-1 uppercase ${isMatched ? 'bg-[var(--success-color)] text-[var(--text-color)]' : 'bg-[var(--error-color)] text-[var(--bg-color)]'
                    }`}
                >
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case 'setup':
        return (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 brutalist-border bg-white flex flex-col">
                <p className="text-xs uppercase font-bold tracking-widest opacity-60 mb-1">Vector</p>
                <p className="text-xl font-black uppercase text-ellipsis overflow-hidden whitespace-nowrap">{member?.name || '-'}</p>
              </div>
              <div className="p-4 brutalist-border bg-white flex flex-col">
                <p className="text-xs uppercase font-bold tracking-widest opacity-60 mb-1">Target</p>
                <p className="text-xl font-black uppercase text-ellipsis overflow-hidden whitespace-nowrap">{verse?.reference || '-'}</p>
              </div>
            </div>

            <div className="p-6 brutalist-border bg-[var(--text-color)] text-[var(--bg-color)]">
              <label className="block text-sm font-bold uppercase tracking-widest mb-4">
                Engine Protocol
              </label>
              <VersionPicker
                value={selectedVersion.toLowerCase()}
                onChange={(v) => setSelectedVersion(v.toUpperCase() as BibleVersion)}
              />
            </div>

            <div className="p-6 brutalist-border border-dashed bg-white">
              <p className="text-xs uppercase font-bold tracking-widest opacity-50 mb-4 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2">Validation Telemetry Preview</p>
              <p className="text-xl leading-relaxed font-medium">"{masterText}"</p>
            </div>

            <button
              onClick={handleStartRecording}
              className="w-full flex items-center justify-center gap-3 py-6 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] font-black uppercase tracking-widest text-3xl hover:bg-[var(--success-color)] hover:text-[var(--text-color)] transition-none shadow-[8px_8px_0_0_var(--text-color)]"
            >
              <MicIcon size={32} /> INIT TRANSMISSION
            </button>
          </motion.div>
        )

      case 'recording':
        return (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8 flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center p-6 brutalist-border bg-[var(--error-color)] text-[var(--bg-color)]">
              <div className="flex items-center gap-4 animate-pulse uppercase font-black text-2xl tracking-widest">
                <span className="w-6 h-6 rounded-full bg-[var(--bg-color)] border-[var(--base-border-width)] border-[var(--text-color)]" />
                TRANSMITTING
              </div>
              <div className="text-3xl font-black font-mono tracking-tighter">{formatTime(elapsedTime)}</div>
            </div>

            <div className="w-full min-h-[160px] max-h-[40vh] overflow-y-auto p-8 brutalist-border bg-white relative">
              <div className="absolute top-0 right-0 px-4 py-2 border-l-[var(--base-border-width)] border-b-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)] font-black uppercase tracking-widest text-sm">Input Stream</div>
              <p className="text-3xl leading-relaxed font-medium mt-6">
                {transcript || (
                  <span className="opacity-20 italic focus:outline-none">Awaiting telemetry...</span>
                )}
              </p>
            </div>

            <div className="w-full p-6 brutalist-border border-dashed bg-white opacity-80">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2">Target Telemetry</p>
              <p className="text-lg leading-relaxed font-medium">{masterText}</p>
            </div>

            {error && (
              <div className="w-full p-4 brutalist-border bg-[var(--error-color)] text-[var(--bg-color)] flex items-center gap-4 font-black uppercase">
                <AlertIcon size={24} />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleStopRecording}
              className="w-full flex items-center justify-center gap-3 py-6 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] font-black uppercase tracking-widest text-3xl hover:bg-[var(--bg-color)] hover:text-[var(--text-color)] transition-none"
            >
              <StopIcon size={32} /> HALT INPUT
            </button>
          </motion.div>
        )

      case 'results':
        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className={`w-full p-8 brutalist-border flex flex-col items-center justify-center text-center ${result?.passed ? 'bg-[var(--success-color)] text-[var(--text-color)] shadow-[8px_8px_0_0_var(--text-color)] mb-4' : 'bg-[var(--error-color)] text-[var(--bg-color)]'}`}>
              <div className="flex items-center gap-4 mb-4">
                {result?.passed ? <CheckCircleIcon size={64} /> : <XCircleIcon size={64} />}
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
                  {result?.passed ? 'SECURED' : 'FAILED'}
                </h2>
              </div>
              <div className="text-4xl font-black bg-[var(--bg-color)] text-[var(--text-color)] brutalist-border px-8 py-2 inline-block shadow-[4px_4px_0_0_var(--text-color)]">
                {Math.round((result?.score || 0) * 100)}% Match
              </div>
            </div>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">{renderWordDiff()}</div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleRecordAgain}
                className="flex-1 flex justify-center items-center gap-2 py-6 brutalist-border bg-white text-[var(--text-color)] font-black uppercase tracking-widest text-xl hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-none"
              >
                <RefreshIcon size={24} /> Reset
              </button>
              <button
                onClick={handleConfirmAndSave}
                className="flex-2 flex justify-center items-center gap-2 py-6 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] font-black uppercase tracking-widest text-2xl hover:bg-[var(--success-color)] shadow-[8px_8px_0_0_var(--text-color)] hover:text-[var(--text-color)] hover:-translate-y-1 hover:-translate-x-1 transition-none"
              >
                <CheckIcon size={24} /> COMMIT LOG
              </button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative brutalist-border bg-[var(--bg-color)] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[16px_16px_0_0_var(--text-color)] flex flex-col ${phase === 'results' && result?.passed ? 'success-state border-4' : ''}`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)]">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Diagnostic Audio Array</h2>
                <p className="text-sm font-bold tracking-widest uppercase opacity-80 mt-1">
                  {phase === 'setup' && 'SYSTEM INITIALIZATION'}
                  {phase === 'recording' && 'ACTIVE INPUT'}
                  {phase === 'results' && 'ANALYSIS REPORT'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--error-color)] hover:text-[var(--bg-color)] transition-none"
              >
                <X className="w-8 h-8" strokeWidth={3} />
              </button>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">{renderPhaseContent()}</AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
